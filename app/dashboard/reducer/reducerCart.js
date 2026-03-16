

export const  ReducerCart=(state,action)=>{ 

    switch (action.type) { 

        case "cargar":
         return action.payload

       
        case  "agregar": 

         return state?.some(prod=>prod.variante_id===action.payload.producto.variante_id)?state?.map(p=>p.variante_id===action.payload.producto.variante_id&& p.cantidad < p.stock?{...p,cantidad:p.cantidad+1}:p):[...state,{... action.payload.producto}]

             case  "sacar": 

         return  state?.map(p=>p.variante_id===action.payload.producto.variante_id&& p.cantidad>0?{...p,cantidad:p.cantidad-1}:p).filter(p=>p.cantidad>0)

        case "limpiar": 

        return []
    
        default:
            return state
    }


}