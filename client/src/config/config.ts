import type { FileType } from "../types/FileType.type";

export const IS_VALIDATION_ENABLED = import.meta.env.VITE_ENABLE_FRONTEND_VALIDATION === 'true';
export const MAX_UPLOAD_MB = 50;

export const FILE_TYPES: FileType[] = [
    {id: "video", name: "Video", extension: "mp4", mime: "video/mp4"},
    {id: "youTube", name: "YouTube", extension: "", mime: "youTube"},
    {id: "audio", name: "Audio", extension: "mp3", mime: "audio/mpeg"},
    {id: "image", name: "Image", extension: "jpeg", mime: "image/jpeg"},
    {id: "image", name: "Image", extension: "png", mime: "image/png"},
    {id: "pdf", name: "PDF", extension: "pdf", mime: "application/pdf"},
    {id: "gmap", name: "Google Map", extension: "", mime: "gmap"},
    {id: "webLink", name: "webLink", extension: "", mime: "webLink"},
    {id: "text", name: "text", extension: "", mime: "text/plain"},
    {id: "doc", name: "doc", extension: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},  
];
    
export const FEATURES = 
[
    { "code": "org", "name": "Organizations", "actions": ["Read","Create", "Update", "Delete", "Active"]},
    { "code": "role", "name": "Roles", "actions": ["Read","Create", "Update", "Delete", "Active"]},
    { "code": "person", "name": "Person", "actions": ["Read","Create", "Update", "Delete", "Active"]},

    { "code": "asset", "name": "Asset", "actions": ["Read","Create", "Update", "Delete", "Active", "BulkCreate"]},
    { "code": "playList", "name": "Play List", "actions": ["Read","Create", "Update", "Delete", "Active"]},
] ;
