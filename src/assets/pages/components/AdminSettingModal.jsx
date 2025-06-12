import { Modal } from "bootstrap";
import { useRef, useEffect, useState } from "react";
import axios from "axios";
import { createAsyncMessage } from "../../redux/slice/toastSlice"
import { useDispatch } from "react-redux";
import { getAuth } from "firebase/auth";


function AdminSettingModal({ modalRef }) {
    const settingRef = useRef(null)
    const dispatch = useDispatch();
    const [allowNextYear, setAllowNextYear] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const modal = new Modal(settingRef.current, {
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.current = modal;
        return () => {
            modal.dispose();
        };
    }, [])

    const closeModal = () => {
        modalRef.current.hide();
    };

    const getStateNextYear = async () => {
        try {
            const res = await axios.get("https://us-central1-fir-room-rental.cloudfunctions.net/api/getAllowNextYear")
            setAllowNextYear(res.data.allowNextYear)
            dispatch(
                createAsyncMessage({
                    text: '取得明年度場地開放與否資料',
                    type: '成功',
                    status: 'success',
                })
            );
        } catch (error) {
            const { message } = error?.response?.data?.message || error.message || "未知錯誤";
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '取得明年度場地開放與否資料失敗',
                    status: 'failed',
                })
            );
        }
    }

    useEffect(() => {
        getStateNextYear()
    }, [])

    const handleToggleNextYear = async (e) => {
        const newValue = e.target.checked
        if (isSubmitting) return;
        setIsSubmitting(true);
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            dispatch(
                createAsyncMessage({
                    text: '尚未登入或驗證失敗',
                    type: '錯誤',
                    status: 'failed',
                })
            );
            setIsSubmitting(false);
            return;
        }

        try {
            const token = await currentUser.getIdToken();
            await axios.post("https://us-central1-fir-room-rental.cloudfunctions.net/api/setAllowNextYear", { allowNextYear: newValue },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            setAllowNextYear(newValue);
            dispatch(
                createAsyncMessage({
                    text: newValue ? '已開啟明年度預約功能' : '已關閉明年度預約功能',
                    type: '成功',
                    status: 'success',
                })
            );
        } catch (error) {
            const { message } = error?.response?.data?.message || error.message || "未知錯誤";
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '取得場地資料失敗',
                    status: 'failed',
                })
            );
        } finally {
            setIsSubmitting(false);
        }
    }
    return (
        <div className="modal" tabIndex="-1" ref={settingRef} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">設定</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                    </div>
                    <div className="modal-body">
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="flexSwitchCheckChecked"
                                checked={allowNextYear}
                                onChange={handleToggleNextYear}
                                disabled={isSubmitting} />
                            <label className="form-check-label" htmlFor="flexSwitchCheckChecked">開啟明年度場地申請</label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={closeModal}>確定</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminSettingModal