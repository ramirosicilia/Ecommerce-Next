import ViewCart from "./components/ViewCart" 
import {consultaImagenes} from "../../lib/consultation.js"


export default async function CartPage(){  

    const Imagenes= await consultaImagenes()


   

    return (

    <>


    <ViewCart imagenes={Imagenes}/>
    
    </>

    )

}