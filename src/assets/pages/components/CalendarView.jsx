import { useState, useRef } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import { dateFnsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import zhTW from 'date-fns/locale/zh-TW'
import EditEventModal from './EditEventModal'



const locales = {
    'zh-TW': zhTW,
}
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
})

const defaultEventState = {
    data: {
        user: {
            email: "",
            contact: "",
            content: "",
            group: "",
            number: "",
            phone: ""

        }
    },
    date: "",
    location: "",
    times: [],
    starttime: "",
    endtime: "",
}

function CalendarView({ events, onDataChange }) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalMode, setModalMode] = useState(null);
    const modalRef = useRef(null);

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

    const CustomEvent = ({ event }) => (
        <span>
            <strong>{event.title}</strong>
            <br />
            <small>{event.resource}</small>
        </span>
    );
    return (<>
        <div style={{ height: '100vh', margin: '20px' }}>
            <div className="d-flex text-nowrap align-items-center mb-5 justify-content-between">
                <div className="input-group w-50">
                    {/* <input type="text" className="form-control" placeholder="請輸入申請單位" aria-label="search" aria-describedby="search" />
                    <span className="input-group-text" id="search">搜尋</span> */}
                </div>
                <div>
                    <button type="button" className="btn btn-primary me-3" onClick={() => openModal('create')}>新增場地登記</button>
                </div>
            </div>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                defaultView="week"
                views={['month', 'week', 'day']}
                culture="zh-TW"
                min={new Date(1970, 1, 1, 8, 0)}
                max={new Date(1970, 1, 1, 22, 0)}
                step={30}
                timeslots={1}
                onSelectEvent={(event) => openModal('edit', event)}
                formats={{
                    timeGutterFormat: 'HH:mm',
                }}
                messages={{
                    week: '週',
                    work_week: '工作週',
                    day: '日',
                    month: '月',
                    previous: '上一頁',
                    next: '下一頁',
                    today: '今天',
                    agenda: '行程',
                    date: '日期',
                    time: '時間',
                    event: '事件',
                    noEventsInRange: '這個時間範圍沒有活動。',
                }}
                components={{
                    event: CustomEvent,
                }}
                style={{ backgroundColor: '#fff', borderRadius: '10px' }}
            />
        </div>
        <EditEventModal modalRef={modalRef} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} modalMode={modalMode} onSuccess={onDataChange} />
    </>
    )
}
export default CalendarView