"use client"


import { createContext } from "react"; 
import { useReducerCart } from "../hooks/useReducerCat.js";





export const createContextCart= createContext() 



const ContextoCart = ({children}) => { 

    const {state ,dispatch}=useReducerCart()


  return ( 


  <> 

    <createContextCart.Provider value={{state,dispatch}}> 

        {children}


    </createContextCart.Provider>
  </>
  )
}

export default ContextoCart
