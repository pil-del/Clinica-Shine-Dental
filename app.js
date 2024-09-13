// 1 - Invocamos a Express
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

// 2 - Para poder capturar los datos del formulario
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Le decimos a Express que vamos a usar JSON

// 3 - Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

// 4 - Invocamos a bcryptjs
const bcryptjs = require('bcryptjs');

// 5 - Configura el motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 6 - Configura la carpeta pública para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// 7 - Configura la base de datos
const db = require('./database/db');

// Verificar conexión a la base de datos
db.query('SELECT 1', (err, results) => {
    if (err) {
        console.error('Error al ejecutar la consulta: ', err.message);
        return;
    }
    console.log('Consulta de prueba ejecutada con éxito');
});

// 8 - Configuración de la sesión
const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key', // Usa una clave secreta segura y gestionada a través de .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a true si usas HTTPS
}));

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (req.session.loggedin) {
        return next();
    }
    res.redirect('/admin/login'); // Redirige a login si no está autenticado
};

// 9 - Rutas para la página principal y páginas de cliente
app.get('/', (req, res) => {
    res.render('index'); // Renderiza el archivo index.ejs en la carpeta views
});

app.get('/cliente/about', (req, res) => {
    res.render('cliente/about'); // Renderiza el archivo about.ejs en la carpeta views/cliente
});

app.get('/cliente/contact', (req, res) => {
    res.render('cliente/contact'); // Renderiza el archivo contact.ejs en la carpeta views/cliente
});

app.get('/cliente/doctors', (req, res) => {
    res.render('cliente/doctors'); // Renderiza el archivo doctors.ejs en la carpeta views/cliente
});

app.get('/cliente/odontopediatria', (req, res) => {
    res.render('cliente/odontopediatria'); // Renderiza el archivo odontopediatria.ejs en la carpeta views/cliente
});

app.get('/cliente/services', (req, res) => {
    res.render('cliente/services'); // Renderiza el archivo services.ejs en la carpeta views/cliente
});

// 10 - Rutas de administrador
app.get('/admin/login', (req, res) => {
    res.render('admin/login'); // Renderiza el archivo login.ejs en la carpeta views/admin
});

app.get('/admin/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard', { usuario: req.session.usuario }); // Asegúrate de pasar 'usuario' correctamente
});

app.get('/admin/doctores', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM doctor', (error, results) => {
        if (error) {
            console.error('Error al consultar doctores:', error);
            return res.status(500).send('Error al consultar doctores');
        }
        console.log('Doctores:', results); // Línea para depuración
        res.render('admin/doctores', { doctores: results });
    });
});


// 13 - Ruta para consultar usuarios con autenticación
app.get('/admin/usuarios', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM usuario', (error, results) => {
        if (error) {
            console.error('Error al consultar usuarios:', error);
            return res.status(500).send('Error al consultar usuarios');
        }
        res.render('admin/usuarios', { usuarios: results });
    });
});



app.get('/admin/usuariosinactivos', (req, res) => {
    res.render('admin/usuariosinactivos');
});

app.get('/admin/registro', isAuthenticated, (req, res) => {
    res.render('admin/registro'); // Renderiza el archivo registro.ejs en la carpeta views/admin
});


// 11 - Registro
app.post('/admin/registro', async (req, res) => {
    const {
        usuario, password, nombre, apellido, especialidad,
        telefono, email, observacion
    } = req.body;

    // Validar datos (puedes agregar más validaciones aquí)
    if (!usuario || !password || !nombre || !apellido || !especialidad || !telefono || !email) {
        return res.status(400).send('Todos los campos son requeridos.');
    }

    // Hash del password
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Iniciar una transacción
        connection.beginTransaction((err) => {
            if (err) throw err;

            // Insertar en la tabla usuario
            connection.query(
                'INSERT INTO usuario (user, password, rol_idrol, estadoUsuario_idestadoUsuario) VALUES (?, ?, 1, 1)',
                [usuario, hashedPassword],
                (error, results) => {
                    if (error) {
                        return connection.rollback(() => {
                            throw error;
                        });
                    }

                    const usuario_id = results.insertId;

                    // Insertar en la tabla doctor
                    connection.query(
                        'INSERT INTO doctor (nombre, apellido, especialidad, telefono, email, observacion, usuario_idusuario) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [nombre, apellido, especialidad, telefono, email, observacion, usuario_id],
                        (error) => {
                            if (error) {
                                return connection.rollback(() => {
                                    throw error;
                                });
                            }

                            // Confirmar la transacción
                            connection.commit((err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        throw err;
                                    });
                                }
                                res.send('Doctor registrado exitosamente.');
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('Error al registrar el doctor:', error);
        res.status(500).send('Error al registrar el doctor.');
    }
});

// 12 - Autenticación
app.post('/auth', async (req, res) => {
    const user = req.body.usuario;
    const password = req.body.password;
    
    if (!user || !password) {
        return res.status(400).send('Por favor ingrese usuario y contraseña');
    }

    db.query('SELECT * FROM usuario WHERE user = ?', [user], async (error, results) => {
        if (error) {
            console.error('Error en la consulta:', error);
            return res.status(500).send('Ocurrió un error en la consulta');
        }

        if (results.length == 0 || !(await bcryptjs.compare(password, results[0].password))) {
            return res.render('admin/login', {
                alert: true,
                alertTitle: "Error",
                alertMessage: "Usuario y/o contraseña incorrectos",
                alertIcon: "error",
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        } 

        req.session.loggedin = true;
        req.session.usuario = results[0].user;
        res.redirect('/admin/dashboard');
    });
});


// 13 - Rutas para consultar tablas
// Ruta para consultar usuarios
app.get('/admin/usuarios', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM usuario', (error, results) => {
        if (error) {
            console.error('Error al consultar usuarios:', error);
            return res.status(500).send('Error al consultar usuarios');
        }
        res.render('admin/usuarios', { usuarios: results }); // 'usuarios' es el nombre que usarás en la vista
    });
});

// Ruta para consultar doctores
app.get('/admin/doctores', isAuthenticated, (req, res) => {
    db.query('SELECT * FROM doctor', (error, results) => {
        if (error) {
            console.error('Error al consultar doctores:', error);
            return res.status(500).send('Error al consultar doctores');
        }
        res.render('admin/doctores', { doctores: results }); // 'doctores' es el nombre que usarás en la vista
    });
});


// 14 - EDITS
app.get('/admin/doctor/:iddoctor', (req, res) => {
    const iddoctor = req.params.iddoctor;

    connection.query('SELECT * FROM doctor WHERE iddoctor=?', [iddoctor], (error, results) => {
        if (error) {
            throw error;
        } else {
            res.render('doctor', { doctor: results[0] });
        }
    });
});

app.get('/admin/usuario/:idusuario', (req, res) => {
    const idusuario = req.params.idusuario;

    connection.query('SELECT * FROM usuario WHERE idusuario=?', [idusuario], (error, results) => {
        if (error) {
            throw error;
        } else {
            res.render('usuario', { usuario: results[0] });
        }
    });
});
/*
// 11 - Ingresar Nuevo Doctor
app.post('/admin/doctores', async (req, res) => {
    const {
        usuario, password, nombre, apellido, especialidad,
        telefono, email, observacion
    } = req.body;

    // Validar datos (puedes agregar más validaciones aquí)
    if (!usuario || !password || !nombre || !apellido || !especialidad || !telefono || !email) {
        return res.status(400).send('Todos los campos son requeridos.');
    }

    // Hash del password
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Iniciar una transacción
        connection.beginTransaction((err) => {
            if (err) throw err;

            // Insertar en la tabla usuario
            connection.query(
                'INSERT INTO usuario (user, password, rol_idrol, estadoUsuario_idestadoUsuario) VALUES (?, ?, 1, 1)',
                [usuario, hashedPassword],
                (error, results) => {
                    if (error) {
                        return connection.rollback(() => {
                            throw error;
                        });
                    }

                    const usuario_id = results.insertId;

                    // Insertar en la tabla doctor
                    connection.query(
                        'INSERT INTO doctor (nombre, apellido, especialidad, telefono, email, observacion, usuario_idusuario) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [nombre, apellido, especialidad, telefono, email, observacion, usuario_id],
                        (error) => {
                            if (error) {
                                return connection.rollback(() => {
                                    throw error;
                                });
                            }

                            // Confirmar la transacción
                            connection.commit((err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        throw err;
                                    });
                                }
                                res.send('Doctor registrado exitosamente.');
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('Error al registrar el doctor:', error);
        res.status(500).send('Error al registrar el doctor.');
    }
});*/


// 14 - CRUDS
const docCRUD = require('./controllers/doctorCRUD');
app.post('/updatedoctor', docCRUD.updatedoctor);

const usCRUD = require('./controllers/usuarioCRUD');
app.post('/updateusuario', usCRUD.updateusuario);


// 15 - Inicia el servidor
app.listen(3000, () => {
    console.log('Servidor en ejecución en http://localhost:3000');
});