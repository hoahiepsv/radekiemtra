import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ConfigForm from './components/ConfigForm';
import ExamPreview from './components/ExamPreview';
import ApiKeyConfig from './components/ApiKeyConfig';
import AppLogo from './components/AppLogo';
import { analyzeFiles, generateExamContent } from './services/geminiService';
import { DEFAULT_CONFIG, ICONS, AUTHOR_INFO } from './constants';
import { FileWithData, ExamConfig, GeneratedExam, Question } from './types';

const App: React.FC = () => {
  // State
  const [apiKey, setApiKey] = useState<string>('');
  const [files, setFiles] = useState<FileWithData[]>([]);
  const [config, setConfig] = useState<ExamConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docExtractedNotice, setDocExtractedNotice] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'upload'>('config');

  // Load API Key from local storage on mount (optional)
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Handlers - Automatically read Single-Subject requirements from uploaded documents
  const handleFilesSelected = async (newFiles: FileWithData[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const allFiles = [...files, ...newFiles];
      setFiles(allFiles);
      
      // Analyze files to auto-fill single subject counts, school, exam name, time, etc.
      const info = await analyzeFiles(allFiles, apiKey);
      
      let newSubjectType: 'single' | 'integrated' = info.subjectType || config.subjectType;
      let newSubjects = config.subjects;

      if (info.detectedSubjects && info.detectedSubjects.length > 1) {
        newSubjectType = 'integrated';
        newSubjects = info.detectedSubjects.map(name => ({
          name,
          score: Math.round(10 / (info.detectedSubjects?.length || 1)),
          mcCount: 4,
          tfCount: 1,
          saCount: 2,
          essayCount: 0,
          essayPoints: 0
        }));
      } else {
        newSubjectType = 'single';
      }

      setConfig(prev => ({
        ...prev,
        schoolName: info.schoolName || prev.schoolName,
        examName: info.examName || prev.examName,
        subjectType: newSubjectType,
        subjects: newSubjects,
        mcCount: info.mcCount !== undefined ? info.mcCount : prev.mcCount,
        tfCount: info.tfCount !== undefined ? info.tfCount : prev.tfCount,
        saCount: info.saCount !== undefined ? info.saCount : prev.saCount,
        essayCount: info.essayCount !== undefined ? info.essayCount : prev.essayCount,
        essayPoints: info.essayPoints !== undefined ? info.essayPoints : prev.essayPoints,
        examTime: info.examTime !== undefined ? info.examTime : prev.examTime,
        difficulty: info.difficulty || prev.difficulty,
        matrixNotes: info.matrixNotes || prev.matrixNotes,
        excludedTopics: info.excludedTopics || prev.excludedTopics
      }));

      const notice = info.summary || `Đã đọc từ tài liệu: NLC: ${info.mcCount ?? 12} câu, Đ/S: ${info.tfCount ?? 4} câu, TLN: ${info.saCount ?? 6} câu${(info.essayCount || 0) > 0 ? `, TL: ${info.essayCount} câu (${info.essayPoints}đ)` : ''} | Thời gian: ${info.examTime ?? 45} phút`;
      setDocExtractedNotice(notice);
      setActiveTab('config');
    } catch (err) {
      console.warn("Lỗi đọc file:", err);
      setError("Không thể phân tích file đã tải. Vui lòng kiểm tra lại file PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReExtractFromFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const info = await analyzeFiles(files, apiKey);
      setConfig(prev => ({
        ...prev,
        schoolName: info.schoolName || prev.schoolName,
        examName: info.examName || prev.examName,
        mcCount: info.mcCount !== undefined ? info.mcCount : prev.mcCount,
        tfCount: info.tfCount !== undefined ? info.tfCount : prev.tfCount,
        saCount: info.saCount !== undefined ? info.saCount : prev.saCount,
        essayCount: info.essayCount !== undefined ? info.essayCount : prev.essayCount,
        essayPoints: info.essayPoints !== undefined ? info.essayPoints : prev.essayPoints,
        examTime: info.examTime !== undefined ? info.examTime : prev.examTime,
        difficulty: info.difficulty || prev.difficulty,
        matrixNotes: info.matrixNotes || prev.matrixNotes,
        excludedTopics: info.excludedTopics || prev.excludedTopics
      }));
      setDocExtractedNotice(info.summary || `Đã đồng bộ lại từ tài liệu: NLC: ${info.mcCount ?? 12} câu, Đ/S: ${info.tfCount ?? 4} câu, TLN: ${info.saCount ?? 6} câu`);
    } catch (err) {
      console.warn("Lỗi đọc lại file:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await generateExamContent(files, config, apiKey);
      setGeneratedExam(result);
    } catch (err) {
      console.error("Lỗi tạo đề:", err);
      setError("Có lỗi trong quá trình tạo đề thi. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestionUpdate = (index: number, newQuestion: Question) => {
    if (!generatedExam) return;
    const newQuestions = [...generatedExam.questions];
    newQuestions[index] = newQuestion;
    setGeneratedExam({
      ...generatedExam,
      questions: newQuestions
    });
  };

  const handleReset = () => {
    setFiles([]);
    setConfig(DEFAULT_CONFIG);
    setGeneratedExam(null);
    setError(null);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/80 text-slate-900">
      <Header 
        hasCustomKey={Boolean(apiKey)} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
      />

      {/* Optional Settings Dialog */}
      <ApiKeyConfig 
        apiKey={apiKey} 
        onApiKeyChange={setApiKey} 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <main className="flex-grow container mx-auto px-4 py-6 max-w-7xl">
        {/* Banner with Info and Ready Status */}
        <div className="mb-6 bg-gradient-to-r from-blue-900 via-indigo-850 to-blue-950 rounded-2xl p-5 md:p-6 text-white shadow-lg border border-blue-800/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-4">
            <AppLogo size="xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Chế độ: Sẵn sàng
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                HỆ THỐNG SOẠN ĐỀ THEO CÔNG VĂN 7991/BGDĐT-GDTrH
              </h2>
              <p className="text-xs md:text-sm text-blue-200/90 mt-1 max-w-2xl">
                Tự động thiết lập cấu trúc ma trận đặc tả chuẩn Bộ Giáo dục. Hỗ trợ công thức LaTeX và xuất file Word.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang tạo đề...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Tạo Đề Ngay (CV 7991)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-sm flex items-center justify-between" role="alert">
            <div>
              <p className="font-bold text-sm">Thông báo</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-sm font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Controls (Tabs for Config / Upload) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Tab switch */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
              <button
                onClick={() => setActiveTab('config')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'config' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                <span>⚙️ Cấu hình ma trận</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 relative ${
                  activeTab === 'upload' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                <span>📁 Tải tài liệu nguồn</span>
                {files.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
                    {files.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB CONTENT: UPLOAD */}
            {activeTab === 'upload' && (
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-base font-bold text-primary flex items-center gap-2">
                    {ICONS.FileText}
                    <span>Tài liệu nguồn (Tuỳ chọn)</span>
                  </h3>
                  <span className="text-[11px] text-gray-400">PDF Ma trận / Ngân hàng đề</span>
                </div>

                <p className="text-xs text-gray-600">
                  Bạn có thể tải lên các file PDF ma trận đề hoặc đề cương để hệ thống tự động bám sát kiến thức. Nếu không có file, hệ thống vẫn tạo đề chuẩn 100% theo chương trình GDPT 2018.
                </p>

                {files.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-gray-700">Các file đã tải ({files.length}):</span>
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                      {files.map((f, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-blue-50/80 p-2.5 rounded-lg text-xs text-blue-900 border border-blue-100">
                          <span className="truncate max-w-[240px] font-medium">{f.file.name}</span>
                          <button 
                            onClick={() => removeFile(idx)} 
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            title="Xoá file"
                          >
                            {ICONS.Trash}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
              </div>
            )}

            {/* TAB CONTENT: CONFIG FORM */}
            <div className={activeTab === 'config' ? 'block' : 'hidden'}>
              <ConfigForm 
                config={config} 
                onChange={setConfig} 
                disabled={isProcessing} 
                hasFiles={files.length > 0}
                onReExtractFromFiles={handleReExtractFromFiles}
                docExtractedNotice={docExtractedNotice}
              />
            </div>

            {/* Action Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-2.5">
              <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-primary hover:bg-blue-800 active:bg-blue-900 focus:outline-none transition-all cursor-pointer ${
                  isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo đề kiểm tra...
                  </>
                ) : (
                  'Tạo Đề Kiểm Tra (CV 7991)'
                )}
              </button>

              <button 
                onClick={handleReset}
                disabled={isProcessing}
                className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                title="Làm mới cấu hình"
              >
                {ICONS.Refresh}
              </button>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-7">
            {generatedExam ? (
              <ExamPreview 
                exam={generatedExam} 
                onQuestionUpdate={handleQuestionUpdate}
                apiKey={apiKey}
              />
            ) : (
              <div className="min-h-[560px] flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 p-8 text-center">
                <div className="mb-4">
                  <AppLogo size="lg" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Chưa có đề thi được hiển thị
                </h3>
                <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                  Vui lòng tải lên tài liệu ma trận đề (PDF) hoặc thiết lập cấu hình mong muốn rồi nhấn <span className="font-semibold text-primary">"Tạo Đề Kiểm Tra (CV 7991)"</span>.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <div>
              <p className="font-bold text-primary">ỨNG DỤNG RA ĐỀ KIỂM TRA THEO CÔNG VĂN 7991</p>
              <p className="text-[11px] text-gray-400">Chuẩn cấu trúc định dạng GDPT 2018 Bộ Giáo dục & Đào tạo</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-700">{AUTHOR_INFO}</p>
            <p className="text-[11px] text-gray-400">Tự động hóa - Chuẩn sư phạm - Xuất Word MathType</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
