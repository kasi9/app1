import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import axios from "axios";
import { Autocomplete, TextField } from "@mui/material";

import Pagination from "../Pagination";
import { useAudit } from "../../context/AuditContext";

import { toast } from "react-toastify";
import { api, type CustomAxiosConfig } from "../../context/api";
import { useAppContext } from "../../context/AppContext";
import { useUserContext } from "../../context/UserContext";
import type { Asset } from "../../types/Asset.type";
import { getAssetsByPaginationClient } from "./AssetPage";

export interface AssetSearchRef { 
    selectedItems: () => Asset[];
    deleteSelectedAssets: () => void;
    clearSeletion: () => void;
}

interface AssetSearchProps {
    onSelectionChange: (assets: Asset[]) => void;
    onLoad: (priv: Previleges ) => void;
    assets?: Asset[];
    onDelete?: (idx: number) => void;
    onPlay?: (asset: Asset) => void;
}

export interface Previleges { canViewOrEdit: boolean, titleViewOrEdit: string, canDelete: boolean, titleDelete: string};
type SortOrder = "asc" | "desc";

interface FilterRule { field: keyof Asset; value: string; }
interface SortRule { field: keyof Asset; order: SortOrder; }

const AssetSearch2 = forwardRef<AssetSearchRef, AssetSearchProps> (({ onSelectionChange, onLoad, assets = [], onDelete, onPlay }, ref)=>{

    const { baseURL, pageSize } = useAppContext();
    const { actions, getActions } = useUserContext();
    const { trackAction } = useAudit();
    
    const [ totalPages, setTotalPages ] = useState(1); 
    const [ currentPage, setCurrentPage ] = useState(1);
    const [ pageAssets, setPageAssets] = useState<Asset[]>([]);

    const [ search, setSearch] = useState('');
    const [ filterRules, setFilterRules ] = useState<FilterRule[]>([]);
    const [ sortRules, setSortRules ] = useState<SortRule[]>([]);
    const [ availableTags, setAvailableTags ] = useState<string[]>([]);
    const [ selectedTags, setSelectedTags] = useState<string[]>([]);
    const [ privileges, setPrivileges] = useState<Previleges> ({canViewOrEdit: false, titleViewOrEdit: "", canDelete: false, titleDelete: ""});
    const [ showFilter, setShowFilter] = useState(false);

  //  const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedItems, setSelectedItems] = useState<Asset[]>([]);

    const selectAllRef = useRef<HTMLInputElement | null>(null);
    const selectAllPagesRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(ref, () => ({
        selectedItems: () => { return selectedItems },
        deleteSelectedAssets: () => { deleteAssets() },
        clearSeletion: () => { 
            setSelectedItems([]) ;
            selectAllRef.current!.checked = false;
            selectAllPagesRef.current!.checked = false;
        },
    }));

    useEffect(() => {   
        pageLoad();
    },[]);

    useEffect(()=>{
        getData(currentPage);
    }, [assets]);

    useEffect(()=>{
        onLoad(privileges);                
    },[privileges]);

    const pageLoad = async () => {
        await getActions('asset') ;
        setPrivileges2(selectedItems);
        const res2 = await api.get(`${baseURL}/tags`, { hideMessage: true } as CustomAxiosConfig);
        setAvailableTags(res2.data.data);
    }

    const setPrivileges2 = (items: Asset[]) => {

        const privs: Previleges = { ...privileges };

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
        setPrivileges(privs);
//        onLoad(privs);
    }

    useEffect(() => {  
        getData(currentPage); 

    }, [currentPage, filterRules, sortRules, selectedTags]);

    const getData = async (pageNo: number) => {

//        const res = await api.get(`${baseURL}/assets/${pageSize}/${pageNo}/${JSON.stringify(filterRules)}/${JSON.stringify(sortRules)}/${search ? search : '_'}/${JSON.stringify(selectedTags)}`) ;
//        const assets = res.data.result.map((asset:Asset) => ({ ...asset, isPreview: true }));
//        setAssets(assets);  

        const result = getAssetsByPaginationClient({ assets, pageNo, pageSize, search, filterRules, sortRules, tags:selectedTags, });
        setPageAssets(result.result);
        setTotalPages(result.totalPages); 
    }


    const deleteAssets = async () => {

            if ((selectedItems?.length ?? 0) === 0) {
                toast.warn("Asset should be selected to delete.");
                return ;
            }

            if (!window.confirm(`Delete ${selectedItems.length} asset(s)?`))
                return null ;

            await Promise.all(
                selectedItems.map(i =>
                    api.delete(`${baseURL}/assets/${i._id}`, { hideMessage: true } as CustomAxiosConfig)
                )
            );

            await setSelectedItems([]);
            if (selectAllRef.current) {
                selectAllRef.current.checked = false;
            }
            await setCurrentPage(1);
            await getData(currentPage); 
            onSelectionChange(selectedItems);
    }

    const handleSelect = (playlist: Asset) => {
        setSelectedItems(prev => {
            const newSelectedItems = prev.some(i=>i._id===playlist._id) ? prev.filter(i=>i._id !== playlist._id) : [...prev, playlist];
            onSelectionChange(newSelectedItems);
            setPrivileges2(newSelectedItems);
            return newSelectedItems;
        });
    }

    const handleSelectAll = () => {
        setSelectedItems(()=>{
            const newSelectedItems = selectAllRef.current?.checked ? assets : [];
                
            onSelectionChange(newSelectedItems);
            setPrivileges2(newSelectedItems);

            return newSelectedItems;
        });
    }

    const handleSelectAllPages = async () => {

        if (selectedItems.length>0){
            setSelectedItems([]);
            onSelectionChange([]);
            setPrivileges2([]);
            if (selectAllRef.current)
                selectAllRef.current.checked = false;
        }
        else {
            try{
                const res = await api.get(`${baseURL}/assets/-1/0/${JSON.stringify(filterRules)}/${JSON.stringify(sortRules)}/${search ? search : '_'}/${JSON.stringify(selectedTags)}`) ;
       
                setSelectedItems(()=>{
                    const newSelectedItems = res.data.result;
                    onSelectionChange(newSelectedItems);
                    setPrivileges2(newSelectedItems);
                    return newSelectedItems;
                });     

                if (selectAllRef.current)
                    selectAllRef.current.checked = true;
            } 
            catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    toast.error(err.response?.data?.message ?? "Something went wrong", { autoClose: false });
                } else {
                    toast.error("Unexpected error", { autoClose: false });
                }
            }
        }       
    }

    const handleSearch = () => {
        trackAction("Clicked Search Button", { query: "some search text dommmm  kasi" });
        setCurrentPage(1);
        getData(currentPage);
    }
    
    const setFilter = (field: keyof Asset, value: string) => {

        setFilterRules((prev) => {
            let updatedRules = [...prev];
            const existingIndex = updatedRules.findIndex((r) => r.field === field);

            if (existingIndex >= 0) { 
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
  
    const handleSort = (field: keyof Asset, ctrlOrMetaKey: boolean) => {

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
    
    const getSortIndicator = (field: keyof Asset) => { 
        const index = sortRules.findIndex((r) => r.field === field);
        if (index === -1) return "";
        const arrow = sortRules[index].order === "asc" ? "▲" : "▼";
        return ` ${arrow}${sortRules.length > 1 ? index + 1 : ""}`;
    };

    const handleDelete = (idx:number) => {
        onDelete?.(idx);
    }

    const handlePlay = (asset: Asset) => {
        onPlay?.(asset);
    }

    return (

<div className="border-2 border-red-500 m-2 p-2">

  {/* MAIN LAYOUT */}
  <div className="flex flex-col lg:flex-row gap-4">

    {/* RIGHT PANEL – SEARCH + TABLE */}
    <div className="w-full border rounded p-2">

      {/* SEARCH BAR */}
      <div className="flex items-center gap-2 mb-3 ml-5">
        <input type="checkbox" onChange={handleSelectAllPages} ref={selectAllPagesRef} disabled = { assets?.length>0 ? false : true } />
        <Autocomplete multiple freeSolo options={availableTags ?? []} value={selectedTags ?? []} getOptionLabel={(option) => option }
            onChange={(_, value) => setSelectedTags(value)} 
          renderInput={(params) => (<TextField {...params} label="Tags" size="small" />)} className="flex-1" />
        <input type="text" name="search" value={search} onChange={(e) => setSearch(e.target.value) } 
            onKeyDown ={(e) =>  e.key === "Enter" && handleSearch() } 
            className="border px-2 py-1 flex-1" placeholder="Search..." />
        <button onClick={ () => handleSearch() } className="btn">Search</button>
        <button onClick={() => setShowFilter(v => !v)} className="btn">{'>>'}</button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto max-h-[70vh]">
<table className="w-full border border-blue-500 border-collapse">
  <thead className="bg-gray-100">
    {/* FILTER ROW */}
    <tr className={showFilter ? "" : "hidden"} >
      <th className="w-12 p-2 text-center"></th>
      <th className="p-2">
        <input onChange={(e)=>setFilter('assetType',e.target.value)} className="border w-full p-1"/>
      </th>
      <th className="p-2">
        <input onChange={(e)=>setFilter('code',e.target.value)} className="border w-full p-1"/>
      </th>
      <th className="p-2">
        <input onChange={(e)=>setFilter('title',e.target.value)} className="border w-full p-1"/>
      </th>
      <th className="p-2">
        <input onChange={(e)=>setFilter('tags',e.target.value)} className="border w-full p-1"/>
      </th>
    </tr>

    {/* HEADER */}
    <tr>
      <th className="w-12 p-2 text-center"><input type="checkbox" onChange={handleSelectAll} ref={selectAllRef} disabled = { assets?.length===0 } /></th>
      <th className="p-2 text-left cursor-pointer" onClick={(e)=>handleSort("assetType", e.ctrlKey)}>Type {getSortIndicator('assetType')}</th>
      <th className="p-2 text-left cursor-pointer" onClick={(e)=>handleSort("code", e.ctrlKey)} >Code {getSortIndicator('code')}</th>
      <th className="p-2 text-left cursor-pointer" onClick={(e)=>handleSort("title", e.ctrlKey)} > Title {getSortIndicator('title')} </th>
      <th className="p-2 text-left cursor-pointer" > Tags </th>
    </tr>
  </thead>

  <tbody>
    {actions.includes("Read") ? (
      pageAssets?.map((p,idx) => (
        <tr key={p._id} className="hover:bg-gray-100 cursor-pointer" onClick={() => handleSelect(p)} >
          <td className="p-2">
            <button onClick={() => handlePlay(p)} className="text-blue-600 underline">
              Play
            </button>
          </td>

          <td className="w-12 p-2 text-center"><input type="checkbox" onChange={() => handleSelect(p)} onClick={e => e.stopPropagation()} checked={selectedItems.some(i => i._id === p._id)} readOnly /></td>
          <td className="p-2 text-left">{p.assetType}</td>
          <td className="p-2 text-left">{p.code}</td>
          <td className="p-2 text-left">{p.title}</td>
          <td className="p-2 text-left">{p.tags}</td>
          <td className="p-2">
            <button onClick={()=>{ handleDelete(idx) }} className="text-red-600 underline" > Delete </button>
          </td>
        </tr>
      ))
    ) : ( <tr><td colSpan={6} className="p-4 text-gray-400 text-center">No access</td></tr> )}
  </tbody>

  <tfoot><tr><td>{selectedItems.length} selected <Pagination onPageNoChange={setCurrentPage} totalPages={totalPages} currentPage={currentPage} /></td></tr></tfoot>
</table>
      </div>
    </div>

  </div>
</div> 

    );
});

export default AssetSearch2;