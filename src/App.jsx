import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Swiper, SwiperSlide } from 'swiper/react';
import { createAsyncMessage } from './assets/redux/slice/toastSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal } from "bootstrap";
import Calendar from 'react-calendar';
import axios from 'axios'
import Input from './assets/pages/components/Input';
import AlertModal from './assets/pages/components/AlertModal';
import Navbar from './assets/pages/layout/Navbar';
import Footer from './assets/pages/layout/Footer';
import Toast from './assets/pages/layout/Toast'
import ScreenLoading from './assets/pages/components/ScreenLoading';
import emailjs from "@emailjs/browser";


import 'react-calendar/dist/Calendar.css';
import 'swiper/css';

const projectId = "fir-room-rental";


function App() {
  const [roomList, setRoomList] = useState([]);
  const [bookingList, setBookingList] = useState([])
  const [selectRoom, setSelectRoom] = useState('')
  const [selectTag, setSelectTag] = useState('')
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isScreenLoading, setIsScreenLoading] = useState(false)
  const [allowNextYear, setAllowNextYear] = useState(false);
  const [bookingType, setBookingType] = useState("")
  const modalRef = useRef(null);
  const alertRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formRef = useRef();

  const thisYear = new Date().getFullYear();
  const minDate = new Date(thisYear, 0, 1);
  const maxDate = allowNextYear ? (new Date(thisYear + 1, 11, 31)) : (new Date(thisYear, 11, 31))
  const minDateStr = new Date(thisYear, 0, 1).toISOString().split('T')[0];
  const maxDateStr = allowNextYear
    ? new Date(thisYear + 1, 11, 31).toISOString().split('T')[0]
    : new Date(thisYear, 11, 31).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const roomNameList = ["7樓會議室", "601餐廳", "603教室", "503教室", "505會議室", "506圖書室",
    "507音樂教室", "402母子室", "406禱告室", "407禱告室", "三樓大堂", "205地板教室",
    "206教室", "204教室", "203教室", "202教室", "交誼廳", "一樓副堂", "一樓台語堂", "舊101室"]

  const roomColMap = {
    "7樓會議室": "col-5 mx-auto",
    "601餐廳": "col-8",
    "603教室": "col-4",
    "503教室": "col-2",
    "505會議室": "col-4",
    "402母子室": "col-6",
    "三樓大堂": "col-12",
    "206教室": "col-2",
    "204教室": "col-2",
    "203教室": "col-2",
    "交誼廳": "col-2",
    "一樓副堂": "col-4",
    "一樓台語堂": "col-4",
    "舊101室": "col-2"
  };

  const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]

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
  const {
    register,
    unregister,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      dateFrom: today,
      dateTo: today,
    }
  })

  const onSubmit = handleSubmit(data => {
    if (!startTime || !endTime) return;
    const startIndex = times.indexOf(startTime);
    const endIndex = times.indexOf(endTime);
    const selected = times.slice(startIndex, endIndex + 1);
    const { ...user } = data;

    if (bookingType === "single") {
      const submitDetail = {
        data: { user },
        date: dateString,
        weekDay: weekdayString,
        times: selected,
        location: selectRoom
      };

      handleSingleSubmit(submitDetail);
      sentEmail(data, selected, selectRoom);
    }

    if (bookingType === "longTime") {
      handleLongTermSubmit(data, selected, user);
    }
  })

  const handleSingleSubmit = async (data) => {
    setIsScreenLoading(true)
    try {
      await axios.post("https://us-central1-fir-room-rental.cloudfunctions.net/api/addBooking", data)
      dispatch(
        createAsyncMessage({
          text: `成功登記場地`,
          type: '成功',
          status: 'success',
        })
      );
      getRoomList();
      setStartTime(null);
      setEndTime(null);
      setSelectRoom('');
      setSelectedDate(new Date())
      navigate('/successed')
    } catch (error) {
      const message = error.response?.data?.error || error.message || '未知錯誤';
      dispatch(
        createAsyncMessage({
          text: message,
          type: '場地登記失敗',
          status: 'failed',
        })
      );
    } finally {
      setIsScreenLoading(false);
      reset();
    }
  }

  const handleLongTermSubmit = async (formData, selectedTimes, user) => {
    setIsScreenLoading(true)
    const targetWeekday = formData.weekDay;
    const targetWeekdayIndex = weekdayMap[targetWeekday];
    const dateFrom = new Date(formData.dateFrom);
    const dateTo = new Date(formData.dateTo);

    const bookings = [];
    for (let d = new Date(dateFrom); d <= dateTo; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === targetWeekdayIndex) {
        const bookingDateStr = d.toISOString().split("T")[0];
        const bookingDetail = {
          data: { user },
          date: bookingDateStr,
          weekDay: weekdays[d.getDay()],
          times: selectedTimes,
          location: selectRoom,
        };
        bookings.push(bookingDetail);
      }
    }
    try {
      const results = await Promise.allSettled(
        bookings.map((b) =>
          axios.post("https://us-central1-fir-room-rental.cloudfunctions.net/api/addBooking", b)
        )
      );
      const success = results.filter((r) => r.status === "fulfilled").length;
      dispatch(
        createAsyncMessage({
          text: `成功新增 ${success} 筆場地登記資料`,
          type: '成功',
          status: 'success',
        })
      );
      navigate("/successed");
    } catch (error) {
      const message = error.response?.data?.error || error.message || '未知錯誤';
      dispatch(
        createAsyncMessage({
          text: message,
          type: '場地登記失敗',
          status: 'failed',
        })
      );
    } finally {
      setIsScreenLoading(false);
      reset();
      setStartTime(null);
      setEndTime(null);
      setSelectRoom('');
      setSelectedDate(new Date());
      getRoomList();
    }
  };

  // 驗證送出模式
  useEffect(() => {
    reset();
    if (bookingType === "single") {
      unregister("weekDay");
      unregister("dateFrom");
      unregister("dateTo");
    } else if (bookingType === "longTime") {
      unregister("selectedDate");
    }
  }, [bookingType]);

  const sentEmail = async (data, selected, selectRoom) => {
    try {
      const res = await emailjs.send("service_zyy3wgz", "template_1xdk17e", {
        email: data.email,
        contact: data.contact,
        content: data.content,
        date: dateString,
        weekday: weekdayString,
        time: `${selected[0]}~${selected[selected.length - 1]}`,
        location: selectRoom,
        group: data.group,
        phone: data.phone,
        number: data.number,
      },
        "_l492JzLkW_Vu1P8u");
      dispatch(
        createAsyncMessage({
          text: res.text,
          type: '郵件已成功發送！',
          status: 'success',
        })
      );
    } catch (error) {
      const { message } = error.response.data;
      dispatch(
        createAsyncMessage({
          text: message.join('、'),
          type: '郵件發送失敗',
          status: 'failed',
        })
      );
    } finally {
      reset()
    }
  }

  const getBookingList = async (data) => {
    try {
      const res = await axios.get("https://us-central1-fir-room-rental.cloudfunctions.net/api/getBookings", data)
      const bookedMap = {};
      res.data.forEach((booking) => {
        const { date, location, times } = booking;

        if (!bookedMap[date]) {
          bookedMap[date] = {}
        }
        if (!bookedMap[date][location]) {
          bookedMap[date][location] = [];
        }
        bookedMap[date][location].push(...times);
      })
      setBookingList(bookedMap);
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


  const getRoomList = async () => {
    try {
      const res = await axios.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/room`)
      setRoomList(res.data.documents)
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
    getRoomList()
    getBookingList()
    getStateNextYear()
  }, [])

  const selectItem = (value) => {
    setSelectRoom(value)
  }

  const tags = [...new Set(roomList.flatMap(tag => tag.fields?.tag?.arrayValue?.values.map(tag => tag.stringValue?.trim())
  )
    .filter(Boolean)
  )]

  const seeAll = () => {
    setSelectRoom('');
    setSelectTag('')
  }

  const tagFilterRooms = roomList.filter((room) => {
    if (selectTag === '') return true;
    const tags = room.fields?.tag?.arrayValue?.values || [];
    return tags.some(tag => tag.stringValue === selectTag);
  })

  const filterRoom = room => {
    const roomName = room.fields?.title?.stringValue;
    const roomTags = room.fields?.tag?.arrayValue?.values?.map(tag => tag.stringValue) || [];

    // 條件 1：是否符合目前選中的房間（或沒選）
    const isSelectedOrAll = !selectRoom || roomName === selectRoom;

    // 條件 2：是否符合目前選中的 tag（或沒選）
    const isTagMatched = !selectTag || roomTags.includes(selectTag);

    // 條件 3：如果未選擇時間，不檢查衝突
    if (!startTime || !endTime) {
      return isSelectedOrAll && isTagMatched;
    }

    // 預約衝突檢查
    const dateBookings = bookingList[dateString];
    const roomBookedTimes = dateBookings?.[roomName] || [];

    const startIndex = times.indexOf(startTime);
    const endIndex = times.indexOf(endTime);
    const selectedRange = times.slice(startIndex, endIndex + 1);
    const hasConflict = selectedRange.some(time => roomBookedTimes.includes(time));

    // 條件 4：無衝突才回傳 true
    return isSelectedOrAll && isTagMatched && !hasConflict;
  };

  const handleSelectTime = (time) => {
    if (!startTime || (startTime && endTime)) {
      setStartTime(time);
      setEndTime(null);
    } else {
      const startIndex = times.indexOf(startTime);
      const selectedIndex = times.indexOf(time);

      if (selectedIndex > startIndex) {
        setEndTime(time);
      } else {
        setStartTime(time);
        setEndTime(null);
      }
    }
  };

  const removeSelectTime = () => {
    setStartTime(null);
    setEndTime(null);
  }

  useEffect(() => {
    if (alertRef.current) {
      modalRef.current = new Modal(alertRef.current);
      alertRef.current.addEventListener("shown.bs.modal", () => {
        alertRef.current.querySelector(".btn-close")?.focus();
      });
      modalRef.current.show();
    }
  }, []);


  // 時間格式
  const formatDate = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const dateString = formatDate(selectedDate)
  const weekdayString = selectedDate.toLocaleDateString('zh-TW', { weekday: 'long' });

  const filteredTimes = weekdayString === '星期日' ? times.filter((time) => time <= "17:00")
    : times;

  const selectedWeekDay = watch("weekDay");

  useEffect(() => {
    if (!selectedWeekDay) return;

    const targetIndex = weekdayMap[selectedWeekDay];
    const today = new Date();
    const todayIndex = today.getDay();

    let offset = targetIndex - todayIndex;
    if (offset <= 0) offset += 7; // 下週的同一天

    const nextTargetDate = new Date(today);
    nextTargetDate.setDate(today.getDate() + offset);

    const formattedDate = nextTargetDate.toISOString().split("T")[0];
    setValue("dateFrom", formattedDate);
    setValue("dateTo", formattedDate);
  }, [selectedWeekDay, setValue]);

  return (
    <div className="bg-primary-50">
      <Navbar />
      <div className="container pb-8">
        <form onSubmit={handleSubmit(onSubmit)} ref={formRef}>
          {/* 時間 */}
          <section>
            <div className="row g-4 align-items-stretch">
              <div className="col-6">
                <button type="button" className="btn btn-outline-primary w-100 h-100 py-3 btnL" onClick={() => setBookingType("single")}>
                  <h4 className="fs-6 fs-lg-4">單次借用</h4>
                </button>
              </div>
              <div className="col-6">
                <button type="button" className="btn btn-outline-primary w-100 h-100 py-3 btnL" onClick={() => setBookingType("longTime")}>
                  <h4 className="fs-6 fs-lg-4">長期借用(長期每週借用)</h4>
                  <small className="text-white fs-7 fs-lg-6">*非連續每週使用請選擇單次借用</small>
                </button>
              </div>
            </div>
            {bookingType === "" ? (<div className="mb-8 mb-lg-5">
            </div>) : (
              <div className="border-bottom border-primary py-md-6 py-0">
                {bookingType === "single" ? (<>
                  <h3 className="mt-4 mb-4"><small className="text-danger">*</small>請選擇時間</h3>
                  <div className="row g-4">
                    <div className="col-lg-6 d-flex justify-content-center">
                      <Calendar
                        onChange={setSelectedDate}
                        value={selectedDate}
                        minDate={minDate}
                        maxDate={maxDate} />
                    </div>
                    <div className="col-lg-6">
                      {weekdayString === '星期一' ? (
                        <h4 className="mt-4">週一為本堂休假日，<br />若有借用需求請洽行政同工或本堂長老</h4>
                      ) : (<>
                        <h5 className="mb-4"><small className="text-danger">*</small>請選擇開始時間與結束時間</h5>
                        <div className="d-flex">
                          <div className="input-group mb-3 me-3 me-md-9">
                            <span className="input-group-text">開始</span>
                            <input type="text" className="form-control" value={startTime || ''} readOnly />
                            <span className="input-group-text">結束</span>
                            <input type="text" className="form-control" value={endTime || ''} readOnly />
                          </div>
                          <button type="button" className="btn btn-primary mb-3 me-3 ms-auto text-nowrap py-2 px-4 d-none d-md-block" onClick={removeSelectTime}>清除重選</button>
                        </div>
                        {filteredTimes.map((time) => {
                          const currentIndex = times.indexOf(time);
                          const startIndex = times.indexOf(startTime);
                          const endIndex = times.indexOf(endTime);
                          const isSelected =
                            (startTime && !endTime && currentIndex === startIndex) ||
                            (startTime && endTime && currentIndex >= startIndex && currentIndex <= endIndex);
                          return (
                            <button
                              type="button"
                              className={`btn me-2 mb-2 ${isSelected ? "btn-primary" : "btn-outline-primary"}`}
                              key={time}
                              onClick={() => handleSelectTime(time)}>
                              {time}
                            </button>
                          )
                        })}
                      </>
                      )}
                      <div className="d-flex justify-content-end d-md-none">
                        <button type="button" className="btn btn-primary mb-3 me-3 text-nowrap py-2 px-4" onClick={removeSelectTime}>清除重選</button>
                      </div>
                    </div>
                  </div>
                </>) : (<>
                  <h3 className="mt-4 mb-4"><small className="text-danger">*</small>請選擇日期區間</h3>
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="row">
                        <div className="col-lg-7 col-9 mx-auto mb-5">
                          <label htmlFor="weekDay" className="form-label">星期</label>
                          <select
                            className={`form-select ${errors["weekDay"] && 'is-invalid'} `}
                            id="weekDay"
                            name="weekDay"
                            {...register("weekDay", {
                              required: {
                                value: true,
                                message: '請選擇星期幾',
                              }
                            })}>
                            {errors["weekDay"] && (
                              <div className="invalid-feedback">{errors?.["weekDay"]?.message}</div>
                            )}
                            <option value="" disabled hidden>請選擇星期幾</option>
                            {weekdays.map((weekday) => {
                              return (
                                <option value={weekday} key={weekday}>{weekday}</option>
                              )
                            })}
                          </select>
                        </div>
                        <div className="col-lg-7 col-9 mx-auto mb-2">
                          <label htmlFor="weekDay" className="form-label">開始日期</label>
                          {typeof allowNextYear !== 'undefined' && (
                            <input
                              type="date"
                              className={`form-control ${errors["dateFrom"] && 'is-invalid'}`}
                              id="dateFrom"
                              name="dateFrom"
                              min={minDateStr}
                              max={maxDateStr}
                              {...register("dateFrom", { required: "請選擇開始日期" })} />
                          )}
                          {errors["dateFrom"] && (
                            <div className="invalid-feedback">{errors?.["dateFrom"]?.message}</div>
                          )}
                        </div>
                        <div className="col-lg-7 col-9 mx-auto">
                          <label htmlFor="weekDay" className="form-label">結束日期</label>
                          {typeof allowNextYear !== 'undefined' && (
                            <input
                              type="date"
                              className={`form-control ${errors["dateTo"] && 'is-invalid'}`}
                              id="dateTo"
                              name="dateTo"
                              min={minDateStr}
                              max={maxDateStr}
                              {...register("dateTo", {
                                required: "請選擇結束日期",
                                validate: (value) => {
                                  const dateFrom = getValues("dateFrom");
                                  if (!dateFrom) return true;
                                  return new Date(value) >= new Date(dateFrom) || "結束日期不能早於開始日期";
                                }
                              })} />
                          )}
                          {errors["dateTo"] && (
                            <div className="invalid-feedback">{errors?.["dateTo"]?.message}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      {watch("weekDay") === '星期一' ? (
                        <h4 className="mt-4">週一為本堂休假日，<br />若有借用需求請洽行政同工或本堂長老</h4>
                      ) : (<>
                        <h5 className="mb-4"><small className="text-danger">*</small>請選擇開始時間與結束時間</h5>
                        <div className="d-flex">
                          <div className="input-group mb-3 me-3 me-md-9">
                            <span className="input-group-text">開始</span>
                            <input type="text" className="form-control" value={startTime || ''} readOnly />
                            <span className="input-group-text">結束</span>
                            <input type="text" className="form-control" value={endTime || ''} readOnly />
                          </div>
                          <button type="button" className="btn btn-primary mb-3 me-3 ms-auto text-nowrap py-2 px-4 d-none d-md-block" onClick={removeSelectTime}>清除重選</button>
                        </div>
                        {filteredTimes.map((time) => {
                          const currentIndex = times.indexOf(time);
                          const startIndex = times.indexOf(startTime);
                          const endIndex = times.indexOf(endTime);
                          const isSelected =
                            (startTime && !endTime && currentIndex === startIndex) ||
                            (startTime && endTime && currentIndex >= startIndex && currentIndex <= endIndex);
                          return (
                            <button
                              type="button"
                              className={`btn me-2 mb-2 ${isSelected ? "btn-primary" : "btn-outline-primary"}`}
                              key={time}
                              onClick={() => handleSelectTime(time)}>
                              {time}
                            </button>
                          )
                        })}
                      </>
                      )}
                      <div className="d-flex justify-content-end d-md-none">
                        <button type="button" className="btn btn-primary mb-3 me-3 text-nowrap py-2 px-4" onClick={removeSelectTime}>清除重選</button>
                      </div>
                    </div>
                  </div>
                </>)}
              </div>
            )}
          </section>
          {/* 場地 */}
          <section className="border-bottom border-primary py-md-6 py-0">
            <div className="d-flex mt-4 mb-4">
              <h3><small className="text-danger">*</small>請選擇場地</h3>
              <button type="button" className="btn btn-primary mb-3 me-3 ms-auto text-nowrap py-2 px-4" onClick={seeAll}>看全部</button>
            </div>
            <div className="row g-0 g-md-5">
              <div className="col-lg-6 mb-5">
                <div className="row g-2 g-lg-3">
                  {roomNameList.map((roomName) => {
                    const dateBookings = bookingList[dateString];
                    const roomBookedTimes = dateBookings?.[roomName] || [];
                    const startIndex = times.indexOf(startTime);
                    const endIndex = times.indexOf(endTime);
                    const selectedRange = times.slice(startIndex, endIndex + 1);
                    const hasConflict = selectedRange.some(time => roomBookedTimes.includes(time));

                    return (
                      <div className={roomColMap[roomName] || "col-3"} key={roomName}>
                        <button
                          type="button"
                          className={`btn room-btn px-0 px-md-2 py-2 fs-7 fs-md-6 ${selectRoom === roomName ? "active" : ""}`}
                          onClick={() => selectItem(roomName)}
                          value="roomName"
                          disabled={hasConflict}>{roomName}</button>
                      </div>)
                  })}
                </div>
              </div>
              <div className="col-lg-6">
                {/* 手機板 */}
                <div className="d-md-none">
                  <Swiper
                    slidesPerView={4.5}
                    className="nav nav-pills"
                    spaceBetween={10}
                    style={{ paddingLeft: 0, paddingRight: 0 }}
                  >
                    {tags.map((tag) => {
                      return (
                        <SwiperSlide key={tag}>
                          <button type="button" className={`btn mb-4 fs-7 text-white ${selectTag === tag ? "btn-primary-400" : "btn-primary-300"}`} onClick={() => setSelectTag(tag)}>{tag}</button>
                        </SwiperSlide>
                      )
                    })}
                  </Swiper>
                </div>
                {/* 電腦版 */}
                <div className='d-flex align-items-center mb-2 d-none d-md-block'>
                  <div>
                    {tags.map((tag) => {
                      return (
                        <button type="button" className={`btn rounded rounded-pill me-2 mb-2 text-white ${selectTag === tag ? "btn-primary-400 " : "btn-primary-300"}`} key={tag} onClick={() => setSelectTag(tag)}>{tag}</button>
                      )
                    })}
                  </div>
                </div>
                <div className="list-group overflow-scroll" style={{ maxHeight: "400px" }}>
                  {tagFilterRooms.filter(filterRoom).length === 0 ? (
                    <p className="text-muted">目前無可預約的場地，請重新選擇時間或標籤。</p>
                  ) : (
                    tagFilterRooms.filter(filterRoom).map((room) => {
                      const isSelected = selectRoom === room.fields?.title?.stringValue;
                      return (
                        <div key={room.name} className={`btn border border-primary rounded-4 py-3 px-4 mb-3 ${isSelected && "bg-primary-75 text-primary"}`} onClick={() => selectItem(room.fields?.title?.stringValue)}>
                          <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                            <h5 className="mb-1">{room.fields?.title?.stringValue}</h5>
                            <p className="mb-1 w-50 text-start ">建議人數：{room.fields.number.stringValue}</p>
                          </div>
                          <div className="d-flex flex-wrap">
                            {room.fields?.tag?.arrayValue?.values
                              ?.filter(tag => tag.stringValue?.trim())
                              .map(tag => {
                                const tagValue = tag.stringValue;
                                const isSelected = selectTag === tagValue;
                                return (
                                  <button
                                    type="button"
                                    className={`btn rounded rounded-pill text-white fs-7 me-2 py-1 text-nowrap mb-2 ${isSelected ? "btn-primary-400 " : "btn-primary-300"}`}
                                    key={tagValue}>
                                    {tagValue}
                                  </button>
                                )
                              })}
                          </div>
                        </div>)
                    }))}
                </div>
              </div>
            </div>
          </section>
          {/* 借用者資料 */}
          <section className="mt-4 mt-md-8 mb-md-4 mb-2 row">
            <div className="col-lg-6 mx-auto bg-white p-4 rounded">
              <div className="row g-0 g-md-4">
                <div className="col-lg-6">
                  <Input
                    register={register}
                    errors={errors}
                    id="group"
                    type="text"
                    labelText="借用單位"
                    mark="*"
                    rules={{
                      required: {
                        value: true,
                        message: '借用單位為必填',
                      }
                    }}
                  />
                </div>
                <div className="col-lg-6">
                  <Input
                    register={register}
                    errors={errors}
                    id="contact"
                    type="text"
                    labelText="聯絡人"
                    mark="*"
                    rules={{
                      required: {
                        value: true,
                        message: '聯絡人為必填',
                      }
                    }}
                  />
                </div>
                <div className="col-lg-6">
                  <Input
                    register={register}
                    errors={errors}
                    id="phone"
                    type="tel"
                    labelText="電話"
                    mark="*"
                    rules={{
                      required: {
                        value: true,
                        message: '聯絡電話為必填',
                      },
                      pattern: {
                        value: /^(0[2-8]\d{7}|09\d{8})$/,
                        message: '格式不正確',
                      },
                    }}
                  />
                </div>
                <div className="col-lg-6">
                  <Input
                    register={register}
                    errors={errors}
                    id="email"
                    type="email"
                    labelText="Email"
                    mark="*"
                    rules={{
                      required: {
                        value: true,
                        message: '聯絡人為必填',
                      },
                      pattern: {
                        value:
                          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: '格式不正確',
                      },
                    }}
                  />
                </div>
                <div className="col-lg-6">
                  <Input
                    register={register}
                    errors={errors}
                    id="number"
                    type="number"
                    labelText="參加人數"
                    mark="*"
                    rules={{
                      required: {
                        value: true,
                        message: '參加人數為必填',
                      },
                      min: {
                        value: 1,
                        message: '參加人數至少 1 人'
                      }
                    }}
                  />
                </div>
                <div className="col-12">
                  <label htmlFor="exampleFormControlTextarea1" className="form-label"><small className="text-danger">*</small>聚會內容</label>
                  <textarea {...register("content", {
                    required: {
                      value: true,
                      message: '聚會內容為必填',
                    }
                  })} className="form-control" id="exampleFormControlTextarea1" rows="3"></textarea>
                </div>
                <div className="col-12">
                  <h4 className="text-primary">使用規則</h4>
                  <ul>
                    <li><p className="mb-2">週一為本堂休假日，若為突發或特殊狀況須外借場地，須徵得行政主管或長老同意，且有本堂牧者陪同。</p></li>
                    <li><p className="mb-2">聚會使用餐飲，請務必按照規定方式妥善處理「垃圾分類」；並將廚餘及餐盒統一放置在一樓中庭垃圾桶內，以便丟棄。</p></li>
                    <li><p className="mb-2">本堂三樓及四樓會堂內，及五樓音樂教室不得攜入任何食物及飲料。</p></li>
                    <li><p>場地使用後，請務必將各項設備及桌椅歸回原狀；使用設備若有損毁，請立即告知行政部處理，借用者須支付修理或另行採購之費用。</p></li>
                    <li><p className="mb-2">週間使用場地最晚勿超過晚間九點半，主日為下午五點。</p></li>
                    <li><p className="mb-2">會後請進行清潔並將設備恢復原狀。</p></li>
                  </ul>
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input className={`form-check-input ${errors["agreerules"] && 'is-invalid'}`} type="checkbox" {...register("agreerules", {
                      required: {
                        value: true,
                      }
                    })} id="agreerules" />
                    <label className="form-check-label" htmlFor="agreerules">
                      <small className="text-danger">*</small>我已閱讀使用規則並同意
                    </label>
                    {errors["agreerules"] && (
                      <div className="invalid-feedback">{errors?.["agreerules"]?.message}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div className="d-flex justify-content-center">
            <button
              type="submit"
              className="btn btn-primary rounded rounded-3 text-white fs-5 fw-bold mt-3"
              style={{ width: "200px" }}
              disabled={selectRoom === "" || !startTime || !endTime}>
              確認申請
            </button>
          </div>
        </form>
      </div>
      <Footer />
      <AlertModal alertRef={alertRef} modalRef={modalRef} />
      <Toast />
      <ScreenLoading isScreenLoading={isScreenLoading} />
    </div>
  )
}

export default App