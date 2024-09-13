const connection = require('../database/db');

exports.updatedoctor = (req, res)=>{

    const iddoctor = req.body.iddoctor;
    const nombre = req.body.nombre;
    const apellido = req.body.apellido;
    const especialidad = req.body.especialidad;
    const telefono = req.body.telefono;
    const email = req.body.email;
    const observacion = req.body.observacion;

    connection.query('UPDATE doctor SET ? WHERE iddoctor = ?',[{nombre:nombre, apellido:apellido, especialidad:especialidad,telefono:telefono,telefono:telefono, email:email, observacion:observacion}, iddoctor], (error, results)=>{
        if(error){
            console.log(error);
        }else{           
            res.redirect('doctor');         
        }
});
};