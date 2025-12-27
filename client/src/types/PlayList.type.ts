import type { Asset } from "./asset.type";

export interface PlayList { 
    _id?: string; 
    id?: string; 
    code: string; 
    title: string; 
    description: string; 
    assets: Asset[]
};
