"use client"

import styles from "@/app/dashboard/components/dashboard.module.css"

import { useRouter } from "next/navigation"


export default function LogicaBotones({id}){  



    const router=useRouter() 

 

    console.log(id,"id rama")


         function handleClick(){
            
         

            router.push(`/dashboard/detailsProducts/${id}`)

          
         }  

        


    return(


        <> 

        <button onClick={handleClick} className={styles.boton}>Agregar</button>
        
        
        </> 

    )
}