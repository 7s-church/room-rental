import { Modal } from "bootstrap";
import { useRef, useEffect, useState } from "react";
import ScreenLoading from "./ScreenLoading";
import { useDispatch } from "react-redux";
import { createAsyncMessage } from "../../redux/slice/toastSlice";
import axios from "axios";
const projectId = "fir-room-rental";

function FullYearBooking({ modalRef, selectedEvent, setSelectedEvent, getBookingList }) {
    const fullYearBookingRef = useRef(null);
    const dispatch = useDispatch();
    const [isScreenLoading, setIsScreenLoading] = useState(false)
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const weekdayMap = {
        "星期日": 0,
        "星期一": 1,
        "星期二": 2,
        "星期三": 3,
        "星期四": 4,
        "星期五": 5,
        "星期六": 6,
    };
    const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]
    const userFieldKeys = ["email", "contact", "content", "group", "number", "phone"];
    const today = new Date().toISOString().split('T')[0]


    const [roomList, setRoomList] = useState([]);

    const getRoomList = async () => {
        try {
            const res = await axios.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/room`)
            setRoomList(res.data.documents.map((item) => {
                return item.fields.title.stringValue
            }))

        } catch (error) {
            const { message } = error.response.data;
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '取得場地資料失敗',
                    status: 'failed',
                })
            );
        }
    }

    useEffect(() => {
        getRoomList()
    }, [])

    const preparePayload = (event) => {
        const userData = {};
        userFieldKeys.forEach(key => {
            userData[key] = event[key] || "";
        });

        const { dateFrom, dateTo, weekDay, times, location } = event;
        const payload = [];

        const groupId = `group-${Date.now()}`;
        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTo);
        const targetWeekday = weekdayMap[weekDay];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === targetWeekday) {
                const date = d.toISOString().split('T')[0];
                payload.push({
                    data: {
                        user: userData
                    },
                    date,
                    location,
                    weekDay,
                    times,
                    groupId
                });
            }
        }

        console.log("準備 payload", {
            dateFrom,
            dateTo,
            weekDay,
            targetWeekday,
            allDays: [...Array(7).keys()].map(i => ({
                day: i,
                label: weekdays[i]
            }))
        });
        return payload
    }

    const createNewBooking = async () => {
        setIsScreenLoading(true)
        const payloadList = preparePayload(selectedEvent);
        let successCount = 0;

        const { dateFrom, dateTo, weekDay, times, location } = selectedEvent;

        if (!dateFrom || !dateTo || !weekDay || !times?.length || !location) {
            dispatch(
                createAsyncMessage({
                    text: '請確認已選擇開始/結束日期、星期、時段與場地',
                    type: '欄位未填寫完整',
                    status: 'warning',
                })
            );
            return;
        }
        try {

            for (const booking of payloadList) {
                await axios.post("https://us-central1-fir-room-rental.cloudfunctions.net/api/addBooking", booking);
                successCount++;
            }
            dispatch(
                createAsyncMessage({
                    text: `成功新增 ${successCount} 筆場地登記資料`,
                    type: '成功',
                    status: 'success',
                })
            );
        } catch (error) {
            const message = error.response?.data?.error || error.message || '未知錯誤';
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '新增場地登記失敗',
                    status: 'failed',
                })
            );
        } finally {
            getBookingList()
            setIsScreenLoading(false)
            closeModal()
        }
    }


    const selectTimeRange = (start, end) => {
        const startIndex = times.indexOf(start);
        const endIndex = times.indexOf(end);
        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            return []
        }
        return times.slice(startIndex, endIndex + 1);
    }

    //時間
    const hadnleTimeGroup = (e) => {
        const { name, value } = e.target
        setSelectedEvent((prev) => {
            const updatedStart = name === 'starttime' ? value : prev.starttime;
            const updatedEnd = name === 'endtime' ? value : prev.endtime;
            const updatedRange = selectTimeRange(updatedStart, updatedEnd);

            return {
                ...prev,
                [name]: value,
                times: updatedRange,
            };
        });
    }

    const getinputValue = e => {
        const { value, name } = e.target;

        if (name === 'date') {
            const dateObj = new Date(value);
            const weekDay = weekdays[dateObj.getDay()];

            setSelectedEvent((prev) => ({
                ...prev,
                date: value,
                weekDay: weekDay,
            }))
        } else if (name === 'weekDay') {
            const targetDay = weekdayMap[value];
            const todayDate = new Date();
            const todayDay = todayDate.getDay();

            // 計算距離下一個目標星期的天數（例如今天週一，選週三 → +2）
            const diff = (targetDay + 7 - todayDay) % 7;
            const nextTargetDate = new Date(todayDate);
            nextTargetDate.setDate(todayDate.getDate() + diff);
            const nextDateStr = nextTargetDate.toISOString().split('T')[0];

            setSelectedEvent((prev) => ({
                ...prev,
                weekDay: value,
                dateFrom: nextDateStr,
            }));
        } else {
            setSelectedEvent((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    useEffect(() => {
        modalRef.current = new Modal(fullYearBookingRef.current, {
            backdrop: false,
        })
    }, [])


    const closeModal = () => {
        modalRef.current.hide();
    };


    return (
        <div className="modal" tabIndex="-1" ref={fullYearBookingRef} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">新增長期場地登記</h5>
                        <div className="ms-auto">
                            <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                        </div>
                    </div>
                    <div className="modal-body">
                        <div className="bg-white p-2 rounded">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label htmlFor="weekDay" className="form-label">星期</label>
                                    <select
                                        className="form-select"
                                        id="weekDay"
                                        name="weekDay"
                                        value={selectedEvent.weekDay ?? ""}
                                        onChange={getinputValue}>
                                        <option value="" disabled hidden>請選擇星期幾</option>
                                        {weekdays.map((weekday) => {
                                            return (
                                                <option value={weekday} key={weekday}>{weekday}</option>
                                            )
                                        })}
                                    </select>
                                </div>
                                <div className="col-md-12">
                                    <div className="d-flex">
                                        <div className="input-group mb-3 me-3 me-md-9">
                                            <label className="input-group-text" htmlFor="starttime">開始</label>
                                            <select
                                                className="form-select"
                                                id="starttime"
                                                name="starttime"
                                                value={selectedEvent.starttime ?? ""}
                                                onChange={hadnleTimeGroup}>
                                                {times.map((time) => {
                                                    return (
                                                        <option value={time} key={time}>{time}</option>
                                                    )
                                                })}
                                            </select>
                                            <label className="input-group-text" htmlFor="endtime">結束</label>
                                            <select
                                                className="form-select"
                                                id="endtime"
                                                name="endtime"
                                                value={selectedEvent.endtime ?? ""}
                                                onChange={hadnleTimeGroup}>
                                                {(selectedEvent.starttime ? times.filter(time => time >= selectedEvent.starttime) : times)
                                                    .map((time) => {
                                                        return (
                                                            <option value={time} key={time}>{time}</option>
                                                        )
                                                    })}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="weekDay" className="form-label">開始日期</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="dateFrom"
                                        name="dateFrom"
                                        value={selectedEvent.dateFrom || today}
                                        onChange={getinputValue} />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="weekDay" className="form-label">結束日期</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="dateTo"
                                        name="dateTo"
                                        value={selectedEvent.dateTo || '2025-12-31'}
                                        onChange={getinputValue} />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="location" className="form-label">借用場地</label>
                                    <select
                                        className="form-select"
                                        id="location"
                                        name="location"
                                        value={selectedEvent.location ?? ""}
                                        onChange={getinputValue}>
                                        <option value="" disabled hidden>請選擇場地</option>
                                        {roomList.map((room) => {
                                            return (
                                                <option value={room} key={room}>{room}</option>
                                            )
                                        })}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="group" className="form-label">借用單位</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="group"
                                        name="group"
                                        value={selectedEvent.group ?? ""}
                                        onChange={getinputValue} />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="contact" className="form-label">聯絡人</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="contact"
                                        name="contact"
                                        value={selectedEvent.contact ?? ""}
                                        onChange={getinputValue} />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="phone" className="form-label">聯絡電話</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        value={selectedEvent.phone ?? ""}
                                        onChange={getinputValue} />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={selectedEvent.email ?? ""}
                                        onChange={getinputValue} />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="number" className="form-label">參加人數</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="number"
                                        name="number"
                                        value={selectedEvent.number ?? ""}
                                        onChange={getinputValue} />
                                </div>
                                <div className="col-12">
                                    <label htmlFor="content" className="form-label">聚會內容</label>
                                    <textarea
                                        className="form-control"
                                        id="content"
                                        name="content"
                                        rows="3"
                                        value={selectedEvent.content ?? ""}
                                        onChange={getinputValue}></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={closeModal}>取消</button>
                            <button type="button" className="btn btn-primary" onClick={createNewBooking}>確認送出</button>
                        </div>

                    </div>
                </div>
            </div>
            <ScreenLoading isScreenLoading={isScreenLoading} />
        </div>
    )
}

export default FullYearBooking