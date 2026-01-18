import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import PlayListSearch, { type PlayListSearchHandle, type Previleges } from "../components/PlayList/PlayListSearch";
import { useUserContext } from "../context/UserContext";

const PlayListSearchPage = () => {

    const navigate = useNavigate();
    const { getActions,  } = useUserContext();   

    const playListSearchRef = useRef<PlayListSearchHandle>(null);
    const [ canViewOrEdit, setCanViewOrEdit ] = useState(false);
    const [ titleViewOrEdit, setTitleViewOrEdit ] = useState(""); 
    const [ canDelete, setCanDelete ] = useState(false);
    const [ titleDelete, setTitleDelete ] = useState(""); 

    useEffect(()=>{
        getActions("playList");
    },[]);
    
    const handleEdit = () => {
        const selectedItem = playListSearchRef.current?.selectedItems()?.[0];

        if (!selectedItem) {
            toast.warn("Please select a Play List to edit.");
            return ;
        }

        navigate('/playlist', {state: { _id: selectedItem._id }});
    }

    const handleDelete = () => {   
        if (!window.confirm('Are you sure you want to delete play list?'))         
            return ;

        playListSearchRef.current?.deleteSelectedItems();
    }

    const handleOnLoad = (priv: Previleges) => {
//        setTimeout(() => {
            setCanViewOrEdit(priv.canViewOrEdit);
            setTitleViewOrEdit(priv.titleViewOrEdit);
            setCanDelete(priv.canDelete);
            setTitleDelete(priv.titleDelete);            
//        }, 0);
    }

    return (
        <div style={{ borderWidth: "2px", borderColor: "red", margin:"5px" }}>
<div className="flex items-center mt-3">

  {/* LEFT SPACER */}
  <div className="flex-1"></div>

  {/* CENTER TITLE */}
  <h1 className="flex-none text-xl font-semibold text-center">Playlists List</h1>

  {/* RIGHT ACTIONS */}
  <div className="flex-1 flex justify-end gap-2">
    <Link to="/playlist" className="link">New</Link>
    <button onClick={handleEdit} disabled={!canViewOrEdit} title={titleViewOrEdit} className="btn" > View/Edit </button>
    <button onClick={handleDelete} disabled={!canDelete} title={titleDelete} className="btn" > Delete </button>
  </div>

</div>

<div>
    <PlayListSearch ref = {playListSearchRef}  onSelectionChange={ ()=>{} } onLoad={ (e)=>handleOnLoad(e) }></PlayListSearch>
</div>
        </div>
    );
}

export default PlayListSearchPage;