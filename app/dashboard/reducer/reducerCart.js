

export const  ReducerCart=(state,{type, payload})=>{ 

    switch (type) { 

       
        case  "agregar": 

         return state?.some(prod=>prod.variante_id===payload.producto.variante_id)?state?.map(p=>p.variante_id===payload.producto.variante_id&& p.cantidad < p.stock?{...p,cantidad:p.cantidad+1}:p):[...state,{... payload.producto}]

             case  "sacar": 

         return  state?.map(p=>p.variante_id===payload.producto.variante_id&& p.cantidad>0?{...p,cantidad:p.cantidad-1}:p).filter(p=>p.cantidad>0)

        case "limpiar": 

        return []
    
        default:
            return state
    }


}