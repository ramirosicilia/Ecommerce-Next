export type FormErrors = {
  nombre?: string
  apellido?: string
  dni?: string
  email?: string
  usuario?: string
  contrasena?: string
  general?: string
}

export type FormState = {
  success: string | null
  error: FormErrors
  values?: {
    nombre?: string
    apellido?: string
    dni?: string
    email?: string
    usuario?: string
  }
}     

export type LoginState = {
  success: string | null
  error: FormErrors
  values?: {
    usuario?: string
    contrasena?: string
  }
}

