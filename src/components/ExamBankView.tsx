import React, { useState, useRef } from 'react';
import { ExamQuestion, ExamCategory, DEPARTMENTS, Department, SectionDefinition } from '../types';
import { exportExamQuestionsToCsv, parseExamQuestionsFromCsv } from '../utils/examExport';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle,
  HelpCircle,
  X,
  Code,
  Brain,
  ListChecks,
  AlertCircle
} from 'lucide-react';

interface ExamBankViewProps {
  examQuestions: ExamQuestion[];
  sections: SectionDefinition[];
  onUpdateExamQuestions: (questions: ExamQuestion[]) => void;
}

export const ExamBankView: React.FC<ExamBankViewProps> = ({
  examQuestions = [],
  sections = [],
  onUpdateExamQuestions,
}) => {
  // Lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ExamQuestion>>({
    code: '',
    sectionKey: 'kien_thuc',
    department: 'common',
    category: 'trac_nghiem',
    difficulty: 'trung_binh',
    points: 10,
    title: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    rubric: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lọc danh sách câu hỏi
  const filteredQuestions = examQuestions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || q.department === selectedDept;
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesDept && matchesCategory && matchesDifficulty;
  });

  // Mở modal thêm mới
  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormData({
      code: `EXAM-${Math.floor(100 + Math.random() * 900)}`,
      sectionKey: sections[0]?.id || 'kien_thuc',
      department: 'common',
      category: 'trac_nghiem',
      difficulty: 'trung_binh',
      points: 10,
      title: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      rubric: '',
    });
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (q: ExamQuestion) => {
    setEditingQuestion(q);
    setFormData({ ...q, options: q.options && q.options.length ? q.options : ['', '', '', ''] });
    setIsModalOpen(true);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi đề thi này?')) {
      onUpdateExamQuestions(examQuestions.filter((q) => q.id !== id));
    }
  };

  // Lưu thông tin (Tạo mới hoặc Cập nhật)
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    if (editingQuestion) {
      const updated = examQuestions.map((q) =>
        q.id === editingQuestion.id ? ({ ...q, ...formData } as ExamQuestion) : q
      );
      onUpdateExamQuestions(updated);
    } else {
      const newQuestion: ExamQuestion = {
        id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        code: formData.code || `EXAM-${Math.floor(100 + Math.random() * 900)}`,
        sectionKey: formData.sectionKey || 'kien_thuc',
        department: (formData.department as Department) || 'common',
        category: (formData.category as ExamCategory) || 'trac_nghiem',
        difficulty: (formData.difficulty as any) || 'trung_binh',
        points: formData.points || 10,
        title: formData.title.trim(),
        options: formData.category === 'trac_nghiem' ? formData.options?.filter((o) => o.trim() !== '') : [],
        correctAnswer: formData.correctAnswer || '',
        rubric: formData.rubric || '',
      };
      onUpdateExamQuestions([newQuestion, ...examQuestions]);
    }

    setIsModalOpen(false);
  };

  // Nhập CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = parseExamQuestionsFromCsv(content) as ExamQuestion[];
        if (imported.length > 0) {
          onUpdateExamQuestions([...imported, ...examQuestions]);
          alert(`Đã nhập thành công ${imported.length} câu hỏi đề thi!`);
        } else {
          alert('Không tìm thấy dữ liệu hợp lệ trong tệp!');
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Ngân Hàng Đề Thi & Trắc Nghiệm Đánh Giá</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Quản lý tập trung câu hỏi lý thuyết, thực hành code, trắc nghiệm và tình huống cho các ban STEM.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportExamQuestionsToCsv(filteredQuestions)}
            className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Xuất danh sách câu hỏi ra CSV/Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Nhập câu hỏi từ tệp CSV"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Nhập CSV</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.txt" className="hidden" />

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Câu Hỏi Mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã câu hỏi hoặc nội dung đề..."
            className="w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl pl-9 pr-4 py-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl px-3 py-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tất cả Ban</option>
            <option value="common">Dùng Chung</option>
            {Object.keys(DEPARTMENTS).map((d) => (
              <option key={d} value={d}>
                Ban {DEPARTMENTS[d as Department].name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl px-3 py-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tất cả Dạng câu hỏi</option>
            <option value="trac_nghiem">Trắc nghiệm A/B/C/D</option>
            <option value="tu_luan">Tự luận lý thuyết</option>
            <option value="code_snippet">Code Snippet / Đoạn mã</option>
            <option value="logic_iq">Logic & IQ</option>
            <option value="tinh_huong">Xử lý tình huống</option>
          </select>
        </div>

        <div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl px-3 py-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tất cả Độ khó</option>
            <option value="de">Dễ</option>
            <option value="trung_binh">Trung bình</option>
            <option value="kho">Khó</option>
          </select>
        </div>
      </div>

      {/* Questions List View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-500 font-medium px-1">
          <span>Hiển thị {filteredQuestions.length} / {examQuestions.length} câu hỏi đề thi</span>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-12 text-center text-xs text-neutral-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
            <p>Không tìm thấy câu hỏi đề thi nào phù hợp với bộ lọc!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {q.code}
                    </span>

                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      {q.department === 'common' ? 'Dùng Chung' : DEPARTMENTS[q.department]?.name || q.department}
                    </span>

                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 flex items-center gap-1">
                      {q.category === 'trac_nghiem' && <ListChecks className="w-3 h-3" />}
                      {q.category === 'code_snippet' && <Code className="w-3 h-3" />}
                      {q.category === 'logic_iq' && <Brain className="w-3 h-3" />}
                      {q.category}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        q.difficulty === 'de'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.difficulty === 'kho'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.difficulty === 'de' ? 'Dễ' : q.difficulty === 'kho' ? 'Khó' : 'Trung Bình'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100">
                      {q.points} điểm
                    </span>

                    <div className="flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-800 pl-2">
                      <button
                        onClick={() => handleOpenEditModal(q)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Chỉnh sửa câu hỏi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {q.title}
                </div>

                {/* Options if Multiple Choice */}
                {q.category === 'trac_nghiem' && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {q.options.map((opt, idx) => {
                      const isCorrect = q.correctAnswer && q.correctAnswer.trim() === opt.trim();
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border ${
                            isCorrect
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 font-medium text-emerald-900 dark:text-emerald-200'
                              : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/50 dark:border-neutral-700/50 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <span className="font-bold mr-1">{String.fromCharCode(65 + idx)}.</span> {opt}
                          {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 inline ml-1.5" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Rubric / Answer key */}
                {(q.correctAnswer || q.rubric) && (
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-xs space-y-1 text-neutral-600 dark:text-neutral-400">
                    {q.correctAnswer && q.category !== 'trac_nghiem' && (
                      <div>
                        <strong className="text-neutral-800 dark:text-neutral-200">Gợi ý đáp án chuẩn:</strong>{' '}
                        {q.correctAnswer}
                      </div>
                    )}
                    {q.rubric && (
                      <div>
                        <strong className="text-neutral-800 dark:text-neutral-200">Hướng dẫn chấm / Barem:</strong>{' '}
                        {q.rubric}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Câu Hỏi Đề Thi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {editingQuestion ? 'Chỉnh Sửa Câu Hỏi Đề Thi' : 'Tạo Câu Hỏi Đề Thi Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Mã câu hỏi</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ban áp dụng</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                  >
                    <option value="common">Dùng Chung</option>
                    {Object.keys(DEPARTMENTS).map((d) => (
                      <option key={d} value={d}>
                        Ban {DEPARTMENTS[d as Department].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Điểm số (chuẩn)</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Dạng câu hỏi</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                  >
                    <option value="trac_nghiem">Trắc nghiệm (A/B/C/D)</option>
                    <option value="tu_luan">Tự luận lý thuyết</option>
                    <option value="code_snippet">Thực hành Code / Snippet</option>
                    <option value="logic_iq">Tư duy Logic & IQ</option>
                    <option value="tinh_huong">Xử lý tình huống</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Mức độ khó</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                  >
                    <option value="de">Dễ</option>
                    <option value="trung_binh">Trung Bình</option>
                    <option value="kho">Khó</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Đề bài / Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập chi tiết câu hỏi hoặc đoạn mã code bài tập..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl p-3 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                />
              </div>

              {/* Dynamic Inputs for Trắc Nghiệm */}
              {formData.category === 'trac_nghiem' && (
                <div className="space-y-2 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                    Các phương án lựa chọn (A, B, C, D):
                  </label>
                  {formData.options?.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-bold w-4">{String.fromCharCode(65 + idx)}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(formData.options || [])];
                          newOpts[idx] = e.target.value;
                          setFormData({ ...formData, options: newOpts });
                        }}
                        placeholder={`Phương án ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-1.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Đáp án đúng / Đáp án chuẩn</label>
                <input
                  type="text"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  placeholder={formData.category === 'trac_nghiem' ? 'Nhập chính xác nội dung đáp án đúng' : 'Nội dung cốt lõi của câu trả lời'}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl px-3 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Hướng dẫn chấm / Barem điểm</label>
                <textarea
                  rows={2}
                  value={formData.rubric}
                  onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
                  placeholder="Tiêu chí chấm điểm chi tiết..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl p-3 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium"
                >
                  {editingQuestion ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};