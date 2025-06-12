function Footer() {
    return (
        <footer className='bg-primary text-white'>
            <div className="container">
                <div className="d-flex flex-column flex-md-row justify-content-end py-4">
                    <div className="d-flex align-items-center me-4 me-lg-6">
                        <span className="material-symbols-outlined me-2" style={{ fontSize: "16px" }}>location_on</span>
                        <h6 className="mb-0">80053 高雄市新興區七賢一路467號</h6>
                    </div>
                    <div className="d-flex align-items-center me-4 me-lg-6">
                        <span className="material-symbols-outlined me-2" style={{ fontSize: "16px" }}>call</span>
                        <a href="tel:072351622" className="text-white hover:text-primary-100">
                            (07)235-1622
                        </a>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="material-symbols-outlined me-2" style={{ fontSize: "16px" }}>mail</span>
                        <a href="mailto:xuxiaohui_64@livemail.tw" className="text-white hover:text-primary-100">
                            xuxiaohui_64@livemail.tw
                        </a>
                    </div>
                </div>
            </div>
        </footer>)
}

export default Footer