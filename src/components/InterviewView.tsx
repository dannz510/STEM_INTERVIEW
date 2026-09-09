import React, { useState, useEffect, useMemo } from 'react';
import {
  Candidate,
  DEPARTMENTS,
  Department,
  InterviewQuestion,
  QuestionBankItem,
  SectionDefinition,
  BareemConfig,
} from '../types';
import {
  generateInterviewQuestions,
  computeCandidateScoreStats,
} from '../utils/interviewGenerator';
import { exportCandidateInterviewCsv } from '../utils/excelExport';
import { CountdownTimer } from './CountdownTimer';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  HelpCircle,
  Pin,
  RefreshCw,
  Sparkles,
  User,
  UserPlus,
  RotateCcw,
  ExternalLink,
  Info,
  Edit3,
  XCircle,
} from 'lucide-react';

interface InterviewViewProps {
  candidates: Candidate[];
  questionBank: QuestionBankItem[];
  sections: SectionDefinition[];
  bareemConfig: BareemConfig;
  onUpdateCandidate: (updated: Candidate) => void;
  onAddNewCandidate: () => void;
  initialCandidateId?: string;
  onViewCandidateList: () => void;
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  candidates = [],
  questionBank = [],
  sections = [],
  bareemConfig,
  onUpdateCandidate,
  onAddNewCandidate,
  initialCandidateId,
  onViewCandidateList,
}) => {
  // Selected candidate state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    initialCandidateId || candidates[0]?.id || ''
  );
  
  // Custom applicant inputs for quick start
  const [candidateNameInput, setCandidateNameInput] = useState('');
  const [candidateClassInput, setCandidateClassInput] = useState('');
  const [candidateDeptInput, setCandidateDeptInput] = useState<Department>('ky_thuat');
  const [isMultiDeptMode, setIsMultiDeptMode] = useState(false);
  const [multiDeptSelection, setMultiDeptSelection] = useState<Department[]>(['ky_thuat', 'doi_ngoai']);

  // Active interview state
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showProfileDrawer, setShowProfileDrawer] = useState(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [interviewerName, setInterviewerName] = useState('Giám Khảo 1');

  // Sync selectedCandidateId with props
  useEffect(() => {
    if (initialCandidateId) {
      setSelectedCandidateId(initialCandidateId);
      const found = candidates.find((c) => c.id === initialCandidateId);
      if (found) {
        setCandidateNameInput(found.name || '');
        setCandidateClassInput(found.className || '');
        setCandidateDeptInput(found.departments?.[0] || 'ky_thuat');
      }
    } else if (!selectedCandidateId && candidates.length > 0) {
      setSelectedCandidateId(candidates[0].id);
    }
  }, [initialCandidateId, candidates]);

  const selectedCandidateFromList = useMemo(() => {
    return candidates.find((c) => c.id === selectedCandidateId);
  }, [candidates, selectedCandidateId]);

  // Start interview session
  const handleStartInterview = (candidateToStart?: Candidate) => {
    let candidate = candidateToStart || selectedCandidateFromList;

    if (!candidate) {
      // Create new candidate from inputs
      if (!candidateNameInput.trim()) {
        alert('Vui lòng nhập họ và tên thí sinh');
        return;
      }
      const depts = isMultiDeptMode ? multiDeptSelection : [candidateDeptInput];
      const newCand: Candidate = {
        id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: candidateNameInput.trim(),
        className: candidateClassInput.trim() || '10A',
        departments: depts,
        isMultiDepartment: depts.length > 1,
        status: 'in_progress',
        result: 'not_evaluated',
        totalScore: 0,
        maxScore: 100,
      };
      candidate = newCand;
    }

    // Check if candidate already has questions, if not generate them
    let questions = candidate.interviewQuestions;
    if (!questions || questions.length === 0) {
      questions = generateInterviewQuestions(
        candidate,
        questionBank,
        sections,
        candidate.isMultiDepartment ? 'multi' : candidate.departments[0]
      );
    }

    const updatedCand: Candidate = {
      ...candidate,
      status: 'in_progress',
      interviewQuestions: questions,
      interviewerName: interviewerName || candidate.interviewerName || 'Giám Khảo 1',
    };

    setActiveCandidate(updatedCand);
    onUpdateCandidate(updatedCand);
    setCurrentQuestionIndex(0);
    setShowCompletionDialog(false);
  };

  // Re-generate fresh question set for this candidate
  const handleRegenerateQuestions = () => {
    if (!activeCandidate) return;
    if (
      !confirm(
        'Bạn có chắc chắn muốn xáo trộn và tạo lại bộ câu hỏi cho thí sinh này? Điểm đã chấm sẽ được làm mới.'
      )
    ) {
      return;
    }

    const newQuestions = generateInterviewQuestions(
      activeCandidate,
      questionBank,
      sections,
      activeCandidate.isMultiDepartment ? 'multi' : activeCandidate.departments[0]
    );

    const stats = computeCandidateScoreStats(newQuestions, sections, bareemConfig);

    const updated: Candidate = {
      ...activeCandidate,
      interviewQuestions: newQuestions,
      totalScore: stats.totalScore,
      maxScore: stats.maxScore,
      result: stats.result,
      sectionScores: stats.sectionScores,
    };

    setActiveCandidate(updated);
    onUpdateCandidate(updated);
    setCurrentQuestionIndex(0);
  };

  // Swap current question with another from question bank
  const handleSwapCurrentQuestion = () => {
    if (!activeCandidate || !activeCandidate.interviewQuestions) return;
    const currentQ = activeCandidate.interviewQuestions[currentQuestionIndex];
    if (!currentQ) return;

    // Filter available alternatives from question bank in this section
    const usedIds = new Set(activeCandidate.interviewQuestions.map((q) => q.bankQuestionId));
    const pool = questionBank.filter(
      (b) =>
        b.sectionKey === currentQ.sectionKey &&
        !usedIds.has(b.id) &&
        (b.department === 'common' ||
          activeCandidate.departments.includes(b.department as Department))
    );

    if (pool.length === 0) {
      alert('Không còn câu hỏi thay thế nào khác trong ngân hàng cho phần này.');
      return;
    }

    const replacement = pool[Math.floor(Math.random() * pool.length)];
    const updatedQuestions = [...activeCandidate.interviewQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQ,
      bankQuestionId: replacement.id,
      text: replacement.text,
      isFixed: replacement.isFixed,
      rubric: replacement.rubric,
      awardedScore: null,
      candidateAnswerNote: '',
    };

    const stats = computeCandidateScoreStats(updatedQuestions, sections, bareemConfig);
    const updated: Candidate = {
      ...activeCandidate,
      interviewQuestions: updatedQuestions,
      totalScore: stats.totalScore,
      maxScore: stats.maxScore,
      result: stats.result,
      sectionScores: stats.sectionScores,
    };

    setActiveCandidate(updated);
    onUpdateCandidate(updated);
  };

  // Handle score change with strict 0 <= score <= maxPoints clamp
  const handleScoreChange = (rawScore: number | null) => {
    if (!activeCandidate || !activeCandidate.interviewQuestions) return;
    const currentQ = activeCandidate.interviewQuestions[currentQuestionIndex];
    if (!currentQ) return;

    let score: number | null = rawScore;
    if (typeof rawScore === 'number') {
      if (isNaN(rawScore)) score = null;
      else if (rawScore < 0) score = 0;
      else if (rawScore > currentQ.maxPoints) score = currentQ.maxPoints;
      else score = Math.round(rawScore * 10) / 10;
    }

    const updatedQuestions = [...activeCandidate.interviewQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQ,
      awardedScore: score,
    };

    const stats = computeCandidateScoreStats(updatedQuestions, sections, bareemConfig);
    const updated: Candidate = {
      ...activeCandidate,
      interviewQuestions: updatedQuestions,
      totalScore: stats.totalScore,
      maxScore: stats.maxScore,
      result: stats.result,
      sectionScores: stats.sectionScores,
    };

    setActiveCandidate(updated);
    onUpdateCandidate(updated);
  };

  // Handle note change
  const handleNoteChange = (note: string) => {
    if (!activeCandidate || !activeCandidate.interviewQuestions) return;
    const currentQ = activeCandidate.interviewQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const updatedQuestions = [...activeCandidate.interviewQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQ,
      candidateAnswerNote: note,
    };

    const updated: Candidate = {
      ...activeCandidate,
      interviewQuestions: updatedQuestions,
    };

    setActiveCandidate(updated);
    onUpdateCandidate(updated);
  };

  // Handle changing maximum points (x) for the current question
  const handleMaxPointsChange = (rawMax: number) => {
    if (!activeCandidate || !activeCandidate.interviewQuestions) return;
    const currentQ = activeCandidate.interviewQuestions[currentQuestionIndex];
    if (!currentQ) return;
    if (isNaN(rawMax) || rawMax <= 0) return;

    const validatedMax = Math.max(0.5, Math.round(rawMax * 10) / 10);
    let newAwarded = currentQ.awardedScore;
    if (typeof newAwarded === 'number' && newAwarded > validatedMax) {
      newAwarded = validatedMax;
    }

    const updatedQuestions = [...activeCandidate.interviewQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQ,
      maxPoints: validatedMax,
      awardedScore: newAwarded,
    };

    const stats = computeCandidateScoreStats(updatedQuestions, sections, bareemConfig);
    const updated: Candidate = {
      ...activeCandidate,
      interviewQuestions: updatedQuestions,
      totalScore: stats.totalScore,
      maxScore: stats.maxScore,
      result: stats.result,
      sectionScores: stats.sectionScores,
    };

    setActiveCandidate(updated);
    onUpdateCandidate(updated);
  };

  // Finish interview
  const handleCompleteInterview = () => {
    if (!activeCandidate || !activeCandidate.interviewQuestions) return;

    const stats = computeCandidateScoreStats(
      activeCandidate.interviewQuestions,
      sections,
      bareemConfig
    );

    const completed: Candidate = {
      ...activeCandidate,
      status: 'completed',
      totalScore: stats.totalScore,
      maxScore: stats.maxScore,
      result: stats.result,
      sectionScores: stats.sectionScores,
      interviewedAt: new Date().toISOString(),
      interviewerName: interviewerName || activeCandidate.interviewerName || 'Giám Khảo 1',
    };

    setActiveCandidate(completed);
    onUpdateCandidate(completed);
    setShowCompletionDialog(true);

    try {
      exportCandidateInterviewCsv(completed, bareemConfig);
    } catch (err) {
      console.error('Lỗi khi tự động xuất file CSV:', err);
    }
  };

  // Export current candidate CSV
  const handleExportCurrentCandidateCsv = () => {
    if (!activeCandidate) return;
    exportCandidateInterviewCsv(activeCandidate, bareemConfig);
  };

  // Current question data
  const currentQuestion: InterviewQuestion | undefined =
    activeCandidate?.interviewQuestions?.[currentQuestionIndex];

  // Stats calculation
  const totalQuestions = activeCandidate?.interviewQuestions?.length || 0;
  const answeredCount =
    activeCandidate?.interviewQuestions?.filter((q) => q.awardedScore !== null).length || 0;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Running total
  const runningScore =
    activeCandidate?.interviewQuestions?.reduce(
      (acc, q) => acc + (typeof q.awardedScore === 'number' ? q.awardedScore : 0),
      0
    ) || 0;

  // ==========================================
  // RENDER: CANDIDATE SELECTION SCREEN
  // ==========================================
  if (!activeCandidate) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                BƯỚC 1 / 2 • KHỞI TẠO PHIÊN PHỎNG VẤN
              </span>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                Chọn hoặc Nhập thông tin thí sinh phỏng vấn
              </h2>
            </div>
            <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
              {candidates.length} hồ sơ sẵn sàng
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Col: Pick from registered candidates */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                1. Chọn thí sinh từ danh sách nộp đơn ({candidates.length})
              </label>

              <div className="relative">
                <select
                  id="select-candidate"
                  value={selectedCandidateId}
                  onChange={(e) => {
                    setSelectedCandidateId(e.target.value);
                    const found = candidates.find((c) => c.id === e.target.value);
                    if (found) {
                      setCandidateNameInput(found.name);
                      setCandidateClassInput(found.className);
                      setCandidateDeptInput(found.departments[0] || 'ky_thuat');
                    }
                  }}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm rounded-xl px-4 py-3 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn thí sinh trong danh sách --</option>
                  {candidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.name} - Lớp {cand.className} (
                      {cand.departments?.map((d) => DEPARTMENTS[d]?.shortName || d).join(', ')})
                      {cand.status === 'completed' ? ' [Đã PV]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCandidateFromList && (
                <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                      {selectedCandidateFromList.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                      Lớp {selectedCandidateFromList.className}
                    </span>
                  </div>

                  <div className="text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Ban:</span>{' '}
                    {selectedCandidateFromList.departments
                      ?.map((d) => DEPARTMENTS[d]?.name || d)
                      .join(', ')}
                  </div>

                  {selectedCandidateFromList.introduction && (
                    <p className="text-neutral-500 line-clamp-2 italic">
                      "{selectedCandidateFromList.introduction}"
                    </p>
                  )}

                  <button
                    id="btn-start-selected-cand"
                    onClick={() => handleStartInterview(selectedCandidateFromList)}
                    className="w-full mt-3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {selectedCandidateFromList.status === 'completed'
                        ? 'Xem lại & Chấm lại bài phỏng vấn này'
                        : 'Bắt đầu phỏng vấn thí sinh này'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Col: Enter new candidate or custom department */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-neutral-100 dark:border-neutral-800 md:pl-8">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                2. Hoặc nhập trực tiếp thông tin thí sinh mới
              </label>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-medium text-neutral-500">Họ và tên thí sinh *</span>
                  <input
                    id="input-new-cand-name"
                    type="text"
                    value={candidateNameInput}
                    onChange={(e) => setCandidateNameInput(e.target.value)}
                    placeholder="VD: Trần Phương Nguyên"
                    className="w-full mt-1 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm rounded-xl px-3.5 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-medium text-neutral-500">Lớp *</span>
                    <input
                      id="input-new-cand-class"
                      type="text"
                      value={candidateClassInput}
                      onChange={(e) => setCandidateClassInput(e.target.value)}
                      placeholder="VD: 10A1, 11A5..."
                      className="w-full mt-1 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm rounded-xl px-3.5 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-neutral-500">Người phỏng vấn</span>
                    <input
                      id="input-interviewer-name"
                      type="text"
                      value={interviewerName}
                      onChange={(e) => setInterviewerName(e.target.value)}
                      placeholder="VD: Giám Khảo 1"
                      className="w-full mt-1 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm rounded-xl px-3.5 py-2 border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Single or Multi Department Mode */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-neutral-500">Ban ứng tuyển</span>
                    <button
                      id="btn-toggle-multi-dept"
                      type="button"
                      onClick={() => setIsMultiDeptMode(!isMultiDeptMode)}
                      className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {isMultiDeptMode ? 'Đổi sang ứng tuyển 1 ban' : 'Thí sinh ứng tuyển ĐA BAN?'}
                    </button>
                  </div>

                  {!isMultiDeptMode ? (
                    <div className="grid grid-cols-2 gap-2 bg-neutral-100 dark:bg-neutral-800/80 p-1.5 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
                      {(Object.keys(DEPARTMENTS) as Department[]).map((deptKey) => {
                        const dept = DEPARTMENTS[deptKey];
                        const isSelected = candidateDeptInput === deptKey;
                        return (
                          <button
                            key={deptKey}
                            id={`btn-dept-${deptKey}`}
                            type="button"
                            onClick={() => setCandidateDeptInput(deptKey)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                              isSelected
                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                            }`}
                          >
                            <div className="font-semibold">{dept.shortName}</div>
                            <div className="text-[10px] text-neutral-500 truncate">
                              {deptKey === 'ky_thuat'
                                ? 'Code & Robot'
                                : deptKey === 'truyen_thong'
                                ? 'Media & Design'
                                : deptKey === 'doi_ngoai'
                                ? 'Đối tác & Tài trợ'
                                : 'Kho & Vận hành'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl space-y-2 text-xs">
                      <span className="text-neutral-500 text-[11px] block">
                        Chọn các ban thí sinh đăng ký (câu hỏi sẽ được tổng hợp cân đối):
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(DEPARTMENTS) as Department[]).map((dKey) => {
                          const isChecked = multiDeptSelection.includes(dKey);
                          return (
                            <label
                              key={dKey}
                              className="flex items-center gap-2 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setMultiDeptSelection([...multiDeptSelection, dKey]);
                                  } else {
                                    if (multiDeptSelection.length > 1) {
                                      setMultiDeptSelection(multiDeptSelection.filter((d) => d !== dKey));
                                    }
                                  }
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                {DEPARTMENTS[dKey].name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="btn-create-and-start-interview"
                  type="button"
                  onClick={() => handleStartInterview()}
                  disabled={!candidateNameInput.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Khởi Tạo Ngân Hàng Đề & Phỏng Vấn Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ACTIVE INTERVIEW SESSION
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Top Banner */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shadow-inner">
            {activeCandidate.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {activeCandidate.name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-700 dark:text-neutral-300">
                Lớp {activeCandidate.className}
              </span>
              {activeCandidate.isMultiDepartment && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-medium">
                  Đa Ban
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-2 mt-0.5">
              <span>
                Ban:{' '}
                <strong className="text-neutral-700 dark:text-neutral-300">
                  {activeCandidate.departments?.map((d) => DEPARTMENTS[d]?.shortName || d).join(', ')}
                </strong>
              </span>
              <span>•</span>
              <span>GK: {activeCandidate.interviewerName || interviewerName}</span>
              {activeCandidate.phone && (
                <>
                  <span>•</span>
                  <span>SĐT: {activeCandidate.phone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Score Counter & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-right">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
              Tổng điểm hiện tại
            </span>
            <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {runningScore}{' '}
              <span className="text-xs font-normal text-neutral-400">
                / {activeCandidate.maxScore || 100}
              </span>
            </span>
          </div>

          <button
            id="btn-toggle-cand-profile"
            onClick={() => setShowProfileDrawer(!showProfileDrawer)}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Xem đơn đăng ký & thông tin chi tiết của thí sinh"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Hồ Sơ Thí Sinh</span>
            {showProfileDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-switch-candidate"
            onClick={() => setActiveCandidate(null)}
            className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5 text-neutral-500" />
            <span>Đổi thí sinh</span>
          </button>
        </div>
      </div>

      {/* Candidate Background Drawer */}
      {showProfileDrawer && (
        <div className="bg-neutral-50/90 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-4 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200/50 dark:border-neutral-800 pb-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              Thông tin khai trong Đơn Tuyển Quân của thí sinh
            </span>
            {activeCandidate.facebookUrl && (
              <a
                href={
                  activeCandidate.facebookUrl.startsWith('http')
                    ? activeCandidate.facebookUrl
                    : `https://${activeCandidate.facebookUrl}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
              >
                Facebook thí sinh <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeCandidate.introduction && (
              <div className="space-y-1">
                <span className="font-medium text-neutral-500">Giới thiệu bản thân & Điểm mạnh/yếu:</span>
                <p className="text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200/40 dark:border-neutral-700/40">
                  {activeCandidate.introduction}
                </p>
              </div>
            )}

            {(activeCandidate.experienceTechnical || activeCandidate.languages) && (
              <div className="space-y-1">
                <span className="font-medium text-neutral-500">Kỹ thuật & Ngôn ngữ lập trình:</span>
                <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200/40 dark:border-neutral-700/40 space-y-1 text-neutral-800 dark:text-neutral-200">
                  {activeCandidate.languages && (
                    <div>
                      <strong>Code:</strong> {activeCandidate.languages}
                    </div>
                  )}
                  {activeCandidate.experienceTechnical && (
                    <div>
                      <strong>Chế tạo:</strong> {activeCandidate.experienceTechnical}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(activeCandidate.experienceTeamwork || activeCandidate.experienceMedia) && (
              <div className="space-y-1">
                <span className="font-medium text-neutral-500">Kinh nghiệm Teamwork & Media:</span>
                <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200/40 dark:border-neutral-700/40 space-y-1 text-neutral-800 dark:text-neutral-200">
                  {activeCandidate.experienceTeamwork && (
                    <div>
                      <strong>Teamwork/MC:</strong> {activeCandidate.experienceTeamwork}
                    </div>
                  )}
                  {activeCandidate.experienceMedia && (
                    <div>
                      <strong>Media:</strong> {activeCandidate.experienceMedia}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Countdown Timer Widget */}
      <CountdownTimer currentQuestionIndex={currentQuestionIndex} />

      {/* Section Subtotals Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {sections.map((sec) => {
          const s = activeCandidate.sectionScores?.[sec.id] || { awarded: 0, max: sec.defaultPoints };
          const pct = s.max > 0 ? Math.round((s.awarded / s.max) * 100) : 0;
          return (
            <div
              key={sec.id}
              className="p-3 rounded-2xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-sm border border-[#e8e3d8]/80 dark:border-neutral-800 shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                <span className="font-semibold text-[#3d3429] dark:text-neutral-300 truncate">
                  {sec.roman}. {sec.title.split('&')[0].trim()}
                </span>
                <span className="font-mono text-[10px] text-neutral-400">{pct}%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-base font-bold text-[#3d3429] dark:text-neutral-100">
                  {s.awarded} <span className="text-xs font-normal text-neutral-400">/ {s.max}đ</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#eaf4ed] text-[#2d5037] font-medium">
                  Phần {sec.roman}
                </span>
              </div>
            </div>
          );
        })}

        {/* Overall Score Summary Card */}
        <div className="p-3 rounded-2xl bg-[#faf8f4] dark:bg-neutral-800/90 border border-[#e8e3d8] dark:border-neutral-700 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
            <span className="font-semibold text-[#3d3429] dark:text-neutral-200">Tổng điểm tích lũy</span>
            <span className="font-mono text-[10px] text-neutral-400">
              {activeCandidate.maxScore > 0 ? Math.round((activeCandidate.totalScore / activeCandidate.maxScore) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-base font-bold text-[#2d5037] dark:text-emerald-400">
              {activeCandidate.totalScore} <span className="text-xs font-normal text-neutral-400">/ {activeCandidate.maxScore}đ</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                activeCandidate.result === 'pass'
                  ? 'bg-emerald-100 text-emerald-800'
                  : activeCandidate.result === 'reserve'
                  ? 'bg-amber-100 text-amber-800'
                  : activeCandidate.result === 'fail'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {activeCandidate.result === 'pass'
                ? 'ĐẬU'
                : activeCandidate.result === 'reserve'
                ? 'DỰ BỊ'
                : activeCandidate.result === 'fail'
                ? 'TRƯỢT'
                : 'CHƯA ĐÁNH GIÁ'}
            </span>
          </div>
        </div>
      </div>

      {/* Question Stepper Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
          <span>
            Tiến độ: {answeredCount} / {totalQuestions} câu đã chấm ({Math.round(progressPercent)}%)
          </span>
          <button
            id="btn-regenerate-questions"
            onClick={handleRegenerateQuestions}
            className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
            title="Xáo trộn lại toàn bộ ngân hàng câu hỏi cho thí sinh này"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xáo trộn lại câu hỏi</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {activeCandidate.interviewQuestions?.map((q, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            const hasScore = typeof q.awardedScore === 'number';

            return (
              <button
                key={q.id || idx}
                id={`btn-jump-question-${idx}`}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                    : hasScore
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                }`}
              >
                <span>Câu {idx + 1}</span>
                {q.isFixed && <Pin className="w-2.5 h-2.5 opacity-60" />}
                {hasScore && (
                  <span className="font-mono text-[10px] font-bold">
                    ({q.awardedScore}/{q.maxPoints})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                {currentQuestion.sectionTitle}
              </span>

              {currentQuestion.isFixed ? (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Pin className="w-3 h-3" />
                  Cố định bắt buộc đầu phần
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Câu hỏi ngẫu nhiên
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#f5f2eb] dark:bg-neutral-800 px-2.5 py-1.5 rounded-xl border border-[#e8e3d8] dark:border-neutral-700">
                <Edit3 className="w-3 h-3 text-[#4a7c59]" />
                <span className="text-xs font-medium text-[#6e6255] dark:text-neutral-400">
                  Điểm tối đa (x):
                </span>
                <input
                  id="input-question-max-points"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  value={currentQuestion.maxPoints}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      handleMaxPointsChange(val);
                    }
                  }}
                  className="w-14 bg-white dark:bg-neutral-900 text-center font-bold font-mono text-xs rounded-lg py-1 px-1 border-0 ring-1 ring-[#d6cebf] dark:ring-neutral-600 focus:ring-2 focus:ring-[#4a7c59] outline-none"
                  title="Thay đổi điểm số tối đa x cho câu hỏi này"
                />
                <span className="text-xs font-mono font-medium text-[#6e6255] dark:text-neutral-400">
                  đ
                </span>
              </div>

              <button
                id="btn-swap-question"
                onClick={handleSwapCurrentQuestion}
                className="text-xs text-[#5c4d3c] hover:text-[#3d3429] dark:text-neutral-400 dark:hover:text-neutral-100 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eee9df] hover:bg-[#e4ded2] dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors font-medium shadow-xs"
                title="Đổi câu hỏi khác từ ngân hàng câu hỏi"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đổi câu khác</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                CÂU HỎI {currentQuestionIndex + 1} / {totalQuestions}
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                {currentQuestion.text}
              </h3>
            </div>

            {currentQuestion.rubric && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Tiêu chí chấm điểm (Barem gợi ý):</strong>
                  <span>{currentQuestion.rubric}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Ghi chú câu trả lời & phản xạ của thí sinh:</span>
                <span className="text-neutral-400 text-[11px]">Tự động lưu khi nhập</span>
              </div>
              <textarea
                id="textarea-candidate-note"
                rows={4}
                value={currentQuestion.candidateAnswerNote || ''}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Nhập tóm tắt ý chính câu trả lời của thí sinh, thái độ, phản xạ, điểm cộng/trừ..."
                className="w-full bg-[#faf8f4] dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 text-sm rounded-xl p-3.5 border-0 ring-1 ring-[#e2ddd3] dark:ring-neutral-700 focus:ring-2 focus:ring-[#4a7c59] outline-none resize-y"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#faf8f4]/90 dark:bg-neutral-800/50 border border-[#e8e3d8] dark:border-neutral-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-[#3d3429] dark:text-neutral-200 block">
                    Chấm điểm cho câu hỏi này (dạng a/x)
                  </span>
                  <span className="text-[11px] text-[#7d7164] dark:text-neutral-400">
                    Quy định: Điểm chấm <code className="text-[#4a7c59] font-mono font-bold">0 ≤ a ≤ {currentQuestion.maxPoints}</code>. Tự động tính tổng điểm và điểm từng phần.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <input
                      id="input-question-score"
                      type="number"
                      step="0.5"
                      min="0"
                      max={currentQuestion.maxPoints}
                      value={currentQuestion.awardedScore !== null && currentQuestion.awardedScore !== undefined ? currentQuestion.awardedScore : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseFloat(e.target.value);
                        handleScoreChange(val);
                      }}
                      placeholder="0"
                      className="w-20 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-center font-bold font-mono text-base rounded-xl py-2 px-2 border-0 ring-1 ring-[#d6cebf] dark:ring-neutral-600 focus:ring-2 focus:ring-[#4a7c59] outline-none shadow-inner"
                    />
                    <span className="text-sm font-semibold font-mono text-[#5c4d3c] dark:text-neutral-400 ml-2">
                      / {currentQuestion.maxPoints} điểm
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#e8e3d8]/60 dark:border-neutral-700/40">
                <span className="text-[11px] text-[#7d7164] dark:text-neutral-400 mr-1">Chấm nhanh:</span>
                {[
                  { label: '0đ', value: 0 },
                  {
                    label: `${Math.round(currentQuestion.maxPoints * 0.25 * 2) / 2}đ (25%)`,
                    value: Math.round(currentQuestion.maxPoints * 0.25 * 2) / 2,
                  },
                  {
                    label: `${Math.round(currentQuestion.maxPoints * 0.5 * 2) / 2}đ (50%)`,
                    value: Math.round(currentQuestion.maxPoints * 0.5 * 2) / 2,
                  },
                  {
                    label: `${Math.round(currentQuestion.maxPoints * 0.75 * 2) / 2}đ (75%)`,
                    value: Math.round(currentQuestion.maxPoints * 0.75 * 2) / 2,
                  },
                  { label: `${currentQuestion.maxPoints}đ (Tối đa)`, value: currentQuestion.maxPoints },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    id={`btn-preset-score-${idx}`}
                    type="button"
                    onClick={() => handleScoreChange(preset.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-colors ${
                      currentQuestion.awardedScore === preset.value
                        ? 'bg-[#4a7c59] text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-[#3d3429] dark:text-neutral-300 hover:bg-[#eee9df] dark:hover:bg-neutral-700 border border-[#e8e3d8]/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stepper Navigation Footer */}
          <div className="px-6 py-4 bg-neutral-50/60 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <button
              id="btn-prev-question"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Câu trước</span>
            </button>

            <div className="text-xs text-neutral-400 font-mono">
              {currentQuestionIndex + 1} / {totalQuestions}
            </div>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                id="btn-next-question"
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-finish-interview"
                onClick={handleCompleteInterview}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hoàn thành phỏng vấn</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completion Dialog */}
      {showCompletionDialog && activeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Đã Hoàn Thành Phỏng Vấn!
              </h3>
              <p className="text-xs text-neutral-500">
                Thí sinh: <strong>{activeCandidate.name}</strong> - Lớp{' '}
                <strong>{activeCandidate.className}</strong>
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 text-center space-y-2">
                <span className="text-xs text-neutral-500">TỔNG ĐIỂM ĐÁNH GIÁ</span>
                <div className="text-3xl font-extrabold font-mono text-neutral-900 dark:text-neutral-100">
                  {activeCandidate.totalScore}
                  <span className="text-base font-normal text-neutral-400">
                    {' '}
                    / {activeCandidate.maxScore || 100}
                  </span>
                </div>

                <div>
                  {activeCandidate.result === 'pass' && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ ĐẬU (TRÚNG TUYỂN) - Từ {bareemConfig.passThreshold}đ
                    </span>
                  )}
                  {activeCandidate.result === 'reserve' && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      ⚠ DỰ BỊ (CHỜ XÉT) - Từ {bareemConfig.reserveThreshold}đ
                    </span>
                  )}
                  {activeCandidate.result === 'fail' && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                      ✕ TRƯỢT - Dưới {bareemConfig.reserveThreshold}đ
                    </span>
                  )}
                </div>
              </div>

              {activeCandidate.sectionScores && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Chi tiết điểm theo từng phần:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {sections.map((sec) => {
                      const scoreData = activeCandidate.sectionScores?.[sec.id];
                      return (
                        <div
                          key={sec.id}
                          className="p-2.5 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/50 flex justify-between items-center"
                        >
                          <span className="text-neutral-600 dark:text-neutral-400 truncate mr-2">
                            {sec.roman}. {sec.title}
                          </span>
                          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
                            {scoreData?.awarded || 0}/{scoreData?.max || sec.defaultPoints}đ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-[#eaf4ed] dark:bg-emerald-950/40 border border-[#b2d8bc]/80 dark:border-emerald-800 text-xs text-[#2d5037] dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#4a7c59] shrink-0" />
                  <span>
                    <strong>Đã tự động tải file CSV!</strong> Kết quả chấm điểm, transcript chi tiết và phân loại của thí sinh đã được lưu về máy.
                  </span>
                </div>

                <button
                  id="btn-download-candidate-csv"
                  onClick={handleExportCurrentCandidateCsv}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#4a7c59] hover:bg-[#3d6749] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải lại file CSV chi tiết của thí sinh này</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-add-another-candidate"
                    onClick={() => {
                      setShowCompletionDialog(false);
                      onAddNewCandidate();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#eee9df] hover:bg-[#e4ded2] dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#3d3429] dark:text-neutral-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#e8e3d8]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm người mới</span>
                  </button>

                  <button
                    id="btn-go-to-candidates-list"
                    onClick={() => {
                      setShowCompletionDialog(false);
                      onViewCandidateList();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#342e28] hover:bg-[#25201b] dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Xem bảng xếp loại</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};