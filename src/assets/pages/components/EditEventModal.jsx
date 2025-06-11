import { Modal } from "bootstrap";
import { useRef, useEffect, useState } from "react";
import ScreenLoading from "./ScreenLoading";
import { useDispatch } from "react-redux";
import { createAsyncMessage } from "../../redux/slice/toastSlice";
import axios from "axios";
const projectId = "fir-room-rental";
import { getAuth } from "firebase/auth";

function EditEventModal({ modalRef, selectedEvent, setSelectedEvent, modalMode, getBookingList }) {
    const editEventRef = useRef(null);
    const dispatch = useDispatch();
    const [isScreenLoading, setIsScreenLoading] = useState(false)
    const [weekday, setWeekday] = useState('')
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]
    const userFieldKeys = ["email", "contact", "content", "group", "number", "phone"];

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

        return {
            ...event,
            data: { user: userData },
        };
    }

    const editBooking = async () => {
        setIsScreenLoading(true)
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("尚未登入");
            const token = await user.getIdToken();
            const payload = preparePayload(selectedEvent);
            await axios.put(`https://us-central1-fir-room-rental.cloudfunctions.net/api/editBooking/${selectedEvent.id}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            dispatch(
                createAsyncMessage({
                    text: '修改場地登記成功',
                    type: '成功',
                    status: 'success',
                }))

        } catch (error) {
            const { message } = error.response.data;
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '修改場地登記失敗',
                    status: 'failed',
                })
            );
        } finally {
            setIsScreenLoading(false)
        }
    }

    const createNewBooking = async () => {
        setIsScreenLoading(true)
        try {
            const payload = preparePayload(selectedEvent);
            await axios.post("https://us-central1-fir-room-rental.cloudfunctions.net/api/addBooking", payload)
            dispatch(
                createAsyncMessage({
                    text: '新增場地登記成功',
                    type: '成功',
                    status: 'success',
                }))
        } catch (error) {
            const { message } = error.response.data;
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '新增場地登記失敗',
                    status: 'failed',
                })
            );
        } finally {
            setIsScreenLoading(false)
            closeModal()
        }
    }

    const btnUpdateProduct = async () => {
        try {
            const apiswitch =
                modalMode === 'create' ? createNewBooking : editBooking;
            await apiswitch();

        } catch (error) {
            const { message } = error.response.data;
            dispatch(
                createAsyncMessage({
                    text: message.join('、'),
                    type: '失敗',
                    status: 'failed',
                })
            );
        } finally {
            getBookingList()
            closeModal()
        }
    };

    const selectTimeRange = (start, end) => {
        const startIndex = times.indexOf(start);
        const endIndex = times.indexOf(end);

        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            return []
        }
        return times.slice(startIndex, endIndex + 1);
    }

    const getinputValue = e => {
        const { value, name, checked, type } = e.target;
        const updatedValue = type === 'checkbox' ? checked : value;

        if (name === 'starttime' || name === 'endtime') {
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
            return;
        }

        if (name === 'date') {
            const dateObj = new Date(value);
            const weekDay = weekdays[dateObj.getDay()];

            setSelectedEvent((prev) => ({
                ...prev,
                date: value,
                weekDay: weekDay,
            }));
        } else if (userFieldKeys.includes(name)) {
            setSelectedEvent((prev) => ({
                ...prev,
                [name]: updatedValue,
            }));
        }
        else {
            setSelectedEvent((prev) => ({
                ...prev,
                [name]: updatedValue,
            }));
        }
    };

    const deleteBooking = async () => {
        setIsScreenLoading(true)
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("尚未登入");
            const token = await user.getIdToken();
            await axios.delete(`https://us-central1-fir-room-rental.cloudfunctions.net/api/deleteBooking/${selectedEvent.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            dispatch(
                createAsyncMessage({
                    text: '刪除場地登記成功',
                    type: '成功',
                    status: 'success',
                }))

        } catch (error) {
            const { message } = error.response.data;
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '刪除場地登記失敗',
                    status: 'failed',
                })
            );
        } finally {
            setIsScreenLoading(false)
            onSuccess()
            closeModal()
        }
    }

    useEffect(() => {
        modalRef.current = new Modal(editEventRef.current, {
            backdrop: false,
        })
    }, [])


    const closeModal = () => {
        modalRef.current.hide();
    };

    const getWeekdayValue = (e) => {
        const { name, value } = e.target;
        if (name === 'date') {
            const date = new Date(value);
            const weekDay = weekdays[date.getDay()];
            setSelectedEvent(prev => ({ ...prev, date: value, weekDay }));
            setWeekday(weekDay)
        }

    }

    // // 全年借用設定
    // const getLongTurnBooking = (targetWeekday) => {
    //     const result = [];
    //     const today = new Date();
    //     const endOfYear = new Date(today.getFullYear(), 11, 31)
    //     const dayDiff = (targetWeekday + 7 - today.getDay()) % 7;

    //     let current = new Date(today);
    //     current.setDate(today.getDate() + dayDiff)

    //     while (current <= endOfYear) {
    //         result.push(new Date(current));
    //         current.setDate(current.getDate() + 7)
    //     }
    //     return result
    // }
    return (
        <div className="modal" tabIndex="-1" ref={editEventRef} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                {modalMode === 'recurring' ? (<div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">今年度借用場地登記</h5>
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
                                        value={weekday}
                                    >
                                        <option selected>請選擇星期幾</option>
                                        {weekdays.map((weekday) => {
                                            return (
                                                <option value={weekday} key={weekday}>{weekday}</option>)
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
                                                onChange={getinputValue}>
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
                                                value={selectedEvent?.endtime ?? ""}
                                                onChange={getinputValue}>
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
                                    <label htmlFor="location" className="form-label">借用場地</label>
                                    <select
                                        className="form-select"
                                        id="location"
                                        name="location"
                                        value={selectedEvent?.location ?? ""}
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
                            <button type="submit" className="btn btn-primary" onClick={btnUpdateProduct}>確認送出</button>
                        </div>

                    </div>
                </div>) : (<div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{modalMode === 'create' ? '新增場地登記' : '編輯場地登記'}</h5>
                        <div className="ms-auto">
                            {modalMode === 'edit' && (<button type="button" className="btn btn-primary me-3" onClick={deleteBooking}>刪除此登記</button>)}
                            <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                        </div>
                    </div>
                    <div className="modal-body">
                        <div className="bg-white p-2 rounded">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label htmlFor="date" className="form-label">日期</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="date"
                                        name="date"
                                        value={selectedEvent?.date ?? ""}
                                        onChange={getWeekdayValue} />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="weekDay" className="form-label">星期</label>
                                    <input
                                        className="form-select"
                                        id="weekDay"
                                        name="weekDay"
                                        value={selectedEvent?.weekDay ?? weekday ?? ""}
                                        readOnly />
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
                                                onChange={getinputValue}>
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
                                                onChange={getinputValue}>
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
                            <button type="submit" className="btn btn-primary" onClick={btnUpdateProduct}>確認送出</button>
                        </div>

                    </div>
                </div>)}
            </div>
            <ScreenLoading isScreenLoading={isScreenLoading} />
        </div>
    )
}

export default EditEventModal