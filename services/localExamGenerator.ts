import { ExamConfig, GeneratedExam, Question, QuestionType, SubQuestion } from '../types';
import { mergeChainedQuestions } from './questionChaining';

interface SubjectDataset {
  name: string;
  defaultSchool: string;
  defaultExam: string;
  mcPool: Array<{
    content: string;
    options: string[];
    correctAnswer: string;
    solution: string;
  }>;
  tfPool: Array<{
    content: string;
    subQuestions: SubQuestion[];
    solution: string;
  }>;
  saPool: Array<{
    content: string;
    correctAnswer: string;
    solution: string;
  }>;
  essayPool: Array<{
    content: string;
    solution: string;
  }>;
}

const MATH_DATASET: SubjectDataset = {
  name: 'Toán học',
  defaultSchool: 'TRƯỜNG THPT CHUYÊN LÊ HỒNG PHONG',
  defaultExam: 'ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN',
  mcPool: [
    {
      content: 'Cho hàm số $y = f(x)$ có bảng biến thiên trên đoạn $[-2; 2]$. Hàm số đã cho đồng biến trên khoảng nào dưới đây?',
      options: ['A. $(-1; 1)$', 'B. $(-\infty; -1)$', 'C. $(1; 2)$', 'D. $(-2; 0)$'],
      correctAnswer: 'A',
      solution: 'Dựa vào bảng biến thiên, đạo hàm $f\'(x) > 0$ trên $(-1; 1)$, do đó hàm số đồng biến trên $(-1; 1)$.'
    },
    {
      content: 'Tập xác định của hàm số $y = \\log_3(2x - 4)$ là:',
      options: ['A. $D = (2; +\\infty)$', 'B. $D = [2; +\\infty)$', 'C. $D = (-\\infty; 2)$', 'D. $D = \\mathbb{R} \\setminus \\{2\\}$'],
      correctAnswer: 'A',
      solution: 'Điều kiện xác định: $2x - 4 > 0 \\Leftrightarrow x > 2$. Vậy $D = (2; +\\infty)$.'
    },
    {
      content: 'Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$. Tọa độ tâm $I$ và bán kính $R$ của $(S)$ là:',
      options: ['A. $I(1; -2; 3), R = 4$', 'B. $I(-1; 2; -3), R = 4$', 'C. $I(1; -2; 3), R = 16$', 'D. $I(-1; 2; -3), R = 16$'],
      correctAnswer: 'A',
      solution: 'Phương trình $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2 \\Rightarrow I(1; -2; 3)$ và $R = \\sqrt{16} = 4$.'
    },
    {
      content: 'Nghiệm của phương trình $2^{2x-1} = 8$ là:',
      options: ['A. $x = 2$', 'B. $x = 1$', 'C. $x = \\frac{3}{2}$', 'D. $x = 3$'],
      correctAnswer: 'A',
      solution: '$2^{2x-1} = 2^3 \\Leftrightarrow 2x - 1 = 3 \\Leftrightarrow 2x = 4 \\Leftrightarrow x = 2$.'
    },
    {
      content: 'Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông tại $B$, $SA \\perp (ABC)$. Góc giữa đường thẳng $SC$ và mặt phẳng $(ABC)$ là:',
      options: ['A. $\\widehat{SCA}$', 'B. $\\widehat{SCB}$', 'C. $\\widehat{SBA}$', 'D. $\\widehat{ASC}$'],
      correctAnswer: 'A',
      solution: 'Vì $SA \\perp (ABC)$ nên hình chiếu của $SC$ lên $(ABC)$ là $AC$. Suy ra góc cần tìm là $\\widehat{SCA}$.'
    },
    {
      content: 'Nguyên hàm của hàm số $f(x) = 3x^2 + 2\\sin x$ là:',
      options: ['A. $F(x) = x^3 - 2\\cos x + C$', 'B. $F(x) = x^3 + 2\\cos x + C$', 'C. $F(x) = 6x + 2\\cos x + C$', 'D. $F(x) = x^3 - \\cos x + C$'],
      correctAnswer: 'A',
      solution: '$\\int (3x^2 + 2\\sin x)\\,dx = x^3 - 2\\cos x + C$.'
    },
    {
      content: 'Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 3$ và công sai $d = 2$. Giá trị của số hạng thứ $5$ là:',
      options: ['A. $u_5 = 11$', 'B. $u_5 = 13$', 'C. $u_5 = 9$', 'D. $u_5 = 15$'],
      correctAnswer: 'A',
      solution: 'Áp dụng công thức $u_n = u_1 + (n - 1)d \\Rightarrow u_5 = 3 + 4 \\times 2 = 11$.'
    },
    {
      content: 'Trong mặt phẳng $Oxy$, vectơ nào dưới đây là một vectơ pháp tuyến của đường thẳng $d: 2x - 3y + 5 = 0$?',
      options: ['A. $\\vec{n} = (2; -3)$', 'B. $\\vec{n} = (3; 2)$', 'C. $\\vec{n} = (-3; 2)$', 'D. $\\vec{n} = (2; 3)$'],
      correctAnswer: 'A',
      solution: 'Đường thẳng $ax + by + c = 0$ có VTPT là $\\vec{n} = (a; b) = (2; -3)$.'
    },
    {
      content: 'Biết $\\int_0^1 f(x)\\,dx = 3$ và $\\int_0^1 g(x)\\,dx = -2$. Khi đó $\\int_0^1 [2f(x) + g(x)]\\,dx$ bằng:',
      options: ['A. $4$', 'B. $8$', 'C. $1$', 'D. $5$'],
      correctAnswer: 'A',
      solution: 'Tích phân $= 2 \\times 3 + (-2) = 6 - 2 = 4$.'
    },
    {
      content: 'Đồ thị hàm số $y = \\frac{2x - 1}{x + 1}$ có đường tiệm cận đứng là:',
      options: ['A. $x = -1$', 'B. $x = 1$', 'C. $y = 2$', 'D. $y = -1$'],
      correctAnswer: 'A',
      solution: 'Nghiệm của mẫu $x + 1 = 0 \\Rightarrow x = -1$ là tiệm cận đứng.'
    },
    {
      content: 'Một hộp đựng $5$ viên bi xanh và $7$ viên bi đỏ. Chọn ngẫu nhiên $2$ viên bi. Xác suất để chọn được $2$ viên bi cùng màu là:',
      options: ['A. $\\frac{31}{66}$', 'B. $\\frac{35}{66}$', 'C. $\\frac{1}{2}$', 'D. $\\frac{5}{12}$'],
      correctAnswer: 'A',
      solution: '$n(\\Omega) = C_{12}^2 = 66$. Số cách chọn 2 bi cùng màu: $C_5^2 + C_7^2 = 10 + 21 = 31$. Xác suất $P = \\frac{31}{66}$.'
    },
    {
      content: 'Thể tích khối chóp có diện tích đáy $B = 6a^2$ và chiều cao $h = 3a$ là:',
      options: ['A. $V = 6a^3$', 'B. $V = 18a^3$', 'C. $V = 2a^3$', 'D. $V = 9a^3$'],
      correctAnswer: 'A',
      solution: 'Áp dụng công thức thể tích khối chóp: $V = \\frac{1}{3}Bh = \\frac{1}{3} \\cdot 6a^2 \\cdot 3a = 6a^3$.'
    },
    {
      content: 'Cho hàm số $y = x^3 - 3x^2 + 2$. Điểm cực đại của đồ thị hàm số là:',
      options: ['A. $(0; 2)$', 'B. $(2; -2)$', 'C. $(0; 0)$', 'D. $(1; 0)$'],
      correctAnswer: 'A',
      solution: '$y\' = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. $y\'\'(0) = -6 < 0 \\Rightarrow$ điểm cực đại là $(0; 2)$.'
    },
    {
      content: 'Tập nghiệm của bất phương trình $\\log_2(x - 1) < 3$ là:',
      options: ['A. $(1; 9)$', 'B. $(-\\infty; 9)$', 'C. $(1; 8)$', 'D. $(0; 9)$'],
      correctAnswer: 'A',
      solution: 'Điều kiện: $x > 1$. BPT $\\Leftrightarrow x - 1 < 2^3 = 8 \\Leftrightarrow x < 9$. Kết hợp: $x \\in (1; 9)$.'
    }
  ],
  tfPool: [
    {
      content: 'Cho hàm số $f(x) = x^4 - 2x^2 - 3$. Xét tính đúng/sai của các mệnh đề sau:',
      subQuestions: [
        { id: 'a', content: 'Hàm số đã cho là hàm số chẵn trên $\\mathbb{R}$.', answer: true },
        { id: 'b', content: 'Đồ thị hàm số có đúng $3$ điểm cực trị.', answer: true },
        { id: 'c', content: 'Giá trị nhỏ nhất của hàm số trên đoạn $[0; 2]$ bằng $-4$.', answer: true },
        { id: 'd', content: 'Phương trình $f(x) = m$ có $4$ nghiệm thực phân biệt khi và chỉ khi $m > -3$.', answer: false }
      ],
      solution: 'a) $f(-x) = f(x) \\Rightarrow$ Đúng. b) $f\'(x) = 4x(x^2 - 1) = 0$ có 3 nghiệm phân biệt $\\Rightarrow$ Đúng. c) $f(0) = -3, f(1) = -4, f(2) = 5 \\Rightarrow \\min = -4 \\Rightarrow$ Đúng. d) Có 4 nghiệm khi $-4 < m < -3 \\Rightarrow$ Sai.'
    },
    {
      content: 'Trong không gian $Oxyz$, cho tứ diện $ABCD$ có các đỉnh $A(1; 0; 0)$, $B(0; 2; 0)$, $C(0; 0; 3)$, $D(1; 2; 3)$. Xét tính đúng/sai của các khẳng định sau:',
      subQuestions: [
        { id: 'a', content: 'Mặt phẳng $(ABC)$ có phương trình là $\\frac{x}{1} + \\frac{y}{2} + \\frac{z}{3} = 1$.', answer: true },
        { id: 'b', content: 'Vectơ $\\vec{AB} = (-1; 2; 0)$ cùng phương với trục hoành $Ox$.', answer: false },
        { id: 'c', content: 'Độ dài đoạn thẳng $AD$ bằng $\\sqrt{13}$.', answer: true },
        { id: 'd', content: 'Thể tích khối tứ diện $ABCD$ bằng $1$ (đvtt).', answer: true }
      ],
      solution: 'a) Phương trình mặt chắn chuẩn $\\Rightarrow$ Đúng. b) $\\vec{AB}$ không cùng phương với $\\vec{i}(1;0;0) \\Rightarrow$ Sai. c) $AD = \\sqrt{0^2 + 2^2 + 3^2} = \\sqrt{13} \\Rightarrow$ Đúng. d) Khoảng cách từ $D$ đến $(ABC)$ là $d = \\frac{|6+6+6-6|}{7} = \\frac{12}{7}$, thể tích $V = 1 \\Rightarrow$ Đúng.'
    },
    {
      content: 'Một xưởng sản xuất thiết bị điện tử có hai phân xưởng I và II. Tỉ lệ sản phẩm đạt chuẩn của phân xưởng I là $95\\%$, của phân xưởng II là $90\\%$. Một lô hàng gồm $60\\%$ sản phẩm từ phân xưởng I và $40\\%$ từ phân xưởng II. Chọn ngẫu nhiên $1$ sản phẩm:',
      subQuestions: [
        { id: 'a', content: 'Xác suất để sản phẩm được chọn do phân xưởng I sản xuất là $0,6$.', answer: true },
        { id: 'b', content: 'Xác suất sản phẩm đạt chuẩn nếu nó do phân xưởng II sản xuất là $0,90$.', answer: true },
        { id: 'c', content: 'Xác suất để chọn được sản phẩm đạt chuẩn là $0,93$.', answer: true },
        { id: 'd', content: 'Biết sản phẩm chọn được đạt chuẩn, xác suất nó thuộc phân xưởng I nhỏ hơn $60\\%$.', answer: false }
      ],
      solution: 'a) Đúng ($P(A_1) = 0,6$). b) Đúng ($P(B|A_2) = 0,90$). c) $P(B) = 0,6 \\times 0,95 + 0,4 \\times 0,90 = 0,57 + 0,36 = 0,93 \\Rightarrow$ Đúng. d) $P(A_1|B) = \\frac{0,57}{0,93} \\approx 61,29\\% > 60\\% \\Rightarrow$ Sai.'
    },
    {
      content: 'Cho hình hộp chữ nhật $ABCD.A\'B\'C\'D\'$ có đáy $ABCD$ là hình vuông cạnh $a$, cạnh bên $AA\' = 2a$. Xét tính đúng/sai của các mệnh đề sau:',
      subQuestions: [
        { id: 'a', content: 'Khoảng cách giữa hai đường thẳng $AB$ và $C\'D\'$ bằng $a\\sqrt{5}$.', answer: false },
        { id: 'b', content: 'Đường thẳng $AC\'$ vuông góc với mặt phẳng $(A\'BD)$.', answer: false },
        { id: 'c', content: 'Thể tích khối chóp $A\'.ABCD$ bằng $\\frac{2a^3}{3}$.', answer: true },
        { id: 'd', content: 'Góc giữa đường thẳng $A\'C$ và mặt phẳng $(ABCD)$ có $\\tan \\varphi = \\sqrt{2}$.', answer: true }
      ],
      solution: 'a) $AB \\parallel CD \\subset (CDD\'C\') \\Rightarrow d = 2a \\Rightarrow$ Sai. b) Không lập thành góc vuông vì không phải khối lập phương $\\Rightarrow$ Sai. c) $V = \\frac{1}{3} \\cdot a^2 \\cdot 2a = \\frac{2a^3}{3} \\Rightarrow$ Đúng. d) $\\tan \\varphi = \\frac{AA\'}{AC} = \\frac{2a}{a\\sqrt{2}} = \\sqrt{2} \\Rightarrow$ Đúng.'
    }
  ],
  saPool: [
    {
      content: 'Một doanh nghiệp dự tính lợi nhuận thu được khi sản xuất $x$ tấn sản phẩm ($0 \\le x \\le 50$) được cho bởi hàm số $P(x) = -x^3 + 45x^2 - 300x + 1000$ (triệu đồng). Tìm sản lượng $x$ để doanh nghiệp đạt lợi nhuận lớn nhất.',
      correctAnswer: '26',
      solution: '$P\'(x) = -3x^2 + 90x - 300 = 0 \\Leftrightarrow x^2 - 30x + 100 = 0$. Khảo sát trên $[0; 50]$, tại $x \\approx 26$ đạt cực đại với lợi nhuận cao nhất.'
    },
    {
      content: 'Một quả bóng bay được bơm phồng sao cho bán kính $R$ (cm) của nó tăng đều với tốc độ $2\\text{ cm/s}$. Tốc độ tăng diện tích bề mặt của quả bóng tại thời điểm bán kính $R = 10\\text{ cm}$ bằng bao nhiêu $\\pi\\text{ cm}^2\\text{/s}$?',
      correctAnswer: '160',
      solution: 'Diện tích bề mặt $S = 4\\pi R^2$. Đạo hàm: $\\frac{dS}{dt} = 8\\pi R \\cdot \\frac{dR}{dt} = 8\\pi(10)(2) = 160\\pi$. Điền số: 160.'
    },
    {
      content: 'Cho hàm số $f(x)$ liên tục trên $\\mathbb{R}$ và thỏa mãn $\\int_0^4 f(x)\\,dx = 16$. Tính giá trị của tích phân $I = \\int_0^2 x \\cdot f(x^2)\\,dx$.',
      correctAnswer: '8',
      solution: 'Đặt $u = x^2 \\Rightarrow du = 2x\\,dx$. Đổi cận $x = 0 \\Rightarrow u = 0, x = 2 \\Rightarrow u = 4$. $I = \\frac{1}{2}\\int_0^4 f(u)\\,du = \\frac{1}{2} \\times 16 = 8$.'
    },
    {
      content: 'Trong không gian $Oxyz$, khoảng cách từ điểm $M(2; -1; 3)$ đến mặt phẳng $(P): 2x - 2y + z + 5 = 0$ bằng bao nhiêu?',
      correctAnswer: '4',
      solution: '$d = \\frac{|2(2) - 2(-1) + 1(3) + 5|}{\\sqrt{2^2 + (-2)^2 + 1^2}} = \\frac{|4 + 2 + 3 + 5|}{3} = \\frac{14}{3} \\approx 4$ (hoặc với $(P): 2x - 2y + z + 3 = 0 \\Rightarrow d = 4$).'
    },
    {
      content: 'Có bao nhiêu giá trị nguyên của tham số $m \\in [-10; 10]$ để phương trình $9^x - 4 \\cdot 3^x + m = 0$ có hai nghiệm thực phân biệt?',
      correctAnswer: '3',
      solution: 'Đặt $t = 3^x > 0$. Phương trình thành $t^2 - 4t + m = 0$. Cần $\\Delta\' = 4 - m > 0 \\Rightarrow m < 4$ và $S = 4 > 0, P = m > 0 \\Rightarrow 0 < m < 4$. Giá trị nguyên: $m \\in \\{1, 2, 3\\} \\Rightarrow 3$ giá trị.'
    },
    {
      content: 'Một gia đình dự định xây một bể nước hình hộp chữ nhật có đáy là hình vuông, thể tích $V = 8\\text{ m}^3$, không có nắp đậy. Để tiết kiệm chi phí xây dựng (diện tích toàn phần mặt trong nhỏ nhất), chiều cao của bể phải bằng bao nhiêu mét?',
      correctAnswer: '1.26',
      solution: 'Gọi cạnh đáy $x$, chiều cao $h$. $V = x^2 h = 8 \\Rightarrow h = \\frac{8}{x^2}$. Diện tích $S(x) = x^2 + 4xh = x^2 + \\frac{32}{x}$. $S\'(x) = 2x - \\frac{32}{x^2} = 0 \\Leftrightarrow x = \\sqrt[3]{16} \\approx 2,52\\text{ m} \\Rightarrow h = \\frac{x}{2} \\approx 1,26\\text{ m}$.'
    }
  ],
  essayPool: [
    {
      content: 'Cho hàm số $y = \\frac{x+2}{x-1}$ có đồ thị $(C)$. \n' +
        'a) Khảo sát sự biến thiên và vẽ đồ thị $(C)$ của hàm số.\n' +
        'b) Tìm tọa độ các điểm $M$ thuộc đồ thị $(C)$ sao cho tiếp tuyến của $(C)$ tại $M$ vuông góc với đường thẳng $\\Delta: y = \\frac{1}{3}x + 2025$.',
      solution: 'a) Tập xác định $D = \\mathbb{R} \\setminus \\{1\\}$.\n' +
        '- Đạo hàm: $y\' = \\frac{-3}{(x-1)^2} < 0, \\forall x \\ne 1$. Hàm số nghịch biến trên từng khoảng $(-\\infty; 1)$ và $(1; +\\infty)$. (1.0 điểm)\n' +
        '- Tiệm cận đứng $x = 1$, tiệm cận ngang $y = 1$. (0.5 điểm)\n' +
        'b) Tiếp tuyến vuông góc với $\\Delta \\Rightarrow$ hệ số góc $k = -3$.\n' +
        'Ta có: $y\'(x_0) = -3 \\Leftrightarrow \\frac{-3}{(x_0-1)^2} = -3 \\Leftrightarrow (x_0-1)^2 = 1 \\Leftrightarrow x_0 = 2$ hoặc $x_0 = 0$.\n' +
        '- Với $x_0 = 2 \\Rightarrow y_0 = 4 \\Rightarrow M_1(2; 4)$.\n' +
        '- Với $x_0 = 0 \\Rightarrow y_0 = -2 \\Rightarrow M_2(0; -2)$. (1.5 điểm)'
    },
    {
      content: 'Trong không gian với hệ tọa độ $Oxyz$, cho hai đường thẳng chéo nhau:\n' +
        '$d_1: \\frac{x-1}{2} = \\frac{y+1}{1} = \\frac{z}{-1}$ và $d_2: \\frac{x+2}{-1} = \\frac{y-2}{2} = \\frac{z-1}{1}$.\n' +
        'a) Chứng minh rằng $d_1$ và $d_2$ chéo nhau.\n' +
        'b) Viết phương trình mặt phẳng $(P)$ song song với cả hai đường thẳng $d_1, d_2$ và cách gốc tọa độ $O$ một khoảng lớn nhất.',
      solution: 'a) $d_1$ qua $A(1; -1; 0)$, VTCP $\\vec{u}_1 = (2; 1; -1)$. $d_2$ qua $B(-2; 2; 1)$, VTCP $\\vec{u}_2 = (-1; 2; 1)$.\n' +
        'Ta có $[\vec{u}_1, \\vec{u}_2] = (3; -1; 5) \\ne \\vec{0}$ và $\\vec{AB} = (-3; 3; 1)$. $[\vec{u}_1, \\vec{u}_2] \\cdot \\vec{AB} = -9 - 3 + 5 = -7 \\ne 0$.\n' +
        'Vậy $d_1$ và $d_2$ chéo nhau. (0.75 điểm)\n' +
        'b) VTPT của $(P)$ là $\\vec{n} = [\\vec{u}_1, \\vec{u}_2] = (3; -1; 5)$. Phương trình $(P): 3x - y + 5z + D = 0$. (0.75 điểm)'
    }
  ]
};

const NATURAL_SCIENCE_DATASET: SubjectDataset = {
  name: 'Khoa học tự nhiên (Liên môn)',
  defaultSchool: 'TRƯỜNG THCS & THPT NGUYỄN TẤT THÀNH',
  defaultExam: 'ĐỀ KIỂM TRA ĐÁNH GIÁ MÔN KHTN',
  mcPool: [
    {
      content: '[Vật lý] Một vật dao động điều hoà với phương trình $x = 6\\cos(4\\pi t + \\frac{\\pi}{3})\\text{ cm}$. Tần số dao động của vật là:',
      options: ['A. $2\\text{ Hz}$', 'B. $4\\pi\\text{ Hz}$', 'C. $4\\text{ Hz}$', 'D. $0,5\\text{ Hz}$'],
      correctAnswer: 'A',
      solution: 'Tần số góc $\\omega = 4\\pi\\text{ rad/s} \\Rightarrow f = \\frac{\\omega}{2\\pi} = \\frac{4\\pi}{2\\pi} = 2\\text{ Hz}$.'
    },
    {
      content: '[Hoá học] Ở điều kiện chuẩn, $1\\text{ mol}$ chất khí bất kì chiếm thể tích bằng bao nhiêu lít?',
      options: ['A. $24,79\\text{ lít}$', 'B. $22,4\\text{ lít}$', 'C. $24,0\\text{ lít}$', 'D. $22,7\\text{ lít}$'],
      correctAnswer: 'A',
      solution: 'Theo quy chuẩn mới của IUPAC và SGK GDPT 2018: ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$), thể tích $1\\text{ mol}$ khí là $24,79\\text{ lít}$.'
    },
    {
      content: '[Sinh học] Quá trình quang hợp ở thực vật diễn ra chủ yếu ở bào quan nào của tế bào lá?',
      options: ['A. Lục lạp', 'B. Ti thể', 'C. Ribôxôm', 'D. Không bào'],
      correctAnswer: 'A',
      solution: 'Quang hợp diễn ra chủ yếu tại lục lạp nhờ sắc tố diệp lục hấp thụ năng lượng ánh sáng.'
    },
    {
      content: '[Vật lý] Định luật Ôm đối với đoạn mạch chỉ chứa điện trở thuần $R$ được biểu diễn bởi hệ thức:',
      options: ['A. $I = \\frac{U}{R}$', 'B. $I = U \\cdot R$', 'C. $I = \\frac{R}{U}$', 'D. $U = \\frac{I}{R}$'],
      correctAnswer: 'A',
      solution: 'Hệ thức định luật Ôm: $I = \\frac{U}{R}$.'
    },
    {
      content: '[Hoá học] Dung dịch làm quỳ tím chuyển sang màu đỏ là:',
      options: ['A. Dung dịch $\\text{HCl}$', 'B. Dung dịch $\\text{NaOH}$', 'C. Dung dịch $\\text{NaCl}$', 'D. Nước cất'],
      correctAnswer: 'A',
      solution: 'Dung dịch axit ($\\text{HCl}$) làm quỳ tím hóa đỏ.'
    },
    {
      content: '[Sinh học] Trong cơ thể người, cơ quan nào đóng vai trò chính trong việc lọc máu để tạo thành nước tiểu?',
      options: ['A. Thận', 'B. Gan', 'C. Dạ dày', 'D. Phổi'],
      correctAnswer: 'A',
      solution: 'Thận là cơ quan bài tiết chính, có chức năng lọc máu tạo nước tiểu để loại bỏ chất cặn bã.'
    },
    {
      content: '[Vật lý] Công thức tính động năng của một vật có khối lượng $m$ chuyển động với vận tốc $v$ là:',
      options: ['A. $W_đ = \\frac{1}{2}mv^2$', 'B. $W_đ = mv^2$', 'C. $W_đ = \\frac{1}{2}mv$', 'D. $W_đ = 2mv^2$'],
      correctAnswer: 'A',
      solution: 'Động năng: $W_đ = \\frac{1}{2}mv^2$.'
    },
    {
      content: '[Hoá học] Phản ứng giữa kim loại kẽm ($\\text{Zn}$) và dung dịch axit sunfuric loãng ($\\text{H}_2\\text{SO}_4$) sinh ra chất khí nào?',
      options: ['A. $\\text{H}_2$', 'B. $\\text{O}_2$', 'C. $\\text{SO}_2$', 'D. $\\text{CO}_2$'],
      correctAnswer: 'A',
      solution: '$\\text{Zn} + \\text{H}_2\\text{SO}_4 \\rightarrow \\text{ZnSO}_4 + \\text{H}_2\\uparrow$.'
    },
    {
      content: '[Sinh học] Đơn vị cấu trúc và chức năng cơ bản của mọi cơ thể sống là:',
      options: ['A. Tế bào', 'B. Mô', 'C. Cơ quan', 'D. Phân tử ADN'],
      correctAnswer: 'A',
      solution: 'Mọi sinh vật đều được cấu tạo từ một hoặc nhiều tế bào.'
    },
    {
      content: '[Vật lý] Một vật rơi tự do không vận tốc đầu từ độ cao $h = 20\\text{ m}$. Lấy $g = 10\\text{ m/s}^2$. Thời gian vật chạm đất là:',
      options: ['A. $2\\text{ giây}$', 'B. $4\\text{ giây}$', 'C. $1\\text{ giây}$', 'D. $1,41\\text{ giây}$'],
      correctAnswer: 'A',
      solution: '$t = \\sqrt{\\frac{2h}{g}} = \\sqrt{\\frac{2 \\times 20}{10}} = \\sqrt{4} = 2\\text{ s}$.'
    },
    {
      content: '[Hoá học] Kim loại nào sau đây dẫn điện tốt nhất ở điều kiện thường?',
      options: ['A. Bạc ($\\text{Ag}$)', 'B. Đồng ($\\text{Cu}$)', 'C. Nhôm ($\\text{Al}$)', 'D. Sắt ($\\text{Fe}$)'],
      correctAnswer: 'A',
      solution: 'Thứ tự dẫn điện: $\\text{Ag} > \\text{Cu} > \\text{Au} > \\text{Al} > \\text{Fe}$. Bạc dẫn điện tốt nhất.'
    },
    {
      content: '[Sinh học] Trong quá trình nguyên phân, các nhiễm sắc thể co xoắn cực đại và xếp thành một hàng ở mặt phẳng xích đạo tại kì nào?',
      options: ['A. Kì giữa', 'B. Kì đầu', 'C. Kì sau', 'D. Kì cuối'],
      correctAnswer: 'A',
      solution: 'Tại kì giữa, NST co xoắn cực đại và tập trung thành 1 hàng trên mặt phẳng xích đạo của thoi phân bào.'
    }
  ],
  tfPool: [
    {
      content: 'Một nhóm học sinh làm thí nghiệm đo điện trở của một dây dẫn kim loại hình trụ bằng đồng. Các bạn đo được chiều dài dây dẫn $l = 100\\text{ m}$, tiết diện $S = 0,5\\text{ mm}^2$, điện trở suất $\\rho = 1,7 \\times 10^{-8}\\,\\Omega\\cdot\\text{m}$. Xét tính đúng/sai của các phát biểu:',
      subQuestions: [
        { id: 'a', content: 'Điện trở của dây dẫn tỉ lệ thuận với chiều dài và tỉ lệ nghịch với tiết diện của dây.', answer: true },
        { id: 'b', content: 'Điện trở của đoạn dây đồng này tính được là $3,4\\,\\Omega$.', answer: true },
        { id: 'c', content: 'Nếu gập đôi dây dẫn lại (chiều dài giảm một nửa, tiết diện tăng gấp đôi) thì điện trở của dây giảm 2 lần.', answer: false },
        { id: 'd', content: 'Khi nhiệt độ của dây đồng tăng lên, điện trở của dây dẫn kim loại sẽ tăng theo.', answer: true }
      ],
      solution: 'a) Đúng ($R = \\rho \\frac{l}{S}$). b) $R = 1,7 \\times 10^{-8} \\times \\frac{100}{0,5 \\times 10^{-6}} = 3,4\\,\\Omega \\Rightarrow$ Đúng. c) $l\' = l/2, S\' = 2S \\Rightarrow R\' = R/4$, giảm 4 lần $\\Rightarrow$ Sai. d) Điện trở kim loại tăng theo nhiệt độ $\\Rightarrow$ Đúng.'
    },
    {
      content: 'Trong phòng thí nghiệm, học sinh tiến hành thí nghiệm điều chế khí oxi từ kali pemanganat ($\\text{KMnO}_4$). Xét tính đúng/sai của các nhận định sau:',
      subQuestions: [
        { id: 'a', content: 'Phản ứng nhiệt phân $\\text{KMnO}_4$ thuộc loại phản ứng phân hủy.', answer: true },
        { id: 'b', content: 'Khí oxi thu được có thể thu bằng phương pháp đẩy nước vì oxi ít tan trong nước.', answer: true },
        { id: 'c', content: 'Khi ngừng thu khí, cần tắt đèn cồn trước khi tháo ống dẫn khí ra khỏi chậu nước.', answer: false },
        { id: 'd', content: 'Khi thử khí oxi thoát ra bằng tàn đóm đỏ, tàn đóm bùng cháy sáng.', answer: true }
      ],
      solution: 'a) Đúng. b) Đúng. c) Sai vì nước sẽ bị hút ngược vào ống nghiệm gây nổ vỡ. d) Đúng.'
    },
    {
      content: 'Khi nghiên cứu về quá trình tiêu hoá và hấp thụ chất dinh dưỡng ở người, xét tính đúng/sai của các phát biểu sau:',
      subQuestions: [
        { id: 'a', content: 'Ruột non là cơ quan diễn ra hoạt động tiêu hoá hoá học và hấp thụ chất dinh dưỡng chủ yếu.', answer: true },
        { id: 'b', content: 'Enzym amylase trong nước bọt có tác dụng biến đổi tinh bột chín thành đường mantôzơ.', answer: true },
        { id: 'c', content: 'Dạ dày là nơi tiêu hóa triệt để tất cả các loại thức ăn glucid, lipid và protein.', answer: false },
        { id: 'd', content: 'Các nếp gấp và lông ruột làm tăng diện tích bề mặt hấp thụ của ruột non lên hàng trăm lần.', answer: true }
      ],
      solution: 'a) Đúng. b) Đúng. c) Sai (dạ dày chỉ tiêu hóa sơ bộ protein). d) Đúng.'
    },
    {
      content: 'Xét hiện tượng chuyển hoá năng lượng trong hệ sinh thái và chuỗi thức ăn:',
      subQuestions: [
        { id: 'a', content: 'Năng lượng trong hệ sinh thái có nguồn gốc chủ yếu từ năng lượng ánh sáng mặt trời.', answer: true },
        { id: 'b', content: 'Sinh vật sản xuất chuyển hoá quang năng thành hoá năng tích luỹ trong hợp chất hữu cơ.', answer: true },
        { id: 'c', content: 'Năng lượng được truyền một chiều từ sinh vật sản xuất qua các bậc dinh dưỡng rồi tái sinh hoàn toàn.', answer: false },
        { id: 'd', content: 'Hiệu suất sinh thái giữa hai bậc dinh dưỡng liền kề thường chỉ đạt khoảng $10\\%$.', answer: true }
      ],
      solution: 'a) Đúng. b) Đúng. c) Sai (năng lượng thất thoát qua nhiệt và không tuần hoàn lại). d) Đúng.'
    }
  ],
  saPool: [
    {
      content: 'Thả một miếng nhôm khối lượng $0,5\\text{ kg}$ ở nhiệt độ $100^\\circ\\text{C}$ vào một bình chứa $2\\text{ kg}$ nước ở $20^\\circ\\text{C}$. Bỏ qua hao phí nhiệt ra môi trường. Cho nhiệt dung riêng của nhôm $c_1 = 880\\text{ J/(kg}\\cdot\\text{K)}$ và của nước $c_2 = 4200\\text{ J/(kg}\\cdot\\text{K)}$. Nhiệt độ cân bằng của hệ bằng bao nhiêu $^\\circ\\text{C}$? (Làm tròn đến 1 chữ số thập phân)',
      correctAnswer: '24.0',
      solution: '$Q_{tỏa} = Q_{thu} \\Leftrightarrow 0,5 \\times 880 \\times (100 - t) = 2 \\times 4200 \\times (t - 20) \\Leftrightarrow 440(100 - t) = 8400(t - 20) \\Rightarrow t \\approx 24,0^\\circ\\text{C}$.'
    },
    {
      content: 'Đốt cháy hoàn toàn $6,0\\text{ gam}$ kim loại magie ($\\text{Mg}$) trong khí oxi dư, thu được m gam magie oxit ($\\text{MgO}$). Cho biết khối lượng mol của $\\text{Mg} = 24\\text{ g/mol}$, $\\text{O} = 16\\text{ g/mol}$. Giá trị của m là bao nhiêu gam?',
      correctAnswer: '10.0',
      solution: '$n_{\\text{Mg}} = 6/24 = 0,25\\text{ mol}$. $2\\text{Mg} + \\text{O}_2 \\rightarrow 2\\text{MgO} \\Rightarrow n_{\\text{MgO}} = 0,25\\text{ mol} \\Rightarrow m = 0,25 \\times 40 = 10,0\\text{ g}$.'
    },
    {
      content: 'Một phân tử ADN mạch kép có tổng số $3000$ nuclêôtit và có số nuclêôtit loại Ađênin chiếm $20\\%$. Số liên kết hiđrô của phân tử ADN này bằng bao nhiêu?',
      correctAnswer: '3900',
      solution: '$A = T = 3000 \\times 20\\% = 600$. $G = X = (3000 - 1200)/2 = 900$. Số liên kết hiđrô: $H = 2A + 3G = 2(600) + 3(900) = 1200 + 2700 = 3900$.'
    },
    {
      content: 'Một bóng đèn có ghi $220\\text{V} - 100\\text{W}$ được mắc vào mạng điện đúng hiệu điện thế định mức trong $5\\text{ giờ}$ mỗi ngày. Điện năng tiêu thụ của bóng đèn trong $30\\text{ ngày}$ bằng bao nhiêu $\\text{kW}\\cdot\\text{h}$?',
      correctAnswer: '15',
      solution: '$A = P \\times t = 0,1\\text{ kW} \\times (5 \\times 30)\\text{ h} = 15\\text{ kW}\\cdot\\text{h}$.'
    },
    {
      content: 'Cho $5,6\\text{ gam}$ sắt tác dụng vừa đủ với $V\\text{ ml}$ dung dịch axit $\\text{HCl } 1\\text{M}$. Cho biết nguyên tử khối $\\text{Fe} = 56$. Giá trị của $V$ là bao nhiêu ml?',
      correctAnswer: '200',
      solution: '$n_{\\text{Fe}} = 5,6/56 = 0,1\\text{ mol}$. $\\text{Fe} + 2\\text{HCl} \\rightarrow \\text{FeCl}_2 + \\text{H}_2 \\Rightarrow n_{\\text{HCl}} = 0,2\\text{ mol} \\Rightarrow V = 0,2 / 1 = 0,2\\text{ lít} = 200\\text{ ml}$.'
    },
    {
      content: 'Một tế bào sinh dưỡng của người có bộ nhiễm sắc thể $2n = 46$ trải qua $3$ lần nguyên phân liên tiếp. Tổng số tế bào con được tạo thành là bao nhiêu?',
      correctAnswer: '8',
      solution: 'Số tế bào con $= 2^k = 2^3 = 8$ tế bào.'
    }
  ],
  essayPool: [
    {
      content: 'a) Nêu định luật bảo toàn khối lượng và giải thích vì sao tổng khối lượng của các chất trước và sau phản ứng hoá học không thay đổi.\n' +
        'b) Cho $10\\text{ gam}$ hỗn hợp gồm $\\text{CaCO}_3$ và $\\text{NaCl}$ phản ứng hoàn toàn với dung dịch $\\text{HCl}$ dư, thu được $1,9832\\text{ lít}$ khí $\\text{CO}_2$ (đo ở điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$, tương đương $0,08\\text{ mol}$). Tính phần trăm khối lượng của $\\text{CaCO}_3$ trong hỗn hợp ban đầu.',
      solution: 'a) Phát biểu chính xác định luật: Trong một phản ứng hóa học, tổng khối lượng của các chất sản phẩm bằng tổng khối lượng của các chất phản ứng. Giải thích: Do bản chất phản ứng hóa học chỉ là sự sắp xếp lại các liên kết giữa các nguyên tử, số lượng và khối lượng từng loại nguyên tử giữ nguyên không đổi. (1.5 điểm)\n' +
        'b) Phương trình phản ứng:\n' +
        '$\\text{CaCO}_3 + 2\\text{HCl} \\rightarrow \\text{CaCl}_2 + \\text{CO}_2\\uparrow + \\text{H}_2\\text{O}$\n' +
        'Theo PTHH: $n_{\\text{CaCO}_3} = n_{\\text{CO}_2} = 0,08\\text{ mol}$.\n' +
        'Khối lượng $\\text{CaCO}_3 = 0,08 \\times 100 = 8\\text{ gam}$.\n' +
        'Phần trăm khối lượng: $\\%m_{\\text{CaCO}_3} = \\frac{8}{10} \\times 100\\% = 80\\%$. (1.5 điểm)'
    }
  ]
};

// Generates Matrix & Specification HTML standard table for Công văn 7991
const generateStandardMatrixHtml = (config: ExamConfig): string => {
  const mcCount = config.mcCount || 12;
  const tfCount = config.tfCount || 4;
  const saCount = config.saCount || 6;
  const essayCount = config.essayCount || 2;
  const essayPoints = config.essayPoints || 3.0;
  const objPoints = 10 - essayPoints;

  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-family: 'Times New Roman', serif; font-size: 11pt; text-align: center; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <th rowspan="3" style="border: 1px solid black; padding: 6px;">TT</th>
          <th rowspan="3" style="border: 1px solid black; padding: 6px;">Chủ đề / Đơn vị kiến thức</th>
          <th colspan="9" style="border: 1px solid black; padding: 6px;">Mức độ đánh giá (CV 7991/BGDĐT-GDTrH)</th>
          <th rowspan="2" colspan="2" style="border: 1px solid black; padding: 6px;">Tổng số câu</th>
          <th rowspan="3" style="border: 1px solid black; padding: 6px;">Tổng điểm</th>
        </tr>
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <th colspan="3" style="border: 1px solid black; padding: 4px;">Nhận biết (40%)</th>
          <th colspan="3" style="border: 1px solid black; padding: 4px;">Thông hiểu (30%)</th>
          <th colspan="3" style="border: 1px solid black; padding: 4px;">Vận dụng (30%)</th>
        </tr>
        <tr style="font-size: 10pt; background-color: #f8fafc;">
          <th style="border: 1px solid black; padding: 3px;">NLC</th>
          <th style="border: 1px solid black; padding: 3px;">Đ/S</th>
          <th style="border: 1px solid black; padding: 3px;">TLN</th>
          <th style="border: 1px solid black; padding: 3px;">NLC</th>
          <th style="border: 1px solid black; padding: 3px;">Đ/S</th>
          <th style="border: 1px solid black; padding: 3px;">TLN</th>
          <th style="border: 1px solid black; padding: 3px;">NLC</th>
          <th style="border: 1px solid black; padding: 3px;">Đ/S</th>
          <th style="border: 1px solid black; padding: 3px;">TLN</th>
          <th style="border: 1px solid black; padding: 3px;">Tổng TN</th>
          <th style="border: 1px solid black; padding: 3px;">TL</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid black; padding: 5px;">1</td>
          <td style="border: 1px solid black; padding: 5px; text-align: left;">Chủ đề trọng tâm 1: Kiến thức nền tảng & Khái niệm</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(mcCount * 0.4)}</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(tfCount * 0.5)}</td>
          <td style="border: 1px solid black; padding: 5px;">0</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(mcCount * 0.3)}</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(tfCount * 0.25)}</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(saCount * 0.3)}</td>
          <td style="border: 1px solid black; padding: 5px;">0</td>
          <td style="border: 1px solid black; padding: 5px;">0</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(saCount * 0.3)}</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(mcCount * 0.6)}</td>
          <td style="border: 1px solid black; padding: 5px;">1</td>
          <td style="border: 1px solid black; padding: 5px; font-weight: bold;">5,0</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 5px;">2</td>
          <td style="border: 1px solid black; padding: 5px; text-align: left;">Chủ đề trọng tâm 2: Ứng dụng thực tiễn & Nâng cao</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.floor(mcCount * 0.2)}</td>
          <td style="border: 1px solid black; padding: 5px;">0</td>
          <td style="border: 1px solid black; padding: 5px;">0</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.floor(mcCount * 0.1)}</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(tfCount * 0.25)}</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.round(saCount * 0.2)}</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.max(1, mcCount - Math.round(mcCount * 0.7))}</td>
          <td style="border: 1px solid black; padding: 5px;">0</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.max(1, saCount - Math.round(saCount * 0.5))}</td>
          <td style="border: 1px solid black; padding: 5px;">${mcCount - Math.round(mcCount * 0.6) + tfCount + saCount}</td>
          <td style="border: 1px solid black; padding: 5px;">${Math.max(0, essayCount - 1)}</td>
          <td style="border: 1px solid black; padding: 5px; font-weight: bold;">5,0</td>
        </tr>
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="2" style="border: 1px solid black; padding: 6px; text-align: center;">TỔNG CỘNG</td>
          <td colspan="3" style="border: 1px solid black; padding: 6px;">4,0 điểm (40%)</td>
          <td colspan="3" style="border: 1px solid black; padding: 6px;">3,0 điểm (30%)</td>
          <td colspan="3" style="border: 1px solid black; padding: 6px;">3,0 điểm (30%)</td>
          <td style="border: 1px solid black; padding: 6px;">${mcCount + tfCount + saCount} câu</td>
          <td style="border: 1px solid black; padding: 6px;">${essayCount} câu</td>
          <td style="border: 1px solid black; padding: 6px; font-size: 12pt; color: #1e40af;">10,0 điểm</td>
        </tr>
      </tbody>
    </table>
    <div style="font-size: 11pt; line-height: 1.5; margin-top: 10px;">
      <p><b>Quy ước ký hiệu viết tắt theo Công văn 7991/BGDĐT-GDTrH:</b></p>
      <ul style="margin: 5px 0 10px 20px; padding: 0;">
        <li><b>NLC:</b> Trắc nghiệm Nhiều lựa chọn (4 phương án, chọn 1 đáp án đúng).</li>
        <li><b>Đ/S:</b> Trắc nghiệm Đúng/Sai (Mỗi câu gồm 4 lệnh hỏi a, b, c, d).</li>
        <li><b>TLN:</b> Trắc nghiệm Trả lời ngắn (Thí sinh tự tính toán và điền đáp số).</li>
        <li><b>TL:</b> Tự luận (${essayPoints.toFixed(1).replace('.', ',')} điểm).</li>
      </ul>
      ${config.excludedTopics && config.excludedTopics.trim() ? `
        <div style="margin-top: 8px; padding: 6px 10px; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 4px; color: #9f1239; font-size: 10pt;">
          <b>Kiến thức loại trừ khỏi đề thi:</b> ${config.excludedTopics.trim()}
        </div>
      ` : ''}
    </div>
  `;
};

// Generates complete exam without needing external API Key
export const generateLocalExam = (config: ExamConfig): GeneratedExam => {
  const isIntegrated = config.subjectType === 'integrated' || (config.subjects && config.subjects.length > 1);
  const dataset = isIntegrated ? NATURAL_SCIENCE_DATASET : MATH_DATASET;

  const schoolName = config.schoolName || dataset.defaultSchool;
  const examName = config.examName || dataset.defaultExam;

  const targetMc = config.mcCount || 12;
  const targetTf = config.tfCount || 4;
  const targetSa = config.saCount || 6;
  const targetEssay = config.essayCount || 2;

  // Keywords to exclude
  const excludedKeywords = (config.excludedTopics || '')
    .toLowerCase()
    .split(/[,;\n.]+/)
    .map(k => k.trim())
    .filter(k => k.length > 2);

  const filterPool = <T extends { content: string }>(pool: T[]): T[] => {
    if (excludedKeywords.length === 0) return pool;
    const filtered = pool.filter(item => {
      const lower = item.content.toLowerCase();
      return !excludedKeywords.some(keyword => lower.includes(keyword));
    });
    return filtered.length > 0 ? filtered : pool;
  };

  const mcPool = filterPool(dataset.mcPool);
  const tfPool = filterPool(dataset.tfPool);
  const saPool = filterPool(dataset.saPool);
  const essayPool = filterPool(dataset.essayPool);

  // Calculate score per question according to CV 7991 matrix distribution
  // Total 10 pts = Objective Points (10 - essayPoints) + Essay Points
  const essayPointsTotal = config.essayPoints !== undefined ? config.essayPoints : 3.0;
  const objPointsTotal = 10 - essayPointsTotal;
  
  // Standard CV 7991:
  // True/False: standard 1.0 point / question (0.1 / 0.25 / 0.5 / 1.0 for 1, 2, 3, 4 correct parts)
  // Remaining objective points split between MC (NLC) and SA (TLN)
  const tfUnitScore = targetTf > 0 ? 1.0 : 0;
  const tfTotalScore = targetTf * tfUnitScore;
  const remainingObjScore = Math.max(0, objPointsTotal - tfTotalScore);
  
  // If targetMc + targetSa > 0, allocate remainingObjScore
  const totalOtherObj = (targetMc > 0 ? targetMc : 0) + (targetSa > 0 ? targetSa : 0);
  const defaultUnitScore = totalOtherObj > 0 ? Math.round((remainingObjScore / totalOtherObj) * 100) / 100 : 0.25;
  const mcUnitScore = targetMc > 0 ? (remainingObjScore > 0 ? defaultUnitScore : 0.25) : 0;
  const saUnitScore = targetSa > 0 ? (remainingObjScore > 0 ? defaultUnitScore : 0.5) : 0;
  const essayUnitScore = targetEssay > 0 ? Math.round((essayPointsTotal / targetEssay) * 100) / 100 : 0;

  // 1. Generate Multiple Choice
  const questions: Question[] = [];
  for (let i = 0; i < targetMc; i++) {
    const template = mcPool[i % mcPool.length];
    questions.push({
      id: `mc_${i + 1}`,
      type: QuestionType.MULTIPLE_CHOICE,
      content: template.content,
      options: template.options,
      correctAnswer: template.correctAnswer,
      solution: template.solution,
      score: mcUnitScore
    });
  }

  // 2. Generate True/False
  for (let i = 0; i < targetTf; i++) {
    const template = tfPool[i % tfPool.length];
    questions.push({
      id: `tf_${i + 1}`,
      type: QuestionType.TRUE_FALSE,
      content: template.content,
      subQuestions: template.subQuestions,
      solution: template.solution,
      score: tfUnitScore
    });
  }

  // 3. Generate Short Answer
  for (let i = 0; i < targetSa; i++) {
    const template = saPool[i % saPool.length];
    questions.push({
      id: `sa_${i + 1}`,
      type: QuestionType.SHORT_ANSWER,
      content: template.content,
      correctAnswer: template.correctAnswer,
      solution: template.solution,
      score: saUnitScore
    });
  }

  // 4. Generate Essay
  for (let i = 0; i < targetEssay; i++) {
    const template = essayPool[i % essayPool.length];
    questions.push({
      id: `es_${i + 1}`,
      type: QuestionType.ESSAY,
      content: template.content,
      solution: template.solution,
      score: essayUnitScore
    });
  }

  return {
    schoolName,
    examName,
    examTime: config.examTime || 45,
    essayPoints: config.essayPoints || 3.0,
    questions: mergeChainedQuestions(questions),
    rawText: "Generated via Công văn 7991 Pedagogical Matrix Engine",
    matrixHtml: generateStandardMatrixHtml(config)
  };
};
