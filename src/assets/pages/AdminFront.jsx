import { useEffect, useState } from "react";
import Navbar from "./layout/Navbar"
import axios from "axios";
import { useDispatch } from "react-redux";
import { createAsyncMessage } from "../redux/slice/toastSlice";
import Toast from "./layout/Toast";
import CalendarView from "./components/CalendarView";


function AdminFront() {
    const [events, setEvents] = useState([])
    const dispatch = useDispatch();


    const getBookingList = async (data) => {
        try {
            const res = await axios.get("https://us-central1-fir-room-rental.cloudfunctions.net/api/getBookings", data)
            console.log(res.data)
            const mapEvents = res.data.map((booking) => {
                const [year, month, day] = booking.date.split('-').map(Number);
                const [startHour, startMinute] = booking.times[0].split(':').map(Number);
                const [endHour, endMinute] = booking.times[booking.times.length - 1].split(':').map(Number);
                const start = new Date(year, month - 1, day, startHour, startMinute);
                const end = new Date(year, month - 1, day, endHour, endMinute);
                return {
                    title: booking.data.user?.group,
                    start,
                    end,
                    resource: booking.location,
                    id: booking.id,
                    data: {
                        user: {
                            email: booking.data.user?.email,
                            contact: booking.data.user?.contact,
                            content: booking.data.user?.content,
                            group: booking.data.user?.group,
                            number: booking.data.user?.number,
                            phone: booking.data.user?.phone,

                        }
                    },
                    weekDay: booking.weekDay,
                    times: booking.times,
                    date: booking.date,
                    starttime: booking.times[0],
                    endtime: booking.times[booking.times?.length - 1],
                    location: booking.location
                }
            })
            setEvents(mapEvents)
            dispatch(
                createAsyncMessage({
                    text: '取得場地登記資料',
                    type: '成功',
                    status: 'success',
                })
            );
        } catch (error) {
            const { message } = error.response.data;
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '取得場地登記資料失敗',
                    status: 'failed',
                })
            );
        }
    }

    useEffect(() => {
        getBookingList()
    }, [])
    return (<>
        <Navbar isAdminPage={true} />
        <div className="container">
            <CalendarView events={events} onDataChange={getBookingList}/>
        </div>
        <Toast />
    </>)
}

export default AdminFront