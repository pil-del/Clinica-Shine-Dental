const connection = require('../database/db');

exports.updateuser = (req, res) => {
    const idusuario = req.body.idusuario;
    const username = req.body.username;
    const rol_idrol = req.body.rol_idrol;

    // Validar la presencia de 'idusuario', ya que es necesario para la actualización
    if (!idusuario) {
        return res.status(400).json({ message: 'El campo idusuario es obligatorio.' });
    }

    // Construir el objeto de actualización basado en los campos permitidos
    const updateData = {
        ...(username && { username }), // Solo incluir 'username' si se proporciona
        ...(rol_idrol && { rol_idrol }) // Solo incluir 'rol_idrol' si se proporciona
    };

    // Asegurarse de no incluir 'password' ni 'estadoUsuario_idestadoUsuario'
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
    }

    connection.query('UPDATE usuario SET ? WHERE idusuario = ?', [updateData, idusuario], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).json({ message: 'Error al actualizar el usuario.' });
        } else {
            res.redirect('user'); // Redirigir a la lista de usuarios o a la página correspondiente
        }
    });
};
