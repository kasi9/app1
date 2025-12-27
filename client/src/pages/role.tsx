import axios, { AxiosError } from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { AppContent } from "../context/AppContext";
import { useUser } from "../context/UserContext";
import { FileUploader } from "../components/FileUploader";
import { OrganizationSelect } from "../components/OrganizationSelect";

interface Role { id: string, tenantId: string; organizationId: string; roleId: number, code: string, rolename: string; description: string, privileges: Privilege[]}
interface Privilege { privilegeId: number; code: string; name: string; actions: string[] };
interface ValidationError { msg: string; param?: string; location?: string; }

interface Organization {id: string; tenantId: string|null; parentId: string|null; code: string; organizationName: string; address: string; };
interface Organization2 {_id: string; tenantId: string|null; parentId: string; code: string; organizationName: string; address: string};


type Props = {
    onSave?: (role: Role) => void;
    onClose?: () => void;
}

const Role: React.FC<Props> = ({onSave, onClose}) => {

    const navigate = useNavigate();
    const location = useLocation();
    const { id } = location.state || {}; 

    const { isValidataionEnabled, baseURL } = useContext(AppContent)!;
    const { token, actions, getActions} = useUser();

    const [role, setRole] = useState<Role>({ id: "", tenantId: "", organizationId: "", roleId: 0, code: "", rolename: "",  description: "", privileges:[]});
    const [privileges, setPrivileges] = useState<Privilege[]>([]);
    const [roleIcon, setRoleIcon] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization2 | null>(null);

    const codeRef = useRef<HTMLInputElement>(null);

    const getRole = async () => {
        await axios.get(`${baseURL}/organizations`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => { setOrgs(response.data); });

        if (id) {
            await axios.get(`${baseURL}/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => { 
                setRole(response.data) ;
                role.privileges = response.data.privileges;             
            });         
            
            await axios.get(`${baseURL}/roles/icon/${id}`, { responseType: "blob", headers: { Authorization: `Bearer ${token}` } }).then((response) => { 
                const url = URL.createObjectURL(response.data); 
                setImageSrc(url);
            });              
        }
    }

    useEffect(() => {
        codeRef.current?.focus();
        getActions('role');
        getRole();

        axios.get(`${baseURL}/privilege`, { headers: { Authorization: `Bearer ${token}` } }).then((res4) => { 
            setPrivileges(res4.data);
        });
    },[]);

    const changeHandler = (event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
        const {name, value} = event.target;
        setRole({...role, [name]: value});
    } ;

    const addPrivilegeWithAction = (code: string, action: string) => {

        setRole(prev => {
        
            const privileges = [...prev.privileges]; // clone privileges

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

            return { ...prev, privileges };
        });
    };

    const saveRole = async () => {

        if (isValidataionEnabled){
            const result = await validateData();
            if (!result.result) {
                toast.error('* '+ result.errors.join("\n* "), { style: { whiteSpace: "pre-line" }, });
                return ;
            }
        }

        role.organizationId = selectedOrg?._id;
        role.tenantId = selectedOrg?.tenantId;
        if (role.id==""){
            try {
             
                await axios.post(`${baseURL}/roles`, role, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
                    if (!res.data.status) {		
                        toast.error(res.data.errors.map((e: ValidationError) => e.msg).join("\n"), { style: { whiteSpace: "pre-line", width: 'auto' }, });
                    }
                    else {                    
                        onSave?.(role);
                        saveIcon(res.data.data._id);
                        toast.success('Role created successfully.');
                        setRole({ id: "", tenantId: "", organizationId: "", roleId: 0, code: "", rolename: "", description: "", privileges:[]});
                        codeRef.current?.focus();
                    }
                });

            }
            catch (err) {
                const error = err as AxiosError<{ message: string }>;
                toast.error(error.message || 'Failed in role creation.');
            }
        }
        else {        
            await axios.put(`${baseURL}/roles/${id}`, role, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Role updated successfully.");
            navigate('/roles');
        }
    }

    const saveIcon = async(id: string) => {
        if (!roleIcon) return;

        const formData = new FormData();

        formData.append("icon", roleIcon); 
        await axios.put(`${baseURL}/roles/icon/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
    }

    const deleteRole = async () => {
        if (!window.confirm("Are you sure you want to delete this role?")) {
            return;
        }
        await axios.delete(`${baseURL}/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Role deleted successfully.');
        await navigate('/roles');
    }

    const validateData = () => {

		const errors: string[] = [];

        if (!role.code.trim())
            errors.push('Code is required') ;
        if (!role.rolename.trim())
            errors.push('Name is required');

        return { result: errors.length === 0, errors: errors}; 
    }

    const handleFiles = (files: File[]) => {
        setRoleIcon(files[0]);
    };

    return (
        <div>
             <div className="content">
                <div className="form">
                    <div className="py-2 flex justify-center"><h2>Role</h2></div>   

                    <hr></hr>
                    <div className="line">
                        <div className="line-label flex items-center">{imageSrc && <img src={imageSrc} alt="icon" className="max-h-10 rounded shadow mr-2"/>}</div>
                        <div className="line-text">
                            <FileUploader label="" multiple={false} accept="image/*" maxSizeMB={10} onFilesSelected={handleFiles} onPreviewChange={(url) => setImageSrc(url)}/>  
                        </div>
                    </div>                       
                    <div className="line">
                        <div className="line-label"><label>Parent</label></div>
                        <div className="line-text"><OrganizationSelect organizations={orgs} value={selectedOrg?._id} onChange={setSelectedOrg}/></div>
                    </div> 
                    <div className="line">
                        <div className="line-label"><label>Code * </label></div>
                        <div className="line-text"><input type="text" id="code" name="code" value={role.code} onChange={changeHandler} ref={codeRef} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Name * </label></div>
                        <div className="line-text"><input type="text" id="rolename" name="rolename" value={role.rolename} onChange={changeHandler} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Description </label></div>
                        <div className="line-text"><textarea id="description" name="description" value={role.description} onChange={changeHandler} className="text"></textarea></div>
                    </div>

                    <hr></hr>
                    <div>
                        {
                            privileges.map(p => (
                                <div key={p.code} className="line">
                                    <div className="line-label"><label>{p.name}</label></div>
                                    <div className="line-text">
                                        {
                                        p.actions.map(a => (
                                            
                                            <label key = {a} >
                                                <input type="checkbox" key={a} onChange={() => addPrivilegeWithAction(p.code, a)} 
                                                    checked = {role.privileges.some(p2 => p2.code === p.code && p2.actions.includes(a))}
                                                className="mx-2"/>{a}
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
                        <button onClick={saveRole} disabled = { (!actions.includes('Create') && !actions.includes('Update')) } title={ actions.includes('Delete') ? '' : 'No access' } className="btn">Save</button>
                        <button onClick={deleteRole} disabled = { !actions.includes('Delete') } title={ actions.includes('Delete') ? '' : 'No access' } className="btn">Delete</button>
                        <Link to = "/roles" className="link">List</Link>
                        <button onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Role;