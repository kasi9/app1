
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PlayList } from "../../types/PlayList.type";
import axios from "axios";
import { AppContent } from "../../context/AppContext";
import { useUser } from "../../context/UserContext";
import Pagination from "../Pagination";
import { useAudit } from "../../context/useAudit";
import { toast } from "react-toastify";
import { api, type CustomAxiosConfig } from "../../context/api";

export interface PlayListSearchHandle { 
    add: () => Omit<PlayList, 'id'> | null; 
    selectedItems: () => PlayList[];
    deleteSelectedItems: () => Promise<void>;
}

interface PlayListSearchProps {
    onSelectionChange: (hasSelection: boolean) => void;
    onLoad: (priv: Previleges ) => void;
}
export interface Previleges { canViewOrEdit: boolean; titleViewOrEdit: string; canDelete: boolean; titleDelete: string; };

type SortOrder = "asc" | "desc";

interface FilterRule { field: keyof PlayList; value: string; }
interface SortRule { field: keyof PlayList; order: SortOrder; }

const PlayListSearch = forwardRef<PlayListSearchHandle, PlayListSearchProps> (({ onSelectionChange, onLoad }, ref)=>{
    const { baseURL } = useContext(AppContent)!;
    const { token, actions, getActions } = useUser();
    const { trackAction } = useAudit();
    
    const { pageSize } = useContext(AppContent)!;
    const [ totalPages, setTotalPages ] = useState(1); 
    const [ currentPage, setCurrentPage ] = useState(1);
    const [ search, setSearch] = useState('');
    const [ filterRules, setFilterRules ] = useState<FilterRule[]>([]);
    const [ sortRules, setSortRules ] = useState<SortRule[]>([]);

    const [playLists, setPlayLists] = useState<PlayList[]>([]);
    const [selectedItems, setSelectedItems] = useState<PlayList[]>([]);
    const [ privileges, ] = useState<Previleges> ({canViewOrEdit: false, titleViewOrEdit: "", canDelete: false, titleDelete: ""});

    const selectAllRef = useRef<HTMLInputElement | null>(null);

    const getData = async (pageNo: number) => {

        const res = await api.get(`${baseURL}/playlists/${pageSize}/${pageNo}/${JSON.stringify(filterRules)}/${JSON.stringify(sortRules)}/${search ? search : '_'}`
            , { hideMessage: true } as CustomAxiosConfig);

        setPlayLists(res.data.data?.result);          
        setTotalPages(res.data.data?.totalPages); 
    }

    useEffect(() => {
        getActions("playList");
        pageLoad();
    }, []);

    useEffect(() => {
     
        getData(currentPage);

    }, [currentPage, filterRules, sortRules]);

    const pageLoad = async () => {
        await getActions('asset') ;
        setPrivileges2(selectedItems);
    }

    const setPrivileges2 = (items: PlayList[]) => {

        const privs = privileges ;

        if (!actions.includes('View') && !actions.includes('Update') ) {
            privs.canViewOrEdit = false;
            privs.titleViewOrEdit = "No permission"
        }
        else if (items.length === 0) {
            privs.canViewOrEdit = false;
            privs.titleViewOrEdit = "No selection";
        }
        else if (items.length > 1) {
            privs.canViewOrEdit = false;
            privs.titleViewOrEdit = "Multiple selection";
        }
        else {
            privs.canViewOrEdit = true;
            privs.titleViewOrEdit = "";
        }

        if (!actions.includes('Delete')) {
            privs.canDelete = false;
            privs.titleDelete = "No permission"
        }
        else if (items.length === 0) {
            privs.canDelete = false;
            privs.titleDelete = "No selection";
        }
        else {
            privs.canDelete = true;
            privs.titleDelete = "";
        }

        onLoad(privs);
    }

    useImperativeHandle(ref, () => ({
        add: () => {
            console.log('clicked on Add ');
            return null;
        },
        selectedItems: () => { 
            return selectedItems 
        },

        deleteSelectedItems: async () => { 
            if (selectedItems.length===0) {
                toast.warn("Please select Play List to delete.");
                return ;
            }

            await Promise.all(
            selectedItems?.map(i =>           
                axios.delete(`${baseURL}/playlists/${i._id}`, { headers: { Authorization: `Bearer ${token}` } })
            ));

            toast.success("Selected Play List(s) deleted successfully.");

            if (selectAllRef.current) {
                selectAllRef.current.checked = false;
            }
            
            setSelectedItems([]);
            onSelectionChange(false);
            await getData(1);
        }
    }));

    const onSearchHandler = () => {
        trackAction("Clicked Search Button", { query: "some search text dommmm  kasi" });
        setCurrentPage(1);
        getData(1);
    }
    
    const toggleFilter = () => {
        const filterElement = document.getElementById('filter');

        if (filterElement) {
            filterElement.className = filterElement.className === "hidden" ? "table-row" : "hidden";
        }
    }
    
    const setFilter = (field: keyof PlayList, value: string) => {

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
    }
  
    const handleSort = (field: keyof PlayList, ctrlOrMetaKey: boolean) => {

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
    
    const getSortIndicator = (field: keyof PlayList) => { 
        const index = sortRules.findIndex((r) => r.field === field);
        if (index === -1) return "";
        const arrow = sortRules[index].order === "asc" ? "▲" : "▼";
        return ` ${arrow}${sortRules.length > 1 ? index + 1 : ""}`;
    };
        
    const handleSelect = (playlist: PlayList) => {
    
        setSelectedItems(prev => {
            const items = prev.some(i=>i._id === playlist._id) ? prev.filter(i=>i._id !== playlist._id) : [...prev, playlist] ;

                setPrivileges2(items);
                
                onSelectionChange(items.length > 0);
            return items ;
        });
    }

    const handleSelectAll = () => {

        setSelectedItems(() => {
            const items = selectAllRef.current?.checked ? playLists : [] ;

            setPrivileges2(items)

            onSelectionChange(items.length > 0);
            return items ;
        });
    }

    return (
        <div className="border-2 border-red-500 m-2 p-2">
<div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50">
  <input type="text" name="search" value={search} onChange={(e) => setSearch(e.target.value)} 
    className="border px-2 py-1 flex-1 min-w-[200px]" 
    onKeyUp ={(e) =>  e.key === "Enter" && onSearchHandler() } 
    placeholder="Search playlists..." />
  <button onClick={onSearchHandler} className="btn">Search</button>
  <button onClick={toggleFilter} className="btn">{'>>'}</button>
</div>

<table className="w-full border-collapse">
<thead className="bg-gray-100">

  {/* FILTER ROW */}
  <tr id="filter" className="hidden">
    <th className="p-2"></th>
    <th className="p-2">
      <input onChange={(e)=>setFilter('code',e.target.value)} className="border w-full px-1"/>
    </th>
    <th className="p-2">
      <input onChange={(e)=>setFilter('title',e.target.value)} className="border w-full px-1"/>
    </th>
  </tr>

  {/* HEADER ROW */}
  <tr>
    <th className="w-12 p-2 text-center"><input type="checkbox" onChange={handleSelectAll} ref={selectAllRef} disabled = { playLists?.length>0 ? false : true }/></th>
    <th onClick={(e)=>handleSort("code", e.ctrlKey)}  className="p-2 text-left cursor-pointer">Code {getSortIndicator('code')}</th>
    <th onClick={(e)=>handleSort("title", e.ctrlKey)}  className="p-2 text-left cursor-pointer">Title {getSortIndicator('title')}</th>
  </tr>

</thead>
<tbody>
  {actions.includes("Read") ? (
    playLists?.map(p => (
      <tr key={p._id} className="hover:bg-gray-100 cursor-pointer" onClick={() => handleSelect(p)} >
        <td className="w-12 p-2 text-center"><input type="checkbox" checked={selectedItems.some(i => i._id === p._id)} readOnly /></td>
        <td className="p-2 text-left">{p.code}</td>
        <td className="p-2 text-left">{p.title}</td>
      </tr>
    ))
  ) : ( <tr><td colSpan={4} className="text-center text-gray-400 p-4">No access</td></tr>)}
</tbody>
<tfoot><Pagination onPageNoChange={(page) => setCurrentPage(page)} totalPages={totalPages} currentPage={ currentPage }></Pagination></tfoot>    
</table>

        </div>
    );
});

export default PlayListSearch;