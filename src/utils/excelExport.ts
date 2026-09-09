import * as XLSX from 'xlsx';
import { Candidate, DEPARTMENTS, Department, InterviewQuestion, QuestionBankItem, SectionKey, BareemConfig } from '../types';
import { parseDepartments } from '../data/defaultCandidates';

const RESULT_LABELS: Record<string, string> = {
  pass: 'ĐẬU (TRÚNG TUYỂN)',
  reserve: 'DỰ BỊ (CHỜ XÉT)',
  fail: 'TRƯỢT',
  not_evaluated: 'CHƯA PHỎNG VẤN',
};

const SECTION_NAMES: Record<SectionKey, string> = {
  competence: 'Phần I. Năng Lực & Kinh Nghiệm Chuyên Môn',
  eq: 'Phần II. EQ & Kỹ Năng Làm Việc Nhóm',
  situation: 'Phần III. Xử Lý Tình Huống Thực Tế',
  attitude: 'Phần IV. Thái Độ, Cam Kết & Trách Nhiệm',
  bonus: 'Phần Điểm Cộng',
};

/**
 * Downloads text as a file with UTF-8 BOM so Vietnamese displays perfectly in Excel.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * 1. Export detailed individual candidate interview transcript to CSV
 * Includes Candidate name, email, facebook, class, list of questions, scores (a/x),
 * section subtotals, final total score, and result classification (Trượt, Dự bị, Đậu).
 */
export function exportCandidateInterviewCsv(candidate: Candidate, bareemConfig?: BareemConfig) {
  const safeName = candidate.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  const filename = `Ket_Qua_PV_${safeName}_${candidate.className}.csv`;
  const deptsText = candidate.departments.map((d) => DEPARTMENTS[d]?.name || d).join(', ');
  const resultText = RESULT_LABELS[candidate.result] || candidate.result;

  const lines: string[] = [];

  // Metadata headers
  lines.push(`"BÁO CÁO CHI TIẾT KẾT QUẢ PHỎNG VẤN THÍ SINH - CLB STEM"`);
  lines.push(`"Thời gian phỏng vấn",${escapeCsvCell(candidate.interviewedAt ? new Date(candidate.interviewedAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'))}`);
  lines.push(`"Họ và tên thí sinh",${escapeCsvCell(candidate.name)}`);
  lines.push(`"Lớp",${escapeCsvCell(candidate.className)}`);
  lines.push(`"Email",${escapeCsvCell(candidate.email || 'N/A')}`);
  lines.push(`"Link Facebook",${escapeCsvCell(candidate.facebookUrl || 'N/A')}`);
  lines.push(`"Số điện thoại",${escapeCsvCell(candidate.phone || 'N/A')}`);
  lines.push(`"Ban ứng tuyển",${escapeCsvCell(deptsText)}`);
  lines.push(`"Người phỏng vấn (GK)",${escapeCsvCell(candidate.interviewerName || 'Hội đồng phỏng vấn CLB STEM')}`);
  lines.push(`"TỔNG ĐIỂM CUỐI CÙNG",${escapeCsvCell(`${candidate.totalScore} / ${candidate.maxScore || 100} điểm`)}`);
  lines.push(`"PHÂN LOẠI KẾT QUẢ",${escapeCsvCell(resultText)}`);
  if (bareemConfig) {
    lines.push(`"Tiêu chuẩn phân loại",${escapeCsvCell(`Đậu: >= ${bareemConfig.passThreshold}đ | Dự bị: >= ${bareemConfig.reserveThreshold}đ | Trượt: < ${bareemConfig.reserveThreshold}đ`)}`);
  }
  if (candidate.generalNotes) {
    lines.push(`"Nhận xét chung của GK",${escapeCsvCell(candidate.generalNotes)}`);
  }
  lines.push(''); // blank row

  // Section summary table
  lines.push(`"BẢNG ĐIỂM TỔNG HỢP THEO TỪNG PHẦN ĐÁNH GIÁ"`);
  lines.push([
    'Phần đánh giá',
    'Điểm đạt được (a)',
    'Điểm tối đa (x)',
    'Tỷ lệ đạt (%)',
  ].map(escapeCsvCell).join(','));

  const sec = candidate.sectionScores || {
    competence: { awarded: 0, max: 15 },
    eq: { awarded: 0, max: 20 },
    situation: { awarded: 0, max: 35 },
    attitude: { awarded: 0, max: 30 },
    bonus: { awarded: 0, max: 0 },
  };

  const sectionsList: SectionKey[] = ['competence', 'eq', 'situation', 'attitude'];
  sectionsList.forEach((key) => {
    const s = sec[key] || { awarded: 0, max: 0 };
    const pct = s.max > 0 ? Math.round((s.awarded / s.max) * 1000) / 10 : 0;
    lines.push([
      SECTION_NAMES[key] || key,
      s.awarded,
      s.max,
      `${pct}%`,
    ].map(escapeCsvCell).join(','));
  });

  lines.push([
    'TỔNG CỘNG CHUNG',
    candidate.totalScore,
    candidate.maxScore || 100,
    candidate.maxScore > 0 ? `${Math.round((candidate.totalScore / candidate.maxScore) * 1000) / 10}%` : '0%',
  ].map(escapeCsvCell).join(','));

  lines.push(''); // blank row

  // Detailed Table of questions asked
  lines.push(`"DANH SÁCH CHI TIẾT CÂU HỎI ĐÃ HỎI VÀ ĐIỂM SỐ"`);
  lines.push([
    'STT',
    'Mã câu hỏi',
    'Mục phân loại',
    'Câu hỏi bắt buộc',
    'Ban phụ trách',
    'Nội dung câu hỏi',
    'Điểm số (a/x)',
    'Điểm chấm (a)',
    'Điểm tối đa (x)',
    'Ghi chú / Câu trả lời của thí sinh',
    'Tiêu chí chấm điểm (Rubric)',
  ].map(escapeCsvCell).join(','));

  const questions = candidate.interviewQuestions || [];
  questions.forEach((q, idx) => {
    const deptLabel = q.department === 'common' ? 'Chung' : DEPARTMENTS[q.department]?.shortName || q.department;
    const scoreStr = q.awardedScore !== null ? `${q.awardedScore}/${q.maxPoints}` : `Chưa chấm/${q.maxPoints}`;

    lines.push([
      idx + 1,
      q.bankQuestionId || `Q_${idx + 1}`,
      q.sectionTitle,
      q.isFixed ? 'True (Bắt buộc)' : 'False (Ngẫu nhiên)',
      deptLabel,
      q.text,
      scoreStr,
      q.awardedScore !== null ? q.awardedScore : '',
      q.maxPoints,
      q.candidateAnswerNote || '',
      q.rubric || '',
    ].map(escapeCsvCell).join(','));
  });

  // UTF-8 BOM for Excel compatibility
  const csvContent = '\uFEFF' + lines.join('\r\n');
  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * 2. Export all candidates summary table to Excel (.xlsx) and CSV
 */
export function exportCandidatesSummaryExcel(candidates: Candidate[], fileType: 'xlsx' | 'csv' = 'xlsx') {
  const timestamp = new Date().toISOString().slice(0, 10);
  const rows = candidates.map((c, index) => {
    const depts = c.departments.map((d) => DEPARTMENTS[d]?.shortName || d).join(', ');
    const sec = c.sectionScores || {
      competence: { awarded: 0, max: 15 },
      eq: { awarded: 0, max: 20 },
      situation: { awarded: 0, max: 35 },
      attitude: { awarded: 0, max: 30 },
      bonus: { awarded: 0, max: 0 },
    };

    return {
      'STT': index + 1,
      'Họ và tên': c.name,
      'Lớp': c.className,
      'Ban ứng tuyển': depts,
      'Năng lực (15đ)': sec.competence ? sec.competence.awarded : '',
      'EQ (20đ)': sec.eq ? sec.eq.awarded : '',
      'Tình huống (35đ)': sec.situation ? sec.situation.awarded : '',
      'Thái độ (30đ)': sec.attitude ? sec.attitude.awarded : '',
      'Tổng điểm': c.totalScore,
      'Điểm chuẩn': c.maxScore || 100,
      'Kết quả': RESULT_LABELS[c.result] || c.result,
      'Trạng thái': c.status === 'completed' ? 'Đã phỏng vấn' : (c.status === 'in_progress' ? 'Đang phỏng vấn' : 'Chưa phỏng vấn'),
      'Số điện thoại': c.phone || '',
      'Email': c.email || '',
      'Giới thiệu bản thân': c.introduction || '',
      'Kinh nghiệm kỹ thuật': c.experienceTechnical || '',
      'Kinh nghiệm truyền thông': c.experienceMedia || '',
      'Kỹ năng làm việc nhóm': c.experienceTeamwork || '',
      'Ngôn ngữ lập trình': c.languages || '',
      'Nhận xét chung': c.generalNotes || '',
      'Thời gian phỏng vấn': c.interviewedAt ? new Date(c.interviewedAt).toLocaleString('vi-VN') : '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  // Auto-width columns
  const colWidths = [
    { wch: 6 }, // STT
    { wch: 22 }, // Họ tên
    { wch: 10 }, // Lớp
    { wch: 24 }, // Ban
    { wch: 15 }, // Năng lực
    { wch: 12 }, // EQ
    { wch: 16 }, // Tình huống
    { wch: 15 }, // Thái độ
    { wch: 12 }, // Tổng điểm
    { wch: 12 }, // Điểm chuẩn
    { wch: 18 }, // Kết quả
    { wch: 16 }, // Trạng thái
    { wch: 14 }, // SĐT
    { wch: 25 }, // Email
    { wch: 30 }, // Giới thiệu
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KetQuaPhongVan');

  if (fileType === 'xlsx') {
    XLSX.writeFile(workbook, `Danh_Sach_Ket_Qua_Phong_Van_${timestamp}.xlsx`);
  } else {
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    downloadFile('\uFEFF' + csvOutput, `Danh_Sach_Ket_Qua_Phong_Van_${timestamp}.csv`, 'text/csv');
  }
}

/**
 * 3. Import Candidates from CSV or Excel file
 */
export async function importCandidatesFromFile(file: File): Promise<Candidate[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const importedCandidates: Candidate[] = rawJson.map((row, index) => {
          // Flexible key lookup to support both Vietnamese column names and original Google Form fields
          const name = row['Họ và tên'] || row['Họ và tên thí sinh'] || row['Tên'] || row['Name'] || row['Full Name'] || `Thí sinh ${index + 1}`;
          const className = row['Lớp'] || row['Class'] || 'N/A';
          const rawDept = row['Bạn muốn ứng tuyển vào những ban nào?'] || row['Ban ứng tuyển'] || row['Ban'] || row['Department'] || '';
          const departments = parseDepartments(String(rawDept));
          
          return {
            id: `imported_${Date.now()}_${index}`,
            submissionId: row['Submission ID'] || row['Mã'] || `SUB_${index + 1}`,
            name: String(name).trim(),
            className: String(className).trim(),
            departments,
            isMultiDepartment: departments.length > 1,
            email: row['Email'] || '',
            phone: String(row['Số điện thoại cá nhân'] || row['Số điện thoại'] || row['Phone'] || '').trim(),
            facebookUrl: row['Link Facebook'] || row['Facebook'] || '',
            introduction: row['Bạn cho chúng mình biết về bản thân được không?'] || row['Giới thiệu bản thân'] || '',
            experienceMedia: row['Bạn đã từng có kinh nghiệm viết content, design, chụp ảnh, quay/chỉnh sửa video hoặc quản lý mạng xã hội chưa?'] || row['Kinh nghiệm truyền thông'] || '',
            experienceTeamwork: row['Bạn đã từng tham gia hoạt động nào yêu cầu giao tiếp, làm việc nhóm hoặc kết nối với người khác chưa?'] || row['Kỹ năng làm việc nhóm'] || '',
            languages: row['Bạn biết những ngôn ngữ lập trình nào?'] || row['Ngôn ngữ lập trình'] || '',
            experienceTechnical: row['Bạn đã từng có kinh nghiệm về kỹ thuật, công nghệ, lắp ráp, chế tạo hoặc sử dụng các thiết bị/công cụ nào chưa?'] || row['Kinh nghiệm kỹ thuật'] || '',
            status: 'pending' as const,
            result: 'not_evaluated' as const,
            totalScore: 0,
            maxScore: 100,
          };
        }).filter((c) => c.name.length > 0);

        resolve(importedCandidates);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * 4. Export Question Bank to CSV and Excel with standardized structure:
 * ID câu hỏi, Nội dung câu hỏi, Điểm số, Ban phụ trách, Mục phân loại, Câu hỏi bắt buộc, Tiêu chí chấm điểm
 */
export function exportQuestionBankCsv(questions: QuestionBankItem[]) {
  const filename = `Ngan_Hang_Cau_Hoi_${new Date().toISOString().slice(0, 10)}.csv`;
  const lines: string[] = [];

  // Standard requested header
  lines.push([
    'ID câu hỏi',
    'Nội dung câu hỏi',
    'Điểm số',
    'Ban phụ trách',
    'Mục phân loại',
    'Câu hỏi bắt buộc',
    'Tiêu chí chấm điểm',
  ].map(escapeCsvCell).join(','));

  const sectionLabelMap: Record<SectionKey, string> = {
    competence: 'Năng lực',
    eq: 'EQ',
    situation: 'Tình huống',
    attitude: 'Thái độ',
    bonus: 'Điểm cộng',
  };

  const deptLabelMap: Record<string, string> = {
    ky_thuat: 'Kỹ Thuật',
    truyen_thong: 'Truyền Thông',
    doi_ngoai: 'Đối Ngoại',
    hau_can: 'Hậu Cần',
    common: 'Chung',
  };

  questions.forEach((q) => {
    lines.push([
      q.id,
      q.text,
      q.defaultPoints,
      deptLabelMap[q.department] || q.department,
      sectionLabelMap[q.sectionKey] || q.sectionTitle,
      q.isFixed ? 'True' : 'False',
      q.rubric || '',
    ].map(escapeCsvCell).join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  downloadFile(csvContent, filename, 'text/csv');
}

export function downloadSampleQuestionBankCsv() {
  const filename = 'Mau_Ngan_Hang_Cau_Hoi_Chuan.csv';
  const sampleRows = [
    ['ID câu hỏi', 'Nội dung câu hỏi', 'Điểm số', 'Ban phụ trách', 'Mục phân loại', 'Câu hỏi bắt buộc', 'Tiêu chí chấm điểm'],
    ['Q_KT_FIXED_01', 'Em đã từng lập trình hoặc lắp ráp thiết bị/robot nào chưa? Hãy mô tả quy trình thực hiện một sản phẩm em tự hào nhất.', '7.5', 'Kỹ Thuật', 'Năng lực', 'True', 'Đánh giá kinh nghiệm thực chiến, tư duy giải thuật, khả năng debug và đam mê kỹ thuật.'],
    ['Q_KT_RND_02', 'Nếu mạch điều khiển động cơ bị nóng bất thường và bốc khói nhẹ trong buổi test, các bước kiểm tra xử lý an toàn của em là gì?', '7.5', 'Kỹ Thuật', 'Năng lực', 'False', 'Đánh giá kiến thức an toàn điện, quy trình cô lập nguồn và đoản mạch.'],
    ['Q_TT_FIXED_01', 'Em thường sử dụng công cụ nào để thiết kế hoặc dựng video (Canva, Photoshop, Premiere, CapCut...)? Hãy chia sẻ về một ấn phẩm em từng làm.', '7.5', 'Truyền Thông', 'Năng lực', 'True', 'Đánh giá gu thẩm mỹ, kỹ năng dùng phần mềm và khả năng kể chuyện bằng hình ảnh.'],
    ['Q_DN_FIXED_01', 'Khi cần liên hệ xin tài trợ hoặc kết nối với diễn giả cho workshop khoa học của CLB, em sẽ chuẩn bị hồ sơ và tiếp cận ra sao?', '7.5', 'Đối Ngoại', 'Năng lực', 'True', 'Đánh giá kỹ năng soạn thảo email đối ngoại, tính chuyên nghiệp và đàm phán.'],
    ['Q_HC_FIXED_01', 'Trước một ngày diễn ra sự kiện ngày hội STEM với 300 người tham gia, em sẽ lên danh sách checklist vật tư và phân công hậu cần thế nào?', '7.5', 'Hậu Cần', 'Năng lực', 'True', 'Đánh giá tính tỉ mỉ, khả năng lập kế hoạch và quản lý rủi ro.'],
    ['Q_EQ_FIXED_01', 'Trong nhóm có một bạn không hoàn thành phần việc được giao khiến cả nhóm trễ hạn nộp dự án, em sẽ trao đổi với bạn ấy như thế nào?', '10', 'Chung', 'EQ', 'True', 'Lắng nghe, thấu cảm, giải quyết vấn đề mang tính xây dựng thay vì đổ lỗi.'],
    ['Q_SIT_FIXED_01', 'Sát giờ thuyết trình dự án trước ban giám khảo cuộc thi, máy tính demo bị lỗi không nhận driver cảm biến, em xử lý tình huống ra sao?', '17.5', 'Chung', 'Tình huống', 'True', 'Bình tĩnh, chuyển phương án dự phòng (video demo, slides giải thích nguyên lý), báo cáo rõ ràng.'],
    ['Q_ATT_FIXED_01', 'Thời gian thi học kỳ trùng với tuần cao điểm chuẩn bị cuộc thi STEM lớn của CLB, em sẽ cân bằng thời gian và trách nhiệm ra sao?', '15', 'Chung', 'Thái độ', 'True', 'Cam kết trách nhiệm, kỹ năng quản lý thời gian và tinh thần chủ động báo trước nếu quá tải.'],
  ];

  const csv = '\uFEFF' + sampleRows.map((r) => r.map(escapeCsvCell).join(',')).join('\r\n');
  downloadFile(csv, filename, 'text/csv');
}

export function exportQuestionBankExcel(questions: QuestionBankItem[]) {
  const sectionLabelMap: Record<SectionKey, string> = {
    competence: 'Năng lực',
    eq: 'EQ',
    situation: 'Tình huống',
    attitude: 'Thái độ',
    bonus: 'Điểm cộng',
  };

  const deptLabelMap: Record<string, string> = {
    ky_thuat: 'Kỹ Thuật',
    truyen_thong: 'Truyền Thông',
    doi_ngoai: 'Đối Ngoại',
    hau_can: 'Hậu Cần',
    common: 'Chung',
  };

  const rows = questions.map((q) => ({
    'ID câu hỏi': q.id,
    'Nội dung câu hỏi': q.text,
    'Điểm số': q.defaultPoints,
    'Ban phụ trách': deptLabelMap[q.department] || (q.department === 'common' ? 'Chung' : q.department),
    'Mục phân loại': sectionLabelMap[q.sectionKey] || q.sectionTitle,
    'Câu hỏi bắt buộc': q.isFixed ? 'True' : 'False',
    'Tiêu chí chấm điểm': q.rubric || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 16 }, // ID câu hỏi
    { wch: 45 }, // Nội dung câu hỏi
    { wch: 10 }, // Điểm số
    { wch: 16 }, // Ban phụ trách
    { wch: 16 }, // Mục phân loại
    { wch: 18 }, // Câu hỏi bắt buộc
    { wch: 40 }, // Tiêu chí chấm điểm
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'NganHangCauHoi');
  XLSX.writeFile(workbook, `Ngan_Hang_Cau_Hoi_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 5. Import Question Bank from CSV or Excel file
 * Robust parsing for UTF-8 CSV and Excel formats
 */
export async function importQuestionBankFromFile(file: File): Promise<QuestionBankItem[]> {
  const isCsv = file.name.toLowerCase().endsWith('.csv');

  if (isCsv) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          // Parse CSV with XLSX or manual robust parser
          const workbook = XLSX.read(text, { type: 'string' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawJson: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
          const items = parseRawQuestions(rawJson);
          resolve(items);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file, 'utf-8');
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        const items = parseRawQuestions(rawJson);
        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function parseRawQuestions(rawJson: any[]): QuestionBankItem[] {
  return rawJson.map((row, idx) => {
    // 1. Department mapping
    const rawDept = String(
      row['Ban phụ trách'] || row['Ban'] || row['Department'] || row['ban_phu_trach'] || ''
    ).toLowerCase();
    let department: Department | 'common' = 'common';
    if (rawDept.includes('kỹ') || rawDept.includes('kĩ') || rawDept.includes('tech')) department = 'ky_thuat';
    else if (rawDept.includes('truyền') || rawDept.includes('media')) department = 'truyen_thong';
    else if (rawDept.includes('đối') || rawDept.includes('ngoại') || rawDept.includes('er')) department = 'doi_ngoai';
    else if (rawDept.includes('hậu') || rawDept.includes('cần') || rawDept.includes('logistics')) department = 'hau_can';
    else if (rawDept.includes('chung') || rawDept.includes('all') || rawDept.includes('common')) department = 'common';

    // 2. Fixed/Mandatory flag
    const rawFixed = String(
      row['Câu hỏi bắt buộc'] || row['Bắt buộc'] || row['Cố định'] || row['Loại câu hỏi'] || row['isFixed'] || ''
    ).toLowerCase().trim();
    const isFixed = (
      rawFixed === 'true' ||
      rawFixed === '1' ||
      rawFixed === 'yes' ||
      rawFixed === 'có' ||
      rawFixed.includes('cố định') ||
      rawFixed.includes('bắt buộc')
    );

    // 3. Section classification
    const rawSection = String(
      row['Mục phân loại'] || row['Phần'] || row['Mã phần'] || row['Section'] || row['muc_phan_loai'] || ''
    ).toLowerCase();
    let sectionKey: SectionKey = 'competence';
    let sectionTitle = 'I. Năng lực & Kinh nghiệm chuyên môn';

    if (rawSection.includes('eq') || rawSection.includes('cảm xúc') || rawSection.includes('nhóm') || rawSection.includes('ii')) {
      sectionKey = 'eq';
      sectionTitle = 'II. EQ & Kỹ năng làm việc nhóm';
    } else if (rawSection.includes('tình huống') || rawSection.includes('situation') || rawSection.includes('iii')) {
      sectionKey = 'situation';
      sectionTitle = 'III. Xử lý tình huống thực tế';
    } else if (rawSection.includes('thái độ') || rawSection.includes('attitude') || rawSection.includes('cam kết') || rawSection.includes('iv')) {
      sectionKey = 'attitude';
      sectionTitle = 'IV. Thái độ, Cam kết & Trách nhiệm';
    }

    const questionText = String(
      row['Nội dung câu hỏi'] || row['Câu hỏi'] || row['Question'] || row['noi_dung_cau_hoi'] || ''
    ).trim();

    const points = parseFloat(
      row['Điểm số'] || row['Điểm'] || row['Điểm mặc định'] || row['Points'] || row['diem_so'] || '5'
    ) || 5;

    const rubric = String(
      row['Tiêu chí chấm điểm'] || row['Tiêu chí chấm / Rubric'] || row['Tiêu chí chấm'] || row['Rubric'] || ''
    ).trim();

    const id = String(
      row['ID câu hỏi'] || row['Mã câu hỏi'] || row['ID'] || `q_${Date.now()}_${idx}`
    ).trim();

    return {
      id,
      department,
      sectionKey,
      sectionTitle,
      text: questionText,
      isFixed,
      defaultPoints: points > 0 ? points : 5,
      rubric,
      tags: [],
    };
  }).filter((q) => q.text.length > 0);
}
