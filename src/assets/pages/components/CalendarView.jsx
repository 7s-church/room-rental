import { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import EditEventModal from './EditEventModal';
import dayGridPlugin from '@fullcalendar/daygrid'
import axios from "axios";
import { createAsyncMessage } from "../../redux/slice/toastSlice"
import { useDispatch } from "react-redux";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const projectId = "fir-room-rental";
const defaultEventState = {
    email: "",
    contact: "",
    content: "",
    group: "",
    number: "",
    phone: "",
    date: "",
    location: "",
    times: [],
    starttime: "",
    endtime: "",
}

function CalendarView() {
    const [selectedEvent, setSelectedEvent] = useState(defaultEventState);
    const [roomList, setRoomList] = useState([]);
    const [events, setEvents] = useState([])
    const [modalMode, setModalMode] = useState(null);
    const [currentView, setCurrentView] = useState('resourceTimelineWeek')
    const calendarRef = useRef(null);
    const modalRef = useRef(null);
    const dispatch = useDispatch();

    const getRoomList = async () => {
        try {
            const res = await axios.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/room`)
            setRoomList(res.data.documents)
            dispatch(
                createAsyncMessage({
                    text: '取得場地資料',
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
        }
    }

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
                    displayTimeRange: `${formetTime(booking.times[0])}~${formetTime(booking.times[booking.times.length - 1])}`
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
        getRoomList()
    }, [])

    const roomNameList = roomList.map(room => ({ id: room.fields.title.stringValue, title: room.fields.title.stringValue }))


    const openModal = (mode, event) => {
        setModalMode(mode);
        switch (mode) {
            case 'create':
                setSelectedEvent(defaultEventState);
                break;
            case 'edit':
                setSelectedEvent(event);
                break;
            default:
                break;
        }
        modalRef.current.show();
    };

    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    //轉PDF
    const handleExportPDF = () => {
        const calendarEl = document.querySelector('.fc');
        if (!calendarEl) return;

        html2canvas(calendarEl, {
            useCORS: true,
            scale: 2,
            scrollY: -window.scrollY
        }).then((canvas) => {
            const imgHeight = canvas.height;
            const imgWidth = canvas.width;
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // 計算每頁圖片高度（按比例縮放）
            const ratio = pdfWidth / imgWidth;
            const scaledHeight = imgHeight * ratio;
            let position = 0;

            while (position < scaledHeight) {
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = (pdfHeight / ratio);

                const pageCtx = pageCanvas.getContext('2d');
                pageCtx.drawImage(
                    canvas,
                    0, position / ratio,
                    canvas.width, pageCanvas.height,
                    0, 0,
                    canvas.width, pageCanvas.height
                );

                const pageData = pageCanvas.toDataURL('image/png');
                if (position > 0) pdf.addPage();
                pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                position += pdfHeight;
            }

            pdf.save('月曆.pdf');
        })
    }
    return (<>
        <div style={{ height: '100vh', margin: '20px' }}>
            <div className="d-flex text-nowrap align-items-center mb-5 justify-content-between">
                <div className="input-group w-50">
                </div>
                <div>
                    <button type="button" className="btn btn-primary me-3" onClick={() => openModal('create')}>新增場地登記</button>
                    {currentView === 'dayGridMonth' && (
                        <button onClick={handleExportPDF} className="btn btn-primary me-3">
                            匯出月曆 PDF
                        </button>)}
                </div>
            </div>
            <FullCalendar
                plugins={[resourceTimelinePlugin, interactionPlugin, timeGridPlugin, dayGridPlugin]}
                ref={calendarRef}
                initialView="resourceTimelineWeek"
                initialDate={new Date()}
                resources={roomNameList}
                events={events}
                height="auto"
                editable={false}
                selectable={true}
                eventClick={({ event }) => {
                    const data = {
                        id: event.id,
                        ...event.extendedProps,
                        start: event.start,
                        end: event.end,
                        date: formatDate(event.start),
                    };
                    openModal('edit', data);
                }}
                locale="zh-tw"
                slotMinTime="08:00:00"
                slotMaxTime="22:00:00"
                slotLabelFormat={[
                    { weekday: 'short', day: 'numeric', month: 'numeric' }, // 顯示 "三 6/11"
                    { hour: '2-digit', minute: '2-digit', hour12: false },  // 顯示 "08:00"、"09:00"
                ]}
                slotLabelInterval={{ hours: 1 }}
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false, // 24 小時制
                }}

                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,resourceTimelineWeek,resourceTimelineDay',
                }}
                buttonText={{
                    today: '今天',
                    resourceTimelineDay: '日',
                    resourceTimelineWeek: '週',
                    dayGridMonth: '月',
                }}
                eventContent={(arg) => {
                    if (arg.view.type !== 'dayGridMonth') return true;
                    const event = arg.event;
                    const { displayTimeRange, location, group } = event.extendedProps;
                    return {
                        html: `<b>${displayTimeRange}</b>[${location}] ${group}`,
                    };
                }}
                datesSet={(arg) => {
                    setCurrentView(arg.view.type)
                }}
            />
        </div>
        <EditEventModal modalRef={modalRef} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} modalMode={modalMode} getBookingList={getBookingList} />
    </>
    )
}
export default CalendarView