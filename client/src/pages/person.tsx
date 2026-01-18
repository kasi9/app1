import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { FileUploader } from "../components/FileUploader";
import { OrganizationSelect } from "../components/OrganizationSelect";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

interface Person { id: string; tenantId: string; organizationId: string; code: string; personName: string; mobileNo: string; address: string; user: {loginName: string; password: string; 
    roles: string[], privileges: Privilege[]}};
interface Role { _id: string, code: string, rolename: string };
interface Privilege { privilegeId: number; code: string; name: string; actions: string[] };
interface ValidationError { msg: string; param?: string; location?: string; }
interface Organization {id: string; tenantId: string|null; parentId: string|null; code: string; organizationName: string; address: string; };
interface Organization2 {_id: string; tenantId: string|null; parentId: string; code: string; organizationName: string; address: string};

const Person = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { id } = location.state || {}; 

    const { isValidataionEnabled, baseURL } = useAppContext();
    const { token, actions, getActions } = useUserContext();

    const [loading, setLoading] = useState(false);

    const [person, setPerson] = useState<Person>({  id: "", tenantId: "", organizationId: "", code: "", personName: "", mobileNo: "", address: "", user: { loginName: "", password: "", roles: [], privileges: []}});
    const [roles, setRoles] = useState<Role[]>([]);
    const [privileges, setPrivileges] = useState<Privilege[]>([]);
    const [userAvatar, setUserAvatar] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization2 | null>(null);

    const codeRef = useRef<HTMLInputElement>(null);

    const changeHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = event.target;
        setPerson({...person, [name]: value});
    };

    const changeHandlerUser = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = event.target;
        setPerson({...person, user: {...person.user,[name]: value}});
    };

    const handleCheckboxChange = async (id: string) => {

        setPerson(per => { 

            const user = {...per.user};
            if (user.roles.includes(id))
                user.roles = user.roles.filter(r=>r !== id);
            else
                user.roles = [...user.roles, id];

            return {...per, user};
        });
    }

    const addPrivilegeWithAction = (code: string, action: string) => {

        setPerson(prev => {

            const user = {...prev.user} ;
        
            const privileges = [...prev.user.privileges]; // clone privileges

            const privilegeIndex = privileges.findIndex(p => p.code === code); // find privilege by code or id

            if (privilegeIndex !== -1) {
                const existingPrivilege = { ...privileges[privilegeIndex] }; // privilege exists

                if (!existingPrivilege.actions.includes(action)) { // add action if not present
                  
                    existingPrivilege.actions = [...existingPrivilege.actions, action];
                }
                else {
                       
                    existingPrivilege.actions = existingPrivilege.actions.filter(a=>a !== action);
                }

                privileges[privilegeIndex] = existingPrivilege;
            } else {        
                privileges.push({privilegeId: 0, code, name: '', actions: [action]}); // privilege not exists -> add new with action
            }

            user.privileges = privileges;
            return { ...prev, user };
        });
      
    };
    
    const getPerson = async () => {
        
        await axios.get(`${baseURL}/organizations`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => { setOrgs(response.data); });

        if (id){
            setLoading(true);

            await axios.get(`${baseURL}/persons/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => {            
                setPerson(res.data);   

                person.user = res.data.user;  
                person.user.privileges = res.data.user.privileges;     
                
                axios.get(`${baseURL}/persons/avatar/${res.data.user._id}`, { responseType: "blob", headers: { Authorization: `Bearer ${token}` } }).then((response) => { 
                    const url = URL.createObjectURL(response.data); 
                    setImageSrc(url);
                });       
            });

            setLoading(false);   
        }
    }

    const deletePerson = async () => {
        if (!window.confirm("Are you sure you want to delete this person?")) {
            return;
        }
        await axios.delete(`${baseURL}/persons/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        await navigate('/persons');
    };
    
    useEffect(() => {

        getActions('person');
        getPerson();
        codeRef.current?.focus();

        axios.get(`${baseURL}/roles`, { headers: { Authorization: `Bearer ${token}` } }).then((res2) => { 
            setRoles(res2.data);
        });

        axios.get(`${baseURL}/privilege`, { headers: { Authorization: `Bearer ${token}` } }).then((res4) => { 
            setPrivileges(res4.data);
        });


        const handleMessage = (event: MessageEvent) => {
console.log('person handleMessage', event);            
            if (event.data?.type == 'role'){
                setRoles([...roles, event.data.role]);
                person.user.roles.some(ur => ur === event.data.role._id)
            }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const savePerson = async () => {

        if (isValidataionEnabled) {
            const result = await validate();
            if (!result.result) {
                toast.error(result.errors.join('\n'), { style: { whiteSpace: 'pre-line'}});
                return ;
            }
        }

        person.organizationId = selectedOrg?._id;
        person.tenantId = selectedOrg?.tenantId;

        if (person.id == ""){
            await axios.post(`${baseURL}/persons`, person, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
                if (!res.data.status) {		
                    toast.error(res.data.errors.map((e: ValidationError) => e.msg).join("\n"), { style: { whiteSpace: "pre-line", width: 'auto' }, });
                }    
                else {               
                    saveUserAvatar(res.data.user?._id);
                    setPerson({ id: "", tenantId: "", organizationId: "", code: "", personName: "", mobileNo: "", address: "", user: { loginName: "", password: "", roles: [], privileges: []}});
                    toast.success('Person created successfully.');
                    codeRef.current?.focus();
                }            
            });
        }
        else {
            await axios.put(`${baseURL}/persons/${id}`, person, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Person updated successfully.');
            navigate('/persons');
        }
    } ;

    const saveUserAvatar = async(id: string) => {    
        if (!userAvatar) return;

        const formData = new FormData();

        formData.append("avatar", userAvatar); 
        await axios.put(`${baseURL}/persons/avatar/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
    }


    const validate = () => {

        const errors: string[] = [];

        if (!person.code.trim())
            errors.push('Code is required.');
        if (!person.personName.trim())
            errors.push('Name is required.');

        return ({result: errors.length === 0, errors: errors});
    }

    const openRoleWindow = () => {
        window.open('/modal-window','roleModal','width=1200, height=800, modal=yes, alwaysRaised=yes');
    }

    const handleFiles = (files: File[]) => {
        setUserAvatar(files[0]);
    };

    return (
        <div>
            <div className="content">
                <div className="form">
                    <div className="text-center font-bold"><h1>Person</h1></div>

                    <hr></hr>            
                    { loading ? (<p>data is loading</p>) : (<p></p>)}        
                    <div className="line">
                        <div className="line-label">{imageSrc && <img src={imageSrc} alt="icon" className="max-h-10 rounded shadow mr-2"/>}</div>
                        <div className="line-text">
                            <FileUploader label="" multiple={false} accept="image/*" maxSizeMB={10} onFilesSelected={handleFiles} onPreviewChange={url=>setImageSrc(url)}/>  
                        </div>
                    </div>                  
                    <div className="line">
                        <div className="line-label"><label>Parent</label></div>
                        <div className="line-text"><OrganizationSelect organizations={orgs} value={selectedOrg?._id} onChange={setSelectedOrg}/></div>
                    </div> 
                    <div className="line">
                        <div className="line-label"><label>Code * </label></div>
                        <div className="line-text"><input type="text" id="code" name="code" value={person.code} onChange={changeHandler} ref={codeRef} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Name * </label></div>
                        <div className="line-text"><input type="text" id="personName" name="personName" value={person.personName} onChange={changeHandler} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Mobile No. </label></div>
                        <div className="line-text"><input type="text" id="mobileNo" name="mobileNo" value={person.mobileNo} onChange={changeHandler} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Address </label></div>
                        <div className="line-text"><textarea id="address" name="address" value={person.address} onChange={changeHandler} className="text"></textarea></div>
                    </div>

                    <hr></hr>
                    <div className="line">
                        <div className="line-label"><label>Login Name </label></div>
                        <div className="line-text"><input type="text" id="loginName" name="loginName" value={person.user.loginName} onChange={changeHandlerUser} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Password </label></div>
                        <div className="line-text"><input type="text" id="password" name="password" value={person.user.password} onChange={changeHandlerUser} className="text"></input></div>
                    </div>

                    <hr/>
                    <div className="line">
                        <div className="line-label"><label>Roles</label></div>
                        <div className="line-text">
                        {
                            roles.map((r) => ( 
                                <label key ={r._id}>
                                    <input type="checkbox" key={r._id} onChange={() => handleCheckboxChange(r._id)}
                                        checked = { person.user.roles.some(ur => ur === r._id) } className="mx-2"/>{r.rolename}</label> ))
                        }
                        <button type="button" onClick={openRoleWindow}>+</button>
                        </div>                        
                    </div>
                    <div className="py-2">
                        {
                            privileges.map(p => (
                                <div key={p.code} className="line">
                                    <div className="line-label"><label>{p.name}</label></div>
                                    <div className="line-text items-left space-x-2 mr-2">
                                    {
                                        p.actions.map(a => (
                                            <label key={a}><input type="checkbox" key={a} onChange={() => /*handleCheckboxChangePri*/addPrivilegeWithAction(p.code, a)}
                                                checked = { person.user.privileges.some(up => up.code === p.code && up.actions.includes(a)) } className="mx-2"/>{a}
                                            </label>
                                        ))
                                    }
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                    <hr className="py-2"></hr>
                    <div className="flex gap-2 items-center justify-center">
                        <button onClick={savePerson} disabled = { (!actions.includes('Create') && !actions.includes('Update')) } title={ actions.includes('Create') ? '' : 'No access' } className="btn">Save</button>
                        <button onClick={deletePerson} disabled = { !actions.includes('Delete') } title={ actions.includes('Delete') ? '' : 'No access' } className="btn">Delete</button>
                        <Link to = "/persons" className="link">List</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Person;