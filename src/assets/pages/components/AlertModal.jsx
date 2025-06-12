import axios from 'axios'
import { useEffect, useState } from 'react';

function AlertModal({ alertRef, modalRef }) {
    const [allowNextYear, setAllowNextYear] = useState(false)
    const closeModal = () => {
        if (alertRef.current) {
            modalRef.current.hide();
        }
    };

    const getStateNextYear = async () => {
        try {
            const res = await axios.get("https://us-central1-fir-room-rental.cloudfunctions.net/api/getAllowNextYear")
            setAllowNextYear(res.data.allowNextYear)
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

    return (
        <div className="modal" tabIndex="-1" ref={alertRef} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <span className="material-symbols-outlined text-warning me-2">warning</span>
                        <h5 className="modal-title">使用規則</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                    </div>
                    <div className="modal-body">
                        <p>本表單為教會內牧區小組單位借用場地登記<br />外借場地請洽行政部辦公室書面申請</p>
                        <p>如所選時段與場地須協調請洽行政辦公室</p>
                        <p>如需長期借用場地請填寫「長期借用表單」向行政辦公室申請</p>
                        {allowNextYear ? (<p>已開放明年度場地申請</p>) : (<p>僅限今年度(114年)場地申請</p>)}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={closeModal}>確定</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AlertModal