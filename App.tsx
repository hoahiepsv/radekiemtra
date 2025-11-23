import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ConfigForm from './components/ConfigForm';
import ExamPreview from './components/ExamPreview';
import ApiKeyConfig from './components/ApiKeyConfig';
import { analyzeFiles, generateExamContent } from './services/geminiService';
import { DEFAULT_CONFIG, ICONS, AUTHOR_INFO } from './constants';
import { FileWithData, ExamConfig, GeneratedExam } from './types';

const App: React.FC = () => {
  // State
  const [apiKey, setApiKey] = useState<string>('');
  const [files, setFiles] = useState<FileWithData[]>([]);
  const [config, setConfig] = useState<ExamConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'config' | 'result'>('upload');

  // Load API Key from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Handlers
  const handleFilesSelected = async (newFiles: FileWithData[]) => {
    if (!apiKey) {
      setError("Vui lòng nhập Google API Key trước khi xử lý.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const allFiles = [...files, ...newFiles];
      setFiles(allFiles);
      
      // Analyze first batch of files to auto-fill school/exam name
      if (allFiles.length > 0 && step === 'upload') {
        const info = await analyzeFiles(newFiles, apiKey);
        setConfig(prev => ({
          ...prev,
          schoolName: info.schoolName || prev.schoolName,
          examName: info.examName || prev.examName
        }));
        setStep('config');
      }
    } catch (err) {
      setError("Có lỗi khi đọc file hoặc phân tích. Kiểm tra lại API Key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Vui lòng nhập Google API Key.");
      return;
    }
    if (files.length === 0) {
      setError("Vui lòng tải lên ít nhất một file PDF.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const result = await generateExamContent(files, config, apiKey);
      setGeneratedExam(result);
      setStep('result');
    } catch (err) {
      setError("Không thể tạo đề thi. Vui lòng kiểm tra lại file đầu vào hoặc API Key.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setConfig(DEFAULT_CONFIG);
    setGeneratedExam(null);
    setStep('upload');
    setError(null);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (newFiles.length === 0) setStep('upload');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Error Toast */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm" role="alert">
            <p className="font-bold">Lỗi</p>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* API Key Config */}
            <ApiKeyConfig apiKey={apiKey} onApiKeyChange={setApiKey} />

            {/* File Upload Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
                {ICONS.FileText}
                <span className="ml-2">Tài liệu nguồn</span>
              </h3>
              
              {files.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {files.map((f, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-blue-50 p-2 rounded text-sm text-blue-800">
                      <span className="truncate max-w-[200px]">{f.file.name}</span>
                      <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                        {ICONS.Trash}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
              <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
            </div>

            {/* Configuration Section - Only show if files exist */}
            {files.length > 0 && (
              <ConfigForm 
                config={config} 
                onChange={setConfig} 
                disabled={isProcessing} 
              />
            )}

            {/* Actions */}
            {files.length > 0 && (
              <div className="flex space-x-3">
                 <button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tạo đề...
                    </>
                  ) : (
                    'Tạo Đề Kiểm Tra'
                  )}
                </button>

                <button 
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="bg-gray-200 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-300 transition-colors"
                  title="Làm mới"
                >
                  {ICONS.Refresh}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8">
            {generatedExam ? (
              <ExamPreview exam={generatedExam} />
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-200 text-gray-400">
                 <div className="w-24 h-24 mb-4 text-blue-100">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                 </div>
                 <p className="text-lg">Vui lòng tải tài liệu và nhấn "Tạo Đề Kiểm Tra"</p>
              </div>
            )}
          </div>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
         <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
             <p className="font-semibold text-primary">{AUTHOR_INFO}</p>
             <p>Ứng dụng hỗ trợ giáo viên ra đề nhanh chóng, chính xác.</p>
         </div>
      </footer>
    </div>
  );
};

export default App;