import jwt from "jsonwebtoken" 

const claveSecreta=process.env.JWT_SECRET


export function getToken(payload){

    return jwt.sign(payload,claveSecreta,{expiresIn:"7d"})
}


export function verificarCookie(token){

    return jwt.verify(token,claveSecreta)
}