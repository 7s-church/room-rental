import { Modal } from "bootstrap";
import { useRef, useEffect, useState } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'
import axios from "axios";

function FrontCalenderModal({ modalRef, calendarRef }) {
    const frontCalenderRef = useRef(null);
    const [events, setEvents] = useState([])
    const today = new Date();

    const getBookingList = async (data) => {
        try {
            const res = await axios.get("https://us-central1-fir-room-rental.cloudfunctions.net/api/getBookings", data)

            const mapEvents = res.data.map((booking) => {
                const [year, month, day] = booking.date.split('-').map(Number);
                const [startHour, startMinute] = booking.times[0].split(':').map(Number);
                const [endHour, endMinute] = booking.times[booking.times.length - 1].split(':').map(Number);
                const start = new Date(year, month - 1, day, startHour, startMinute);
                const end = new Date(year, month - 1, day, endHour, endMinute);
                const user = booking.data?.user || {};

                const formetTime = (timeStr) => {
                    const [hour, minute] = timeStr.split(':');
                    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
                }
                return {
                    id: booking.id,
                    title: `[${booking.location}] ${booking.data.user.group ?? ''}`,
                    start,
                    end,
                    resourceId: booking.location,
                    email: user.email || '',
                    contact: user.contact || '',
                    content: user.content || '',
                    group: user.group || '',
                    number: user.number || '',
                    phone: user.phone || '',
                    weekDay: booking.weekDay,
                    times: booking.times,
                    date: booking.date,
                    starttime: booking.times[0],
                    endtime: booking.times[booking.times.length - 1],
                    location: booking.location,
                    displayTimeRange: `${formetTime(booking.times[0])}~${formetTime(booking.times[booking.times.length - 1])}`,
                    groupId: booking.groupId || ''
                }
            })
            setEvents(mapEvents)
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


    useEffect(() => {
        modalRef.current = new Modal(frontCalenderRef.current, {
            backdrop: false,
        })
    }, [])

    const closeModal = () => {
        modalRef.current.hide();
    };


    return (
        <div className="modal front-calendar-modal" tabIndex="-1" ref={frontCalenderRef} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">行事曆</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                    </div>
                    <div className="modal-body">
                        <FullCalendar
                            plugins={[dayGridPlugin]}
                            ref={calendarRef}
                            initialView="dayGridMonth"
                            initialDate={today}
                            events={events}
                            locale="zh-tw"
                            editable={false}
                            showNonCurrentDates={false}
                            height="auto"
                            buttonText={{
                                today: '今天',
                                dayGridMonth: '月',
                            }}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: '',
                            }}

                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false, // 24 小時制
                            }}
                            eventContent={(arg) => {
                                if (arg.view.type !== 'dayGridMonth') return true;
                                const event = arg.event;
                                const { displayTimeRange, location, group } = event.extendedProps;
                                return {
                                    html: `<b>${displayTimeRange}</b>[${location}] ${group}`,
                                };
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>)
}

export default FrontCalenderModal