import Navbar from "./layout/Navbar"
import Toast from "./layout/Toast";
import CalendarView from "./components/CalendarView";


function AdminFront() {

    return (<>
        <Navbar isAdminPage={true} />
        <div className="container">
            <CalendarView/>
        </div>
        <Toast />
    </>)
}

export default AdminFront