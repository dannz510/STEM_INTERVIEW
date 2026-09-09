import React, { useState, useEffect } from 'react';
import { Candidate, DEPARTMENTS, Department } from '../types';
import { UserPlus, X, Download, Loader2 } from 'lucide-react';

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCandidate: (cand: Candidate) => void;
  candidateToEdit?: Candidate | null;
  onImportCandidates?: (candidates: Candidate[]) => void;
}

const SPREADSHEET_ID = '19RPhArut51jUiwzrsQYC7gw6Uy29yFMmmHacfN9MSsY';
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

export const CandidateModal: React.FC<CandidateModalProps> = ({
  isOpen,
  onClose,
  onSaveCandidate,
  candidateToEdit,
  onImportCandidates,
}) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [departments, setDepartments] = useState<Department[]>(['ky_thuat']);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [languages, setLanguages] = useState('');
  const [experienceTechnical, setExperienceTechnical] = useState('');
  const [experienceMedia, setExperienceMedia] = useState('');
  const [experienceTeamwork, setExperienceTeamwork] = useState('');

  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  useEffect(() => {
    if (candidateToEdit) {
      setName(candidateToEdit.name || '');
      setClassName(candidateToEdit.className || '');
      setDepartments(candidateToEdit.departments || ['ky_thuat']);
      setPhone(candidateToEdit.phone || '');
      setEmail(candidateToEdit.email || '');
      setFacebookUrl(candidateToEdit.facebookUrl || '');
      setIntroduction(candidateToEdit.introduction || '');
      setLanguages(candidateToEdit.languages || '');
      setExperienceTechnical(candidateToEdit.experienceTechnical || '');
      setExperienceMedia(candidateToEdit.experienceMedia || '');
      setExperienceTeamwork(candidateToEdit.experienceTeamwork || '');
    } else {
      setName('');
      setClassName('');
      setDepartments(['ky_thuat']);
      setPhone('');
      setEmail('');
      setFacebookUrl('');
      setIntroduction('');
      setLanguages('');
      setExperienceTechnical('');
      setExperienceMedia('');
      setExperienceTeamwork('');
    }
  }, [candidateToEdit, isOpen]);

  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++;
        }
        row.push(cur.trim());
        if (row.some((field) => field.length > 0)) {
          result.push(row);
        }
        row = [];
        cur = '';
      } else {
        cur += c;
      }
    }

    if (cur.length > 0 || row.length > 0) {
      row.push(cur.trim());
      result.push(row);
    }

    return result;
  };

  const handleFetchFromGoogleSheet = async () => {
    try {
      setIsLoadingSheet(true);
      const response = await fetch(CSV_EXPORT_URL);
      if (!response.ok) throw new Error('Không thể tải dữ liệu từ Google Sheet');

      const csvData = await response.text();
      const rows = parseCSV(csvData);

      const parsedCandidates: Candidate[] = rows
        .slice(1)
        .filter((r) => r.length > 0 && r[0])
        .map((row, index) => ({
          id: `sheet_${Date.now()}_${index}`,
          submissionId: `SUB_SHEET_${index + 1}`,
          name: row[0]?.trim() || 'Thí sinh chưa đặt tên',
          className: row[1]?.trim() || '10A',
          departments: ['ky_thuat'],
          isMultiDepartment: false,
          phone: row[2]?.trim() || '',
          email: row[3]?.trim() || '',
          facebookUrl: row[4]?.trim() || '',
          introduction: row[5]?.trim() || '',
          languages: row[6]?.trim() || '',
          experienceTechnical: row[7]?.trim() || '',
          experienceMedia: row[8]?.trim() || '',
          experienceTeamwork: row[9]?.trim() || '',
          status: 'pending',
          result: 'not_evaluated',
          totalScore: 0,
          maxScore: 100,
        }));

      if (onImportCandidates) {
        onImportCandidates(parsedCandidates);
        alert(`Đã tải thành công ${parsedCandidates.length} thí sinh từ Google Sheet!`);
        onClose();
      }
    } catch (error) {
      console.error('Lỗi khi fetch Google Sheet:', error);
      alert('Không thể tải dữ liệu. Lỗi kết nối hoặc chia sẻ File.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const toggleDepartment = (deptId: Department) => {
    setDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Vui lòng nhập họ và tên thí sinh');
    if (departments.length === 0) return alert('Vui lòng chọn ít nhất một ban ứng tuyển');

    const cand: Candidate = {
      ...(candidateToEdit || {}),
      id: candidateToEdit?.id || `cand_${Date.now()}`,
      submissionId: candidateToEdit?.submissionId || `SUB_${Date.now()}`,
      name: name.trim(),
      className: className.trim() || '10A',
      departments,
      isMultiDepartment: departments.length > 1,
      phone: phone.trim(),
      email: email.trim(),
      facebookUrl: facebookUrl.trim(),
      introduction: introduction.trim(),
      languages: languages.trim(),
      experienceTechnical: experienceTechnical.trim(),
      experienceMedia: experienceMedia.trim(),
      experienceTeamwork: experienceTeamwork.trim(),
      status: candidateToEdit?.status || 'pending',
      result: candidateToEdit?.result || 'not_evaluated',
      totalScore: candidateToEdit?.totalScore || 0,
      maxScore: candidateToEdit?.maxScore || 100,
    };

    onSaveCandidate(cand);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100">
            <UserPlus className="h-6 w-6 text-indigo-600" />
            <h2>{candidateToEdit ? 'Chỉnh sửa thông tin thí sinh' : 'Thêm thí sinh mới'}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleFetchFromGoogleSheet}
            disabled={isLoadingSheet}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoadingSheet ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Import từ Google Sheet
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Họ và tên *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Lớp</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="10A1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ban ứng tuyển *
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DEPARTMENTS).map(([key, labelObj]) => {
                const deptKey = key as Department;
                const isSelected = departments.includes(deptKey);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDepartment(deptKey)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {typeof labelObj === 'string' ? labelObj : labelObj.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">SĐT</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateModal;