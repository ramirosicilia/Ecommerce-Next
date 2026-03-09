"use client"

import Image from "next/image"
import styles from "../components/detail.module.css"
import "../../../styles/global.css"
import { createContextCart } from "../../Context/ContextoCart" 
import { useContext,useState } from "react"
import { useRouter } from "next/navigation";




const ViewDetails =  ({id, Productos, Imagenes,usuario, usuarios}) => { 

  console.log(id,"aca esta el id") 

  const {dispatch}= useContext(createContextCart)  


  const [variantes,SetVariantes]=useState(null)


  const router=useRouter()



  console.log(Productos, "LOS PRODUCTOS DEL JOIN")

  const productoDetalle= Productos.find(prod=>prod.producto_id===id)

  console.log(productoDetalle, "productos") 

  const productoImagenes=Imagenes.find(prod=>prod.producto_id===id).urls 

  const usuarioID=usuarios.find(user=>user.usuario===usuario).usuario_id

  console.log(productoImagenes,"imagenes DB")  

  const talles=productoDetalle.productos_variantes?.map(prod=>prod.talles.insertar_talle)
  console.log(talles,"tallezzzzzz")  

  const imagenesMiniaturas=productoImagenes.slice(1) 

  // 🔥 SOLO AGREGAMOS ESTO
  const [imagenPrincipal, setImagenPrincipal] = useState(productoImagenes[0]) 



  function agregarCarrito(){ 
       
     

          if(!variantes?.talles?.insertar_talle || !variantes?.colores?.insertar_color){ 
            
            alert("Debes seleccionar talle y color del producto") 
            return

          }

    if(variantes.talles.insertar_talle && variantes.colores.insertar_color){ 

      dispatch({type:"agregar",payload:{

        
        producto:{ 
          producto_id:id,
          variante_id:variantes.variante_id,
          nombre:productoDetalle.nombre_producto,
          precio:productoDetalle.precio,
          color:variantes.colores.insertar_color,
          cantidad:1,
          user_id:usuarioID,
           talle:variantes.talles.insertar_talle,
           stock:variantes.stock
        }
      }}) 

      router.push("/dashboard/cart")

    } 

    

  }

  

  return (

    <> 

    <div className={styles.container}> 

      <div  className={styles.contenedor} > 

           {/* 🔥 SOLO CAMBIAMOS src */}
           <Image 
             className={styles.imagenes} 
             src={imagenPrincipal} 
             alt="" 
             width={300} 
             height={300}
           ></Image>

        <div> 

          { 

           <div 
             className={styles.imagenesMiniaturas}
             onMouseLeave={()=>setImagenPrincipal(productoImagenes[0])}
           >   

              {imagenesMiniaturas.map((img)=>( 
              <div key={img}> 

                  <Image 
                    className={styles.imagenes}  
                    src={img} 
                    alt="" 
                    width={150} 
                    height={150}
                    onMouseOver={()=>setImagenPrincipal(img)}
                  ></Image>

              </div>

            ))}

           </div>
          
          }
           
        </div>

      </div> 


      <div  className={styles?.containerDetails}> 

        <h1 className={styles?.nombre}>{productoDetalle.nombre_producto}</h1>
        <h3>Descripción:  {productoDetalle.detalles}</h3>
        <h3>precio:$ {productoDetalle.precio.toFixed(2)}</h3>

        <div className={styles.containerSizes}> 
          <h2>tallas:</h2> 
             {productoDetalle.productos_variantes.map((prod)=>( 

              <div className={styles.cuadrados}  key={prod.variante_id} > 
                <h2 style={prod.variante_id===variantes?.variante_id?{color:"red"}:{color:"white"}} onClick={()=>SetVariantes(prod)}>{prod.talles.insertar_talle}</h2>
              </div>

            ))} 
        </div>
        
        <div className={styles.containerColors}> 
           <h2>colores:</h2> 
         {
          productoDetalle.productos_variantes.map((prod)=>(

            <div className={styles.cuadrados} key={prod.variante_id} >
              <h3 style={prod.variante_id===variantes?.variante_id?{color:"red"}:{color:"white"}} onClick={()=>SetVariantes(prod)}>{prod.colores.insertar_color}</h3>
            </div>

          ))
         }

        </div>
      
        <textarea className={styles.textarea}  value={productoDetalle?.descripcion}></textarea>
        <h2>Opciones de entrega</h2>
        <h3>llega mañana</h3> 
        <button onClick={agregarCarrito}  className={styles.enviar}>Agregar al Carrito</button>

      </div>

    </div>  

    
   
    </>
  )
}

export default ViewDetails