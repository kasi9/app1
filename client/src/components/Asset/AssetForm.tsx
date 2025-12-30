import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

import { AppContent } from "../../context/AppContext";
import type { Asset } from "../../types/asset.type";
import { useUser } from "../../context/UserContext";
import AssetViewer, { type AssetViewerRef } from "./AssetViewer";
import { toast } from "react-toastify";
import { api, type CustomAxiosConfig } from "../../context/api";
import { Autocomplete, TextField } from "@mui/material";

const emptyAsset: Asset = { assetType: "", code: "", title: "", description: "", segments: [], tags: [], isUploaded: false };  
interface Segment { start: number; end: number | null; }
export interface Previleges { canCreateOrEdit: boolean; titleCreateOrEdit: string; canDelete: boolean; titleDelete: string; canBulkCreate: boolean; titleBulkCreate: string; };

export interface AssetFormRef { 
    save: () => void;
    saveBulk: () => void;
    delete: () => void;
    clear: () => void;
    focusToCode: () => void;
}

interface AssetFormProps {
    onSave: (asset: Asset) => void;
    onLoad: (priv: Previleges ) => void;
}

const AssetForm = forwardRef<AssetFormRef, AssetFormProps> (({onSave, onLoad}, ref) => {

    const { baseURL, fileTypes } = useContext(AppContent)!;
    const { getActions, actions } = useUser();
    const location = useLocation();
    const { id } = location.state || {}; 

    const codeRef = useRef<HTMLInputElement>(null);
    const fileUploadRef = useRef<HTMLInputElement >(null);
    const urlRef = useRef<HTMLInputElement>(null);
    const assetViewerRef = useRef<AssetViewerRef>(null);

    const [asset, setAsset] = useState<Asset>(emptyAsset);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedFileTypeIndex, setSelectedFileTypeIndex] = useState<number|null>(null);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [ privileges, ] = useState<Previleges> ({canCreateOrEdit: false, titleCreateOrEdit: "", canDelete: false, titleDelete: "", canBulkCreate: false, titleBulkCreate: ""});

    const [url, setUrl] = useState<string>("");
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [previewAssets, setPreviewAssets] = useState<Asset[]>([]);

    useImperativeHandle(ref, () => ({

        save: async () => saveAsset(),
        saveBulk: () => saveAssetsBulk(),
        delete: () => api.delete(`${baseURL}/assets/${asset._id}`) ,
        clear: () => { clearForm(); },
        focusToCode: () => { codeRef.current?.focus(); },
        playListId: () => { return id },

    }));

    useEffect(() => {    

        pageLoad();

    }, []);

    const pageLoad = async () => {
        codeRef.current?.focus();

        getActions('asset')
        const res2 = await api.get(`${baseURL}/tags`, { hideMessage: true} as CustomAxiosConfig);
        setAvailableTags(res2.data.data);

        if (id) 
            getData();


        setPrivileges2();
    }

    const setPrivileges2 = () => {

        const privs = privileges ;

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
        else if (!id) {
            privs.canDelete = false;
            privs.titleDelete = "No selection";
        }
        else {
            privs.canDelete = true;
            privs.titleDelete = "";
        }

        if (!actions.includes('BulkCreate')) {
            privs.canBulkCreate = false;
            privs.titleBulkCreate = "No permission"
        }
        else {
            privs.canBulkCreate = true;
            privs.titleBulkCreate = "";
        }

        onLoad(privs);
    }


    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = event.target;
        setAsset({...asset, [name]: value});
    } ;

    const getData = async () => {

        const res = await api.get(`${baseURL}/assets/${id}`, { hideMessage: true} as CustomAxiosConfig);
            
        if (res.data.data) {
            
            const idx = fileTypes.findIndex(ft=>ft.id == res.data.data.assetType);
            setSelectedFileTypeIndex(idx);
            res.data.data.assetType = fileTypes[idx].name;
            setAsset(res.data.data);   
            setPreviewAssets([...previewAssets,{ _id: "", id: "", assetType: fileTypes[idx].id, code: "", title: "", description: ""
                , filePath: res.data.data.filePath, lat: res.data.data.lat, lng: res.data.data.lng, segments: res.data.data.segments, isUploaded: res.data.data.isUploaded }]);
            assetViewerRef.current?.viewOrPlay();

        }

    }

    const saveAsset = async () => {
        
        const formData = new FormData();

        if (selectedFileTypeIndex !== null) {
            formData.append("assetType", fileTypes[selectedFileTypeIndex]?.id);
            if (["video", "youTube", "audio", "image", "pdf", "webLink"].includes(fileTypes[selectedFileTypeIndex]?.id)) 
                formData.append("filePath", asset.filePath ?? "");
        }
        formData.append("code", asset.code);
        formData.append("title", asset.title);
        formData.append('description', asset.description);
        formData.append('isUploaded', String(asset.isUploaded));
        if (asset.uploadedFile) 
            formData.append("audio", asset.uploadedFile);
        if (asset.assetType === "gmap") {
            formData.append("lat", String(asset.lat));
            formData.append("lng", String(asset.lng));
        }
    
        if ((asset?.segments?.length ?? 0)>0) {
            formData.append('segments', JSON.stringify(asset.segments));
        }
    
        if ((asset?.tags?.length ?? 0) > 0)
            formData.append("tags", JSON.stringify(asset.tags));

        if (id){
            const res = await api.put(`${baseURL}/assets/${id}`, formData);
            onSave(res.data.data); 
        }
        else {
            
            const res = await api.post(`${baseURL}/assets`, formData) ;       
            if (res.data.success)
                clearForm();

            onSave(res.data.data); 
        }

        return { _id: id || "", id: "", assetType: asset.assetType, code: asset.code, title: asset.title, description: asset.description
            , filePath: previewUrl, isUploaded: false };

    }

    const saveAssetsBulk = () => {

        assets.map((asset, i)=>{
            const formData = new FormData();
            formData.append("assetType", asset.assetType);
            formData.append("code", "");
            formData.append("title", asset.title);
            formData.append('description', asset.description);
            formData.append("isUploaded", String(asset.isUploaded));
            if (asset.uploadedFile) 
                formData.append("audio", asset.uploadedFile);

            try {
                api.post(`${baseURL}/assets`, formData, { hideMessage: true } as CustomAxiosConfig)
            }
            catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    toast.error(err.response?.data?.message ?? "Something went wrong", { autoClose: false });
                } else {
                    toast.error("Unexpected error", { autoClose: false });
                }
            }
            finally {
                console.log('bulk save: ', i, asset);
            }
        });

        setAssets(()=>[]);
        clearForm();
        return null;
    }

    const clearForm = () => {
        setAsset(emptyAsset);
        setUrl(()=>"");
        setPreviewAssets(()=>[]);

        if (fileUploadRef.current)
            fileUploadRef.current.value = "";
    }

    const prepareBulkInsert = (files: File[] | null) => {
        files?.map((file)=>{
            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); 
            const idx = fileTypes.findIndex(ft => ft.mime === file?.type);
            if (idx !== -1) {
                const fileTypeId = fileTypes[idx]?.id;
                if (fileTypeId){  
                    setAssets(prev=>[...prev, { _id: "", id: "", assetType: fileTypeId, code: "", title: fileNameWithoutExt, description: ""
                    , uploadedFile: file, isUploaded: true}]);
                }
            }
        });
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (!files || files.length === 0) 
            return;

        if (files?.length>1) {
            prepareBulkInsert(files);
            return ;
        }

        const file = files?.[0];
        if (file) {
            const fileNameWithoutExt = file?.name.replace(/\.[^/.]+$/, ""); 
            const idx = fileTypes.findIndex(ft => ft.mime === file?.type);
            if (idx === -1) {
                setAsset((prev)=>{ return {...prev, assetType: "" }});
                toast.error("Invalid file selected.", {autoClose: false});
                return ;
            }
            setSelectedFileTypeIndex(idx);
            const fileTypeName = fileTypes[idx].name;
            const fileTypeId = fileTypes[idx].id;

            const url = await URL.createObjectURL(file);
            setPreviewUrl(url);

            setAsset({...asset, assetType: fileTypeName, code: !asset.code ? "" : asset.code, title: !asset.title ? fileNameWithoutExt : asset.title
                , uploadedFile: file, segments: [], isUploaded: true});
                
            setPreviewAssets([{ _id: "", id: "", assetType: fileTypeId, code: "", title: "", description: "", filePath: url, isPreview: true, isUploaded: true}]);
            assetViewerRef.current?.viewOrPlay();
        } else {
            setPreviewAssets([]);
            setPreviewUrl("");
        }

        if (urlRef.current){
            urlRef.current.value = "";
            setUrl("");
        }
            
    };

    const handleUrlChange = (url: string) => {
        setUrl(()=>url);

        const linkType = detectUrlType(url);
        const idx = fileTypes.findIndex(ft => ft.mime === linkType);
        setSelectedFileTypeIndex(idx);

        if (linkType==="youTube") {
            const id = extractVideoId(url);    
        
            if (id) {
                setAsset({ ...asset, assetType: 'youTube', filePath: id, segments:[], isUploaded: false })
                setPreviewAssets([{ _id: "", id: "", assetType: 'youTube', code: "", title: "", description: "", filePath: id, isUploaded: false }]);
            }
        }

        if (linkType==="gmap") {
            const { lat, lng } = extractLatLng(url) ?? {};
            setAsset({...asset, assetType: 'gmap', lat: lat, lng: lng, segments: []})  ;
            setPreviewAssets([{ _id: "", id: "", assetType: "gmap", code: "", title: "", description: "", filePath: "", isPreview: true, lat: lat, lng: lng, isUploaded: false}]);
        }

        if (linkType === "webLink") {
            setAsset({...asset, assetType: linkType, filePath: url, segments:[]})  ;
            setPreviewAssets([{ _id: "", id: "", assetType: "webLink", code: "", title: "", description: "", filePath: url, isUploaded: false}]);
        }            

        assetViewerRef.current?.viewOrPlay();
        if (fileUploadRef.current)
            fileUploadRef.current.value = "";
    }

    const detectUrlType = (url: string): "youTube" | "gmap" | "webLink" => {
        
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/).+/i;

        const googleMapsRegex = /^(https?:\/\/)?(www\.)?google\.[a-z.]+\/maps\/.*/i;


        if (youtubeRegex.test(url)) 
            return "youTube";
        if (googleMapsRegex.test(url)) 
            return "gmap";

        return "webLink";
    };

    const extractVideoId = (url: string) => {
        const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/|youtube\.com\/shorts\/)([^&#]+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    };

    const extractLatLng = (url: string): { lat: number; lng: number } | null => {
        // Pattern for URLs containing @LAT,LONG
        const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;

        // Pattern for URLs containing query=LAT,LONG
        const queryPattern = /[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/;

        const matchAt = url.match(atPattern);
        if (matchAt) {
            return { lat: parseFloat(matchAt[1]), lng: parseFloat(matchAt[2]) };
        }

        const matchQuery = url.match(queryPattern);
        if (matchQuery) {
            return { lat: parseFloat(matchQuery[1]), lng: parseFloat(matchQuery[2]) };
        }

        return null;
    }
    
    const handleMarkStart = () => {
        const time = assetViewerRef.current?.getCurrentTime() ?? 0;
        setAsset((prev) => ({...prev, segments: [...(prev.segments || []), { start: time, end: null }], }));  
        setCurrentIndex(asset.segments ? asset.segments.length : null);
    };

    const handleMarkEnd = () => { 
        setAsset(prev => ({ ...prev, segments: prev.segments?.map((seg, i) => i === currentIndex ? { ...seg, end: assetViewerRef.current?.getCurrentTime() ?? null } : seg ), }));
    };

    const handleClearMark = () => { setAsset({...asset, segments: []}) }

    const handlePlaySegment = (seg: Segment) => {
      if (seg.end == null) return;
      
        assetViewerRef.current?.seekTo(seg.start);
        assetViewerRef.current?.viewOrPlay();

        const interval = setInterval(() => {
            const current = assetViewerRef.current?.getCurrentTime() || 0;
            if (current >= seg.end!) {
                assetViewerRef.current?.pauseVideo();
                clearInterval(interval);
            }
        }, 500);
    };

    const handlePlaySegments = async () => {
      if (!assetViewerRef.current || !asset.segments?.length) 
          return;

      const player = assetViewerRef.current;

      for (const seg of asset.segments) {
          player.seekTo(seg.start);
          player.viewOrPlay();

          await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
              const current = player.getCurrentTime();
              if (current >= seg.end!) {
                player.pauseVideo();
                clearInterval(interval);
                resolve();
              }
            }, 1000); 
          });
      }
    };

    const handleTagSelection = (tags: string[]) => {

        setAsset(prev => prev ? { ...prev, tags: tags } : prev);

        const newTag = tags[tags.length-1] ;

        if (!availableTags.includes(newTag))
            setAvailableTags(prev => [...prev, newTag]);

    }

    return (
        <>
<div className="max-w-7xl mx-auto p-4">
    <div className="bg-white rounded shadow p-4 space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="sm:w-1/4 font-medium">Upload File</label>
          <input type="file" multiple onChange={(e) => handleFileChange(e)} ref={fileUploadRef} className="w-full sm:w-3/4 border rounded p-2"/>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="sm:w-1/4 font-medium">URL</label>
          <input value={url} onChange={(e) => handleUrlChange(e.target.value)} className="w-full sm:w-3/4 border rounded p-2" ref = { urlRef }/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* PREVIEW */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <AssetViewer src={previewAssets} ref={assetViewerRef} />
        </div>

        {/* CONTROLS */}
        <div className="border rounded p-3 space-y-3" >

          <div className="flex flex-wrap gap-2">
            <button onClick={handleMarkStart} disabled = { !([0,1,5]).includes(selectedFileTypeIndex ?? 0) } 
                className = { ([0,1,5]).includes(selectedFileTypeIndex ?? 0) ? "btn bg-green-500 text-white btn" : "btn bg-green-500 text-white btnDisabled" } >Mark Start</button>
            <button onClick={handleMarkEnd} disabled = { !([0,1,5]).includes(selectedFileTypeIndex ?? 0) } 
            className = { ([0,1,5]).includes(selectedFileTypeIndex ?? 0) ? "btn bg-red-500 text-white btn" : "btn bg-red-500 text-white btnDisabled" }>Mark End</button>
            <button onClick={handleClearMark} disabled = { !([0,1,5]).includes(selectedFileTypeIndex ?? 0) } 
            className = { ([0,1,5]).includes(selectedFileTypeIndex ?? 0) ? "btn bg-gray-500 text-white btn" : "btn bg-gray-500 text-white btnDisabled" }>Clear</button>
            <button onClick={handlePlaySegments} disabled = { !([0,1,5]).includes(selectedFileTypeIndex ?? 0) } 
            className = { ([0,1,5]).includes(selectedFileTypeIndex ?? 0) ? "btn text-blue-600 btn" : "btn text-blue-600 btnDisabled" }>▶ Play All</button>
          </div>

          <div>
            <h2 className="font-semibold mb-1">Marked Segments</h2>
            <ul className="list-disc pl-5 space-y-1">
              {asset.segments?.map((seg, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{seg.start}s → {seg.end}s</span>
                  <button className="text-blue-600 underline" onClick={() => handlePlaySegment(seg)} > ▶ Play </button>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>


        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="sm:w-1/8 font-medium">Tags</label>
          <Autocomplete multiple freeSolo options={availableTags ?? []} value={asset?.tags || []} getOptionLabel={(option) => option }
            onChange={(_, value) => handleTagSelection(value)}
            className="w-full sm:w-7/8" 
            renderInput={(params) => <TextField {...params} variant="outlined" size="small" className="w-full" 
              InputProps={{ ...params.InputProps, className: "border rounded p-2 flex-wrap" }}/>}            
          />
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="sm:w-1/4 font-medium">Type</label>
           <input name="assetType" value={asset?.assetType} onChange={handleChange} className="w-full sm:w-3/4 border rounded p-2" disabled />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="sm:w-1/4 font-medium">Code</label>
          <input name="code" value={asset?.code} onChange={handleChange} ref={codeRef} className="w-full sm:w-3/4 border rounded p-2" />
        </div>

      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="sm:w-1/8 font-medium">Title</label>
        <input type="text" name="title" value={asset?.title} onChange={ handleChange } className="w-full sm:w-7/8 border rounded p-2"></input>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="sm:w-1/8 font-medium">Description</label>
        <textarea name="description" value={asset?.description} onChange={handleChange} rows={4} className="w-full sm:w-7/8 border rounded p-2" />
      </div>

    </div>
</div>

        </>
    )
});

export default AssetForm;
