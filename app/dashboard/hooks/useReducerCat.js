"use client"

import {useReducer } from "react"
import { ReducerCart } from "../reducer/reducerCart.js"

const initialState = localStorage.getItem("carrito")?JSON.parse(localStorage.getItem("carrito")):[]

export const useReducerCart = () => {
  const [state, dispatch] = useReducer(ReducerCart, initialState)

  

  return { state, dispatch }
}