import React from 'react';
import { Candidate, DEPARTMENTS, SectionDefinition } from '../types';
import { exportCandidateInterviewCsv } from '../utils/excelExport';
import { Download, Pin, Play, X } from 'lucide-react';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  sections: SectionDefinition[];
  onStartInterview: (candId: string) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  onClose,
  sections,
  onStartInterview,
}) => {
  if (!candidate) return null;

  const candidateName = candidate.name?.trim() || 'Chưa cập nhật tên';
  const initialLetter = candidateName.charAt(0).toUpperCase();
  const className = candidate.className || 'N/A';
  
  const departmentNames = Array.isArray(candidate.departments) && candidate.departments.length > 0
    ? candidate.departments.map((d) => DEPARTMENTS[d]?.name || d).join(', ')
    : 'Chưa đăng ký ban';

  const getFormattedFacebookUrl = (url?: string) => {
    if (!url) return '#';
    return url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
  };

  const totalScore = candidate.totalScore ?? 0;
  const maxScore = candidate.maxScore || 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-3xl w-full border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
              {initialLetter}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>{candidateName}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-700 dark:text-neutral-300">
                  Lớp {className}
                </span>
              </h3>
              <p className="text-xs text-neutral-500">
                Ban: {departmentNames}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onStartInterview(candidate.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{candidate.status === 'completed' ? 'Chấm lại bài' : 'Phỏng vấn ngay'}</span>
            </button>

            {candidate.status === 'completed' && (
              <button
                onClick={() => exportCandidateInterviewCsv(candidate)}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5"
                title="Tải bảng điểm chi tiết CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Status Banner */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                Trạng thái đánh giá
              </span>
              <div className="flex items-center gap-2 mt-1">
                {candidate.result === 'pass' && (
                  <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    ✓ ĐẬU (TRÚNG TUYỂN)
                  </span>
                )}
                {candidate.result === 'reserve' && (
                  <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    ⚠ DỰ BỊ (CHỜ XÉT)
                  </span>
                )}
                {candidate.result === 'fail' && (
                  <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                    ✕ TRƯỢT
                  </span>
                )}
                {candidate.result === 'not_evaluated' && (
                  <span className="px-2.5 py-1 rounded-full font-medium text-xs bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                    Chưa phỏng vấn
                  </span>
                )}
                <span className="text-neutral-500">
                  {candidate.status === 'completed'
                    ? `GK: ${candidate.interviewerName || 'Giám Khảo'}`
                    : 'Đang xếp lịch'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                Tổng điểm đạt được
              </span>
              <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {totalScore}{' '}
                <span className="text-xs font-normal text-neutral-400">
                  / {maxScore} điểm
                </span>
              </div>
            </div>
          </div>

          {/* Section Score Breakdown */}
          {candidate.sectionScores && (
            <div className="space-y-2">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Chi tiết điểm các phần đánh giá:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sections.map((sec) => {
                  const s = candidate.sectionScores?.[sec.id];
                  return (
                    <div
                      key={sec.id}
                      className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 space-y-1"
                    >
                      <span className="text-[11px] text-neutral-500 block truncate">
                        {sec.roman}. {sec.title}
                      </span>
                      <div className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {s?.awarded ?? 0} / {s?.max ?? sec.defaultPoints}đ
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details Form */}
          <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 block">
              Thông tin đơn tuyển quân:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-neutral-700 dark:text-neutral-300">
              {candidate.phone && (
                <div>
                  <strong>SĐT:</strong> {candidate.phone}
                </div>
              )}
              {candidate.email && (
                <div>
                  <strong>Email:</strong> {candidate.email}
                </div>
              )}
              {candidate.facebookUrl && (
                <div>
                  <strong>Facebook:</strong>{' '}
                  <a
                    href={getFormattedFacebookUrl(candidate.facebookUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Xem trang cá nhân
                  </a>
                </div>
              )}
              {candidate.languages && (
                <div>
                  <strong>Ngôn ngữ code:</strong> {candidate.languages}
                </div>
              )}
              {candidate.experienceTechnical && (
                <div className="md:col-span-2">
                  <strong>Kinh nghiệm kỹ thuật:</strong> {candidate.experienceTechnical}
                </div>
              )}
              {candidate.introduction && (
                <div className="md:col-span-2">
                  <strong>Tự bạch:</strong> {candidate.introduction}
                </div>
              )}
            </div>
          </div>

          {/* Questions List */}
          {candidate.interviewQuestions && candidate.interviewQuestions.length > 0 && (
            <div className="space-y-3 border-t border-neutral-100 dark:border-neutral-800 pt-4">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 block">
                Bảng câu hỏi & Ghi chép câu trả lời:
              </span>

              <div className="space-y-2.5">
                {candidate.interviewQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/50 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-400 font-bold">#{idx + 1}</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                          {q.sectionTitle}
                        </span>
                        {q.isFixed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5" />
                            Cố định
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100">
                        Điểm:{' '}
                        {q.awardedScore !== null && q.awardedScore !== undefined ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            {q.awardedScore} / {q.maxPoints}đ
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">Chưa chấm</span>
                        )}
                      </div>
                    </div>

                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{q.text}</p>

                    {q.candidateAnswerNote && (
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200/40 dark:border-neutral-700/40">
                        <strong className="text-neutral-700 dark:text-neutral-300">
                          Ghi chú trả lời:
                        </strong>{' '}
                        {q.candidateAnswerNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;