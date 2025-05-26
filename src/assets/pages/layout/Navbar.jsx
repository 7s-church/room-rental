import { useRef } from "react"
import LongTurnModal from "../components/LongTurnModal";

function Navbar() {
    const modalRef = useRef(null);

    const openRef = () => {
        modalRef.current.show();
    }

    return (<>
        <nav className="d-flex justify-content-between align-items-center py-4 text-primary">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                <h1 className="ms-3 ms-md-4 mb-0 fs-3 fs-md-1">七賢路禮拜堂</h1>
                <span className="fs-3 fs-md-1">【聚會場地登記】</span>
            </div>
            <div className="d-flex align-items-center">
                <button type="button" className="btn btn-outline-primary me-md-4 me-2" onClick={openRef}>長期借用表單</button>
                <span className="material-symbols-outlined me-md-4 me-2" style={{ fontSize: "32px" }}>account_circle</span>
            </div>
        </nav>
        <LongTurnModal modalRef={modalRef}/>
    </>
    )
}

export default Navbar