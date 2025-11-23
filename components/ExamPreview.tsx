import React, { useEffect } from 'react';
import { GeneratedExam, QuestionType } from '../types';
import { AUTHOR_INFO, ICONS } from '../constants';

interface ExamPreviewProps {
  exam: GeneratedExam;
}

const ExamPreview: React.FC<ExamPreviewProps> = ({ exam }) => {
  
  // Trigger MathJax re-render when exam changes
  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.typesetPromise && (window as any).MathJax.typesetPromise();
    }
  }, [exam]);

  const handleDownloadWord = () => {
    // Group questions by type for structure following CV 7991
    const part1_type1 = exam.questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
    const part1_type2 = exam.questions.filter(q => q.type === QuestionType.TRUE_FALSE);
    const part1_type3 = exam.questions.filter(q => q.type === QuestionType.SHORT_ANSWER);
    const part2 = exam.questions.filter(q => q.type === QuestionType.ESSAY);

    let htmlBody = '';

    // HEADER - TEACHER STANDARD LAYOUT
    htmlBody += `
      <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <td style="text-align: center; vertical-align: top; width: 40%;">
              <p style="font-weight: bold; margin: 0; font-size: 11pt;">${(exam.schoolName || 'TRƯỜNG THPT...').toUpperCase()}</p>
              <p style="margin: 0;">----------------</p>
            </td>
            <td style="text-align: center; vertical-align: top; width: 60%;">
              <p style="font-weight: bold; margin: 0; font-size: 11pt;">${(exam.examName || 'ĐỀ KIỂM TRA').toUpperCase()}</p>
              <p style="margin: 0; font-size: 10pt; font-style: italic;">(Đề thi có ... trang)</p>
            </td>
          </tr>
      </table>
      
      <div style="text-align: center; margin-top: 15px; margin-bottom: 10px;">
          <p style="font-weight: bold; font-size: 14pt; margin: 0;">ĐỀ KIỂM TRA THEO CÔNG VĂN 7991</p>
          <p style="font-style: italic; margin: 5px 0;">Thời gian làm bài: ${exam.examTime || 45} phút (không kể thời gian phát đề)</p>
      </div>

      <div style="margin: 15px 0; border: 1px solid black; padding: 10px;">
          <p style="margin: 0; font-weight: bold;">Họ và tên học sinh: ............................................................................ Lớp: ....................</p>
      </div>
    `;

    // PART 1: TRẮC NGHIỆM (7.0 điểm)
    if (part1_type1.length > 0 || part1_type2.length > 0 || part1_type3.length > 0) {
        htmlBody += `<div class='part-title'><b>PHẦN I. TRẮC NGHIỆM (7,0 điểm)</b></div>`;
        
        // Type 1: Multiple Choice
        if (part1_type1.length > 0) {
             part1_type1.forEach((q, index) => {
                htmlBody += `<div class='question'><b>Câu ${index + 1}:</b> ${q.content}`;
                if (q.options) {
                    htmlBody += `<div class='options'><table width="100%"><tr>`;
                    q.options.forEach(opt => {
                        htmlBody += `<td width="25%">${opt}</td>`;
                    });
                    htmlBody += `</tr></table></div>`;
                }
                htmlBody += `</div>`;
             });
        }

        // Type 2: True/False
        if (part1_type2.length > 0) {
            htmlBody += `<div class='section-title'><b>Trắc nghiệm đúng sai</b></div>`;
            part1_type2.forEach((q, index) => {
                const qNum = part1_type1.length + index + 1;
                htmlBody += `<div class='question'><b>Câu ${qNum}:</b> ${q.content}`;
                if (q.subQuestions) {
                    htmlBody += `<table class='tf-table' border="1" cellspacing="0" cellpadding="5">
                        <tr>
                            <th width="10%">Ý</th>
                            <th width="70%">Nội dung</th>
                            <th width="10%">Đúng</th>
                            <th width="10%">Sai</th>
                        </tr>`;
                    q.subQuestions.forEach(sq => {
                        htmlBody += `<tr>
                            <td align="center">${sq.id}</td>
                            <td>${sq.content}</td>
                            <td></td>
                            <td></td>
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
                htmlBody += `<div class='question'><b>Câu ${qNum}:</b> ${q.content}<br/>
                <div style="margin-top:5px; border:1px solid #ccc; padding:5px;">Đáp số: ..............................</div></div>`;
            });
        }
    }

    // PART 2: TỰ LUẬN (3.0 điểm)
    if (part2.length > 0) {
        htmlBody += `<div class='part-title' style='margin-top:20px;'><b>PHẦN II. TỰ LUẬN (3,0 điểm)</b></div>`;
        part2.forEach((q, index) => {
            htmlBody += `<div class='question'><b>Câu ${index + 1}:</b> ${q.content}</div>`;
        });
    }

    // FOOTER OF EXAM CONTENT
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
    
    // 1. Answers for Objective Section
    if (part1_type1.length > 0 || part1_type2.length > 0 || part1_type3.length > 0) {
        htmlBody += `<div class='part-title'><b>PHẦN I. TRẮC NGHIỆM</b></div>`;

        // Type 1 Answer
        if (part1_type1.length > 0) {
            htmlBody += `<p><b>Dạng 1: Trắc nghiệm nhiều lựa chọn</b></p>`;
            htmlBody += `<table class="answer-table" border="1" cellspacing="0" cellpadding="5"><tr>`;
            part1_type1.forEach((q, i) => {
                htmlBody += `<td>${i+1}. ${q.correctAnswer}</td>`;
                if ((i+1) % 10 === 0 && (i+1) !== part1_type1.length) htmlBody += `</tr><tr>`;
            });
            htmlBody += `</tr></table><br/>`;
        }

        // Type 2 Answer
        if (part1_type2.length > 0) {
            htmlBody += `<p><b>Dạng 2: Trắc nghiệm đúng sai</b></p>`;
            part1_type2.forEach((q, i) => {
                const qNum = part1_type1.length + i + 1;
                const ansStr = q.subQuestions?.map(sq => `${sq.id}-${sq.answer?'Đ':'S'}`).join(' | ');
                htmlBody += `<p style="margin-left: 20px;"><b>Câu ${qNum}:</b> ${ansStr}</p>`;
            });
        }

        // Type 3 Answer
        if (part1_type3.length > 0) {
            htmlBody += `<p><b>Dạng 3: Trắc nghiệm trả lời ngắn</b></p>`;
            part1_type3.forEach((q, i) => {
                const qNum = part1_type1.length + part1_type2.length + i + 1;
                htmlBody += `<p style="margin-left: 20px;"><b>Câu ${qNum}:</b> ${q.correctAnswer}</p>`;
            });
        }
    }

    // 2. Answers for Essay Section
    if (part2.length > 0) {
         htmlBody += `<div class='part-title' style='margin-top:20px;'><b>PHẦN II. TỰ LUẬN</b></div>`;
         htmlBody += `<table class="essay-table" border="1" cellspacing="0" cellpadding="5">
            <tr><th width="20%">Câu</th><th width="80%">Nội dung / Hướng dẫn chấm</th></tr>
         `;
         part2.forEach((q, i) => {
              const solutionText = q.solution ? q.solution.replace(/\n/g, '<br/>') : 'Chưa có hướng dẫn chấm chi tiết.';
              htmlBody += `
                <tr>
                    <td align="center" valign="top"><b>Câu ${i+1}</b></td>
                    <td valign="top">${solutionText}</td>
                </tr>
              `;
         });
         htmlBody += `</table>`;
    }

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${exam.examName}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.3; }
          .part-title { font-weight: bold; margin-top: 15px; margin-bottom: 10px; font-size: 13pt; }
          .section-title { font-weight: bold; margin-top: 10px; font-style: italic; margin-left: 10px; }
          .question { margin-bottom: 10px; text-align: justify; }
          .options { margin-left: 20px; }
          .tf-table { width: 100%; border: 1px solid black; margin-top: 5px; border-collapse: collapse; }
          .footer { margin-top: 30px; font-size: 10pt; font-style: italic; text-align: right; }
          .answer-title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px; text-transform: uppercase; }
          .answer-table { width: 100%; border-collapse: collapse; }
          .essay-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
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

        {/* Questions Preview Loop */}
        <div className="space-y-6">
            {exam.questions.map((q, idx) => {
                // Note: In real app, calculate offset based on section
                let displayNum = idx + 1; 
                
                return (
                    <div key={idx} className="p-4 bg-slate-50 rounded border border-slate-100 shadow-sm">
                        <div className="font-medium text-gray-900 mb-2">
                            <span className="font-bold text-primary mr-1">
                                {q.type === QuestionType.ESSAY ? 'Câu TL' : 'Câu'} {displayNum}:
                            </span> 
                            <span dangerouslySetInnerHTML={{ __html: q.content }}></span>
                            <span className="text-[10px] text-white bg-blue-400 ml-2 px-2 py-0.5 rounded-full uppercase">{q.type}</span>
                        </div>
                        
                        {/* Multiple Choice */}
                        {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 ml-4 text-sm text-gray-700">
                                {q.options.map((opt, i) => <div key={i} dangerouslySetInnerHTML={{ __html: opt }}></div>)}
                            </div>
                        )}

                        {/* True/False Grid */}
                        {q.type === QuestionType.TRUE_FALSE && q.subQuestions && (
                            <div className="mt-3 ml-4 overflow-x-auto">
                                <table className="min-w-full border border-gray-300 text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border px-2 py-1 w-10">Ý</th>
                                            <th className="border px-2 py-1 text-left">Nội dung</th>
                                            <th className="border px-2 py-1 w-16 text-center">Đúng</th>
                                            <th className="border px-2 py-1 w-16 text-center">Sai</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {q.subQuestions.map((sq) => (
                                            <tr key={sq.id}>
                                                <td className="border px-2 py-1 text-center font-bold">{sq.id}</td>
                                                <td className="border px-2 py-1" dangerouslySetInnerHTML={{ __html: sq.content }}></td>
                                                <td className="border px-2 py-1 text-center"><input type="checkbox" disabled /></td>
                                                <td className="border px-2 py-1 text-center"><input type="checkbox" disabled /></td>
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

                        {/* Solution toggle for checking */}
                        <details className="mt-2 text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-blue-600">Xem đáp án</summary>
                            <div className="mt-1 p-2 bg-yellow-50 border border-yellow-100 rounded text-gray-800 whitespace-pre-wrap">
                                {q.type === QuestionType.MULTIPLE_CHOICE && <b>ĐA: {q.correctAnswer}</b>}
                                {q.type === QuestionType.TRUE_FALSE && (
                                    <div>{q.subQuestions?.map(sq => <span key={sq.id} className="mr-3">{sq.id}: <b>{sq.answer ? 'Đúng' : 'Sai'}</b></span>)}</div>
                                )}
                                {q.type === QuestionType.SHORT_ANSWER && <b>ĐA: {q.correctAnswer}</b>}
                                {(q.solution) && <div className="mt-1 italic">{q.solution}</div>}
                            </div>
                        </details>
                    </div>
                );
            })}
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-4 border-t text-xs text-gray-400 italic text-right">
          {AUTHOR_INFO}
        </div>
      </div>
    </div>
  );
};

export default ExamPreview;