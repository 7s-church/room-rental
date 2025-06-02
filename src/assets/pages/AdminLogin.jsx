import { useState } from "react";
import { useForm } from "react-hook-form"
import Input from "./components/Input"
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import ScreenLoading from "./components/ScreenLoading";
import { useDispatch } from "react-redux";
import { createAsyncMessage } from "../redux/slice/toastSlice";
import Toast from "./layout/Toast";

function AdminLogin() {
    const [isScreenLoading, setIsScreenLoading] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async data => {
        setIsScreenLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            dispatch(
                createAsyncMessage({
                    text: '登入成功',
                    type: '歡迎登入管理中心',
                    status: 'success',
                })
            );
            navigate('/admin')
        } catch (error) {
            const message = error.message || '登入失敗';
            dispatch(
                createAsyncMessage({
                    text: message,
                    type: '登入失敗',
                    status: 'failed',
                })
            );
        } finally {
            setIsScreenLoading(false);
        }
    };


    return (
        <div className="container">
            <div className="row">
                <div className="card border-0 mx-auto my-lg-9 my-7 col-md-6 col-lg-4">
                    <div className="card-body mb-3">
                        <h1 className="card-title fs-2 text-center text-primary mb-9">
                            管理者登入
                        </h1>
                        <form
                            className="d-flex flex-column"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <div className="mb-3">
                                <Input
                                    register={register}
                                    errors={errors}
                                    id="email"
                                    labelText="帳號"
                                    type="text"
                                    rules={{
                                        required: {
                                            value: true,
                                            message: '帳號為必填',
                                        },
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                            message: '格式不正確',
                                        },
                                    }}
                                />
                            </div>
                            <div>
                                <Input
                                    register={register}
                                    errors={errors}
                                    id="password"
                                    labelText="密碼"
                                    type="password"
                                    rules={{
                                        required: {
                                            value: true,
                                            message: '密碼為必填',
                                        },
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary py-2 my-5 mx-auto w-50 text-nowrap">
                                登入
                            </button>
                        </form>
                    </div>
                    <div className="d-flex justify-content-center">
                        <Link className="card-link link-primary" to="/">
                            回首頁
                        </Link>
                    </div>
                </div>
            </div>
            <ScreenLoading isScreenLoading={isScreenLoading} />
            <Toast/>
        </div>
    )
}

export default AdminLogin