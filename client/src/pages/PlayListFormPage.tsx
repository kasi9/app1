import {  useCallback, useEffect, useRef, useState } from "react";
import PlayListForm, { type PlayListFormRef, type Previleges } from "../components/PlayList/PlayListForm";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AssetSearch, { type AssetSearchRef }  from "../components/Asset/AssetSearch";
import { toast } from "react-toastify";
import DraggableDialog from "./DraggableDialog";
import AssetForm, { type AssetFormRef } from "../components/Asset/AssetForm";
import { useUserContext } from "../context/UserContext";
import type { Asset } from "../types/Asset.type";

const PlayListFormPage = () => {
    const { state } = useLocation() as { state?: { _id?: string } };
    const _id = state?._id;
    
    const navigate = useNavigate();
    const { getActions, } = useUserContext();   

    const [, setSelectedItems] = useState<Asset[]>([]);
    const [openAssetSearch, setOpenAssetSearch] = useState(false);
    const [openAssetNew, setOpenAssetNew] = useState(false);
 //   const [, setHasSelection] = useState(false);
    const [ canCreateOrEdit, setCanCreateOrEdit ] = useState(false);
    const [ titleCreateOrEdit, setTitleCreateOrEdit ] = useState(""); 
    const [ canDelete, setCanDelete ] = useState(false);
    const [ titleDelete, setTitleDelete ] = useState(""); 

    const playListFormRef = useRef<PlayListFormRef>(null);
    const assetSearchRef = useRef<AssetSearchRef>(null);
    const assetFormRef = useRef<AssetFormRef>(null);

    useEffect(()=>{
        getActions("playList");
        playListFormRef.current?.clear();    
    }, []);

    const saveHandle = async () => { 
        const ok = await playListFormRef.current?.save()

        if (ok && playListFormRef.current?.playListId())
            navigate('/playlistlist');
    }

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete play list?")) 
            return ;  

        const ok = await playListFormRef.current?.delete();
        if (ok)
            navigate('/playlistlist');
    }

    const handleClear = () => {
        playListFormRef.current?.clear();
    }
    
    const handleAdd = () => {
        const selectedItem = assetSearchRef.current?.selectedItems();

        if (!selectedItem?.length) {
            toast.warn("Please select at least one asset before adding.");
            return;
        }

        selectedItem.forEach((item)=>{
            playListFormRef.current?.addAsset({ ...item, updateType: "add" });
        }); 
        
        assetSearchRef.current?.clearSeletion();
    };

    const handleSelectionChange = useCallback((assets: Asset[]) => {
        setSelectedItems(assets);
    }, []);

    const handleAssetSave = (asset: Asset) => {
        playListFormRef.current?.addAsset(asset);
        handleAssetFormClose();
    }

    const handleAssetFormClose = () => {
        setOpenAssetNew(false);
        assetFormRef.current?.clear();
    }

    const handleOnLoad = (priv: Previleges) => {
        setCanCreateOrEdit(priv.canCreateOrEdit);
        setTitleCreateOrEdit(priv.titleCreateOrEdit);
        setCanDelete(priv.canDelete);
        setTitleDelete(priv.titleDelete);
    }

    return (
<>

<div style={{ borderWidth: "2px", borderColor: "red", margin:"5px" }}>
    <div className="flex items-center justify-between">
        <div className="flex-1"></div>
        <h2 className="flex-none text-xl font-semibold text-center">Play List Form</h2>
        <div className="flex-1 flex justify-end gap-2">
            <button onClick={saveHandle} disabled = { !canCreateOrEdit } title={ titleCreateOrEdit } className="btn" >
                { _id ? "Edit" : "Save" }
            </button>
            <button onClick={handleDelete} disabled = { !canDelete } title={ titleDelete } className="btn" >Delete</button>
            <button onClick={handleClear} className="btn">Clear</button>
            <Link to = "/playlistlist" className="link">List</Link>
            <button onClick={() => setOpenAssetSearch(true)} className="btn">Select Assets</button>
            <button onClick={() => setOpenAssetNew(true)} className="btn">New Asset</button>
        </div>
    </div>
    <div>
        <PlayListForm ref={playListFormRef} onLoad2={ (e)=>handleOnLoad(e) } ></PlayListForm>
    </div>

    <DraggableDialog open={openAssetSearch} onClose={() => setOpenAssetSearch(false)} title="Assets List for selection">
        <AssetSearch ref={assetSearchRef} onSelectionChange={(e)=> handleSelectionChange(e)} onLoad={()=>{}}></AssetSearch>
        <button onClick={() => setOpenAssetSearch(false)}>Close</button>
        <button className="btn" onClick={()=>handleAdd() }>Add</button>
    </DraggableDialog>

    <DraggableDialog open={openAssetNew} onClose={() => handleAssetFormClose() } title="Assets for creation">
        <AssetForm onSave={(e) => handleAssetSave(e) } ref = {assetFormRef} onLoad={()=>{}}></AssetForm>
        <button onClick={() => handleAssetFormClose()} className="btn">Close</button>
        <button className="btn" onClick={() => assetFormRef.current?.save()}>Save</button>
    </DraggableDialog>

</div>

</>


    )
}

export default PlayListFormPage;
