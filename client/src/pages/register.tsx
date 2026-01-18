
import axios, { AxiosError } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

import { useAppContext } from '../context/AppContext';
import { useUserContext } from '../context/UserContext';
import { FileUploader } from '../components/FileUploader';

interface ValidationError { msg: string; param?: string; location?: string; }
interface Register { code: string; organizationName: string; address: string; 
	loginName: string; password: string; 
	personName: string; mobileNo: string; personAddress: string;};

const Register = () => {	

	const { isValidataionEnabled, baseURL } = useAppContext();
	const navigate = useNavigate();
	const { token } = useUserContext();
	
	const [register, setRegister] = useState<Register>({"code": "", "organizationName": "", "address": "", "loginName": "", "password": "", "personName": "", "mobileNo": "", "personAddress": ""});
	const [ tenentLogo, setTenentLogo ] = useState<File | null>(null);
	const [ userAvatar, setUserAvatar ] = useState<File | null>(null);
	const [logoSrc, setLogoSrc] = useState<string | null>(null);
	const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

	const codeRef = useRef<HTMLInputElement>(null);
	
	const initializeForm = async () => {
		codeRef.current?.focus();
	}

	useEffect (() => {
		initializeForm();
	}, [])

	const validateData = async () => {

		const errors: string[] = [];

		if (!register.code.trim()) 
			errors.push("Code is required.");
		if (!register.organizationName.trim()) 
			errors.push("Name is required.");
		if (!register.loginName.trim())
			errors.push("Login Name is required");
		if (!register.password.trim())
			errors.push('Password is required');
		if (!register.personName.trim())
			errors.push('Person Name is required');
		
    	return { result: errors.length === 0, errors: errors}; 
	}

	const changeHandler = (event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
		const {name, value} = event.target;
		setRegister({...register, [name]: value});
	};

	const saveData = async () => {

		if (isValidataionEnabled){
			const result = await validateData();
			if (!result.result) {
				toast.error(result.errors.join("\n"), { style: { whiteSpace: "pre-line" }, });
				return;
			}
		}

		try {			
			await axios.post(`${baseURL}/organizations/register`, register).then((res) => { 
				if (!res.data.status) {		
  					toast.error(res.data.errors.map((e: ValidationError) => e.msg).join("\n"), { style: { whiteSpace: "pre-line", width: 'auto' }, });
				}
				else{			
                    saveLogo(res.data.data.cli._id);
                    saveAvatar(res.data.data.user._id);

					toast.success("Organization created successfully!");
					navigate("/");
				}
			});
		}
		catch (err ) {
			const error = err as AxiosError<{ message: string }>;
			toast.error(error.response?.data?.message || "Something went wrong");
		}
	}

    const saveLogo = async(id: string) => {    
        if (!tenentLogo) return;

        const formData = new FormData();

        formData.append("logo", tenentLogo); 
        await axios.put(`${baseURL}/organizations/logo/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
    }

    const saveAvatar = async(id: string) => {    
        if (!userAvatar) return;

        const formData = new FormData();

        formData.append("avatar", userAvatar); 
        await axios.put(`${baseURL}/persons/avatar/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
    }

    const handleFiles1 = (files: File[]) => {
        setTenentLogo(files[0]);
    };

    const handleFiles2 = (files: File[]) => {
        setUserAvatar(files[0]);
    };

    return (
        <div>
			<div className='content'>
				<div className='form'>
					<div className='py-2 flex justify-center'><h1>Register</h1></div>

					<hr></hr>
					<div className="line">
						<div className="line-label">{logoSrc && <img src={logoSrc} alt="icon" className="max-h-10 rounded shadow mr-2"/>}</div>
						<div className="line-text">
							<FileUploader id="logo1" label="" multiple={false} accept="image/*" maxSizeMB={10} onFilesSelected={handleFiles1} onPreviewChange={url=>setLogoSrc(url)}/>  
						</div>
					</div>                  
					<div className='line'>
						<div className="line-label" ><label  >Code * </label></div>
						<div className='line-text'><input type="text" name="code" value = {register?.code} onChange={changeHandler} ref = {codeRef} className="text"></input></div>
					</div>
					<div className='line'>
						<div className='line-label'><label>Name * </label></div>
						<div className='line-text'><input type="text" name="organizationName" value={register.organizationName} onChange={changeHandler} className='text'></input></div>
					</div>
					<div className='line'>
						<div className='line-label'><label className='line-label'>Address </label></div>
						<div className='line-text'><textarea name="address" value={register.address} onChange={changeHandler} className='text'></textarea></div>
					</div>

					<hr></hr>
					<div className="line">
						<div className="line-label">{avatarSrc && <img src={avatarSrc} alt="icon" className="max-h-10 rounded shadow mr-2"/>}</div>
						<div className="line-text">
							<FileUploader id="avatar1" label="" multiple={false} accept="image/*" maxSizeMB={10} onFilesSelected={handleFiles2} onPreviewChange={url=>setAvatarSrc(url)}/>  
						</div>
					</div>                  
					<div className='line'>
						<div className='line-label'><label className='px-2'>Login Name * </label></div>
						<div className='line-text'><input type="text" name="loginName" value={register.loginName} onChange={changeHandler} className='text'></input></div>
					</div>
					<div className='line'>
						<div className='line-label'><label className='px-2'>Password * </label></div>
						<div className='line-text'><input type="password" name="password" value={register.password} onChange={changeHandler} className='text'></input></div>
					</div>

					<hr></hr>
					<div className='line'>
						<div className='line-label'><label className='px-2'>Name (Person) * </label></div>
						<div className='line-text'><input type="text" name="personName" onChange={changeHandler} className='text'></input></div>
					</div>
					<div className='line'>
						<div className='line-label'><label className='px-2'>Mobile No. </label></div>
						<div className='line-text'><input type="text" name="mobileNo" onChange={changeHandler} className='text'></input></div>
					</div>
					<div className='line'>
						<div className='line-label'><label className='px-2'>Address (Person) </label></div>
						<div className='line-text'><textarea name="personAddress" onChange={changeHandler} className='text'></textarea></div>
					</div>

					<hr></hr>
					<div className='py-2 flex justify-center'>
						<button onClick={saveData} className='btn'>Save</button>
					</div>            
				</div>
			</div>
        </div>  
    );
}

export default Register;