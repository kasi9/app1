

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { api, type CustomAxiosConfig } from "../context/api";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

interface Login { userName: string; password: string};

const Login = () => {
    const { isValidataionEnabled, baseURL } = useAppContext();
    const { setUserName, setIsLoggedIn } = useUserContext();

    const navigate = useNavigate();
    const [ login, setLogin ] = useState<Login>({userName: '', password: ''});
    const userNameRef = useRef<HTMLInputElement>(null);
    
    useEffect (() => {
        userNameRef.current?.focus();
    },[]);
    
    const getToken = async () => {

        if (isValidataionEnabled){
            const result = validate();
            if (!result.result) {
                toast.error('* '+ result.errors.join("\n* "), { style: { whiteSpace: "pre-line" }, });
                return ;
            }
        }
        
        await api.post(`${baseURL}/users/login`, { userName: login.userName, password: login.password }, { hideMessage: true } as CustomAxiosConfig)
       /* await api.get(`${baseURL}/users/login/${login.userName}/${login.password}`, { hideMessage: true } as CustomAxiosConfig)*/.then(res => {   
            if (res.data.success) {       
                localStorage.setItem('token', res.data.data.token);
                setUserName(res.data.data.user.name);
                setIsLoggedIn(true);

                navigate('/');
            }

        });
    } ;

    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value} = e.target;
        setLogin({...login, [name]:value});
    }

    const validate = () => {

        const errors : string[] = [];

        if (!login.userName.trim())
            errors.push('Login user is required.');
        if (!login.password.trim())
            errors.push('Password is required.');

        return ({result: errors.length === 0, errors: errors});
    }

    return (
        <div>
            <div className="content">
                <div className="form">
                    <div className='py-2 flex justify-center'><h1>Log In</h1></div>

                    <hr></hr>
                    <div className="line">
                        <div className="line-label"><label>Login</label></div>
                        <div className="line-text"><input type="text" id="login" name ="userName" value={login.userName} onChange={onChangeHandler} ref ={userNameRef} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Password</label></div>
                        <div className="line-text"><input type="password" id="password" name="password" value={login.password} onChange={onChangeHandler} className="text"></input></div>
                    </div>

                    <hr></hr>
                    <div className="py-2 flex justify-center">
                        <button onClick={getToken} className="btn">Log In</button>
                        <Link to = "/register" className="link">Register</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;