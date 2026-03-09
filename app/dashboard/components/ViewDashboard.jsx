"use client"


import styles from "@/app/dashboard/components/dashboard.module.css"
import Image from "next/image"
import "@/app/styles/global.css"
import "bootstrap-icons/font/bootstrap-icons.css";
import LogicaBotones from "@/app/dashboard/components/Button"
import { useRouter } from "next/navigation";




export default  function DashboardView({products,imagenes,categorias}){  



     const router=useRouter()
  
  
    function Carrito() { 


      router.push("/dashboard/cart")


      
    }
    
   

     return(
    
    <> 


    <div className={styles.containerHeader}>  
       <h1 className={styles.titulo} >Carrito de Compras</h1>
       <i className="bi bi-cart icon" onClick={Carrito}><span className={styles.numero} >0</span></i> 


    </div>

   
   <div className={styles.container}> 


      {products?.map((prod) => {

        const imagenProducto = imagenes?.find(img => img.producto_id === prod.producto_id)
        const categoriaProducto = categorias?.find(cat => cat.categoria_id === prod.categoria_id)
    
  

          const imageUrl = imagenProducto?.urls?.[0]  
          const category=categoriaProducto?.nombre_categoria

    return ( 
    
      <div className={styles.contenedor} key={prod.producto_id}>  
  
    
          <h2 className={styles.nombre}>{prod?.nombre_producto}</h2>
    
            {imageUrl && (
              <Image
                src={imageUrl}
                className={styles.imagen}
                width={180}
                height={180}
                alt="producto"
              />
            )} 
               <h2 className={styles.precio}>{`Precio: $${prod?.precio.toFixed(2)}`}</h2> 
               <h2 className={styles.categoria}>{`categoria: ${category}`}</h2> 
               <LogicaBotones id={prod.producto_id}/>
              
      </div> 
  
          
    )
})  

}



    </div>

    </>  

    
     )



}