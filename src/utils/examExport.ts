import { ExamQuestion } from '../types';

// 1. Xuất danh sách câu hỏi Đề thi ra CSV
export const exportExamQuestionsToCsv = (questions: ExamQuestion[]) => {
  const headers = ['Mã', 'Phần', 'Ban', 'Dạng câu hỏi', 'Độ khó', 'Điểm', 'Đề bài', 'Lựa chọn (A|B|C|D)', 'Đáp án chuẩn', 'Hướng dẫn chấm'];
  
  const rows = questions.map(q => [
    `"${q.code || ''}"`,
    `"${q.sectionKey || ''}"`,
    `"${q.department || 'common'}"`,
    `"${q.category || ''}"`,
    `"${q.difficulty || ''}"`,
    q.points || 0,
    `"${(q.title || '').replace(/"/g, '""')}"`,
    `"${(q.options || []).join(' | ').replace(/"/g, '""')}"`,
    `"${(q.correctAnswer || '').replace(/"/g, '""')}"`,
    `"${(q.rubric || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Ngan_Hang_De_Thi_STEM_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 2. Parser Nhập dữ liệu CSV vào ứng dụng
export const parseExamQuestionsFromCsv = (csvText: string): Partial<ExamQuestion>[] => {
  const lines = csvText.split(/\r\n|\n/);
  if (lines.length < 2) return [];

  const results: Partial<ExamQuestion>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Tách dòng bằng regex phân cách dấu phẩy không nằm trong ngoặc kép
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

    if (cleanCols.length >= 7) {
      results.push({
        id: `exam_q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        code: cleanCols[0] || `EXAM-${Math.floor(Math.random() * 1000)}`,
        sectionKey: cleanCols[1] || 'kien_thuc',
        department: (cleanCols[2] as any) || 'common',
        category: (cleanCols[3] as any) || 'trac_nghiem',
        difficulty: (cleanCols[4] as any) || 'trung_binh',
        points: parseFloat(cleanCols[5]) || 10,
        title: cleanCols[6] || '',
        options: cleanCols[7] ? cleanCols[7].split('|').map(s => s.trim()) : [],
        correctAnswer: cleanCols[8] || '',
        rubric: cleanCols[9] || ''
      });
    }
  }

  return results;
};