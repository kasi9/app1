
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import type { PlayList } from "../../types/PlayList.type";

import type { Asset } from "../../types/Asset.type";
import type { AssetViewerRef } from "../Asset/AssetViewer";
import AssetViewer from "../Asset/AssetViewer";
import { api, type CustomAxiosConfig } from "../../context/api";
import { useAppContext } from "../../context/AppContext";
import { useUserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import AssetSearch2 from "../Asset/AssetSearch2";
import type { AssetSearchRef } from "../Asset/AssetSearch2";

export interface PlayListFormRef { 
    save: () => void;
    delete: () => void;
    clear: () => void,
    playListId: () => Omit<string,"id"> | "";
    getPlayList: () => PlayList | null;
    getAssets: () => Asset[] | null;
    addAsset: (asset: Asset) => void;
}

interface PlayListFormProps {
    onLoad?: (hasSelected: boolean) => void;
    onLoad2: (priv: Previleges ) => void;
}

const emptyPlaylist: PlayList = { _id: "", code: "", title: "", description: "", assets: [] };

export interface Previleges { canCreateOrEdit: boolean; titleCreateOrEdit: string; canDelete: boolean; titleDelete: string; };

const PlayListForm = forwardRef<PlayListFormRef, PlayListFormProps> (({ onLoad, onLoad2 }, ref) => {

    const location = useLocation();
    const { _id } = location.state || {}; 
    const { baseURL } = useAppContext();
    const { actions, getActions } = useUserContext();

    const codeRef = useRef<HTMLInputElement>(null);
    const assetViewerRef = useRef<AssetViewerRef>(null);
    const assetSearchRef = useRef<AssetSearchRef>(null);

    const [playList, setPlayList] = useState<PlayList>({ _id: "", code: "", title: "", description: "", assets: []});
    const [assetFiles, setAssetFiles] = useState<Asset[]>([]);
    const [updatedItems, setUpdatedItems] = useState<Asset[]>([]);
    const [viewerItems, setViewerItems] = useState<Asset[]>([]);
    const [ privileges, ] = useState<Previleges> ({canCreateOrEdit: false, titleCreateOrEdit: "", canDelete: false, titleDelete: "" });

    useEffect(() => {
        pageLoad();
    }, []);
        
    const pageLoad = async () => {
        clear();

        if (_id) {
            onLoad?.(true);
            await getData();
        }
        else
            onLoad?.(false);
        
        await getActions('playList') ;
        setPrivileges2();
    }

    const setPrivileges2 = () => {

        const privs = { ...privileges } ;

        if (!actions.includes('Create') && !actions.includes('Update') ) {
            privs.canCreateOrEdit = false;
            privs.titleCreateOrEdit = "No permission"
        }
                    /*        else if (!id) {
                                privs.canViewOrEdit = false;
                                privs.titleViewOrEdit = "No selection";
                            }*/
        else {
            privs.canCreateOrEdit = true;
            privs.titleCreateOrEdit = "";
        }

        if (!actions.includes('Delete')) {
            privs.canDelete = false;
            privs.titleDelete = "No permission"
        }
        else if (!_id) {
            privs.canDelete = false;
            privs.titleDelete = "No selection";
        }
        else {
            privs.canDelete = true;
            privs.titleDelete = "";
        }

        onLoad2(privs);
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
        const {name, value} = event.target;
        setPlayList({...playList, [name]: value});
    } ;

    const handleItemDelete = (idx: number) => {

        const deletedItem = { ...assetFiles[idx], updateType: "del" };

        setUpdatedItems(prev => [...prev, deletedItem]);
        setAssetFiles(prev => prev.filter((_, i) => i !== idx));
        setViewerItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handlePlay = useCallback((asset: Asset) => {
        setViewerItems(() => {
            const assets = [asset];
            return assets;
        });
        assetViewerRef.current?.viewOrPlay();
    },[]);

    const handleViewerPrePlay = () => {
        setViewerItems(()=>{ const assets = assetFiles; return assets});
        assetViewerRef.current?.viewOrPlay();
    }

    const getData = async () => {

        try {
            const res = await api.get(`${baseURL}/playlists/${_id}`, { hideMessage: true } as CustomAxiosConfig);
            
            setPlayList(res.data.data);   
            setAssetFiles(res.data.data.assets);
            setViewerItems(res.data.data.assets);
            assetViewerRef.current?.viewOrPlay();    
        }
        catch {
            toast.error("Play List fetching failed.");
        }             
    }

    const clear = () => {
        setPlayList(emptyPlaylist);
        codeRef.current?.focus();
        setAssetFiles([]);
        setViewerItems([]);
    }

    const addItem = (asset: Asset) => {
        if (assetFiles.some(a => a._id === asset._id)) {
            toast.warn("This Asset already added.");
            return 
        };

        const updated = { ...asset, updateType: "add" };

        setUpdatedItems(prev => [...prev, updated]);
        setAssetFiles(prev => [...prev, updated]);
        setViewerItems(prev => [...prev, updated]);
    }

    const savePlayList = async () => {

        if (!playList.title?.trim()) {
            toast.error("Title is required");
            codeRef.current?.focus();
            return false;
        }

        if (playList._id === "") {
            const payload = { ...playList, assets: assetFiles };                
            const res2 = await api.post(`${baseURL}/playlists`, payload);
            if (res2.data.success) {
                clear();
                codeRef.current?.focus();
                return true;
            }
            else
                return false;
        }
        else {
            const payload = { ...playList, assets: updatedItems };
            api.put(`${baseURL}/playlists/${playList._id}`, payload) ;
            return true;
        }
    }

    const deletePlayList = async () => { 
        try {
            await api.delete(`${baseURL}/playlists/${playList._id}`);   
            return true;
        }
        catch {
            toast.error("Play List delete failed.");
            return false;
        }
    }    

    useImperativeHandle(ref, () => ({
        
        save: () => savePlayList(),
        delete: () => deletePlayList(),      
        clear: () => clear(), 
        playListId: () => { return _id },
        getPlayList: () => { return playList },  
        getAssets: () => { return assetFiles },
        addAsset: (asset: Asset) => addItem(asset),

    }));

    return (
        <>
<div className="max-w-7xl mx-auto p-4 space-y-6">
<div className="flex flex-col lg:flex-row gap-6">

  {/* LEFT – ASSET VIEWER */}
  <div className="lg:w-1/2 w-full h-[350px] border rounded-lg p-2">
    <AssetViewer assets={viewerItems} ref={assetViewerRef} onPrePlay={handleViewerPrePlay} />
  </div>

  {/* RIGHT – FORM */}
  <div className="lg:w-1/2 w-full space-y-4">

    {/* Code */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <label className="sm:w-1/4 font-medium">Code *</label>
      <input type="text" name="code" value={playList?.code} onChange={handleChange} ref={codeRef} className="w-full sm:w-3/4 border rounded p-2" />
    </div>

    {/* Title */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <label className="sm:w-1/4 font-medium">Title</label>
      <input type="text" name="title" value={playList?.title} onChange={handleChange} className="w-full sm:w-3/4 border rounded p-2" />
    </div>

    {/* Description */}
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <label className="sm:w-1/4 font-medium">Description</label>
      <textarea name="description" value={playList?.description} onChange={handleChange} rows={4} className="w-full sm:w-3/4 border rounded p-2" />
    </div>

  </div>
</div>

<div><AssetSearch2 assets={ assetFiles } onDelete={(e)=>handleItemDelete(e)} onPlay={(e) => handlePlay(e)} onSelectionChange={()=>{}} ref = {assetSearchRef} onLoad={ ()=>{}  }></AssetSearch2></div>
{/*
<div className="overflow-x-auto">
  <table className="min-w-full border border-gray-300 rounded">

    <thead className="bg-gray-100">
      <tr>
        <th className="p-2"></th>
        <th className="p-2 text-left">Code</th>
        <th className="p-2 text-left">Title</th>
        <th className="p-2"></th>
      </tr>
    </thead>

    <tbody>
      {assetFiles?.map((p, idx) => (
        <tr key={idx} className="hover:bg-gray-100">
          <td className="p-2">
            <button onClick={() => handlePlay(p)} className="text-blue-600 underline">
              Play
            </button>
          </td>
          <td className="p-2">{p.code}</td>
          <td className="p-2">{p.title}</td>
          <td className="p-2">
            <button onClick={() => handleItemDelete(idx)} className="text-red-600 underline" > Delete </button>
          </td>
        </tr>
      ))}
    </tbody>

  </table>
</div>*/}

</div>
        </>
    )
});

export default PlayListForm;
