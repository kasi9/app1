
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Pagination from "../components/Pagination";

import { useAudit } from "../context/AuditContext";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

interface Organization {_id: string; code: string; organizationName: string; parentName: string; address: string;};
interface User { code: string; organizationName: string; parentName: string; }

type SortOrder = "asc" | "desc";

interface FilterRule { field: keyof User; value: string; }
interface SortRule { field: keyof User; order: SortOrder; }

const Organizations = () => {
    const { trackAction } = useAudit();

    const [ search, setSearch] = useState('');
    const [ filterRules, setFilterRules ] = useState<FilterRule[]>([]);
    const [ sortRules, setSortRules ] = useState<SortRule[]>([]);

    const { pageSize, baseURL } = useAppContext();
    const { token, actions, getActions } = useUserContext();
    const [ totalPages, setTotalPages ] = useState(1); 
    const [ currentPage, setCurrentPage ] = useState(1);

    const [ orgs, setOrgs ] = useState<Organization[]>([]);

    const getData = async (pageNo: number) => {
        await axios.get(`${baseURL}/organizations/${pageSize}/${pageNo}/${JSON.stringify(filterRules)}/${JSON.stringify(sortRules)}/${search ? search : '_'}`, 
            { headers: { Authorization: `Bearer ${token}` }, withCredentials: true })
        .then((response) => {        
            setOrgs(response.data.result); 
            setTotalPages(response.data.totalPages); 
        });
    }
    
    useEffect(() => {  
        getActions('org')           
        getData(currentPage);
    }, [currentPage, filterRules, sortRules]);

    const deleteOrganization = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this organization?")) {
            return;
        }
        await axios.delete(`${baseURL}/organizations/${id}`, { headers: { Authorization: `Bearer ${token}` } });

        setCurrentPage(1);
        getData(1);        
    }

    const onSearchHandler = () => {
        trackAction("Clicked Search Button", { query: "some search text dommmm  kasi" });
        setCurrentPage(1);
        getData(1);
    }


    const handleSort = (field: keyof User, ctrlOrMetaKey: boolean) => {

        const existingIndex2 = Math.max(0, sortRules.findIndex((r) => r.field === field));
        const prevOrder = sortRules[existingIndex2]?.order;

        setSortRules((prev) => {
            let updatedRules = [...prev];
            const existingIndex = updatedRules.findIndex((r) => r.field === field);

            if (existingIndex >= 0) { // if exists
                if (ctrlOrMetaKey) 
                    updatedRules = updatedRules.filter((_, index) => index !== existingIndex);
                else
                    updatedRules[existingIndex].order = prevOrder === "asc" ? "desc" : "asc";
            } 
            else {
                if (ctrlOrMetaKey) {
                    updatedRules.push({ field, order: "asc" });
                } else {
                    updatedRules = [{ field, order: "asc" }];
                }
            }
            return updatedRules;
        });

       setCurrentPage(1);
    };

    const getSortIndicator = (field: keyof User) => { 
        const index = sortRules.findIndex((r) => r.field === field);
        if (index === -1) return "";
        const arrow = sortRules[index].order === "asc" ? "▲" : "▼";
        return ` ${arrow}${sortRules.length > 1 ? index + 1 : ""}`;
    };

    const toggleFilter = () => {
        const filterElement = document.getElementById('filter');

        if (filterElement) {
            filterElement.style.display = filterElement.style.display === "none" ? "table-row" : "none";
        }
    }

    const setFilter = (field: keyof User, value: string) => {

        setFilterRules((prev) => {
            let updatedRules = [...prev];
            const existingIndex = updatedRules.findIndex((r) => r.field === field);

            if (existingIndex >= 0) { // if exists
                if (value) 
                    updatedRules[existingIndex].value = value;
                else
                    updatedRules = updatedRules.filter((_, index) => index !== existingIndex);
            } 
            else {
                updatedRules.push({ field, value: value });
            }
            return updatedRules;
        });   
    
        setCurrentPage(1);
//        getData(1);      
    }

    return (
        <div>
            <div className="content">
                <div className="form w-full">
            
            <table className="table">
                <caption><h2>Organizations</h2></caption>
                <caption>
                    <input type="text" name="search" value={search} onChange={(e)=>setSearch(e.target.value)} className="border-2"></input>
                    <button onClick={onSearchHandler} className="btn">Search</button>
                    <button className="btn" onClick={toggleFilter}>  {'>>'}</button>
                </caption>
                <thead className="thead">
                    <tr id='filter' style={{display:"none"}}>
                        <th><input type="text" onChange={(e)=>setFilter('code',e.target.value)} className="border-2 bg-white"></input></th>
                        <th><input type="text" onChange={(e)=>setFilter('organizationName',e.target.value)} className="border-2 bg-white"></input></th>
                    </tr>

                    <tr>
                        <th onClick={(e) => handleSort("code", e.ctrlKey)}  
                            className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Code {getSortIndicator('code')}</th>
                        <th onClick={(e) => handleSort("organizationName", e.ctrlKey)} 
                            className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Name {getSortIndicator('organizationName')}</th>
                        <th onClick={(e) => handleSort("parentName", e.ctrlKey)} 
                            className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Parent Name {getSortIndicator('parentName')}</th>
                        <th className="px-4 py-2">{ actions.includes('Create') ? (<Link to ="/organization" className="link">New</Link>) : (<span title="No access" style={{ color: "gray" }} >New</span>)  }</th>
                        <th className="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                {
                    actions.includes('Read') ? (
                        orgs.map(o => (
                            <tr key={o._id} className="tr">
                                <td className="px-4 py-2">{o.code}</td>
                                <td className="px-4 py-2">{o.organizationName}</td>
                                <td className="px-4 py-2">{o.parentName}</td>
                                <td className="px-4 py-2">{ (actions.includes('Update') || actions.includes('Delete')) ? (<Link to = "/organization" state = {{id:o._id}} className="link">Edit</Link>) : (<span title="No access" style={{ color: "gray" }} >Edit</span>)  }</td>
                                <td className="px-4 py-2"><button onClick={ () => deleteOrganization(o._id)} disabled = { !actions.includes('Delete') } title={ actions.includes('Delete') ? '' : 'No access' } className="link">Delete</button></td>
                            </tr>
                        ))) : <tr><td colSpan={4} title="No access" style={{ color: "gray" }}>No access</td></tr>
                }
                </tbody>
                <tfoot><Pagination onPageNoChange={(page) => setCurrentPage(page)} totalPages={totalPages} currentPage={ currentPage }></Pagination></tfoot>          
            </table>
            </div>
            </div>
        </div>
    );
}

export default Organizations ;
