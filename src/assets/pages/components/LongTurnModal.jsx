import { Modal } from "bootstrap";
import { useRef, useEffect, useState } from "react";
import Input from "./Input";
import { useForm } from 'react-hook-form'
import emailjs from "@emailjs/browser";
import ScreenLoading from "./ScreenLoading";
import { useDispatch } from "react-redux";
import { createAsyncMessage } from "../../redux/slice/toastSlice";


function LongTurnModal({ modalRef }) {
    const longturnRef = useRef(null);
    const formRef = useRef();
    const dispatch = useDispatch();
    const [isScreenLoading, setIsScreenLoading] = useState(false)
    const weekdays = ["星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({ mode: 'onTouched' })

    const onSubmit = async () => {
        setIsScreenLoading(true)
        try {
            const res = await emailjs.sendForm("service_zyy3wgz", "template_itttepr", formRef.current,
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
            closeModal()
            setIsScreenLoading(false)
        }
    }

    useEffect(() => {
        modalRef.current = new Modal(longturnRef.current, {
            backdrop: false,
        })
    }, [])

    const closeModal = () => {
        modalRef.current.hide();
    };

    return (
        <div className="modal" tabIndex="-1" ref={longturnRef} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">長期借用表單</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                    </div>
                    <div className="modal-body">
                        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                            <div className="bg-white p-4 rounded">
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="form-label"><small className="text-danger">*</small>星期</label>
                                        <select className="form-select" {...register("weekday", { required: true })} defaultValue="">
                                            <option value="" disabled hidden>請選擇星期幾</option>
                                            {weekdays.map((weekday) => {
                                                return (<option value={weekday} key={weekday}>{weekday}</option>)
                                            })}
                                        </select>
                                        {errors["weekday"] && (
                                            <div className="invalid-feedback">{errors?.["weekday"]?.message}</div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <Input
                                            register={register}
                                            errors={errors}
                                            id="time"
                                            type="text"
                                            labelText="時間"
                                            mark="*"
                                            rules={{
                                                required: {
                                                    value: true,
                                                    message: '借用時間為必填',
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label htmlFor="exampleFormControlTextarea1" className="form-label"><small className="text-danger">*</small>借用月份、頻率等</label>
                                        <textarea {...register("description", {
                                            required: {
                                                value: true,
                                            }
                                        })} className={`form-control ${errors["description"] && 'is-invalid'}`} id="exampleFormControlTextarea1" rows="3"></textarea>
                                        {errors["description"] && (
                                            <div className="invalid-feedback">{errors?.["description"]?.message}</div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <Input
                                            register={register}
                                            errors={errors}
                                            id="location"
                                            type="text"
                                            labelText="場地"
                                            mark="*"
                                            rules={{
                                                required: {
                                                    value: true,
                                                    message: '借用場地為必填',
                                                }
                                            }}
                                        />
                                    </div>
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
                                            <li><p>會後請進行清潔並將設備恢復原狀。</p></li>
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
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={closeModal}>取消</button>
                                <button type="submit" className="btn btn-primary">確認送出</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <ScreenLoading isScreenLoading={isScreenLoading} />
        </div>
    )
}

export default LongTurnModal