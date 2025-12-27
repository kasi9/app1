import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useUser } from "../context/UserContext";
import AssetForm, { type AssetFormRef, type Previleges } from "../components/Asset/AssetForm";

const AssetFormPage = () => {
    const location = useLocation();
    const { id } = location.state || {}; 

    const navigate = useNavigate();
    const { getActions, } = useUser();

    const [ canViewOrEdit, setCanViewOrEdit ] = useState(false);
    const [ titleViewOrEdit, setTitleViewOrEdit ] = useState(""); 
    const [ canDelete, setCanDelete ] = useState(false);
    const [ titleDelete, setTitleDelete ] = useState(""); 
    const [ canBulkCreate, setBulkCreate ] = useState(false);
    const [ titleBulkCreate, setTitleBulkCreate ] = useState(""); 
    
    const createOrEditRef = useRef<HTMLButtonElement>(null);

    useEffect(()=>{
        getActions("asset");
        if (id && createOrEditRef.current)
            createOrEditRef.current.value = "Editxx";
        else if (createOrEditRef.current)
            createOrEditRef.current.value = "Savexxx";

    },[])

    const assetFormRef = useRef<AssetFormRef>(null);

    const saveHandle = () => { 
        
        assetFormRef.current?.save();
      
        if (id)
            navigate('/assetlist');
    }

    const handleBulkSave = () => {
        assetFormRef.current?.saveBulk();
    }

    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this asset?'))
            return null ;
        
        assetFormRef.current?.delete();
        navigate('/assetlist');
    }

    const handleClear = () => {
        assetFormRef.current?.clear();
        assetFormRef.current?.focusToCode();
    }

    const handleOnLoad = (priv: Previleges) => {

        setCanViewOrEdit(priv.canCreateOrEdit);
        setTitleViewOrEdit(priv.titleCreateOrEdit);
        setCanDelete(priv.canDelete);
        setTitleDelete(priv.titleDelete);
        setBulkCreate(priv.canBulkCreate);
        setTitleBulkCreate(priv.titleBulkCreate);
    }

    return (
        <>
        
<div style={{ borderWidth: "2px", borderColor: "red", margin:"5px" }}>
    <div className="flex items-center justify-between">
        <div className="flex-1"></div>
        <h2 className="flex-none text-xl font-semibold text-center">Asset</h2>
        <div className="flex-1 flex justify-end gap-2">
                <button onClick={ saveHandle } disabled = { !canViewOrEdit } title={ titleViewOrEdit  } className= { canViewOrEdit ? "btn" : "btnDisabled" } >{ id ? "Edit" : "Save"}</button>
                <button onClick={handleDelete} disabled = { !canDelete } title={ titleDelete } className={ canDelete ? "btn" : "btnDisabled" }>Delete</button>
                <button onClick={handleClear} className="btn">Clear</button>
                <button onClick={handleBulkSave} disabled = { !canBulkCreate } title = { titleBulkCreate } className={ canBulkCreate ? "btn" : "btnDisabled"} >Bulk Save</button>
                <Link to = "/assetlist" className="link">List</Link>
        </div>
    </div>
    <div>
        <AssetForm ref={assetFormRef} onSave={()=>{}} onLoad={ (e)=>handleOnLoad(e) }></AssetForm>
    </div>
</div>

        </>
    )
}

export default AssetFormPage;
