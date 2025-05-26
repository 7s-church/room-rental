import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const toastSlice = createSlice({
    name: "toast",
    initialState: [],
    reducers: {
        updateMessage(state, action) {
            const { type, text, status } = action.payload;
            state.push({
                id: action.payload.id,
                type,
                text,
                status,
            })
        },
        removeMessage(state, action) {
            const index = state.findIndex(item => item.id === action.payload);
            if (index !== -1) {
                state.splice(index, 1)
            }
        }
    }
})

export const createAsyncMessage = createAsyncThunk(
    'toast/createAsyncMessage',
    async (payload, { dispatch, requestId }) => {
        dispatch(
            toastSlice.actions.updateMessage({
                ...payload,
                id: requestId
            })
        )
        setTimeout(()=>{
            dispatch(toastSlice.actions.removeMessage(requestId))
        }, 2000)
    }
)

export const {updateMessage,removeMessage} = toastSlice.actions;

export default toastSlice.reducer