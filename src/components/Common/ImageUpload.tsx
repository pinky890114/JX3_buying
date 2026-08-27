import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (base64OrUrl: string) => void;
  label?: string;
  placeholder?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  maxSizeMB?: number;
  allowUrlInput?: boolean;
}

/**
 * ImageUpload component:
 * Converts uploaded local images (PNG, JPG, WEBP, GIF, SVG) into a compressed Base64 Data URL,
 * so users can upload directly from their device (phones, computers) without needing an external image hosting service (圖床).
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = '圖片上傳 (支援本機檔案直接上傳)',
  placeholder = '或貼上圖片 URL / 留空使用預設圖',
  previewSize = 'md',
  maxSizeMB = 4,
  allowUrlInput = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Resize / compress large images into JPEG/WEBP base64 to keep state lightweight
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('請選擇圖片檔案 (JPG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`檔案大小超過限制 (${maxSizeMB}MB)，請選擇較小的圖片`);
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setIsProcessing(false);
        return;
      }

      // If it's a small image, directly use result
      if (file.size < 350 * 1024) {
        onChange(result);
        setIsProcessing(false);
        return;
      }

      // Compress images using an offscreen canvas to keep Base64 size lightweight for Firestore (1MB limit per doc)
      const img = new Image();
      img.onload = () => {
        const maxWidth = 700;
        const maxHeight = 700;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Use 0.75 quality to ensure compact size (< 200KB per image) for Firestore compatibility
          let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          
          // If still large (> 400KB), compress more aggressively
          if (compressedDataUrl.length > 500000) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          }

          onChange(compressedDataUrl);
        } else {
          onChange(result);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(result);
        setIsProcessing(false);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setErrorMessage('讀取圖片失敗，請重試');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const previewDimensions = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  }[previewSize];

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="font-bold text-[#1E2530] text-xs flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-[#C5922E]" />
            <span>{label}</span>
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[11px] text-[#A63434] hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
            >
              <X className="w-3 h-3" />
              <span>清除圖片</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Drag & Drop Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`p-3 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center gap-3 ${
          isDragging
            ? 'border-[#C5922E] bg-[#FFF9ED]'
            : 'border-[#DDD5C7] bg-[#FAF7F2] hover:border-[#C5922E]/60'
        }`}
      >
        {/* Thumbnail Preview or Upload Icon */}
        <div
          className={`${previewDimensions} rounded-lg bg-white border border-[#DDD5C7] flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center p-2 text-center text-[#C5922E]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[10px] mt-1 font-bold">壓縮中...</span>
            </div>
          ) : value ? (
            <>
              <img
                src={value}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-opacity"
              >
                換圖
              </div>
            </>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center text-[#A0988A] cursor-pointer hover:text-[#C5922E]"
            >
              <Upload className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-bold">上傳</span>
            </div>
          )}
        </div>

        {/* Action button and optional URL Input */}
        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-[#223147] hover:bg-[#1A2536] text-[#E2B755] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>從相簿 / 電腦選取圖片</span>
            </button>
            <span className="text-[11px] text-[#6B7280]">
              免圖床，自動轉換 Base64 儲存
            </span>
          </div>

          {allowUrlInput && (
            <input
              type="text"
              value={value.startsWith('data:') ? '【本機圖片已載入】' : value}
              onChange={(e) => {
                if (!e.target.value.includes('本機圖片')) {
                  onChange(e.target.value);
                }
              }}
              placeholder={placeholder}
              className="w-full p-2 rounded-lg bg-white border border-[#DDD5C7] text-xs text-[#1E2530] outline-none focus:border-[#C5922E] truncate"
            />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {errorMessage && (
        <p className="text-[11px] font-bold text-[#A63434]">{errorMessage}</p>
      )}
    </div>
  );
};
