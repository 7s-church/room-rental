import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyBfiEZRJrzCtx1LOoZzZ_XDsI5sUPcxxnc",
    authDomain: "fir-room-rental.firebaseapp.com",
    projectId: "fir-room-rental",
    storageBucket: "fir-room-rental.firebasestorage.app",
    messagingSenderId: "106447667454",
    appId: "1:106447667454:web:185ceb232d9f583580a5af",
};

// 初始化 Firebase App
const app = initializeApp(firebaseConfig);

// 取得 auth 實例
export const auth = getAuth(app);