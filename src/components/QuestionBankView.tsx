import React, { useState, useMemo } from 'react';
import {
  DEPARTMENTS,
  Department,
  QuestionBankItem,
  SectionDefinition,
  SectionKey,
} from '../types';
import {
  exportQuestionBankExcel,
  importQuestionBankFromFile,
} from '../utils/excelExport';
import {
  Download,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { DEFAULT_QUESTION_BANK } from '../data/defaultQuestionBank';

interface QuestionBankViewProps {
  questionBank: QuestionBankItem[];
  sections: SectionDefinition[];
  onUpdateQuestionBank: (bank: QuestionBankItem[]) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questionBank,
  sections,
  onUpdateQuestionBank,
}) => {
  const [selectedDept, setSelectedDept] = useState<'all' | Department | 'common'>('all');
  const [selectedSection, setSelectedSection] = useState<'all' | SectionKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Add question modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDept, setNewDept] = useState<Department | 'common'>('ky_thuat');
  const [newSectionKey, setNewSectionKey] = useState<SectionKey>(sections[0]?.id || 'competence');
  const [newIsFixed, setNewIsFixed] = useState(false);
  const [newPoints, setNewPoints] = useState(5);
  const [newRubric, setNewRubric] = useState('');

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questionBank.filter((q) => {
      if (selectedDept !== 'all' && q.department !== selectedDept) return false;
      if (selectedSection !== 'all' && q.sectionKey !== selectedSection) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchText = q.text.toLowerCase().includes(query);
        const matchRubric = (q.rubric || '').toLowerCase().includes(query);
        if (!matchText && !matchRubric) return false;
      }
      return true;
    });
  }, [questionBank, selectedDept, selectedSection, searchQuery]);

  // Handle add question
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    const sec = sections.find((s) => s.id === newSectionKey);
    const item: QuestionBankItem = {
      id: `custom_q_${Date.now()}`,
      department: newDept,
      sectionKey: newSectionKey,
      sectionTitle: sec ? `${sec.roman}. ${sec.title}` : 'I. Năng lực & Kinh nghiệm',
      text: newText.trim(),
      isFixed: newIsFixed,
      defaultPoints: Number(newPoints) || 5,
      rubric: newRubric.trim(),
    };

    onUpdateQuestionBank([item, ...questionBank]);
    setShowAddModal(false);
    setNewText('');
    setNewRubric('');
  };

  // Handle delete question
  const handleDeleteQuestion = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này khỏi ngân hàng?')) {
      onUpdateQuestionBank(questionBank.filter((q) => q.id !== id));
    }
  };

  // Toggle fixed flag
  const handleToggleFixed = (id: string) => {
    const updated = questionBank.map((q) => {
      if (q.id === id) {
        return { ...q, isFixed: !q.isFixed };
      }
      return q;
    });
    onUpdateQuestionBank(updated);
  };

  // Handle import file
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const imported = await importQuestionBankFromFile(file);
      if (imported.length > 0) {
        const combined = [...imported, ...questionBank];
        const seen = new Set();
        const unique = combined.filter((q) => {
          if (seen.has(q.text)) return false;
          seen.add(q.text);
          return true;
        });
        onUpdateQuestionBank(unique);
        alert(`Đã nhập thành công ${imported.length} câu hỏi mới vào ngân hàng!`);
      } else {
        alert('Không tìm thấy câu hỏi hợp lệ trong tệp.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi đọc tệp Excel barem câu hỏi. Vui lòng kiểm tra lại cấu trúc cột.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        'Khôi phục lại toàn bộ ngân hàng câu hỏi gốc chuẩn STEM (Kỹ Thuật, Truyền Thông, Đối Ngoại, Hậu Cần)?'
      )
    ) {
      onUpdateQuestionBank(DEFAULT_QUESTION_BANK);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Overview */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Ngân Hàng Câu Hỏi & Barem Tuyển Quân STEM
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-mono font-medium">
              {questionBank.length} câu hỏi
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Hệ thống phân phối câu hỏi theo các phần chuẩn: Năng lực (15đ), EQ (20đ), Tình huống (35đ), Thái độ (30đ).
            Mỗi phần luôn <strong>bắt buộc câu hỏi cố định đầu tiên</strong>, các câu sau được bốc thăm ngẫu nhiên công bằng.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <label
            htmlFor="upload-question-bank-file"
            className="cursor-pointer px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Nhập thêm câu hỏi từ file Excel/CSV theo chuẩn barem"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Đang đọc...' : 'Import Barem'}</span>
            <input
              id="upload-question-bank-file"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportFile}
              disabled={isImporting}
              className="hidden"
            />
          </label>

          <button
            id="btn-export-question-bank"
            onClick={() => exportQuestionBankExcel(questionBank)}
            className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Xuất ngân hàng câu hỏi hiện tại ra file Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel Barem</span>
          </button>

          <button
            id="btn-reset-default-bank"
            onClick={handleResetToDefault}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Khôi phục lại ngân hàng câu hỏi mặc định ban đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-open-add-question-modal"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Câu Hỏi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-question"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung câu hỏi, tiêu chí chấm (rubric), từ khóa..."
              className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl pl-9 pr-4 py-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          {/* Department Filter Pills */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <span className="text-neutral-400 px-2 text-[11px] font-medium">Ban:</span>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'ky_thuat', label: 'Ban Kỹ Thuật (Main)' },
              { key: 'truyen_thong', label: 'Ban Truyền Thông' },
              { key: 'doi_ngoai', label: 'Ban Đối Ngoại' },
              { key: 'hau_can', label: 'Ban Hậu Cần' },
              { key: 'common', label: 'Chung' },
            ].map((dOpt) => (
              <button
                key={dOpt.key}
                id={`btn-bank-dept-${dOpt.key}`}
                onClick={() => setSelectedDept(dOpt.key as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedDept === dOpt.key
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {dOpt.label}
              </button>
            ))}
          </div>

          {/* Section Filter Pills (Dải Động từ Sections Props) */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl flex-wrap">
            <span className="text-neutral-400 px-2 text-[11px] font-medium">Phần:</span>
            <button
              id="btn-bank-section-all"
              onClick={() => setSelectedSection('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedSection === 'all'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Tất cả phần
            </button>
            {sections.map((sec) => (
              <button
                key={sec.id}
                id={`btn-bank-section-${sec.id}`}
                onClick={() => setSelectedSection(sec.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedSection === sec.id
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {sec.roman}. {sec.title} ({sec.defaultPoints}đ)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 text-neutral-400 text-xs">
            Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const deptInfo = q.department === 'common' ? null : DEPARTMENTS[q.department as Department];

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs p-4.5 hover:shadow-xs transition-shadow space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-neutral-400 font-bold">
                      #{idx + 1}
                    </span>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        deptInfo ? deptInfo.badgeClass : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {deptInfo ? deptInfo.shortName : 'Chung'}
                    </span>

                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                      {q.sectionTitle}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleFixed(q.id)}
                      className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1 transition-colors ${
                        q.isFixed
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                      title="Nhấp để chuyển đổi: Cố định bắt buộc đầu phần hoặc Ngẫu nhiên"
                    >
                      <Pin className="w-3 h-3" />
                      <span>{q.isFixed ? 'Cố định bắt buộc đầu phần' : 'Ngẫu nhiên'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      {q.defaultPoints} điểm
                    </span>

                    <button
                      id={`btn-delete-question-${q.id}`}
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                  {q.text}
                </p>

                {q.rubric && (
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-neutral-200/40 dark:border-neutral-700/40">
                    <strong className="text-neutral-700 dark:text-neutral-300 mr-1.5">
                      Barem gợi ý cho GK:
                    </strong>
                    <span>{q.rubric}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Thêm Câu Hỏi Mới Vào Ngân Hàng
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Nội dung câu hỏi *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="VD: Nếu sát ngày thi đấu robot bị mất tín hiệu, em xử lý ra sao?"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl p-3 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Ban phụ trách
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as any)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl p-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                  >
                    <option value="ky_thuat">Ban Kỹ Thuật (Main)</option>
                    <option value="truyen_thong">Ban Truyền Thông</option>
                    <option value="doi_ngoai">Ban Đối Ngoại</option>
                    <option value="hau_can">Ban Hậu Cần</option>
                    <option value="common">Chung (Tất cả ban)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Phần đánh giá
                  </label>
                  <select
                    value={newSectionKey}
                    onChange={(e) => setNewSectionKey(e.target.value as any)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl p-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.roman}. {sec.title} ({sec.defaultPoints}đ)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Điểm số mặc định
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="35"
                    value={newPoints}
                    onChange={(e) => setNewPoints(parseFloat(e.target.value))}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl p-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIsFixed}
                      onChange={(e) => setNewIsFixed(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Cố định bắt buộc đầu phần
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Tiêu chí chấm điểm / Rubric gợi ý
                </label>
                <textarea
                  rows={2}
                  value={newRubric}
                  onChange={(e) => setNewRubric(e.target.value)}
                  placeholder="VD: Đánh giá sự bình tĩnh, quy trình cô lập lỗi nguồn và phương án thay thế..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl p-3 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium shadow-xs"
                >
                  Lưu Vào Ngân Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};