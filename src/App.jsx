import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Swiper, SwiperSlide } from 'swiper/react';
import Calendar from 'react-calendar';
import axios from 'axios'
import Input from './assets/pages/components/Input';
import AlertModal from './assets/pages/components/AlertModal';
import { Modal } from "bootstrap";

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
  const modalRef = useRef(null);
  const alertRef = useRef(null);



  const roomNameList = ["7樓會議室", "601餐廳", "603教室", "503教室", "505會議室", "506圖書室",
    "507音樂教室", "402母子室", "406禱告室", "407禱告室", "三樓大堂", "205地板教室",
    "206教室", "204教室", "203教室", "202教室", "交誼廳", "一樓副堂", "一樓台語堂", "舊101室"]

  const roomColMap = {
    "7樓會議室": "col-5 mx-auto",
    "601餐廳": "col-8",
    "603教室": "col-4",
    "503教室": "col-2",
    "505會議室": "col-4",
    "402母子室": "col-md-6",
    "三樓大堂": "col-12",
    "206教室": "col-2",
    "204教室": "col-2",
    "203教室": "col-2",
    "交誼廳": "col-2",
    "一樓副堂": "col-4",
    "一樓台語堂": "col-4",
    "舊101室": "col-2"
  };

  const times = ["8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ mode: 'onTouched' })

  const onSubmit = handleSubmit(data => {
    if (!startTime || !endTime) return;
    const startIndex = times.indexOf(startTime);
    const endIndex = times.indexOf(endTime);
    const selected = times.slice(startIndex, endIndex + 1);
    const { ...user } = data;
    const submitDetal = {
      data: {
        user: {
          ...user
        }
      },
      date: dateString,
      weekDay: weekdayString,
      times: selected,
      location: selectRoom
    }
    bookRoom(submitDetal)
  })

  const bookRoom = async (data) => {
    try {
      await axios.post("https://us-central1-fir-room-rental.cloudfunctions.net/api/addBooking", data)
      reset();
      getRoomList();
      setStartTime(null);
      setEndTime(null);
      setSelectRoom('');
      setSelectedDate(new Date())
    } catch (error) {
      console.log(error)
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
      console.log(error)
    }
  }


  const getRoomList = async () => {
    try {
      const res = await axios.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/room`)
      setRoomList(res.data.documents)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getRoomList()
    getBookingList()
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
      modalRef.current = new Modal(alertRef.current, {
        backdrop: false,
      });
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

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const filteredTimes = weekdayString === '星期日' ? times.filter((time) => timeToMinutes(time) <= timeToMinutes("17:00"))
    : times;

  return (
    <div className="bg-primary-50">
      <nav className="d-flex justify-content-between align-items-center py-4 text-primary">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center">
          <h1 className="ms-3 ms-md-4 mb-0">七賢路禮拜堂</h1>
          <span className="fs-3 fs-md-1">【聚會場地登記】</span>
        </div>
        <span className="material-symbols-outlined me-4" style={{ fontSize: "32px" }}>account_circle</span>
      </nav>
      <div className="container pb-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 時間 */}
          <section className="border-bottom border-primary py-6">
            <h3 className="mt-4 mb-4"><small className="text-danger">*</small>請選擇時間</h3>
            <div className="row g-4">
              <div className="col-md-6 d-flex justify-content-center">
                <Calendar onChange={setSelectedDate} value={selectedDate} />
              </div>
              <div className="col-md-6">
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
          </section>
          {/* 場地 */}
          <section className="border-bottom border-primary py-6">
            <div className="d-flex mt-4 mb-4">
              <h3><small className="text-danger">*</small>請選擇場地</h3>
              <button type="button" className="btn btn-primary mb-3 me-3 ms-auto text-nowrap py-2 px-4" onClick={seeAll}>看全部</button>
            </div>
            <div className="row g-5">
              <div className="col-md-6">
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
                          className={`btn room-btn px-0 px-md-2 py-2 ${selectRoom === roomName ? "active" : ""}`}
                          onClick={() => selectItem(roomName)}
                          value="roomName"
                          disabled={hasConflict}>{roomName}</button>
                      </div>)
                  })}
                </div>
              </div>
              <div className="col-md-6">
                {/* 手機板 */}
                <div className="d-md-none">
                  <Swiper
                    slidesPerView={4.5}
                    className="nav nav-pills">
                    {tags.map((tag) => {
                      return (
                        <SwiperSlide className="nav-item" key={tag}>
                          <button type="button" className="btn btn-primary-300 text-white mb-4 fs-7" onClick={() => setSelectTag(tag)}>{tag}</button>
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
                        <button type="button" className="btn btn-primary-300 rounded rounded-pill text-white me-2 mb-2" key={tag} onClick={() => setSelectTag(tag)}>{tag}</button>
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
                        <div key={room.name} className={`btn border border-primary rounded-4 py-3 px-4 mb-3 ${isSelected && "bg-primary-100 border-primary-300 text-primary-300"}`} onClick={() => selectItem(room.fields?.title?.stringValue)}>
                          <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                            <h5 className="mb-1">{room.fields?.title?.stringValue}</h5>
                            <p className="mb-1 w-50 text-start">建議人數：{room.fields.number.stringValue}</p>
                          </div>
                          <div className="d-flex">
                            {room.fields?.tag?.arrayValue?.values
                              ?.filter(tag => tag.stringValue?.trim())
                              .map(tag => (
                                <button
                                  type="button"
                                  className="btn rounded rounded-pill btn-primary-300 text-white fs-7 me-2 py-1"
                                  key={tag.stringValue}>
                                  {tag.stringValue}
                                </button>
                              ))}
                          </div>
                        </div>)
                    }))}
                </div>
              </div>
            </div>
          </section>
          {/* 借用者資料 */}
          <section className="mt-4 mt-md-8 mb-md-4 mb-2 row">
            <div className="col-md-6 mx-auto bg-white p-4 rounded">
              <div className="row g-4">
                <div className="col-md-6">
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
                <div className="col-md-6">
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
                <div className="col-md-6">
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
                <div className="col-md-6">
                  <Input
                    register={register}
                    errors={errors}
                    id="Email"
                    type="email"
                    labelText="Email"
                  />
                </div>
                <div className="col-md-6">
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
      <AlertModal alertRef={alertRef} modalRef={modalRef} />
    </div>
  )
}

export default App
