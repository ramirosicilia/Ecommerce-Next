"use client"


import { useActionState } from "react"
import styles from "../components/login.module.css"
import Ingreso from "../../actions/Ingreso"
import "@/app/styles/global.css"


export default  function ViewLogin(){ 

    const initialForm={
        success:null,
        error:{},

    }

    const [state, FormAction]= useActionState(Ingreso,initialForm) 





    return(

    <>

    <div className={styles.container}> 

        <form action={FormAction} className={styles.formLogin}> 


            <div className={styles.contenedorLogin}> 

                 <label className={styles.label} htmlFor="usuario">Usuario</label>
                 <input type="text" name="usuario" id="user" /> 
            
                 <label className={styles.label} htmlFor="contrasena">Contraseña</label>
                  <input type="password" name="contrasena" id="password" />

                  <button  className={styles.enviar} type="submit">enviar</button>



            </div>

           




        </form>

       

    </div>


    </>
    
)







}