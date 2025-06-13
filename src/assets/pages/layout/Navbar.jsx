import { useRef } from "react"
import LongTurnModal from "../components/LongTurnModal";
import AdminSettingModal from "../components/AdminSettingModal"
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useDispatch } from "react-redux";
import { createAsyncMessage } from "../../redux/slice/toastSlice";

function Navbar({ isAdminPage }) {
    const modalRef = useRef(null);
    const navigate = useNavigate()

    const openRef = () => {
        modalRef.current.show();
    }

    const opensettingModal = () => {
        modalRef.current.show();
    }


    const handleAdminLogout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
            navigate('/');
            dispatch(
                createAsyncMessage({
                    text: '管理員登出成功',
                    type: '成功',
                    status: 'success',
                }))
        } catch (error) {
            const message = error.response?.data?.error || error.message || '未知錯誤';
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '管理員登出失敗',
                    status: 'failed',
                })
            );
        }
    };
    return (<>
        <nav className="d-flex justify-content-between align-items-center py-4 text-primary">
            <Link className="d-flex flex-column flex-md-row align-items-start align-items-md-center text-decoration-none" to='/'>
                <h1 className="ms-3 ms-md-4 mb-0 fs-3 fs-md-1">七賢路禮拜堂</h1>
                <span className="fs-3 fs-md-1">【聚會場地登記】</span>
            </Link>
            <div className="d-flex align-items-center">
                {isAdminPage ? (<>
                    <p className="me-md-3 me-2 mb-0">歡迎來到管理頁面</p>
                    <button type="button" className="btn px-0" onClick={opensettingModal}>
                        <span className="material-symbols-outlined align-middle text-primary" style={{ fontSize: "24px" }}>settings</span>
                    </button>
                    <button type="button" data-bs-toggle="tooltip" data-bs-placement="管理者登出" className="btn" onClick={handleAdminLogout}>
                        <span className="material-symbols-outlined me-md-4 me-2 align-middle text-primary" style={{ fontSize: "24px" }}>exit_to_app</span>
                    </button>
                </>
                ) : (
                    <>
                        <button type="button" className="btn btn-outline-primary me-md-4 me-2" onClick={openRef}>長期借用表單</button>
                        <Link to='/adminlogin'>
                            <button type="button" data-bs-toggle="tooltip" data-bs-placement="管理者登入" className="btn">
                                <span className="material-symbols-outlined me-md-4 me-2 align-middle" style={{ fontSize: "32px" }}>account_circle</span>
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </nav >
        <LongTurnModal modalRef={modalRef} />
        <AdminSettingModal modalRef={modalRef} />
    </>
    )
}

export default Navbar