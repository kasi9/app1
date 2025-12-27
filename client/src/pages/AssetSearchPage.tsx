import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AssetSearch, { type AssetSearchRef, type Previleges } from "../components/Asset/AssetSearch";
import { toast } from "react-toastify";

const AssetSearchPage = () => {

    const navigate = useNavigate();

    const [ canViewOrEdit, setCanViewOrEdit ] = useState(false);
    const [ titleViewOrEdit, setTitleViewOrEdit ] = useState(""); 
    const [ canDelete, setCanDelete ] = useState(false);
    const [ titleDelete, setTitleDelete ] = useState(""); 
  
    const assetSearchRef = useRef<AssetSearchRef>(null);

    const handleEdit = () => {
        const selectedItem = assetSearchRef.current?.selectedItems()[0];
    
        if (selectedItem)
            navigate('/asset', {state: { id: selectedItem?._id }});
        else
            toast.warn("Asset should be selected to edit");
    }

    const handleDelete = () => {
                
        assetSearchRef.current?.deleteSelectedAssets();
    }

    const handleOnLoad = (priv: Previleges) => {
        setTimeout(() => {
            setCanViewOrEdit(priv.canViewOrEdit);
            setTitleViewOrEdit(priv.titleViewOrEdit);
            setCanDelete(priv.canDelete);
            setTitleDelete(priv.titleDelete);        
        }, 0);
    }

    return (

<div style={{ borderWidth: "2px", borderColor: "red", margin:"5px" }}>
    <div className="flex items-center justify-between">
        <div className="flex-1"></div>
        <h2 className="flex-none text-xl font-semibold text-center">Assets List</h2>
        <div className="flex-1 flex justify-end gap-2">
            <Link to="/asset" className="link">New</Link>
            <button onClick={handleEdit} disabled={!canViewOrEdit} title={titleViewOrEdit} className={canViewOrEdit ? "btn" : "btnDisabled"} > View/Edit </button>
            <button onClick={handleDelete} disabled={!canDelete} title={titleDelete} className={canDelete ? "btn" : "btnDisabled"} >Delete</button>
        </div>
    </div>
    <div><AssetSearch onSelectionChange={()=>{}} ref = {assetSearchRef} onLoad={ (e)=>handleOnLoad(e) }></AssetSearch></div>
</div>

    );
}

export default AssetSearchPage;