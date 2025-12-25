// components/admin/ImageUpload.tsx
import React, { useRef, useState } from 'react';
import { ImageUp, X, LoaderCircle } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onUpload, onRemove, isUploading }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUpload(file);
      }
      e.dataTransfer.clearData();
    }
  };
  
  const dropZoneClass = isDragging
    ? 'border-primary bg-blue-50 text-primary'
    : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-primary hover:text-primary';

  return (
    <div>
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*" 
        disabled={isUploading}
      />
      
      {isUploading ? (
        <div className="w-full h-48 bg-gray-100 rounded-md flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
          <LoaderCircle size={32} className="animate-spin" />
          <p className="text-sm mt-2">Uploading...</p>
        </div>
      ) : value ? (
        <div className="relative group">
          <img src={value} alt="Featured" className="rounded-md w-full h-auto object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
            <button 
              type="button" 
              onClick={onRemove} 
              className="bg-white/80 text-red-600 rounded-full p-2 hover:bg-white"
              aria-label="Remove Image"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleUploadClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUploadClick(); }}
          className={`w-full h-48 rounded-md flex flex-col items-center justify-center border-2 border-dashed transition-colors cursor-pointer ${dropZoneClass}`}
        >
          <ImageUp size={32} />
          <p className="text-sm mt-2 font-semibold">{isDragging ? 'Drop image here' : 'Upload Featured Image'}</p>
          <p className="text-xs text-gray-400">{isDragging ? '' : 'Drag & drop or click to browse'}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
