import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Pagination from "../components/Pagination";
import { useUser } from "../context/UserContext";

type SortField = "organizationName" | "code" | "personName" | "mobileNo" | "user.loginName";
type SortOrder = "asc" | "desc";

interface FilterRule {
  field: SortField;
  value: string;
}

interface SortRule {
  field: SortField;
  order: SortOrder;
}

interface Person { _id: string; code: string; personName: string; mobileNo: string; address: string; 
    user: {loginName: string; password: string}; organization: {organizationName: string}};

const Persons = () => {

    const [ search, setSearch ] = useState('');
    const [ filterRules, setFilterRules ] = useState<FilterRule[]>([]);
    const [ sortRules, setSortRules ] = useState<SortRule[]>([]);

    const { pageSize, baseURL } = useContext(AppContent)!;
    const { token, actions, getActions } = useUser();

    const [ totalPages, setTotalPages ] = useState(1); 
    const [ currentPage, setCurrentPage ] = useState(1);

    const [persons, setPersons] = useState<Person[]>([]);

    const getData = async (pageNo: number) => {
        await axios.get(`${baseURL}/persons/${pageSize}/${pageNo}/${JSON.stringify(filterRules)}/${JSON.stringify(sortRules)}/${search ? search : '_'}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {       
            setPersons(response.data.result);          
            setTotalPages(response.data.totalPages);        
        });
    }
    
    useEffect(() => {
        getActions('person');
        getData(currentPage);    
    }, [currentPage, filterRules, sortRules]);

    const deletePerson = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this person?")) {
            return;
        }
        await axios.delete(`${baseURL}/persons/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setCurrentPage(1);
        getData(1);    
    };

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
            
            <div>
                <table className="table">
                    <caption><h2>Persons</h2></caption>
                    <caption>
                        <input type="text" name="search" value={search} onChange={(e)=>setSearch(e.target.value)} className="border-2"></input>
                        <button onClick={onSearchHandler} className="btn">Search</button>
                        <button className="btn" onClick={toggleFilter}>  {'>>'}</button>
                    </caption>
                    <thead className="thead">
                        <tr id='filter' style={{display:"none"}}>
                            <th><input type="text" onChange={(e)=>setFilter('code',e.target.value)} className="border-2 bg-white"></input></th>
                            <th><input type="text" onChange={(e)=>setFilter('personName',e.target.value)} className="border-2 bg-white"></input></th>
                            <th><input type="text" onChange={(e)=>setFilter('mobileNo',e.target.value)} className="border-2 bg-white"></input></th>
                            <th><input type="text" onChange={(e)=>setFilter('user.loginName',e.target.value)} className="border-2 bg-white"></input></th>
                        </tr>     

                        <tr>
                            <th onClick={(e) => handleSort("organizationName", e.ctrlKey)} 
                                className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Organization Name {getSortIndicator('organizationName')}</th>
                            <th onClick={(e) => handleSort("code", e.ctrlKey)} 
                                className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Code {getSortIndicator('code')}</th>
                            <th onClick={(e) => handleSort("personName", e.ctrlKey)}
                                className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Name {getSortIndicator('personName')}</th>
                            <th onClick={(e) => handleSort("mobileNo", e.ctrlKey)} 
                                className="px-4 py-2 cursor-pointer select-none p-2 border-b border-gray-300">Mobile No. {getSortIndicator('mobileNo')}</th>
                            <th className="px-4 py-2">Login Name</th>
                            <th className="px-4 py-2">{ actions.includes('Create') ? (<Link to = "/person" className="link">New</Link>) : (<span title="No access" style={{ color: "gray" }} >New</span>)  }</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        actions.includes('Read') ? (
                            persons.map((p) => (
                            <tr key={p._id} className="tr">
                                <td className="px-4 py-2">{p.organization.organizationName}</td>
                                <td className="px-4 py-2">{p.code}</td>
                                <td className="px-4 py-2">{p.personName}</td>
                                <td className="px-4 py-2">{p.mobileNo}</td>
                                <td className="px-4 py-2">{p.user?.loginName}</td>
                                <td className="px-4 py-2">{ (actions.includes('Update') || actions.includes('Delete')) ? (<Link to = "/person" state={{id:p._id}} className="link">Edit</Link>) : (<span title="No access" style={{ color: "gray" }} >Edit</span>)  }</td>
                                <td className="px-4 py-2"><button onClick={ () => deletePerson(p._id)} disabled = { !actions.includes('Delete') } title={ actions.includes('Delete') ? '' : 'No access' } className="link">Delete</button></td>
                            </tr> 
                        ))): <tr><td colSpan={6} title="No access" style={{ color: "gray" }}>No access</td></tr>
                    }
                    </tbody>
                    <tfoot><Pagination onPageNoChange={(page) => setCurrentPage(page)} totalPages={totalPages} currentPage={ currentPage }></Pagination></tfoot>          
                </table>
            </div>
            </div>
            </div>
        </div>
    );
}

export default Persons;
