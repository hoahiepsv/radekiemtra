import React, { useCallback } from 'react';
import { ICONS } from '../constants';
import { FileWithData } from '../types';

interface FileUploadProps {
  onFilesSelected: (files: FileWithData[]) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles: FileWithData[] = [];
      
      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];
        if (file.type === 'application/pdf') {
          const base64 = await convertToBase64(file);
          newFiles.push({
            file,
            base64,
            mimeType: file.type
          });
        }
      }
      onFilesSelected(newFiles);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result as string;
        // Remove data url prefix (e.g. "data:application/pdf;base64,")
        encoded = encoded.split(',')[1]; 
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="w-full">
      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${isProcessing ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-secondary bg-blue-50 hover:bg-blue-100'}`}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="text-secondary mb-2">
            {ICONS.Upload}
          </div>
          <p className="mb-1 text-sm text-gray-600 font-semibold">
            {isProcessing ? 'Đang xử lý...' : 'Nhấn để tải lên file PDF'}
          </p>
          <p className="text-xs text-gray-500">Hỗ trợ nhiều file (Ma trận, Ngân hàng câu hỏi)</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          multiple 
          accept=".pdf" 
          onChange={handleFileChange} 
          disabled={isProcessing}
        />
      </label>
    </div>
  );
};

export default FileUpload;