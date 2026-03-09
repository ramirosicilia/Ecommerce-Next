"use client" 


import { useActionState } from "react"
import { useEffect } from "react"

import styles from "../components/formulario.module.css"
import "@/app/styles/global.css"
import createUsers from "@/app/actions/CreateUser"
import type { FormState } from "@/app/types/formTypes"
import { useState } from "react"





export default function FormView(){   

  const [usuario, SeTUsuario] = useState({

    nombre:"",
    apellido:"",
    dni:"",
    usuario:"",
    email:"",
    contrasena:""


  });


   const initialForm: FormState = {
  success: null,
  error: {} 
}

   const [state, FormAction] = useActionState<FormState, FormData>(createUsers,initialForm)  


   useEffect(()=>{ 

    if(state.success){ 

      SeTUsuario({ 
        nombre:"",
    apellido:"",
    dni:"",
    usuario:"",
    email:"",
    contrasena:""

      })

    }



   },[state])

  

    return (
  <>
    <div className={styles.container}>
      <form action={FormAction} className={styles.formulario}>

        <label className={styles.label} htmlFor="nombre">Nombre</label>
        <input
          type="text"
          name="nombre"
          id="nombre"
          value={usuario.nombre}  
          onChange={(e)=>SeTUsuario(prev=>({...prev,[e.target.name]:e.target.value}))}       
        />
        {state.error.nombre && (
          <p className={styles.errores}>{state.error.nombre}</p>
        )}

        <label className={styles.label} htmlFor="apellido">
          Ingrese su apellido
        </label>
        <input
          type="text"
          name="apellido"
          id="apellido"
             value={usuario.apellido}  
            onChange={(e)=>SeTUsuario(prev=>({...prev,[e.target.name]:e.target.value}))}      
       
        />
        {state.error.apellido && (
          <p className={styles.errores}>{state.error.apellido}</p>
        )}

        <label className={styles.label} htmlFor="dni">DNI</label>
        <input
          type="text"
          name="dni"
          id="dni"
           value={usuario.dni}  
            onChange={(e)=>SeTUsuario(prev=>({...prev,[e.target.name]:e.target.value}))}      
        
        />
        {state.error.dni && (
          <p className={styles.errores}>{state.error.dni}</p>
        )}

        <label className={styles.label} htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="email"
           value={usuario.email}  
            onChange={(e)=>SeTUsuario(prev=>({...prev,[e.target.name]:e.target.value}))}      
      
        />
        {state.error.email && (
          <p className={styles.errores}>{state.error.email}</p>
        )}

        <label className={styles.label} htmlFor="usuario">Usuario</label>
        <input
          type="text"
          name="usuario"
          id="usuario"
           value={usuario.usuario}  
            onChange={(e)=>SeTUsuario(prev=>({...prev,[e.target.name]:e.target.value}))}      
        />
        {state.error.usuario && (
          <p className={styles.errores}>{state.error.usuario}</p>
        )}

        <label className={styles.label} htmlFor="contrasena">
          contraseña
        </label>
        <input
          type="password"
          name="contrasena"
          id="contrasena"
           value={usuario.contrasena}  
            onChange={(e)=>SeTUsuario(prev=>({...prev,[e.target.name]:e.target.value}))}      
        />
        {state.error.contrasena && (
          <p className={styles.errores}>{state.error.contrasena}</p>
        )}

        {state.error.general && (
          <p className={styles.errores}>{state.error.general}</p>
        )}

        <button className={styles.enviar} type="submit">
          enviar
        </button>

        {state.success && (
          <p className={styles.success}>{state.success}</p>
        )}

      </form>
    </div>
  </>
)


}