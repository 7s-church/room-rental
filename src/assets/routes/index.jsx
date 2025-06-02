import App from "../../App";
import AdminFront from "../pages/AdminFront";
import AdminLogin from "../pages/AdminLogin";
import Successed from "../pages/Successed";

const routes = [
    {
        index: true,
        element: <App />
    },
    {
        path: '/successed',
        element: <Successed />
    },
    {
        path: '/adminlogin',
        element: <AdminLogin />
    },
    {
        path: '/admin',
        element: <AdminFront />
    }
]

export default routes