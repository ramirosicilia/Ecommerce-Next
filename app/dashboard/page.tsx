 import DashoboardView from "./components/ViewDashboard"
 import { consultaImagenes } from "../lib/consultation.js"
 import { ProductosJoin } from "../lib/consultation.js"
 import { consultaCategorias } from "../lib/consultation.js"


export default async function DasboardPage(){ 


    const imagenes= await consultaImagenes()
    const productos=await ProductosJoin()
    const categorias= await consultaCategorias()






    return(
    
    <> 

     <DashoboardView products={productos} imagenes={imagenes} categorias={categorias}  />




    
    </> 
    
)



}