import Link from "next/link";
import styles from "../components/navbar.module.css"

export default function Navbar(){

    return(

    <>

    <div className={styles.containerNav}>

        <Link className={styles.link} href="/">Home</Link>
        <Link className={styles.link} href="form">form</Link>
        <Link className={styles.link} href="login">login</Link>

    </div>






    </>
    
)


}