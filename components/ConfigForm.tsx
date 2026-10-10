import React, { useEffect } from 'react';
import { ExamConfig, SubjectConfig } from '../types';

interface ConfigFormProps {
  config: ExamConfig;
  onChange: (newConfig: ExamConfig) => void;
  disabled: boolean;
  hasFiles?: boolean;
  onReExtractFromFiles?: () => void;
  docExtractedNotice?: string | null;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ 
  config, 
  onChange, 
  disabled,
  hasFiles = false,
  onReExtractFromFiles,
  docExtractedNotice
}) => {
  
  const handleChange = (key: keyof ExamConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  // Recalculate totals whenever subjects change
  useEffect(() => {
    if (config.subjectType === 'integrated') {
      const totals = config.subjects.reduce((acc, sub) => ({
        mc: acc.mc + (sub.mcCount || 0),
        tf: acc.tf + (sub.tfCount || 0),
        sa: acc.sa + (sub.saCount || 0),
        essay: acc.essay + (sub.essayCount || 0),
        essayPts: acc.essayPts + (sub.essayPoints || 0),
      }), { mc: 0, tf: 0, sa: 0, essay: 0, essayPts: 0 });

      // Only update if numbers differ to avoid infinite loop
      if (totals.mc !== config.mcCount || 
          totals.tf !== config.tfCount || 
          totals.sa !== config.saCount || 
          totals.essay !== config.essayCount ||
          totals.essayPts !== config.essayPoints) {
        onChange({
          ...config,
          mcCount: totals.mc,
          tfCount: totals.tf,
          saCount: totals.sa,
          essayCount: totals.essay,
          essayPoints: totals.essayPts
        });
      }
    }
  }, [config.subjects, config.subjectType]); 

  const handleSubjectChange = (index: number, field: keyof SubjectConfig, value: any) => {
    const newSubjects = [...config.subjects];
    newSubjects[index] = { ...newSubjects[index], [field]: value };
    onChange({ ...config, subjects: newSubjects });
  };

  const handleAddSubject = () => {
    const newSubjects = [...config.subjects, { 
      name: '', 
      score: 0,
      mcCount: 4,
      tfCount: 1,
      saCount: 2,
      essayCount: 0,
      essayPoints: 0
    }];
    onChange({ ...config, subjects: newSubjects });
  };

  const handleRemoveSubject = (index: number) => {
    const newSubjects = [...config.subjects];
    newSubjects.splice(index, 1);
    onChange({ ...config, subjects: newSubjects });
  };

  // Calculations for Point Distribution
  const essayPoints = config.essayPoints || 0;
  const objectivePoints = 10 - essayPoints;
  const totalObjQuestions = (config.mcCount || 0) + (config.tfCount || 0) + (config.saCount || 0);
  const isIntegrated = config.subjectType === 'integrated';

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="border-b pb-2">
        <h3 className="text-lg font-bold text-primary">Cấu hình Đề Thi (CV 7991)</h3>
      </div>
      
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
              <option value={30}>30 phút</option> 
              <option value={45}>45 phút</option>
              <option value={60}>60 phút</option>
              <option value={90}>90 phút</option>
              <option value={120}>120 phút</option>
           </select>
        </div>

        {/* Subject Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Hình thức môn</label>
          <div className="mt-2 flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-primary"
                name="subjectType"
                value="single"
                checked={config.subjectType === 'single'}
                onChange={() => handleChange('subjectType', 'single')}
                disabled={disabled}
              />
              <span className="ml-2 text-sm">Đơn môn</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-primary"
                name="subjectType"
                value="integrated"
                checked={config.subjectType === 'integrated'}
                onChange={() => handleChange('subjectType', 'integrated')}
                disabled={disabled}
              />
              <span className="ml-2 text-sm">Liên môn (Tích hợp)</span>
            </label>
          </div>
        </div>

        {/* Integrated Subjects Config */}
        {isIntegrated && (
          <div className="md:col-span-2 bg-blue-50 p-3 rounded border border-blue-200">
            <label className="block text-sm font-bold text-blue-900 mb-2">Cấu hình chi tiết Liên môn</label>
            <p className="text-xs text-gray-500 mb-2">Nhập tên môn, tổng điểm và cấu trúc câu hỏi cho từng môn.</p>
            
            <div className="space-y-3">
              {config.subjects.map((sub, index) => {
                const subObjPoints = sub.score - (sub.essayPoints || 0);
                return (
                <div key={index} className="bg-white p-3 rounded shadow-sm border border-blue-100">
                  <div className="flex flex-wrap justify-between items-center mb-3 pb-2 border-b border-gray-100 gap-2">
                     <div className="flex space-x-2 items-center flex-1 min-w-[200px]">
                        <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Môn {index + 1}</span>
                        <input
                          type="text"
                          placeholder="Tên môn (Vd: Lý)"
                          value={sub.name}
                          onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-semibold focus:ring-1 focus:ring-blue-500"
                          disabled={disabled}
                        />
                     </div>
                     
                     <div className="flex items-center space-x-4">
                         <div className="flex items-center space-x-1" title="Tổng điểm của môn này">
                             <span className="text-xs font-semibold text-gray-600">Tổng điểm:</span>
                             <input
                                type="number"
                                value={sub.score}
                                onChange={(e) => handleSubjectChange(index, 'score', parseFloat(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center font-bold text-blue-700"
                                step="0.25"
                                disabled={disabled}
                             />
                         </div>
                         <button 
                            onClick={() => handleRemoveSubject(index)}
                            className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                            title="Xoá môn này"
                            disabled={disabled}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </button>
                     </div>
                  </div>
                  
                  {/* Point Distribution for Subject */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-blue-50/50 px-3 py-2 mb-3 rounded-md text-sm border border-blue-100">
                     <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <span className="text-gray-700 font-medium">Điểm Tự luận:</span>
                        <input
                           type="number"
                           min="0"
                           max={sub.score}
                           step="0.25"
                           value={sub.essayPoints || 0}
                           onChange={(e) => handleSubjectChange(index, 'essayPoints', parseFloat(e.target.value) || 0)}
                           className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500"
                           disabled={disabled}
                        />
                     </div>
                     <div className="text-gray-600">
                        Điểm Trắc nghiệm: <span className="font-bold text-primary text-base ml-1">{subObjPoints >= 0 ? subObjPoints.toFixed(2) : 0}</span>
                     </div>
                  </div>

                  {/* Subject Structure Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                     <div className="flex flex-col">
                        <label className="text-gray-600 mb-1 font-semibold" title="Nhiều lựa chọn">NLC (Câu)</label>
                        <input
                          type="number"
                          min="0"
                          value={sub.mcCount ?? 0}
                          onChange={(e) => handleSubjectChange(index, 'mcCount', parseInt(e.target.value) || 0)}
                          className="px-2 py-1.5 border border-gray-300 rounded text-center focus:border-blue-500 outline-none"
                          disabled={disabled}
                        />
                     </div>
                     <div className="flex flex-col">
                        <label className="text-gray-600 mb-1 font-semibold" title="Đúng sai">Đ/S (Câu)</label>
                        <input
                          type="number"
                          min="0"
                          value={sub.tfCount ?? 0}
                          onChange={(e) => handleSubjectChange(index, 'tfCount', parseInt(e.target.value) || 0)}
                          className="px-2 py-1.5 border border-gray-300 rounded text-center focus:border-blue-500 outline-none"
                          disabled={disabled}
                        />
                     </div>
                     <div className="flex flex-col">
                        <label className="text-gray-600 mb-1 font-semibold" title="Trả lời ngắn">TLN (Câu)</label>
                        <input
                          type="number"
                          min="0"
                          value={sub.saCount ?? 0}
                          onChange={(e) => handleSubjectChange(index, 'saCount', parseInt(e.target.value) || 0)}
                          className="px-2 py-1.5 border border-gray-300 rounded text-center focus:border-blue-500 outline-none"
                          disabled={disabled}
                        />
                     </div>
                     <div className="flex flex-col">
                        <label className="text-gray-600 mb-1 font-semibold" title="Tự luận">TL (Câu)</label>
                        <input
                          type="number"
                          min="0"
                          value={sub.essayCount ?? 0}
                          onChange={(e) => handleSubjectChange(index, 'essayCount', parseInt(e.target.value) || 0)}
                          className="px-2 py-1.5 border border-gray-300 rounded text-center focus:border-blue-500 outline-none"
                          disabled={disabled}
                        />
                     </div>
                  </div>
                </div>
              )})}
            </div>
            
            <button 
              onClick={handleAddSubject}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium mt-3 bg-white px-3 py-2 rounded border border-dashed border-blue-300 w-full justify-center hover:bg-blue-50"
              disabled={disabled}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              <span>Thêm môn thành phần</span>
            </button>
          </div>
        )}

        {/* Difficulty */}
        <div className="md:col-span-2">
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
        
        {/* SUMMARY BAR */}
        <div className="md:col-span-2 border-t pt-3 mt-1 bg-gray-50 p-3 rounded">
           <div className="flex justify-between items-center">
              <div>
                  <p className="text-sm font-bold text-gray-800 uppercase">TỔNG HỢP CẤU TRÚC ĐỀ</p>
                  <div className="text-xs text-gray-600 space-y-1 mt-1">
                      <p>• Trắc nghiệm: {objectivePoints.toFixed(2)} điểm ({totalObjQuestions} câu)</p>
                      <p>• Tự luận: {essayPoints.toFixed(2)} điểm ({config.essayCount} câu)</p>
                  </div>
              </div>
              <div className="text-right text-sm">
                  <p className="font-bold text-primary text-xl">10.0</p>
                  <p className="text-xs text-gray-500">Tổng điểm</p>
              </div>
           </div>
           {isIntegrated && <p className="text-[10px] text-orange-600 italic mt-2 text-center">(Thông số được tự động cộng dồn từ cấu hình các môn thành phần ở trên)</p>}
        </div>

        {/* SINGLE SUBJECT INPUTS - HIDDEN IN INTEGRATED MODE */}
        {!isIntegrated && (
        <>
            <div className="md:col-span-2 border-t pt-3 mt-2">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-blue-700 uppercase">Cấu hình Đơn môn</p>
                    <p className="text-xs text-gray-500">Đọc tự động từ yêu cầu của tài liệu (NLC, Đ/S, TLN, TL)</p>
                  </div>
                  {hasFiles && onReExtractFromFiles && (
                    <button
                      type="button"
                      onClick={onReExtractFromFiles}
                      disabled={disabled}
                      className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
                      title="Quét lại yêu cầu số câu từ tài liệu đã tải"
                    >
                      <span>🔄</span>
                      <span>Đọc lại từ tài liệu</span>
                    </button>
                  )}
               </div>

               {docExtractedNotice && (
                 <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs mb-3 flex items-start gap-2 animate-in fade-in">
                   <span className="text-emerald-600 font-bold">✓</span>
                   <span className="font-medium">{docExtractedNotice}</span>
                 </div>
               )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700" title="Chọn 1 trong 4 đáp án">
                    Dạng 1: TN Nhiều lựa chọn (NLC)
                </label>
                <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={config.mcCount}
                    onChange={(e) => handleChange('mcCount', parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm font-semibold"
                    disabled={disabled}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700" title="4 ý Đúng/Sai trong 1 câu">
                    Dạng 2: TN Đúng / Sai (Đ/S)
                </label>
                <input 
                    type="number" 
                    min="0" 
                    max="50" 
                    value={config.tfCount}
                    onChange={(e) => handleChange('tfCount', parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm font-semibold"
                    disabled={disabled}
                />
            </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700" title="Học sinh tự điền đáp số">
                    Dạng 3: TN Trả lời ngắn (TLN)
                </label>
                <input 
                    type="number" 
                    min="0" 
                    max="50" 
                    value={config.saCount}
                    onChange={(e) => handleChange('saCount', parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm font-semibold"
                    disabled={disabled}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Số lượng câu Tự luận (TL)
                </label>
                <input 
                    type="number" 
                    min="0" 
                    max="20" 
                    value={config.essayCount}
                    onChange={(e) => handleChange('essayCount', parseInt(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm font-semibold"
                    disabled={disabled}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Điểm Tự luận (TL: 0 - 10)
                </label>
                <input 
                    type="number" 
                    min="0" 
                    max="10"
                    step="0.5"
                    value={config.essayPoints}
                    onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (val > 10) val = 10;
                        if (val < 0) val = 0;
                        handleChange('essayPoints', val);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    disabled={disabled}
                />
            </div>
        </>
        )}
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
      </div>

      {/* Excluded Content / Knowledge box */}
      <div className="mt-4 bg-rose-50/70 p-3.5 rounded-lg border border-rose-200 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <span className="text-base">🚫</span>
            <span>Kiến thức loại trừ</span>
          </label>
          <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
            Không đưa vào đề
          </span>
        </div>
        <p className="text-xs text-rose-800/90 mb-2 leading-relaxed">
          Nhập các dạng bài toán, phần kiến thức mà SGK, tài liệu, đề cương không cho hoặc chưa học để ứng dụng không đưa các dạng toán đó vào đề kiểm tra.
        </p>
        <textarea
          rows={3}
          value={config.excludedTopics || ''}
          onChange={(e) => handleChange('excludedTopics', e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-rose-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm text-gray-800 placeholder-gray-400"
          placeholder="Nhập các dạng bài toán, chuyên đề kiến thức cần loại trừ không đưa vào đề kiểm tra..."
          disabled={disabled}
        ></textarea>
      </div>
    </div>
  );
};

export default ConfigForm;