import React, { useState, useMemo } from 'react';
import { Candidate, DEPARTMENTS, Department, InterviewResult } from '../types';
import {
  exportCandidateInterviewCsv,
  exportCandidatesSummaryExcel,
  importCandidatesFromFile,
} from '../utils/excelExport';
import {
  Download,
  Eye,
  FileSpreadsheet,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';

interface CandidateListViewProps {
  candidates: Candidate[];
  onSelectCandidateToInterview: (candidateId: string) => void;
  onViewCandidateDetail: (candidate: Candidate) => void;
  onAddNewCandidate: () => void;
  onImportCandidates: (newCandidates: Candidate[]) => void;
  onDeleteCandidate: (candidateId: string) => void;
}

export const CandidateListView: React.FC<CandidateListViewProps> = ({
  candidates,
  onSelectCandidateToInterview,
  onViewCandidateDetail,
  onAddNewCandidate,
  onImportCandidates,
  onDeleteCandidate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | InterviewResult>('all');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | Department | 'multi'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'name_asc' | 'class_asc'>('score_desc');
  const [isImporting, setIsImporting] = useState(false);

  const uniqueClasses = useMemo(() => {
    const set = new Set(candidates.map((c) => c.className).filter(Boolean));
    return Array.from(set).sort((a, b) => (a || '').localeCompare(b || '', 'vi', { numeric: true }));
  }, [candidates]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter((c) => c.status === 'completed');
    const pass = candidates.filter((c) => c.result === 'pass');
    const reserve = candidates.filter((c) => c.result === 'reserve');
    const fail = candidates.filter((c) => c.result === 'fail');
    const pending = candidates.filter((c) => c.status === 'pending');

    const avgScore =
      completed.length > 0
        ? Math.round((completed.reduce((acc, c) => acc + (c.totalScore || 0), 0) / completed.length) * 10) / 10
        : 0;

    return {
      total,
      completed: completed.length,
      pass: pass.length,
      reserve: reserve.length,
      fail: fail.length,
      pending: pending.length,
      avgScore,
    };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((cand) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (cand.name || '').toLowerCase().includes(q);
          const matchClass = (cand.className || '').toLowerCase().includes(q);
          const matchPhone = (cand.phone || '').includes(q);
          const matchIntro = (cand.introduction || '').toLowerCase().includes(q);
          if (!matchName && !matchClass && !matchPhone && !matchIntro) return false;
        }

        if (resultFilter !== 'all' && cand.result !== resultFilter) return false;

        if (departmentFilter === 'multi') {
          if (!cand.isMultiDepartment && (cand.departments?.length || 0) <= 1) return false;
        } else if (departmentFilter !== 'all') {
          if (!cand.departments?.includes(departmentFilter)) return false;
        }

        if (classFilter !== 'all' && cand.className !== classFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return (b.totalScore || 0) - (a.totalScore || 0);
        if (sortBy === 'score_asc') return (a.totalScore || 0) - (b.totalScore || 0);
        if (sortBy === 'name_asc') {
          const nameA = (a.name || '').split(' ').pop() || (a.name || '');
          const nameB = (b.name || '').split(' ').pop() || (b.name || '');
          return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
        }
        if (sortBy === 'class_asc') {
          const classA = a.className || '';
          const classB = b.className || '';
          return classA.localeCompare(classB, 'vi', { numeric: true });
        }
        return 0;
      });
  }, [candidates, searchQuery, resultFilter, departmentFilter, classFilter, sortBy]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const imported = await importCandidatesFromFile(file);
      if (imported.length > 0) {
        onImportCandidates(imported);
        alert(`Đã nhập thành công ${imported.length} thí sinh vào hệ thống!`);
      } else {
        alert('Không tìm thấy dữ liệu thí sinh hợp lệ trong tệp.');
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi đọc tệp Excel/CSV.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">Tổng Ứng Viên</span>
          <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">{stats.total}</div>
          <span className="text-[10px] text-neutral-400">Đã PV: {stats.completed}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Đậu</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{stats.pass}</div>
          <span className="text-[10px] text-neutral-400">{stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0}% tổng số</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Dự Bị</span>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{stats.reserve}</div>
          <span className="text-[10px] text-neutral-400">{stats.total > 0 ? Math.round((stats.reserve / stats.total) * 100) : 0}% tổng số</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[11px] font-medium text-red-600 dark:text-red-400 uppercase tracking-wider block">Trượt</span>
          <div className="text-xl font-bold font-mono text-red-600 dark:text-red-400 mt-1">{stats.fail}</div>
          <span className="text-[10px] text-neutral-400">{stats.total > 0 ? Math.round((stats.fail / stats.total) * 100) : 0}% tổng số</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">Chưa PV</span>
          <div className="text-xl font-bold font-mono text-neutral-600 dark:text-neutral-400 mt-1">{stats.pending}</div>
          <span className="text-[10px] text-neutral-400">Đang chờ xếp lịch</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider block">ĐTB</span>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">{stats.avgScore}đ</div>
          <span className="text-[10px] text-neutral-400">Thang 100</span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên thí sinh, lớp, SĐT..."
              className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs rounded-xl pl-9 pr-4 py-2.5 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="cursor-pointer px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isImporting ? 'Đang đọc tệp...' : 'Import Excel/CSV'}</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="hidden"
              />
            </label>

            <button
              onClick={() => exportCandidatesSummaryExcel(filteredCandidates, 'xlsx')}
              className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={() => exportCandidatesSummaryExcel(filteredCandidates, 'csv')}
              className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>

            <button
              onClick={onAddNewCandidate}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Thí Sinh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <span className="text-neutral-400 px-2 text-[11px] font-medium">Kết quả:</span>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pass', label: 'Đậu' },
              { key: 'reserve', label: 'Dự bị' },
              { key: 'fail', label: 'Trượt' },
              { key: 'not_evaluated', label: 'Chưa PV' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setResultFilter(opt.key as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  resultFilter === opt.key
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-neutral-400 text-[11px]">Lớp:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs rounded-xl px-2.5 py-1.5 border-0 outline-none"
            >
              <option value="all">Tất cả lớp ({uniqueClasses.length})</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Lớp {cls}
                </option>
              ))}
            </select>

            <span className="text-neutral-400 text-[11px] ml-2">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs rounded-xl px-2.5 py-1.5 border-0 outline-none"
            >
              <option value="score_desc">Điểm: Cao → Thấp</option>
              <option value="score_asc">Điểm: Thấp → Cao</option>
              <option value="name_asc">Tên thí sinh: A → Z</option>
              <option value="class_asc">Thứ tự lớp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Thí Sinh</th>
                <th className="py-3.5 px-4">Lớp</th>
                <th className="py-3.5 px-4">Ban Ứng Tuyển</th>
                <th className="py-3.5 px-4 text-center">Tổng Điểm</th>
                <th className="py-3.5 px-4 text-center">Kết Quả</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Không tìm thấy thí sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand, idx) => (
                  <tr key={cand.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-neutral-400">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{cand.name}</div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        {cand.phone && <span>{cand.phone}</span>}
                        {cand.phone && cand.email && <span>•</span>}
                        {cand.email && <span className="truncate max-w-[140px]">{cand.email}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                        {cand.className}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {cand.departments?.map((d) => (
                          <span
                            key={d}
                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                              DEPARTMENTS[d]?.badgeClass || 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {DEPARTMENTS[d]?.shortName || d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {cand.status === 'completed' ? (
                        <div className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {cand.totalScore}
                          <span className="text-[10px] text-neutral-400 font-normal"> / 100</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-xs italic">Chưa chấm</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {cand.result === 'pass' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ĐẬU
                        </span>
                      )}
                      {cand.result === 'reserve' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          DỰ BỊ
                        </span>
                      )}
                      {cand.result === 'fail' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          TRƯỢT
                        </span>
                      )}
                      {cand.result === 'not_evaluated' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          Chưa PV
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectCandidateToInterview(cand.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50 font-medium text-xs flex items-center gap-1 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>{cand.status === 'completed' ? 'Chấm lại' : 'PV ngay'}</span>
                        </button>

                        <button
                          onClick={() => onViewCandidateDetail(cand)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Xác nhận xóa thí sinh "${cand.name}" khỏi hệ thống?`)) {
                              onDeleteCandidate(cand.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Xóa thí sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CandidateListView;