import React from 'react';
import { ExamConfig } from '../types';

interface ConfigFormProps {
  config: ExamConfig;
  onChange: (newConfig: ExamConfig) => void;
  disabled: boolean;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ config, onChange, disabled }) => {
  
  const handleChange = (key: keyof ExamConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-primary border-b pb-2">Cấu hình Đề Thi (CV 7991)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auto-extracted info */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên Trường/Sở</label>
          <input
            type="text"
            value={config.schoolName}
            onChange={(e) => handleChange('schoolName', e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Tự động lấy từ ma trận..."
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên Kỳ Thi</label>
          <input
            type="text"
            value={config.examName}
            onChange={(e) => handleChange('examName', e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Tự động lấy từ ma trận..."
            disabled={disabled}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Độ khó</label>
          <div className="mt-2 flex space-x-4">
            {['Dễ', 'Trung bình', 'Khó'].map((level) => (
              <label key={level} className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-primary"
                  name="difficulty"
                  value={level}
                  checked={config.difficulty === level}
                  onChange={() => handleChange('difficulty', level)}
                  disabled={disabled}
                />
                <span className="ml-2 text-sm">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div>
           <label className="block text-sm font-medium text-gray-700">Thời gian làm bài</label>
           <select
             value={config.examTime}
             onChange={(e) => handleChange('examTime', parseInt(e.target.value))}
             disabled={disabled}
             className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
           >
              <option value={15}>15 phút</option>
              <option value={45}>45 phút</option>
              <option value={60}>60 phút</option>
              <option value={90}>90 phút</option>
              <option value={120}>120 phút</option>
           </select>
        </div>

        <div className="md:col-span-2 border-t pt-3 mt-1">
           <p className="text-sm font-bold text-blue-700 uppercase mb-2">Phần I: Trắc nghiệm (70%)</p>
           <p className="text-xs text-gray-500 mb-2">Tổng điểm: 7.0</p>
        </div>

        {/* Question Counts Part 1 */}
        <div>
            <label className="block text-sm font-medium text-gray-700" title="Chọn 1 trong 4 đáp án">
                Dạng 1: TN Nhiều lựa chọn (0-20 câu)
            </label>
            <input 
                type="number" 
                min="0" 
                max="20" 
                value={config.mcCount}
                onChange={(e) => handleChange('mcCount', parseInt(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                disabled={disabled}
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700" title="4 ý Đúng/Sai trong 1 câu">
                Dạng 2: TN Đúng/Sai (0-10 câu)
            </label>
            <input 
                type="number" 
                min="0" 
                max="10" 
                value={config.tfCount}
                onChange={(e) => handleChange('tfCount', parseInt(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                disabled={disabled}
            />
        </div>
         <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700" title="Điền đáp số">
                Dạng 3: TN Trả lời ngắn (0-10 câu)
            </label>
            <input 
                type="number" 
                min="0" 
                max="10" 
                value={config.saCount}
                onChange={(e) => handleChange('saCount', parseInt(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                disabled={disabled}
            />
        </div>

        <div className="md:col-span-2 border-t pt-3 mt-1">
           <p className="text-sm font-bold text-blue-700 uppercase mb-2">Phần II: Tự luận (30%)</p>
           <p className="text-xs text-gray-500 mb-2">Tổng điểm: 3.0</p>
        </div>

        {/* Question Counts Part 2 */}
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
                Số lượng câu Tự luận (0-10 câu)
            </label>
            <input 
                type="number" 
                min="0" 
                max="10" 
                value={config.essayCount}
                onChange={(e) => handleChange('essayCount', parseInt(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                disabled={disabled}
            />
        </div>
      </div>

      {/* Matrix Customization */}
      <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-100">
        <label className="block text-sm font-bold text-blue-900 mb-1">Tuỳ chỉnh Ma trận / Ghi chú</label>
        <textarea
          rows={3}
          value={config.matrixNotes}
          onChange={(e) => handleChange('matrixNotes', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-blue-200 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="Nhập yêu cầu đặc tả ma trận, phân bổ kiến thức chi tiết..."
          disabled={disabled}
        ></textarea>
        <p className="text-xs text-blue-700 mt-1 italic">Hệ thống mặc định phân bổ: 40% Nhận biết, 30% Thông hiểu, 30% Vận dụng.</p>
      </div>
    </div>
  );
};

export default ConfigForm;