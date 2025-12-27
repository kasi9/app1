import axios, { AxiosError } from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { AppContent } from "../context/AppContext";
import { useUser } from "../context/UserContext";
import { OrganizationSelect } from "../components/OrganizationSelect";

interface Organization {id: string; tenantId: string|null; parentId: string|null; code: string; organizationName: string; address: string; };
interface ValidationError { msg: string; param?: string; location?: string; }
interface Organization2 {_id: string; tenantId: string|null; parentId: string; code: string; organizationName: string; address: string};

const Organization = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { id } = location.state || {}; 

    const { isValidataionEnabled, baseURL } = useContext(AppContent)!;
    const { token, actions, getActions } = useUser();

    const [org, setOrg] = useState<Organization>({id: "", tenantId: null, parentId: null, code:"", organizationName: "", address:""});
    const [logoSrc, setLogoSrc] = useState<string>("");
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization2 | null>(null);
    const codeRef = useRef<HTMLInputElement>(null);
    
    const getOrganization = async () => {

        await axios.get(`${baseURL}/organizations`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => { setOrgs(response.data); });

        if (id) {
            await axios.get(`${baseURL}/organizations/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => {setOrg(response.data)});

            await axios.get(`${baseURL}/organizations/logo/${id}`, { responseType: "blob", headers: { Authorization: `Bearer ${token}` } }).then((response) => { 
                const url = URL.createObjectURL(response.data); 
                setLogoSrc(url);
            });              
        }
    }

    useEffect(() => { 
        getActions('org')
        getOrganization(); 
        codeRef.current?.focus(); 
    },[]);
    
    const changeHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = event.target;
        setOrg({...org, [name]: value});
    } ;

    const saveOrganization = async () => {

        if (isValidataionEnabled){
            const result = validate();
            if (!result.result) {
                toast.error('* '+ result.errors.join("\n* "), { style: { whiteSpace: "pre-line" }, });
                return ;
            }
        }
        org.parentId = selectedOrg?._id;
        org.tenantId = selectedOrg?.tenantId;
        if (org.id==""){
            try{
                await axios.post(`${baseURL}/organizations`, org, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
                    if (!res.data.status) {		
                        toast.error(res.data.errors?.map((e: ValidationError) => e.msg).join("\n"), { style: { whiteSpace: "pre-line", width: 'auto' }, });
                        codeRef.current?.focus();
                    }     
                    else{
                        toast.success("Organization created successfully!");
                        setOrg({id: "", tenantId:"", parentId:"", code:"", organizationName: "", address:""});
                        codeRef.current?.focus();
                    }               
                });
            }
            catch(err){
                const error = err as AxiosError<{ message: string }>;
                toast.error(error.message || 'Failed in role creation.');
            }
        }
        else {
            await axios.put(`${baseURL}/organizations/${id}`, org, { headers: { Authorization: `Bearer ${token}` } });
            navigate('/organization');
        }
    }

    const deleteOrganization = async () => {
        if (!window.confirm("Are you sure you want to delete this organization?")) {
            return;
        }
        await axios.delete(`${baseURL}/organizations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        await navigate('/organizations');
    }

    const validate = () => {

        const errors : string[] = [];

        if (!org.code.trim())
            errors.push('Code is required.');
        if (!org.organizationName.trim())
            errors.push('Name is required.');

        return ({result: errors.length === 0, errors: errors});
    }

    return (
        <div>
            <div className="content">
                <div className="form">
                    <div className="py-2 flex justify-center"><h1>Organization</h1></div>

                    <hr></hr>                
                    <div className="line">
                        <div className="line-label">{logoSrc && <img src={logoSrc} alt="icon" className="max-h-10 rounded shadow mr-2"/>}</div>
                        <div className="line-text"></div>
                    </div> 
                    <div className="line">
                        <div className="line-label"><label>Parent</label></div>
                        <div className="line-text"><OrganizationSelect organizations={orgs} value={selectedOrg?._id} onChange={setSelectedOrg}/></div>
                    </div> 
                    <div className="line">
                        <div className="line-label"><label>Code * </label></div>
                        <div className="line-text"><input type="text" id="code" name="code" value={org.code} onChange={changeHandler} ref={codeRef} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Name * </label></div>
                        <div className="line-text"><input type="text" id="organizationName" name="organizationName" value={org.organizationName} onChange={changeHandler} className="text"></input></div>
                    </div>
                    <div className="line">
                        <div className="line-label"><label>Address </label></div>
                        <div className="line-text"><textarea id="address" name="address" value={org.address} onChange={changeHandler} className="text"></textarea></div>
                    </div>

                    <hr className="py-2"></hr>
                    <div className="flex gap-2 items-center justify-center">
                        <button onClick={saveOrganization} disabled = { (!actions.includes('Create') && !actions.includes('Update')) } title={ actions.includes('Delete') ? '' : 'No access' } className="btn">Save</button>
                        <button onClick={deleteOrganization} disabled = { !actions.includes('Delete') } title={ actions.includes('Delete') ? '' : 'No access' } className="btn">Delete</button>
                        <Link to = "/organizations" className="link">List</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Organization ;