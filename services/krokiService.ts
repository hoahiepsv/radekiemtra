
export const fetchTikzImage = async (tikzCode: string, format: 'png' | 'svg' = 'png'): Promise<Blob | null> => {
    try {
        let cleanCode = tikzCode.trim();

        // Tự động bao bọc mã TikZ bằng document class nếu chưa có
        // Bổ sung tkz-euclide và các thư viện cần thiết cho Toán học VN
        // Cấu hình màu sắc nét vẽ: Xanh đen (blue!40!black) để đảm bảo độ nét và thẩm mỹ
        if (!cleanCode.includes('\\documentclass')) {
            cleanCode = `\\documentclass[border=10pt]{standalone}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=newest}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{mathrsfs}
\\usepackage{tkz-euclide}
\\usepackage{xcolor}
\\usetikzlibrary{shapes,arrows,calc,positioning,patterns,intersections,angles,quotes,decorations.markings,backgrounds,fit}

% CẤU HÌNH MÀU SẮC CHUNG
\\tikzset{every picture/.style={line width=0.8pt}}
\\tikzset{every path/.style={draw=blue!40!black}} % Màu nét vẽ: Xanh đen đậm
\\tikzset{every node/.style={text=black}} % Màu chữ: Đen (để dễ đọc)

\\begin{document}
${cleanCode}
\\end{document}`;
        }

        // Sử dụng Kroki public API để render TikZ
        // Lưu ý: Kroki hỗ trợ trả về PNG trực tiếp, phù hợp để chèn vào Word hoặc hiển thị dạng ảnh tĩnh
        const response = await fetch(`https://kroki.io/tikz/${format}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                diagram_source: cleanCode,
                diagram_options: {
                    "font-family": "Times New Roman"
                }
            })
        });

        if (!response.ok) {
            console.warn(`Kroki rendering failed (${format}):`, await response.text());
            return null;
        }
        return await response.blob();
    } catch (e) {
        console.error("Error fetching TikZ image:", e);
        return null;
    }
};
