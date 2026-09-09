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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, lớp, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as any)}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">Tất cả kết quả</option>
            <option value="pass">Đậu</option>
            <option value="reserve">Dự bị</option>
            <option value="fail">Trượt</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value as any)}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">Tất cả ban</option>
            <option value="multi">Đăng ký nhiều ban</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">Tất cả lớp</option>
            {uniqueClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="score_desc">Điểm: Cao đến thấp</option>
            <option value="score_asc">Điểm: Thấp đến cao</option>
            <option value="name_asc">Tên: A-Z</option>
            <option value="class_asc">Lớp: Tăng dần</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Export Excel */}
          <button
            onClick={() => exportCandidatesSummaryExcel(candidates)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            title="Xuất Excel tổng hợp"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          {/* Export Interview Details */}
          <button
            onClick={() => exportCandidateInterviewCsv(candidates)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            title="Xuất chi tiết phỏng vấn"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Xuất Chi Tiết</span>
          </button>

          {/* Import file */}
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">{isImporting ? 'Đang nhập...' : 'Nhập tệp'}</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" disabled={isImporting} />
          </label>

          {/* Add New Candidate */}
          <button
            onClick={onAddNewCandidate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ứng viên</span>
          </button>
        </div>
      </div>

      {/* Candidates Table / List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-4">Ban đăng ký</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Tổng điểm</th>
                <th className="py-3 px-4 text-center">Kết quả</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-sm">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Không tìm thấy ứng viên phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const deptNames = (cand.departments || []).map(
                    (dId) => DEPARTMENTS.find((d) => d.id === dId)?.name || dId
                  );

                  return (
                    <tr key={cand.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                        {cand.name}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                        {cand.className || '---'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 text-xs">
                        {deptNames.join(', ') || 'Chưa chọn'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            cand.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                          }`}
                        >
                          {cand.status === 'completed' ? 'Đã phỏng vấn' : 'Chưa phỏng vấn'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                        {cand.status === 'completed' ? `${cand.totalScore || 0}đ` : '---'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cand.status === 'completed' ? (
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              cand.result === 'pass'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50'
                                : cand.result === 'reserve'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200/50 dark:border-red-800/50'
                            }`}
                          >
                            {cand.result === 'pass' ? 'Đậu' : cand.result === 'reserve' ? 'Dự bị' : 'Trượt'}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-xs">---</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Interview / Resume button */}
                          <button
                            onClick={() => onSelectCandidateToInterview(cand.id)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            title="Bắt đầu/Tiếp tục phỏng vấn"
                          >
                            <Play className="w-4 h-4" />
                          </button>

                          {/* View details */}
                          <button
                            onClick={() => onViewCandidateDetail(cand)}
                            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa ứng viên ${cand.name}?`)) {
                                onDeleteCandidate(cand.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                            title="Xóa ứng viên"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};