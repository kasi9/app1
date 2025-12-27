import React, {  useState, useEffect, useId } from "react";

interface FileUploaderProps {
    id?: string;
    label?: string;
    multiple?: boolean;
    accept?: string; // e.g. "image/*"
    maxSizeMB?: number;
    onFilesSelected?: (files: File[]) => void;
    onPreviewChange?: (previewUrl: string | null) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ id, label = "Upload Image", multiple = false, accept = "image/*", maxSizeMB = 5, onFilesSelected, onPreviewChange}) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const generatedId = useId(); // ✅ unique per instance
    const inputId = id || `fileInput-${generatedId}`;

    const handleFiles = (files: FileList) => {
        const validFiles: File[] = [];

        for (const file of Array.from(files)) {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert(`${file.name} exceeds the ${maxSizeMB}MB limit.`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            const updatedFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;

            setSelectedFiles(updatedFiles);
            onFilesSelected?.(updatedFiles);

            // 👇 Preview the latest selected file
            const latestFile = validFiles[validFiles.length - 1];
            const url = URL.createObjectURL(latestFile);
            setPreviewUrl(url);
            onPreviewChange?.(url); 
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(e.target.files);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        const updated = [...selectedFiles];
        updated.splice(index, 1);
        setSelectedFiles(updated);

        if (updated.length > 0) {
          const last = updated[updated.length - 1];
          const url = URL.createObjectURL(last);
          setPreviewUrl(url);
          onPreviewChange?.(url);
        } else {
          setPreviewUrl(null);
          onPreviewChange?.(null);
        }

        onFilesSelected?.(updated);
    };

  // cleanup created object URL to avoid memory leaks
    useEffect(() => {
        return () => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

  return (
    <div className="w-full max-w-md mx-auto">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:border-blue-400 transition">
        <input type="file" id={inputId} accept={accept} multiple={multiple} onChange={handleInputChange} className="hidden"/>
        <label htmlFor={inputId} className="cursor-pointer text-gray-600">Drag & drop image or <span className="text-blue-500 underline">browse</span></label>

        {selectedFiles.length > 0 && (
          <ul className="mt-2 space-y-2">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex justify-between items-center bg-gray-100 rounded p-2">
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="text-red-500 text-sm hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        )}        
      </div>
    </div>
  );
};
