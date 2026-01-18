import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AssetForm, { type AssetFormRef, type Previleges } from "../components/Asset/AssetForm";

const AssetFormPage = () => {

    const navigate = useNavigate();
    const { state } = useLocation() as { state?: { _id?: string } };
    const _id = state?._id;

    const assetFormRef = useRef<AssetFormRef>(null);
    const [ previleges, setPrevileges ] = useState<Previleges | undefined>(undefined);

    const handleDelete = async () => {
        const ok = await assetFormRef.current?.delete();
        if (ok)
            navigate('/assetlist');
    }

    return (
<>       
<div style = {{ borderWidth: "2px", borderColor: "red", margin:"5px" }} >
    <div className = "flex items-center justify-between" >
        <h2 className = "flex-none text-xl font-semibold text-center" >Asset</h2>
        <div className = "flex-1 flex justify-end gap-2" >
                <button onClick = { ()=>assetFormRef.current?.save() } disabled = { !previleges?.canCreateOrEdit } 
                    title = { previleges?.createOrEditTooltip } className = "btn" >{ _id ? "Edit" : "Save" }</button>
                <button onClick = { ()=>handleDelete() } disabled = { !previleges?.canDelete } 
                    title = { previleges?.deleteTooltip } className = "btn" >Delete</button>
                <button onClick = { ()=>assetFormRef.current?.clear() } className = "btn" >Clear</button>
                <button onClick = { ()=>assetFormRef.current?.saveBulk() } disabled = { !previleges?.canBulkCreate } 
                    title = { previleges?.bulkCreateTooltip } className = "btn" >Bulk Save</button>
                <Link to = "/assetlist" className = "btn" >List</Link>
        </div>
    </div>
    <div>
        <AssetForm assetId={ _id } ref = { assetFormRef } onLoad ={ (p)=>setPrevileges(p) }></AssetForm>
    </div>
</div>
</>
    )
}

export default AssetFormPage;
