import Image from "next/image";
import mujeres from "../img/mujeres_comprando.jpg"
import styles from "../components/index.module.css"
import Link from "next/link";


export default function HomeView(){ 


     return (
    <> 

    <div className={styles.container} > 

        <h1 className={styles.titulo}>Carrito de Compras:</h1> 
        <Link className={styles.link} target="blank" href="/dashboard">Productos</Link>

    </div>

    

    <Image className={styles.imagen} src={mujeres} alt=""></Image>

  
    </>
  );





}