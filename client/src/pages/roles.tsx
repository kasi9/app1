
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import Pagination from "../components/Pagination";
import { useUser } from "../context/UserContext";

type SortField = "organizationName" | "code" | "rolename";
type SortOrder = "asc" | "desc";

interface FilterRule {
  field: SortField;
  value: string;
}

interface SortRule {
  field: SortField;
  order: SortOrder;
}
interface Role { _id: string; organizationName: string; code: string, rolename: string };

const Roles = () => {

    const [ search, setSearch] = useState('');
    const [ filterRules, setFilterRules ] = useState<FilterRule[]>([]);
    const [ sortRules, setSortRules] = useState<SortRule[]>([]);

    const { pageSize, baseURL } = useContext(AppContent)!;
    const { token, actions, getActions} = useUser();

    const [ totalPages, setTotalPages ] = useState(1);
    const [ currentPage, setCurrentPage ] = useState(1);

    const [ roles, setRoles] = useState<Role[]>([]);

    const getData = async (pageNo: number) => {  
        await axios.get(`${baseURL}/roles/${pageSize}/${pageNo}/${JSON.stringify(filterRules)}/${JSON.stringify(sortRules)}/${search ? search : '_'}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {         
            setRoles(response.data.result); 
            setTotalPages(response.data.totalPages); 
        });
    }

    useEffect( () => {  
        getActions('role');
        getData(currentPage);
    }, [currentPage, filterRules]);

    const deleteRole = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this role?")) {
            return;
        }
        await axios.delete(`${baseURL}/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Role deleted successfully.');
        
        setCurrentPage(1);
        getData(1);
    }

    const onSearchHandler = () => {
        setCurrentPage(1);
        getData(1);
    }

    const handleSort = (field: SortField, ctrlOrMetaKey: boolean) => {
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

    const getSortIndicator = (field: SortField) => { 
        const index = sortRules.findIndex((r) => r.field === field);
        if (index === -1) 
            return "";
        
        const arrow = sortRules[index].order === "asc" ? "▲" : "▼";
        return ` ${arrow}${sortRules.length > 1 ? index + 1 : ""}`;
    };

    const toggleFilter = () => {
        const filterElement = document.getElementById('filter');

        if (filterElement) {
            filterElement.style.display = filterElement.style.display === "none" ? "table-row" : "none";
        }
    }

    const setFilter = (field: SortField, value: string) => {

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
        getData(1);      
    }

    return (
        <div>
            <div className="content">
                <div className="form w-full">
          
                <table className="table">
                    <caption>Roles</caption>
                    <caption>
                        <input type="text" name="search" value={search} onChange={(e)=>setSearch(e.target.value)} className="border-2"></input>
                        <button onClick={onSearchHandler} className="btn">Search</button>
                        <button className="btn" onClick={toggleFilter}>  {'>>'}</button>
                    </caption>
                    <thead className="thead">
                        <tr id='filter' style={{display:"none"}}>
                            <th><input type="text" onChange={(e)=>setFilter('code',e.target.value)} className="border-2 bg-white"></input></th>
                            <th><input type="text" onChange={(e)=>setFilter('rolename',e.target.value)} className="border-2 bg-white"></input></th>
                        </tr>
             
                        <tr>
                            <th onClick={(e) => handleSort("organizationName", e.ctrlKey)}
                                className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Organization Name {getSortIndicator('organizationName')}</th>
                            <th onClick={(e) => handleSort("code", e.ctrlKey)}
                                className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Code {getSortIndicator('code')}</th>
                            <th onClick={(e) => handleSort("rolename", e.ctrlKey)}
                                className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Name {getSortIndicator('rolename')}</th>
                            <th className="px-4 py-2">{ actions.includes('Create') ? (<Link to="/role" className="link">New</Link>) : (<span title="No access" style={{ color: "gray" }} >New</span>)  }</th>
                            <th className="px-4 py-2"></th>
                        </tr>  
                    </thead>
                    <tbody>
                    {
                        actions.includes('Read') ? (
                            roles?.map(r => (
                                <tr key={r._id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition">
                                    <td className="px-4 py-2">{r.organizationName}</td>
                                    <td className="px-4 py-2">{r.code}</td>
                                    <td className="px-4 py-2">{r.rolename}</td>
                                    <td className="px-4 py-2">{ (actions.includes('Update') || actions.includes('Delete'))  ? (<Link to = '/role' state={{id:r._id}} className="link">Edit</Link>) : (<span title="No access" style={{ color: "gray" }} >Edit</span>)  }</td>
                                    <td className="px-4 py-2"><button onClick={ () => deleteRole(r._id)} disabled = { !actions.includes('Delete') } title={ actions.includes('Delete') ? '' : 'No access' } className="link">Delete</button></td>
                                </tr> 
                            ))
                        ) : <tr><td colSpan={3} title="No access" style={{ color: "gray" }}>No access</td></tr>
                    }   
                    </tbody>     
                    <tfoot><Pagination onPageNoChange={(page) => setCurrentPage(page)} totalPages={totalPages} currentPage={ currentPage }></Pagination></tfoot>          
                </table>
                </div>
            </div>
        </div>
    );
}

export default Roles;
