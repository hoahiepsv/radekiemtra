import React, { useEffect, useMemo } from 'react';
import { GeneratedExam, QuestionType } from '../types';
import { AUTHOR_INFO, ICONS } from '../constants';
import { mergeChainedQuestions, stripChainedHypothesis } from '../services/questionChaining';

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

  // Normalize and merge any chained questions "(Tiếp tục giả thiết Câu 16a)" into sub-questions (a, b, c, d)
  const normalizedQuestions = useMemo(() => {
    return mergeChainedQuestions(exam.questions || []);
  }, [exam.questions]);

  // Helper to remove any [NLC], [TLN], [Đ/S], [TL], (TL] tags, chained hypothesis labels, and literal \n from text
  const stripExamTags = (text: string): string => {
    if (!text) return '';
    let cleaned = stripChainedHypothesis(text);
    return cleaned
      .replace(/\\r\\n|\\n/g, '<br/>')
      .replace(/[\[\(]\s*(?:NLC|TLN|Đ\/S|Đ-S|TL|TN)\s*[\]\)]\s*[:.]?\s*/gi, '')
      .replace(/[\[\(]\s*TL\s*[\]\)]\s*[:.]?\s*/gi, '')
      .replace(/\[\s*(?:NLC|TLN|Đ\/S|Đ-S|TL|TN)\s*\]/gi, '')
      .replace(/\(\s*(?:NLC|TLN|Đ\/S|Đ-S|TL|TN)\s*\)/gi, '')
      .replace(/^\s*(?:t)?oán\s*[:.]?\s*/gi, '')
      .replace(/^[\s,;:\-\.]+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // Helper to remove "Câu X" prefix, "Bài toán:" prefix, and all question type tags
  const cleanContent = (content: string) => {
    if (!content) return '';
    let text = content
      .replace(/^Câu\s+\d+[a-z]?[:.]?\s*/i, '')
      .replace(/^Bài\s+(?:toán\s*\d*|\d+)[:.]?\s*/i, '')
      .replace(/^\s*(?:t)?oán\s*[:.]?\s*/gi, '');
    text = stripExamTags(text);
    return text.trim();
  };

  // Helper to format LaTeX for Word (Ensure it uses $ delimiters for MathType)
  const formatLatexForWord = (text: string) => {
    if (!text) return '';
    const cleaned = stripExamTags(text);
    // 1. Replace \( and \) with $
    let formatted = cleaned.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    
    // 2. Replace \[ and \] with $$ (for block math)
    formatted = formatted.replace(/\\\[/g, '$$$').replace(/\\\]/g, '$$$');
    
    // 3. Ensure line breaks are formatted as <br/> for Word HTML
    formatted = formatted.replace(/\r\n|\n/g, '<br/>').replace(/\\n/g, '<br/>');

    return formatted;
  };

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadWord = () => {
    if (!exam.questions || !Array.isArray(exam.questions)) {
       showToast("Dữ liệu câu hỏi chưa sẵn sàng để xuất file.");
       return;
    }

    // Filter questions by normalized types (with chained hypothesis questions merged into a, b, c, d)
    const part1_type1 = normalizedQuestions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
    const part1_type2 = normalizedQuestions.filter(q => q.type === QuestionType.TRUE_FALSE);
    const part1_type3 = normalizedQuestions.filter(q => q.type === QuestionType.SHORT_ANSWER);
    const part2 = normalizedQuestions.filter(q => q.type === QuestionType.ESSAY);

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

    // Helper to format score label (e.g. 0.25 -> " (0,25đ)", 1 -> " (1đ)")
    const getScoreLabel = (q: any, defaultScore?: number): string => {
      const scoreVal = typeof q.score === 'number' && q.score > 0 ? q.score : (defaultScore || 0);
      if (!scoreVal || scoreVal <= 0) return '';
      const str = scoreVal % 1 === 0 ? scoreVal.toString() : scoreVal.toFixed(2).replace('.', ',').replace(/0+$/, '').replace(/,$/, '');
      return ` (${str}đ)`;
    };

    // Calculate default unit scores if not explicitly provided
    const mcDefaultScore = part1_type1.length > 0 ? Math.round(((objectivePointsVal - (part1_type2.length * 1.0) - (part1_type3.length * 0.5)) / Math.max(1, part1_type1.length)) * 100) / 100 : 0.25;
    const finalMcScore = mcDefaultScore > 0 ? mcDefaultScore : 0.25;
    const finalTfScore = 1.0;
    const finalSaScore = part1_type3.length > 0 ? 0.5 : 0;
    const finalEssayScore = part2.length > 0 ? Math.round((essayPointsVal / part2.length) * 100) / 100 : 1.5;

    // PART 1: TRẮC NGHIỆM
    if (part1_type1.length > 0 || part1_type2.length > 0 || part1_type3.length > 0) {
        htmlBody += `<div class='part-title'><b>PHẦN I. TRẮC NGHIỆM KHÁCH QUAN (${objectivePointsStr} điểm)</b></div>`;
        
        // Type 1: Multiple Choice
        if (part1_type1.length > 0) {
             htmlBody += `<div class='section-title'><b>Dạng 1. Trắc nghiệm nhiều lựa chọn</b></div>`;
             part1_type1.forEach((q, index) => {
                const scoreLabel = getScoreLabel(q, finalMcScore);
                htmlBody += `<div class='question' style='margin-bottom: 5px;'><b>Câu ${index + 1}${scoreLabel}:</b> ${formatLatexForWord(cleanContent(q.content))}</div>`;
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
            htmlBody += `<div class='section-title' style='margin-top: 15px;'><b>Dạng 2. Trắc nghiệm đúng sai</b></div>`;
            part1_type2.forEach((q, index) => {
                const qNum = part1_type1.length + index + 1;
                const scoreLabel = getScoreLabel(q, finalTfScore);
                htmlBody += `<div class='question' style="margin-bottom: 10px;"><b>Câu ${qNum}${scoreLabel}:</b> ${formatLatexForWord(cleanContent(q.content))}`;
                if (q.subQuestions && q.subQuestions.length > 0) {
                    htmlBody += `<br/><table class='tf-table' style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-top: 5px;">
                        <tr>
                            <th style="border: 1px solid black; padding: 5px; width: 10%; text-align: center;">Lệnh</th>
                            <th style="border: 1px solid black; padding: 5px; width: 70%; text-align: left;">Nội dung mệnh đề</th>
                            <th style="border: 1px solid black; padding: 5px; width: 10%; text-align: center;">Đúng</th>
                            <th style="border: 1px solid black; padding: 5px; width: 10%; text-align: center;">Sai</th>
                        </tr>`;
                    q.subQuestions.forEach(sq => {
                        htmlBody += `<tr>
                            <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">${sq.id})</td>
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
            htmlBody += `<div class='section-title' style='margin-top: 15px;'><b>Dạng 3. Trắc nghiệm trả lời ngắn</b></div>`;
            part1_type3.forEach((q, index) => {
                const qNum = part1_type1.length + part1_type2.length + index + 1;
                const scoreLabel = getScoreLabel(q, finalSaScore);
                htmlBody += `<div class='question'><b>Câu ${qNum}${scoreLabel}:</b> ${formatLatexForWord(cleanContent(q.content))}<br/>
                <div style="margin-top:5px; border:1px solid #ccc; padding:5px; width: 60%;">Đáp số: ............................................................</div></div>`;
            });
        }
    }

    // PART 2: TỰ LUẬN
    if (part2.length > 0) {
        htmlBody += `<div class='part-title' style='margin-top:20px;'><b>PHẦN II. TỰ LUẬN (${essayPointsStr} điểm)</b></div>`;
        part2.forEach((q, index) => {
            const scoreLabel = getScoreLabel(q, finalEssayScore);
            let essayContent = formatLatexForWord(cleanContent(q.content));
            essayContent = essayContent.replace(/([a-d]\))/g, '<br/>$1');
            htmlBody += `<div class='essay-question' style="margin-bottom: 12px;"><b>Câu ${index + 1}${scoreLabel}:</b> ${essayContent}`;
            if (q.subQuestions && q.subQuestions.length > 0) {
                htmlBody += `<div style="margin-top: 5px; margin-left: 20px;">`;
                q.subQuestions.forEach(sq => {
                    htmlBody += `<div style="margin-bottom: 4px;"><b>${sq.id})</b> ${formatLatexForWord(cleanContent(sq.content))}</div>`;
                });
                htmlBody += `</div>`;
            }
            htmlBody += `</div>`;
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
        htmlBody += `<div class='part-title'><b>PHẦN I. TRẮC NGHIỆM KHÁCH QUAN</b></div>`;

        if (part1_type1.length > 0) {
            htmlBody += `<p><b>Dạng 1: Trắc nghiệm nhiều lựa chọn</b></p>`;
            htmlBody += `<table class="answer-table" border="1" cellspacing="0" cellpadding="6" style="width: 100%; border-collapse: collapse; text-align: center; margin-bottom: 15px;"><tr>`;
            part1_type1.forEach((q, i) => {
                // Ensure correct answer is always displayed clearly (e.g. "A", "B", "C", "D")
                let ans = (q.correctAnswer || '').trim();
                if (!ans && q.solution) {
                  const m = q.solution.match(/(?:Chọn|Đáp án|Phương án)\s+([A-D])/i) || q.solution.match(/\b([A-D])\b/);
                  if (m) ans = m[1].toUpperCase();
                }
                if (!ans) ans = 'A'; // Safe pedagogical fallback
                
                htmlBody += `<td style="border: 1px solid black; padding: 6px; font-weight: bold; width: 10%;"><b>${i+1}</b>: ${ans}</td>`;
                if ((i+1) % 10 === 0 && (i+1) !== part1_type1.length) {
                  htmlBody += `</tr><tr>`;
                }
            });
            // Fill empty cells if last row has fewer than 10 cells for balanced table
            const remainder = part1_type1.length % 10;
            if (remainder !== 0) {
              for (let k = remainder; k < 10; k++) {
                htmlBody += `<td style="border: 1px solid black; padding: 6px;"></td>`;
              }
            }
            htmlBody += `</tr></table>`;
        }

        if (part1_type2.length > 0) {
            htmlBody += `<p style="margin-top: 15px;"><b>Dạng 2: Trắc nghiệm đúng sai</b></p>`;
            part1_type2.forEach((q, i) => {
                const qNum = part1_type1.length + i + 1;
                const ansStr = q.subQuestions?.map(sq => `<b>${sq.id}</b>) ${sq.answer ? 'Đúng' : 'Sai'}`).join(' &nbsp;|&nbsp; ') || 'Đang cập nhật';
                htmlBody += `<p style="margin-left: 15px; margin-bottom: 6px;"><b>Câu ${qNum}:</b> ${ansStr}</p>`;
            });
        }

        if (part1_type3.length > 0) {
            htmlBody += `<p style="margin-top: 15px;"><b>Dạng 3: Trắc nghiệm trả lời ngắn</b></p>`;
            htmlBody += `<table class="answer-table" border="1" cellspacing="0" cellpadding="6" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr style="background-color: #f8fafc;"><th style="border: 1px solid black; width: 15%;">Câu</th><th style="border: 1px solid black; text-align: left; padding-left: 10px;">Đáp số chuẩn</th></tr>`;
            part1_type3.forEach((q, i) => {
                const qNum = part1_type1.length + part1_type2.length + i + 1;
                htmlBody += `<tr><td style="border: 1px solid black; text-align: center; font-weight: bold;">Câu ${qNum}</td><td style="border: 1px solid black; padding-left: 10px;">${formatLatexForWord(q.correctAnswer || 'Xem hướng dẫn chi tiết')}</td></tr>`;
            });
            htmlBody += `</table>`;
        }
    }

    if (part2.length > 0) {
         htmlBody += `<div class='part-title' style='margin-top:20px;'><b>PHẦN II. TỰ LUẬN</b></div>`;
         htmlBody += `<table class="essay-table" border="1" cellspacing="0" cellpadding="6" style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f8fafc;"><th style="border: 1px solid black;" width="15%">Câu</th><th style="border: 1px solid black; text-align: left; padding-left: 10px;" width="85%">Nội dung / Hướng dẫn chấm chi tiết</th></tr>
         `;
         part2.forEach((q, i) => {
              const scoreLabel = getScoreLabel(q, finalEssayScore);
              const solutionText = q.solution ? formatLatexForWord(q.solution).replace(/\n/g, '<br/>') : 'Chưa có hướng dẫn chấm chi tiết.';
              htmlBody += `
                <tr>
                    <td align="center" valign="top" style="border: 1px solid black; padding: 6px;"><b>Câu ${i+1}${scoreLabel}</b></td>
                    <td valign="top" style="text-align: left; border: 1px solid black; padding: 6px;">${solutionText}</td>
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

    // Final thorough removal of any [NLC], [TLN], [Đ/S], [TL], (TL] or leftover "oán:", literal "\n" in htmlBody
    const sanitizedHtmlBody = htmlBody
      .replace(/[\[\(]\s*(?:NLC|TLN|Đ\/S|Đ-S|TL|TN)\s*[\]\)]\s*[:.]?\s*/gi, '')
      .replace(/[\[\(]\s*TL\s*[\]\)]\s*[:.]?\s*/gi, '')
      .replace(/\\r\\n|\\n/g, '<br/>')
      .replace(/<b>Câu\s+\d+[^<]*:<\/b>\s*oán\s*[:.]?\s*/gi, (match) => match.replace(/oán\s*[:.]?\s*/gi, ''));

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
      <body>${sanitizedHtmlBody}</body></html>
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
  
  // Split questions for Web View (using normalized questions with chained hypothesis merged)
  const objectiveQuestions = normalizedQuestions.filter(q => q.type !== QuestionType.ESSAY);
  const essayQuestions = normalizedQuestions.filter(q => q.type === QuestionType.ESSAY);

  // Calculate scores for preview header
  const essayPointsVal = exam.essayPoints !== undefined ? exam.essayPoints : 3.0;
  const objectivePointsVal = 10 - essayPointsVal;

  const getBadge = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return { code: 'NLC', name: 'Nhiều lựa chọn', color: 'bg-blue-600' };
      case QuestionType.TRUE_FALSE:
        return { code: 'Đ/S', name: 'Đúng sai', color: 'bg-emerald-600' };
      case QuestionType.SHORT_ANSWER:
        return { code: 'TLN', name: 'Trả lời ngắn', color: 'bg-purple-600' };
      case QuestionType.ESSAY:
        return { code: 'TL', name: 'Tự luận', color: 'bg-amber-600' };
      default:
        return { code: 'TN', name: 'Trắc nghiệm', color: 'bg-slate-600' };
    }
  };

  const renderQuestion = (q: any, idx: number, isEssay: boolean) => {
      const displayContent = cleanContent(q.content);
      const badge = getBadge(q.type);
      
      // Calculate score label for UI preview
      let scoreStr = '';
      if (typeof q.score === 'number' && q.score > 0) {
        scoreStr = q.score % 1 === 0 ? `${q.score}đ` : `${q.score.toFixed(2).replace('.', ',').replace(/0+$/, '').replace(/,$/, '')}đ`;
      } else if (q.type === QuestionType.TRUE_FALSE) {
        scoreStr = '1đ';
      } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
        scoreStr = '0,25đ';
      } else if (q.type === QuestionType.SHORT_ANSWER) {
        scoreStr = '0,5đ';
      } else if (q.type === QuestionType.ESSAY) {
        scoreStr = essayQuestions.length > 0 ? `${(Math.round((essayPointsVal / essayQuestions.length) * 10) / 10).toString().replace('.', ',')}đ` : '1,5đ';
      }
      
      return (
        <div key={q.id || idx} className="p-4 bg-slate-50 rounded border border-slate-100 shadow-sm mb-4">
            <div className="font-medium text-gray-900 mb-2">
                <span className="font-bold text-primary mr-1">
                    Câu {idx} {scoreStr ? `(${scoreStr}):` : ':'}
                </span> 
                <span dangerouslySetInnerHTML={{ __html: displayContent }}></span>
                <span className={`text-[10px] text-white ${badge.color} ml-2 px-2 py-0.5 rounded font-bold`}>
                  {badge.name}
                </span>
            </div>
            
            {/* Multiple Choice */}
            {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 ml-4 text-sm text-gray-700">
                    {q.options.map((opt: string, i: number) => <div key={i} dangerouslySetInnerHTML={{ __html: cleanContent(opt) }}></div>)}
                </div>
            )}

            {/* True/False Grid - UPDATED FOR BETTER VISIBILITY */}
            {q.type === QuestionType.TRUE_FALSE && q.subQuestions && (
                <div className="mt-3 ml-0 md:ml-4 overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 px-3 py-2 w-12 text-center font-semibold text-gray-700">Lệnh</th>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Nội dung mệnh đề</th>
                                <th className="border border-gray-300 px-2 py-2 w-16 text-center font-semibold text-gray-700">Đúng</th>
                                <th className="border border-gray-300 px-2 py-2 w-16 text-center font-semibold text-gray-700">Sai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {q.subQuestions.map((sq: any) => (
                                <tr key={sq.id} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800 align-top">
                                        {sq.id})
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-gray-800 align-top whitespace-normal">
                                        {/* Ensure content wraps and MathJax renders correctly */}
                                        <div dangerouslySetInnerHTML={{ __html: cleanContent(sq.content) }}></div>
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

            {/* Essay Sub-questions (a, b, c, d) */}
            {q.type === QuestionType.ESSAY && q.subQuestions && q.subQuestions.length > 0 && (
                <div className="mt-3 ml-2 md:ml-4 space-y-2 text-sm text-gray-800">
                    {q.subQuestions.map((sq: any) => (
                        <div key={sq.id} className="flex items-start">
                            <span className="font-bold text-gray-900 mr-2 shrink-0">{sq.id})</span>
                            <div dangerouslySetInnerHTML={{ __html: cleanContent(sq.content) }}></div>
                        </div>
                    ))}
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
    <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col relative">
      {toastMessage && (
        <div className="absolute top-4 right-4 z-20 bg-blue-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}
      <div className="flex justify-between items-center mb-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Xem trước Đề thi (CV 7991)</h2>
          <p className="text-xs text-gray-500 mt-0.5">Chuẩn cấu trúc Bộ Giáo dục & Đào tạo theo Công văn 7991</p>
        </div>
        <button
          onClick={handleDownloadWord}
          className="flex items-center space-x-2 bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-semibold"
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
                   <div className="bg-blue-50 p-2.5 rounded-lg text-blue-900 font-bold uppercase text-xs sm:text-sm mb-4 border-l-4 border-blue-600 flex justify-between items-center">
                      <span>Phần I: Trắc nghiệm khách quan ({objectivePointsVal.toFixed(2)} điểm)</span>
                      <span className="text-[11px] font-semibold normal-case text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                        Nhiều lựa chọn • Đúng/Sai • Trả lời ngắn
                      </span>
                   </div>
                   {objectiveQuestions.map((q, idx) => renderQuestion(q, idx + 1, false))}
                </div>
            )}

            {/* PART 2: ESSAY */}
            {essayQuestions.length > 0 && (
                <div>
                   <div className="bg-amber-50 p-2.5 rounded-lg text-amber-900 font-bold uppercase text-xs sm:text-sm mb-4 border-l-4 border-amber-600 flex justify-between items-center">
                      <span>Phần II: Tự luận ({essayPointsVal.toFixed(2)} điểm)</span>
                      <span className="text-[11px] font-semibold normal-case text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                        Barem lời giải chi tiết
                      </span>
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