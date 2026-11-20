'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (base64Url: string) => void;
  error?: string;
  required?: boolean;
}

const renderLabel = (label: string, required?: boolean) => {
  if (!label) return null;
  if (label.includes('*')) {
    const parts = label.split('*');
    return (
      <>
        {parts[0]}
        <span className="text-rose-500 font-bold ml-0.5">*</span>
        {parts.slice(1).join('*')}
      </>
    );
  }
  return (
    <>
      {label}
      {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
    </>
  );
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Product Image',
  value,
  onChange,
  error,
  required = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size must be less than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the image file');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-zinc-700">
          {renderLabel(label, required)}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-50 p-3 group">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-white border border-zinc-200 shrink-0 shadow-xs">
              <img
                src={value}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 truncate flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                Image Uploaded Successfully
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Ready for submission</p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all bg-zinc-50/50 hover:bg-zinc-50 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/40'
              : error || uploadError
              ? 'border-rose-300'
              : 'border-zinc-300 hover:border-zinc-400'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto mb-2 border border-indigo-100">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-zinc-800">
            Click to upload product image or drag & drop
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            PNG, JPG, JPEG or WEBP (Max 8MB)
          </p>
        </div>
      )}

      {(uploadError || error) && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{uploadError || error}</span>
        </p>
      )}
    </div>
  );
};

