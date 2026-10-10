import { Question, QuestionType, SubQuestion } from '../types';

/**
 * Checks if a question content or text refers to continuing a previous hypothesis/context.
 * e.g. "(Tiếp tục giả thiết Câu 16a)", "(Tiếp tục giả thiết câu 16)", "(Tiếp tục dữ kiện Câu 16a)", etc.
 */
export const isChainedHypothesis = (text: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // Must refer to continuing a previous question or assumption
  if (
    lower.includes('tiếp tục giả thiết') ||
    lower.includes('tiếp tục dữ kiện') ||
    lower.includes('tiếp tục dữ liệu') ||
    lower.includes('tiếp tục câu') ||
    lower.includes('tiếp tục bài') ||
    lower.includes('dựa vào dữ kiện câu') ||
    lower.includes('dựa vào giả thiết câu') ||
    lower.includes('theo giả thiết câu') ||
    lower.includes('từ giả thiết câu') ||
    lower.includes('giả thiết của câu') ||
    lower.includes('dữ kiện của câu') ||
    lower.includes('dựa vào câu trước') ||
    lower.includes('theo câu trước') ||
    lower.includes('theo câu trên') ||
    lower.includes('từ câu trên')
  ) {
    return true;
  }

  // Regex matching patterns like "(Tiếp tục giả thiết Câu 16a)", "(Tiếp tục câu 16a)", "[Theo câu 16]"
  const chainedRegex = /[\(\[\{]\s*(?:Tiếp\s*tục|Dựa\s*(?:vào|trên)|Theo|Sử\s*dụng|Từ)\s+(?:giả\s*thiết|dữ\s*kiện|dữ\s*liệu|nội\s*dung)?\s*(?:của\s+)?(?:câu|bài)\s*\d+[a-z]?/i;
  if (chainedRegex.test(text)) return true;

  // Unbracketed continuation at start: "Tiếp tục giả thiết Câu 16a:"
  const startChainedRegex = /^\s*Tiếp\s*tục\s+(?:giả\s*thiết|dữ\s*kiện|dữ\s*liệu|nội\s*dung)?\s*(?:của\s+)?(?:câu|bài)?\s*\d+[a-z]?/i;
  return startChainedRegex.test(text);
};

/**
 * Removes chained hypothesis labels such as "(Tiếp tục giả thiết Câu 16a)" or "Tiếp tục giả thiết Câu 16a:"
 * from question text to make it natural and clean.
 * Also cleans literal "\n" representations and accidental "oán:" prefix.
 */
export const stripChainedHypothesis = (text: string): string => {
  if (!text) return '';
  return text
    // 1. Remove literal string "\n" or "\r\n" if present as raw text characters
    .replace(/\\r\\n|\\n/g, '\n')
    // 2. Remove bracketed chained hypotheses: (Tiếp tục giả thiết Câu 16a), [Tiếp tục giả thiết...], (Theo câu 16)
    .replace(/[\(\[\{]\s*(?:Tiếp\s*tục|Dựa\s*(?:vào|trên)|Theo|Sử\s*dụng|Từ)\s+(?:giả\s*thiết|dữ\s*kiện|dữ\s*liệu|nội\s*dung)?\s*(?:của\s+)?(?:bài\s+toán|câu\s*\d+[a-z]?|bài\s*\d+[a-z]?|câu|bài)?\s*(?:trên|nêu\s*trên|đã\s*cho)?\s*[\)\]\}]\s*[:\-\.,]?\s*/gi, '')
    // 3. Remove unbracketed continuation at start of string: "Tiếp tục giả thiết Câu 16a:"
    .replace(/^\s*Tiếp\s*tục\s+(?:giả\s*thiết|dữ\s*kiện|dữ\s*liệu|nội\s*dung)?\s*(?:của\s+)?(?:bài\s+toán|câu\s*\d+[a-z]?|bài\s*\d+[a-z]?|câu|bài)?\s*(?:trên|nêu\s*trên|đã\s*cho)?\s*[:\-\.,]?\s*/gi, '')
    // 4. Remove start-of-sentence phrases referring to previous question: "Theo giả thiết câu 16a:", "Từ dữ kiện câu 15:"
    .replace(/^\s*(?:Dựa\s*(?:vào|trên)|Theo|Sử\s*dụng|Từ)\s+(?:giả\s*thiết|dữ\s*kiện|dữ\s*liệu|nội\s*dung)\s+(?:của\s+)?(?:câu|bài)\s*\d+[a-z]?\s*[:\-\.,]?\s*/gi, '')
    // 5. Remove start-of-sentence phrases like "Theo giả thiết bài toán:", "Theo bài toán:", "Từ bài toán:"
    .replace(/^\s*(?:Theo|Từ|Dựa\s*(?:vào|trên))\s+(?:giả\s*thiết\s+)?(?:của\s+)?bài\s+toán\s*(?:trên|nêu\s*trên|đã\s*cho)?\s*[:\-\.,]?\s*/gi, '')
    // 6. Remove "Bài toán:", "Bài toán 1:", "Bài 1:" at start of question
    .replace(/^\s*Bài\s+(?:toán\s*\d*|\d+)\s*[:.]?\s*/gi, '')
    // 7. Safeguard: Remove any accidental leftover "oán:", "toán:" or "oán :" at the beginning
    .replace(/^\s*(?:t)?oán\s*[:.]?\s*/gi, '')
    // 8. Clean leading punctuation (e.g. leftover comma or colon)
    .replace(/^[\s,;:\-\.]+/g, '')
    // 9. Clean double spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
};

/**
 * Splits a question into its common hypothesis and its first sub-question part (ý a).
 */
export const extractHypothesisAndFirstSubQuestion = (content: string): { hypothesis: string; partA: string } => {
  if (!content) return { hypothesis: '', partA: '' };

  let clean = content.replace(/^Câu\s+\d+[a-z]?[:.]?\s*/i, '').trim();
  clean = stripChainedHypothesis(clean);

  // 1. Check for explicit "a)" or newline followed by "a."
  const explicitMatch = clean.match(/(.*?)(?:(?:\s+|^)a\)|(?:\n|\r|^)\s*a\.)\s*(.+)$/is);
  if (explicitMatch && explicitMatch[1].trim() && explicitMatch[2].trim()) {
    const hypo = explicitMatch[1].trim();
    return {
      hypothesis: hypo.endsWith('.') || hypo.endsWith(':') ? hypo : `${hypo}.`,
      partA: explicitMatch[2].trim()
    };
  }

  // 2. Look for action verbs / questioning phrases (Tính, Tìm, Xác định, Khẳng định...)
  const actionMatch = clean.match(/^(.*?[.?!;])\s+((?:Tính|Tìm|Xác\s+định|Khẳng\s+định|Chứng\s+minh|Cho\s+biết|Hỏi|Đường\s+thẳng|Mặt\s+phẳng|Góc\s+giữa|Khoảng\s+cách|Thể\s+tích|Diện\s+tích|Tọa\s+độ|Mệnh\s+đề)\s+.+)$/is);
  if (actionMatch && actionMatch[1].trim() && actionMatch[2].trim()) {
    return {
      hypothesis: actionMatch[1].trim(),
      partA: actionMatch[2].trim()
    };
  }

  // 3. If multiple sentences exist, use the last sentence as part A and previous as common hypothesis
  const sentences = clean.split(/(?<=[.?!])\s+/);
  if (sentences.length >= 2) {
    const last = sentences[sentences.length - 1].trim();
    const rest = sentences.slice(0, -1).join(' ').trim();
    if (rest.length > 15 && last.length > 5) {
      return {
        hypothesis: rest,
        partA: last
      };
    }
  }

  // Fallback: entire content serves as both hypothesis and part A inquiry
  return {
    hypothesis: clean,
    partA: clean
  };
};

/**
 * Helper to determine boolean truth value for a sub-question.
 */
const getBooleanAnswer = (q: any): boolean => {
  if (typeof q.answer === 'boolean') return q.answer;
  if (typeof q.correctAnswer === 'boolean') return q.correctAnswer;
  if (typeof q.correctAnswer === 'string') {
    const str = q.correctAnswer.trim().toLowerCase();
    if (str === 'đúng' || str === 'dung' || str === 'true' || str === 't' || str === 'a') return true;
    if (str === 'sai' || str === 'false' || str === 'f' || str === 'b') return false;
  }
  return true;
};

/**
 * Transforms questions formatted like "(Tiếp tục giả thiết Câu 16a)" into sub-questions (a, b, c, d)
 * of the preceding question, matching CV 7991 standards.
 */
export const mergeChainedQuestions = (questions: Question[]): Question[] => {
  if (!questions || questions.length === 0) return [];

  const result: Question[] = [];
  const subLetters = ['a', 'b', 'c', 'd', 'e', 'f'];

  for (let i = 0; i < questions.length; i++) {
    const currentQ = questions[i];
    const isChained = isChainedHypothesis(currentQ.content);

    if (isChained && result.length > 0) {
      // Find the parent question (the last question in result)
      const parentQ = result[result.length - 1];

      // If parent does not have subQuestions initialized yet:
      if (!parentQ.subQuestions || parentQ.subQuestions.length === 0) {
        const { hypothesis, partA } = extractHypothesisAndFirstSubQuestion(parentQ.content);
        parentQ.content = hypothesis || parentQ.content;

        // Initialize subQuestions with part A
        parentQ.subQuestions = [
          {
            id: 'a',
            content: stripChainedHypothesis(partA),
            answer: getBooleanAnswer(parentQ)
          }
        ];

        // If parent was Multiple Choice, transform it into True/False (Type 2) or Essay with 4 parts
        if (parentQ.type === QuestionType.MULTIPLE_CHOICE) {
          parentQ.type = QuestionType.TRUE_FALSE;
          parentQ.options = undefined;
          parentQ.score = 1.0; // Standard 1.0pt for Type 2
        }
      }

      // Determine next letter for current chained question (b, c, d,...)
      const nextIdx = parentQ.subQuestions.length;
      const nextLetter = nextIdx < subLetters.length ? subLetters[nextIdx] : `y_${nextIdx + 1}`;

      const cleanedCurrentContent = stripChainedHypothesis(currentQ.content);

      parentQ.subQuestions.push({
        id: nextLetter,
        content: cleanedCurrentContent,
        answer: getBooleanAnswer(currentQ)
      });

      // Merge solution if available
      if (currentQ.solution) {
        parentQ.solution = (parentQ.solution ? `${parentQ.solution}\n` : '') + `Ý ${nextLetter}: ${stripChainedHypothesis(currentQ.solution)}`;
      }

      // Do NOT add currentQ to result, as it has been folded into parentQ!
      continue;
    }

    // Normal non-chained question: clone and clean any internal references
    const cleanedQ: Question = {
      ...currentQ,
      content: stripChainedHypothesis(currentQ.content),
      solution: currentQ.solution ? stripChainedHypothesis(currentQ.solution) : undefined
    };

    if (cleanedQ.subQuestions && cleanedQ.subQuestions.length > 0) {
      cleanedQ.subQuestions = cleanedQ.subQuestions.map(sq => ({
        ...sq,
        content: stripChainedHypothesis(sq.content)
      }));
    }

    result.push(cleanedQ);
  }

  return result;
};
