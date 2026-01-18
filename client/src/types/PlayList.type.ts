import type { Asset } from "../types/Asset.type";

export interface PlayList { 
    _id?: string; 
//    id?: string; 
    code: string; 
    title: string; 
    description: string; 
    assets: Asset[]
};
