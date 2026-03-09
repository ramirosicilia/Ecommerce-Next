

export function validacionformulario({nombre,apellido,dni,email,usuario,contrasena}){
 

  let error={

     }

    console.log(contrasena,"data") 


    const regex = {
    nombre: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/,
    apellido: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/,
     dni: /^\d{7,8}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    usuario: /^[a-zA-Z0-9_.-]{3,20}$/,
   contrasena: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,32}$/
 }  

   if(nombre.trim()===""){ 
    error.nombre="escriba su nombre"

   } 


  else if(!regex.nombre.test(nombre)){
    error.nombre="por favor escriba un nombre correcto"

   }  


      if(apellido.trim()===""){ 
    error.apellido="escriba su apellido"

   } 

  else if(!regex.apellido.test(apellido)){
    error.apellido="por favor escriba un apellido correcto"

   } 

      if(dni.trim()===""){ 
    error.dni="escriba su dni"

   } 

  else if(!regex.dni.test(dni)){
    error.dni="por favor escriba un dni correcto"

   }  

      if(email.trim()===""){ 
    error.email="escriba su email"

   } 


  else if(!regex.email.test(email)){
    error.email="por favor escriba un correo electronico correcto"

   } 

      if(usuario.trim()===""){ 
    error.usuario="escriba su usuario"

   } 

   else if(!regex.usuario.test(usuario)){
    error.usuario="por favor escriba un usuario valido"

   } 

      if(contrasena.trim()===""){ 
    error.contrasena="escriba su Contraseña"

   } 

  else  if (!regex.contrasena.test(contrasena)) {
    error.contrasena =
    "La contraseña debe tener entre 8 y 32 caracteres, incluir al menos una letra mayúscula, una minúscula, un número y un símbolo (@$!%*?#&)."
  }


     return error

    


}