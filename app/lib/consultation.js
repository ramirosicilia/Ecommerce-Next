import { supabase } from "@/app/lib/DB.js"; 


export async function consultaProductos(){

    let { data: productos, error } = await supabase
  .from('productos')
  .select('*')  

  if(error) return error 

  if(productos.length===0){
    return[]
  }


  return productos
          
          


}  


export async function consultaUsuarios(){

    let { data: usuarios, error } = await supabase
  .from('usuarios')
  .select('*')  

  if(error) return error 

  if(usuarios.length===0){
    return[]
  }


  return usuarios
          
          


} 


export async function ProductosJoin(){
  const { data, error } = await supabase
  .from('productos')
  .select(`
    *,
    productos_variantes (
      *,
      colores (*),
      talles (*)
    )
  `)

if (error) console.error(error)
console.log(data) 

if(data.length===0){
  return

}

 return data
  
}




export async function consultaImagenes(){

    let { data: imagenes, error } = await supabase
  .from('imagenes')
  .select('*')  

  if(error) return error 

  if(imagenes.length===0){
    return[]
  }


  return imagenes

} 

export async function consultaCategorias(){

    let { data: categorias, error } = await supabase
  .from('categorias')
  .select('*')  

  if(error) return error 

  if(categorias.length===0){
    return[]
  }


  return categorias
          
          


}