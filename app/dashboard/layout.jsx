import ContextoCart from "./Context/ContextoCart"

export default function LayoutDashboard({children}){




    return(
        <> 
           
           <ContextoCart> 
            
             {children}


           </ContextoCart>

       
        
        </>
    )
}