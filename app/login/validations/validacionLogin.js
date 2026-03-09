

export function validacionLogin({usuario,contrasena}){ 

    let error={

     } 

       const regex = {
    usuario: /^[a-zA-Z0-9_.-]{3,20}$/,
   contrasena: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,32}$/
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