import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface ApiKeyConfigProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ 
  apiKey, 
  onApiKeyChange,
  isOpen = false,
  onClose 
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onApiKeyChange(inputKey.trim());
    if (inputKey.trim()) {
      localStorage.setItem('gemini_api_key', inputKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      if (onClose) onClose();
    }, 1200);
  };

  const handleClear = () => {
    setInputKey('');
    onApiKeyChange('');
    localStorage.removeItem('gemini_api_key');
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      if (onClose) onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <div className="flex items-center space-x-2 text-primary font-bold text-base">
            {ICONS.Settings}
            <span>Cài đặt Gemini API (Tuỳ chọn)</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">✓</span>
            <div>
              <p className="font-semibold">Ứng dụng hoạt động đầy đủ không cần API key!</p>
              <p className="text-emerald-700 mt-0.5">Hệ thống đã tích hợp sẵn bộ sinh ma trận và câu hỏi chuẩn Công văn 7991.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Google Gemini API Key (Không bắt buộc)
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Để trống để dùng chế độ tự động..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Nếu bạn có Google API Key riêng, bạn có thể dán vào đây để mở rộng khả năng phân tích nâng cao.
            </p>
          </div>

          {savedMessage && (
            <div className="p-2 bg-green-100 text-green-800 text-xs rounded font-medium text-center">
              ✓ Đã lưu cấu hình thành công!
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-600 hover:text-red-800 underline font-medium"
              >
                Xoá API Key (Dùng mặc định)
              </button>
            ) : <div />}

            <div className="flex space-x-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Đóng
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-blue-800 shadow-sm"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyConfig;