const mysql = require('mysql'); 

// Crear la conexión a la base de datos usando las variables de entorno
const conexion = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME
});

// Conectar a la base de datos
conexion.connect((error) => {
    if (error) {
        console.error('El error de conexión es: ' + error.message);
        return;
    }
    console.log('¡Conectado a la Base de Datos!');
});

module.exports = conexion;
