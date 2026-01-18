
export interface Segment {
  start: number;
  end: number | null;
}

export interface Asset { 
    _id?: string; 
//    id?: string; 
    assetType: string;
    code: string; 
    title: string; 
    description: string; 
    isUploaded: boolean;
    filePath?: string; 
    uploadedFile?: File; 
    updateType?: string; 
    isPreview?: boolean | false; 
    lat?: number; 
    lng?: number; 
    segments?: Segment[];
    tags?: string[];
    file?: File;
}