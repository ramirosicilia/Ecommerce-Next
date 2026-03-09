"use client"
import styles from "../components/cart.module.css"
import "../../../styles/global.css"
import "bootstrap-icons/font/bootstrap-icons.css";
import Image from "next/image"
import Button from "../components/Button"
import { useRouter } from "next/navigation";
import { useEffect,useContext } from "react" 
import { createContextCart } from "../../Context/ContextoCart"




const ViewCart = ({imagenes}) => {   
 
    const {state,dispatch} =useContext(createContextCart) 


 const router= useRouter()
     

    function agregar(producto){ 
 
      dispatch({type:"agregar",payload:{
       
        
        producto:producto

      }})  

          


    } 

     function quitar(producto){ 
 
      dispatch({type:"sacar",payload:{
    
        
        producto:producto
         
      

      }})  

          console.log({...state})


    } 






    const totalCompra=state.reduce((acc,prod)=>acc +(prod.precio *prod.cantidad),0) || 0 

    const cantidadCarrito= state.reduce((acc,prod)=>acc+ prod.cantidad,0) || 0




    console.log(state) 

    function limpiar() { 

      dispatch({type:"limpiar",payload:[]}) 

      localStorage.removeItem("carrito")
      
    } 

    function goCart() { 

      router.push("/dashboard")


      
    }



    useEffect(()=>{ 


        localStorage.setItem("carrito",JSON.stringify(state))

    },[state])


  return ( 

    <> 

    
      <div className={styles.containerHeader}>  
        <h1 onClick={goCart} className={styles.titulo} >Carrito de Compras</h1>
        <i className="bi bi-cart icon"><span className={styles.numero} >{cantidadCarrito}</span></i> 
    
     </div>


    <div className={styles.contenedor}> 


      {state.map((prod)=>{ 

        const imagenPrincipal= imagenes.find(img=>img.producto_id===prod.producto_id)
        console.log(imagenPrincipal) 

        const imagenMostrar=imagenPrincipal?.urls[0]
        console.log(imagenMostrar)


   return(
      <div key={prod.variante_id} className={styles.contenedorCarrito}> 

      <div>

        
      </div>

        <Image className={styles.imagen} src={imagenMostrar} width={120} height={120} alt="" ></Image>

        <div className={styles.items}> 

          <p className={styles.itemChildren}>titulo</p> 
          <h2>{prod.nombre}</h2> 

        </div> 

         <div className={styles.items}> 

          <p className={styles.itemChildren} >cantidad</p>
          <h2>{prod.cantidad}</h2> 

        </div> 

         <div className={styles.items}> 

          <p className={styles.itemChildren}>precio</p>
          <h2>$ {prod.precio?.toFixed(2)}</h2> 

        </div> 

         <div className={styles.items}> 

          <p className={styles.itemChildren}>Sub total</p>
          <h2>${prod.precio * prod.cantidad || 0}</h2> 

        </div>  

        <div className={styles.containerButton}> 

          <button type="button" className={styles.botones} onClick={()=>agregar(prod)}>+</button> 
          
          <button type="button" className={styles.botones} onClick={()=>quitar(prod)}>-</button>


        </div>
 
       

        </div>
   )
      })} 

      <div className={styles.containerCompra}>
        <button  onClick={limpiar} className={styles.vaciar}>Vaciar Carrito</button> 
        <h2>total: ${totalCompra}</h2>
        <Button/>
      
      </div>

      
    </div>
    
    </>

    

  )
}

export default ViewCart
