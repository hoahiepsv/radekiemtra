import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface ApiKeyConfigProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ apiKey, onApiKeyChange }) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onApiKeyChange(inputKey);
    localStorage.setItem('gemini_api_key', inputKey);
    alert('Đã lưu API Key thành công!');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-primary flex items-center">
          {ICONS.Settings}
          <span className="ml-2">Cấu hình API Key</span>
        </h3>
        <button 
          onClick={() => setShowInput(!showInput)}
          className="text-xs text-blue-500 hover:text-blue-700 underline"
        >
          {showInput ? 'Ẩn' : 'Chỉnh sửa'}
        </button>
      </div>
      
      {(showInput || !apiKey) && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Nhập Google API Key để sử dụng (Lưu trên trình duyệt của bạn).
          </p>
          <div className="flex space-x-2">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Nhập API Key (AIza...)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-800 transition-colors"
            >
              Lưu
            </button>
          </div>
          <div className="text-[10px] text-gray-400 italic">
            * Ứng dụng hoạt động tốt nhất với model gemini-2.5-flash
          </div>
        </div>
      )}
      
      {apiKey && !showInput && (
         <div className="flex items-center text-xs text-green-600 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Đã cấu hình API Key
         </div>
      )}
    </div>
  );
};

export default ApiKeyConfig;