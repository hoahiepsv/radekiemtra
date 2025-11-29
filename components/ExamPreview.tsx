import React, { useEffect } from 'react';
import { GeneratedExam, QuestionType } from '../types';
import { AUTHOR_INFO, ICONS } from '../constants';

interface ExamPreviewProps {
  exam: GeneratedExam;
  onQuestionUpdate?: (index: number, q: any) => void;
  apiKey?: string;
}

const ExamPreview: React.FC<ExamPreviewProps> = ({ exam }) => {
  
  // Trigger MathJax re-render when exam changes
  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.typesetPromise && (window as any).MathJax.typesetPromise();
    }
  }, [exam]);

  // Helper to remove "Câu X" prefix if AI included it in the content
  const cleanContent = (content: string) => {
    if (!content) return '';
    return content.replace(/^Câu\s+\d+[:.]?\s*/i, '');
  };

  // Helper to format LaTeX for Word (Ensure it uses $ delimiters for MathType)
  const formatLatexForWord = (text: string) => {
    if (!text) return '';
    
    // 1. Replace \( and \) with $
    let formatted = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    
    // 2. Replace \[ and \] with $$ (for block math, though $ is usually enough for inline)
    formatted = formatted.replace(/\\\[/g, '$$$').replace(/\\\]/g, '$$$');
    
    // 3. Simple heuristic: If we see common latex commands NOT inside $, wrap them?
    // Note: This is risky without complex parsing. We rely on the Prompt enforcement first.
    // However, we can fix double backslashes which sometimes appear in raw string literals
    // formatted = formatted.replace(/\\\\/g, '\\'); // Be careful with this, depends on context
    
    return formatted;
  };

  const handleDownloadWord = () => {
    if (!exam.questions || !Array.isArray(exam.questions)) {
       alert("Dữ liệu câu hỏi không hợp lệ để xuất file.");
       return;
    }

    // Filter questions by normalized types
    const part1_type1 = exam.questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
    const part1_type2 = exam.questions.filter(q => q.type === QuestionType.TRUE_FALSE);
    const part1_type3 = exam.questions.filter(q => q.type === QuestionType.SHORT_ANSWER);
    const part2 = exam.questions.filter(q => q.type === QuestionType.ESSAY);

    // Calculate Points for Display
    const essayPointsVal = exam.essayPoints !== undefined ? exam.essayPoints : 3.0;
    const objectivePointsVal = 10 - essayPointsVal;
    
    // Format to Vietnamese string (e.g. 3.0 -> 3,0)
    const essayPointsStr = essayPointsVal.toFixed(2).replace('.', ',').replace(',00', '');
    const objectivePointsStr = objectivePointsVal.toFixed(2).replace('.', ',').replace(',00', '');

    let htmlBody = '';

    // HEADER - MODIFIED TEACHER STANDARD LAYOUT
    htmlBody += `
      <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="text-align: center; vertical-align: top; width: 40%;">
              <p style="font-size: 13pt; margin: 0; text-transform: uppercase;">SỞ GD&ĐT ........................</p>
              <p style="font-weight: bold; margin: 0; font-size: 13pt; text-transform: uppercase;">${(exam.schoolName || 'TRƯỜNG THPT...').toUpperCase()}</p>
              <p style="margin: 0;">----------------</p>
            </td>
            <td style="text-align: center; vertical-align: top; width: 60%;">
              <p style="font-weight: bold; margin: 0; font-size: 13pt; text-transform: uppercase;">${(exam.examName || 'ĐỀ KIỂM TRA')}</p>
              <p style="margin: 5px 0 0 0; font-style: italic; font-size: 13pt;">Thời gian làm bài: ${exam.examTime || 45} phút</p>
              <p style="margin: 0; font-size: 13pt; font-style: italic;">(không kể thời gian phát đề)</p>
            </td>
          </tr>
      </table>

      <div style="margin: 10px 0; border: 1px solid black; padding: 5px 10px;">
          <p style="margin: 0; font-weight: bold; font-size: 13pt;">Họ và tên học sinh: ............................................................................ Lớp: ....................</p>
      </div>
    `;

    // PART 1: TRẮC NGHIỆM
    if (part1_type1.length > 0 || part1_type2.length > 0 || part1_type3.length > 0) {
        htmlBody += `<div class='part-title'><b>PHẦN I. TRẮC NGHIỆM (${objectivePointsStr} điểm)</b></div>`;
        
        // Type 1: Multiple Choice
        if (part1_type1.length > 0) {
             part1_type1.forEach((q, index) => {
                htmlBody += `<div class='question' style='margin-bottom: 5px;'><b>Câu ${index + 1}:</b> ${formatLatexForWord(cleanContent(q.content))}</div>`;
                if (q.options && q.options.length > 0) {
                    htmlBody += `<table style="width: 100%; margin-bottom: 10px; border: none;"><tr>`;
                    q.options.forEach(opt => {
                        htmlBody += `<td style="width: 25%; vertical-align: top;">${formatLatexForWord(opt)}</td>`;
                    });
                    htmlBody += `</tr></table>`;
                } else {
                   htmlBody += `<div style="margin-bottom: 10px;">(Lỗi: Không tìm thấy các lựa chọn đáp án)</div>`;
                }
             });
        }

        // Type 2: True/False
        if (part1_type2.length > 0) {
            htmlBody += `<div class='section-title'><b>Trắc nghiệm đúng sai</b></div>`;
            part1_type2.forEach((q, index) => {
                const qNum = part1_type1.length + index + 1;
                htmlBody += `<div class='question' style="margin-bottom: 10px;"><b>Câu ${qNum}:</b> ${formatLatexForWord(cleanContent(q.content))}`;
                if (q.subQuestions && q.subQuestions.length > 0) {
                    htmlBody += `<br/><table class='tf-table' style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-top: 5px;">
                        <tr>
                            <th style="border: 1px solid black; padding: 5px; width: 10%; text-align: center;">Ý</th>
                            <th style="border: 1px solid black; padding: 5px; width: 70%; text-align: left;">Nội dung</th>
                            <th style="border: 1px solid black; padding: 5px; width: 10%; text-align: center;">Đúng</th>
                            <th style="border: 1px solid black; padding: 5px; width: 10%; text-align: center;">Sai</th>
                        </tr>`;
                    q.subQuestions.forEach(sq => {
                        htmlBody += `<tr>
                            <td style="border: 1px solid black; padding: 5px; text-align: center;">${sq.id}</td>
                            <td style="border: 1px solid black; padding: 5px; text-align: left;">${formatLatexForWord(sq.content)}</td>
                            <td style="border: 1px solid black; padding: 5px;"></td>
                            <td style="border: 1px solid black; padding: 5px;"></td>
                        </tr>`;
                    });
                    htmlBody += `</table>`;
                }
                htmlBody += `</div>`;
            });
        }

        // Type 3: Short Answer
        if (part1_type3.length > 0) {
            htmlBody += `<div class='section-title'><b>Trắc nghiệm trả lời ngắn</b></div>`;
            part1_type3.forEach((q, index) => {
                const qNum = part1_type1.length + part1_type2.length + index + 1;
                htmlBody += `<div class='question'><b>Câu ${qNum}:</b> ${formatLatexForWord(cleanContent(q.content))}<br/>
                <div style="margin-top:5px; border:1px solid #ccc; padding:5px;">Đáp số: ..............................</div></div>`;
            });
        }
    }

    // PART 2: TỰ LUẬN
    if (part2.length > 0) {
        htmlBody += `<div class='part-title' style='margin-top:20px;'><b>PHẦN II. TỰ LUẬN (${essayPointsStr} điểm)</b></div>`;
        part2.forEach((q, index) => {
            let essayContent = formatLatexForWord(cleanContent(q.content));
            essayContent = essayContent.replace(/([a-d]\))/g, '<br/>$1');
            htmlBody += `<div class='essay-question'><b>Câu ${index + 1}:</b> ${essayContent}</div>`;
        });
    }

    // FOOTER
    htmlBody += `
        <div class="footer">Đề thi được tạo bởi phần mềm của ${AUTHOR_INFO}</div>
        <br clear=all style='mso-special-character:line-break;page-break-before:always'>
    `;

    // --- ANSWER KEY PAGE ---
    htmlBody += `
        <div class="answer-title">ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM</div>
        <div style="text-align: center; margin-bottom: 20px;">
           <p>-----------------------------------</p>
        </div>
    `;
    
    // Answers
    if (part1_type1.length > 0 || part1_type2.length > 0 || part1_type3.length > 0) {
        htmlBody += `<div class='part-title'><b>PHẦN I. TRẮC NGHIỆM</b></div>`;

        if (part1_type1.length > 0) {
            htmlBody += `<p><b>Dạng 1: Trắc nghiệm nhiều lựa chọn</b></p>`;
            htmlBody += `<table class="answer-table" border="1" cellspacing="0" cellpadding="5"><tr>`;
            part1_type1.forEach((q, i) => {
                htmlBody += `<td>${i+1}. ${formatLatexForWord(q.correctAnswer || '')}</td>`;
                if ((i+1) % 10 === 0 && (i+1) !== part1_type1.length) htmlBody += `</tr><tr>`;
            });
            htmlBody += `</tr></table><br/>`;
        }

        if (part1_type2.length > 0) {
            htmlBody += `<p><b>Dạng 2: Trắc nghiệm đúng sai</b></p>`;
            part1_type2.forEach((q, i) => {
                const qNum = part1_type1.length + i + 1;
                const ansStr = q.subQuestions?.map(sq => `${sq.id}-${sq.answer?'Đ':'S'}`).join(' | ') || 'Đang cập nhật';
                htmlBody += `<p style="margin-left: 20px;"><b>Câu ${qNum}:</b> ${ansStr}</p>`;
            });
        }

        if (part1_type3.length > 0) {
            htmlBody += `<p><b>Dạng 3: Trắc nghiệm trả lời ngắn</b></p>`;
            part1_type3.forEach((q, i) => {
                const qNum = part1_type1.length + part1_type2.length + i + 1;
                htmlBody += `<p style="margin-left: 20px;"><b>Câu ${qNum}:</b> ${formatLatexForWord(q.correctAnswer || '')}</p>`;
            });
        }
    }

    if (part2.length > 0) {
         htmlBody += `<div class='part-title' style='margin-top:20px;'><b>PHẦN II. TỰ LUẬN</b></div>`;
         htmlBody += `<table class="essay-table" border="1" cellspacing="0" cellpadding="5">
            <tr><th width="20%">Câu</th><th width="80%">Nội dung / Hướng dẫn chấm</th></tr>
         `;
         part2.forEach((q, i) => {
              const solutionText = q.solution ? formatLatexForWord(q.solution).replace(/\n/g, '<br/>') : 'Chưa có hướng dẫn chấm chi tiết.';
              htmlBody += `
                <tr>
                    <td align="center" valign="top"><b>Câu ${i+1}</b></td>
                    <td valign="top" style="text-align: left;">${solutionText}</td>
                </tr>
              `;
         });
         htmlBody += `</table>`;
    }

    // MATRIX
    if (exam.matrixHtml) {
        htmlBody += `
            <br clear=all style='mso-special-character:line-break;page-break-before:always'>
            <div class="answer-title">MA TRẬN / ĐẶC TẢ ĐỀ THI</div>
            <div style="margin-top: 20px;">
                ${exam.matrixHtml}
            </div>
            <p style="margin-top:20px; font-style: italic;">Ma trận được xây dựng dựa trên cấu trúc đề thi đã tạo.</p>
        `;
    }

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${exam.examName}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.3; }
          p, div, table, td, th, span { font-family: 'Times New Roman', serif; font-size: 13pt; }
          .part-title { font-weight: bold; margin-top: 15px; margin-bottom: 10px; font-size: 13pt; }
          .section-title { font-weight: bold; margin-top: 10px; font-style: italic; margin-left: 10px; }
          .question { margin-bottom: 10px; text-align: justify; }
          .essay-question { margin-bottom: 10px; text-align: left; }
          .tf-table { width: 100%; border: 1px solid black; margin-top: 5px; border-collapse: collapse; }
          .footer { margin-top: 30px; font-size: 11pt; font-style: italic; text-align: right; }
          .answer-title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px; text-transform: uppercase; }
          .answer-table { width: 100%; border-collapse: collapse; }
          .essay-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          table td, table th { padding: 5px; }
        </style>
      </head>
      <body>${htmlBody}</body></html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${exam.examName || 'De_Kiem_Tra_CV7991'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER LOGIC for PREVIEW ---
  
  // Split questions for Web View
  const objectiveQuestions = exam.questions.filter(q => q.type !== QuestionType.ESSAY);
  const essayQuestions = exam.questions.filter(q => q.type === QuestionType.ESSAY);

  // Calculate scores for preview header
  const essayPointsVal = exam.essayPoints !== undefined ? exam.essayPoints : 3.0;
  const objectivePointsVal = 10 - essayPointsVal;

  const renderQuestion = (q: any, idx: number, isEssay: boolean) => {
      const displayContent = cleanContent(q.content);
      
      return (
        <div key={q.id || idx} className="p-4 bg-slate-50 rounded border border-slate-100 shadow-sm mb-4">
            <div className="font-medium text-gray-900 mb-2">
                <span className="font-bold text-primary mr-1">
                    Câu {idx}:
                </span> 
                <span dangerouslySetInnerHTML={{ __html: displayContent }}></span>
                <span className="text-[10px] text-white bg-blue-400 ml-2 px-2 py-0.5 rounded-full uppercase">{q.type}</span>
            </div>
            
            {/* Multiple Choice */}
            {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 ml-4 text-sm text-gray-700">
                    {q.options.map((opt: string, i: number) => <div key={i} dangerouslySetInnerHTML={{ __html: opt }}></div>)}
                </div>
            )}

            {/* True/False Grid - UPDATED FOR BETTER VISIBILITY */}
            {q.type === QuestionType.TRUE_FALSE && q.subQuestions && (
                <div className="mt-3 ml-0 md:ml-4 overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 px-3 py-2 w-12 text-center font-semibold text-gray-700">Ý</th>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Nội dung</th>
                                <th className="border border-gray-300 px-2 py-2 w-16 text-center font-semibold text-gray-700">Đúng</th>
                                <th className="border border-gray-300 px-2 py-2 w-16 text-center font-semibold text-gray-700">Sai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {q.subQuestions.map((sq: any) => (
                                <tr key={sq.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800 align-top">
                                        {sq.id}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-gray-800 align-top whitespace-normal">
                                        {/* Ensure content wraps and MathJax renders correctly */}
                                        <div dangerouslySetInnerHTML={{ __html: sq.content }}></div>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 text-center align-top">
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto"></div>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 text-center align-top">
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Short Answer */}
            {q.type === QuestionType.SHORT_ANSWER && (
                <div className="mt-2 ml-4 p-3 bg-white border border-dashed border-gray-300 text-gray-500 text-sm rounded flex items-center">
                    <span>Đáp số:</span>
                    <span className="flex-grow border-b border-dotted border-gray-400 mx-2"></span>
                </div>
            )}

            {/* Solution toggle */}
            <details className="mt-2 text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-blue-600">Xem đáp án</summary>
                <div className="mt-1 p-2 bg-yellow-50 border border-yellow-100 rounded text-gray-800 whitespace-pre-wrap">
                    {q.type === QuestionType.MULTIPLE_CHOICE && <b>ĐA: {q.correctAnswer}</b>}
                    {q.type === QuestionType.TRUE_FALSE && (
                        <div>{q.subQuestions?.map((sq: any) => <span key={sq.id} className="mr-3">{sq.id}: <b>{sq.answer ? 'Đúng' : 'Sai'}</b></span>)}</div>
                    )}
                    {q.type === QuestionType.SHORT_ANSWER && <b>ĐA: {q.correctAnswer}</b>}
                    {(q.solution) && <div className="mt-1 italic">{q.solution}</div>}
                </div>
            </details>
        </div>
      );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">Xem trước Đề thi (CV 7991)</h2>
        <button
          onClick={handleDownloadWord}
          className="flex items-center space-x-2 bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded transition-colors shadow-md"
        >
          {ICONS.Download}
          <span>Tải file Word</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6" id="exam-content">
        {/* Header Preview */}
        <div className="flex justify-between font-bold text-sm uppercase mb-6 border-b-2 border-double pb-2">
          <div className="w-1/2">{exam.schoolName}</div>
          <div className="w-1/2 text-right">{exam.examName}</div>
        </div>
        
        <div className="text-center font-bold text-lg mb-4 text-primary">
             ĐỀ KIỂM TRA THEO CÔNG VĂN 7991
             <div className="text-sm font-normal text-gray-600 italic mt-1">
                 Thời gian: {exam.examTime || 45} phút
             </div>
        </div>

        {/* QUESTIONS CONTAINER */}
        <div className="space-y-6">
            
            {/* PART 1: OBJECTIVE */}
            {objectiveQuestions.length > 0 && (
                <div>
                   <div className="bg-blue-50 p-2 rounded text-blue-800 font-bold uppercase text-sm mb-4 border-l-4 border-blue-600">
                      Phần I: Trắc nghiệm ({objectivePointsVal.toFixed(2)} điểm)
                   </div>
                   {objectiveQuestions.map((q, idx) => renderQuestion(q, idx + 1, false))}
                </div>
            )}

            {/* PART 2: ESSAY */}
            {essayQuestions.length > 0 && (
                <div>
                   <div className="bg-blue-50 p-2 rounded text-blue-800 font-bold uppercase text-sm mb-4 border-l-4 border-blue-600">
                      Phần II: Tự luận ({essayPointsVal.toFixed(2)} điểm)
                   </div>
                   {essayQuestions.map((q, idx) => renderQuestion(q, idx + 1, true))}
                </div>
            )}

        </div>
        
        {/* Matrix Preview */}
        {exam.matrixHtml && (
             <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-bold text-gray-700 mb-2 uppercase text-sm">Ma trận đề thi</h3>
                <div className="prose prose-sm max-w-none p-4 bg-gray-50 border rounded" dangerouslySetInnerHTML={{__html: exam.matrixHtml}}></div>
             </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 pt-4 border-t text-xs text-gray-400 italic text-right">
          {AUTHOR_INFO}
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;