
function AlertModal({ alertRef, modalRef }) {
    const closeModal = () => {
        if (alertRef.current) {
            modalRef.current.hide();
        }
    };
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
                        <p>如需長期借用場地(三個月以上)請填寫「長期借用表單」向行政辦公室申請</p>
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