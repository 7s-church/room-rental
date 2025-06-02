import { Link } from "react-router-dom"
import Navbar from "./layout/Navbar"

function Successed() {
    return (
    <div  className="bg-primary-50">
        <Navbar />
        <div className="container text-center vh-100">
            <h3 className="text-primary mb-4">成功送出申請</h3>
            <Link to="/">回到場地登記表</Link>
        </div>
    </div>)
}

export default Successed