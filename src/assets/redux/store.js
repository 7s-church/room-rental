import { configureStore } from "@reduxjs/toolkit";
import toastReducer from './slice/toastSlice'

export const store = configureStore({
    reducer:{
        toast:toastReducer
    }
})