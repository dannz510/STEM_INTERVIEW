import React, { useState, useEffect } from 'react';
import { Candidate, QuestionBankItem, BareemConfig, SectionDefinition } from './types';
import { INITIAL_CANDIDATES } from './data/defaultCandidates'; 
import { DEFAULT_QUESTION_BANK } from './data/defaultQuestionBank';
import { DEFAULT_BAREEM_CONFIG, DEFAULT_SECTIONS } from './types';
import { Header } from './components/Header';
import { InterviewView } from './components/InterviewView';
import { CandidateListView } from './components/CandidateListView';
import { QuestionBankView } from './components/QuestionBankView';
import { BareemSettingsModal } from './components/BareemSettingsModal';
import { CandidateModal } from './components/CandidateModal';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { exportCandidatesSummaryExcel } from './utils/excelExport';

const STORAGE_KEYS = {
  CANDIDATES: 'stem_interview_candidates_v2', // Đổi sang v2 để tự động nhận mockdata.ts mới
  QUESTION_BANK: 'stem_interview_qbank_v1',
  BAREEM: 'stem_interview_bareem_v1',
  SECTIONS: 'stem_interview_sections_v1',
};

export default function App() {
  // Navigation: Đã đồng bộ đủ 4 tab với Header
  const [activeTab, setActiveTab] = useState<'interview' | 'candidates' | 'question_bank' | 'settings'>('candidates');

  // Load danh sách ứng viên từ localStorage hoặc lấy từ INITIAL_CANDIDATES (mockdata.ts)
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved candidates', e);
    }
    return INITIAL_CANDIDATES;
  });

  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved question bank', e);
    }
    return DEFAULT_QUESTION_BANK;
  });

  const [bareemConfig, setBareemConfig] = useState<BareemConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BAREEM);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse bareem config', e);
    }
    return DEFAULT_BAREEM_CONFIG;
  });

  const [sections, setSections] = useState<SectionDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse sections', e);
    }
    return DEFAULT_SECTIONS;
  });

  // Active candidate selected for interview
  const [activeInterviewCandidateId, setActiveInterviewCandidateId] = useState<string | undefined>(
    candidates[0]?.id
  );

  // Modals
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [candidateInDetailView, setCandidateInDetailView] = useState<Candidate | null>(null);

  // Auto save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
    } catch (e) {
      console.error('Save candidates failed', e);
    }
  }, [candidates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(questionBank));
    } catch (e) {
      console.error('Save question bank failed', e);
    }
  }, [questionBank]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BAREEM, JSON.stringify(bareemConfig));
    } catch (e) {
      console.error('Save bareem failed', e);
    }
  }, [bareemConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    } catch (e) {
      console.error('Save sections failed', e);
    }
  }, [sections]);

  // Sync candidateInDetailView with global candidates state to preserve reactivity
  useEffect(() => {
    if (candidateInDetailView) {
      const updated = candidates.find((c) => c.id === candidateInDetailView.id);
      if (updated) {
        setCandidateInDetailView(updated);
      }
    }
  }, [candidates]);

  // Update a single candidate
  const handleUpdateCandidate = (updated: Candidate) => {
    setCandidates((prev) => {
      const exists = prev.some((c) => c.id === updated.id);
      if (exists) {
        return prev.map((c) => (c.id === updated.id ? updated : c));
      } else {
        return [updated, ...prev];
      }
    });
  };

  // Add / Save from CandidateModal
  const handleSaveCandidateFromModal = (cand: Candidate) => {
    handleUpdateCandidate(cand);
    setCandidateToEdit(null);
    setIsCandidateModalOpen(false);
  };

  // Delete candidate
  const handleDeleteCandidate = (candidateId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    if (activeInterviewCandidateId === candidateId) {
      setActiveInterviewCandidateId(undefined);
    }
    if (candidateInDetailView?.id === candidateId) {
      setCandidateInDetailView(null);
    }
  };

  // Import batch candidates
  const handleImportCandidates = (newCandidates: Candidate[]) => {
    setCandidates((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const filteredNew = newCandidates.filter((c) => !existingIds.has(c.id));
      return [...filteredNew, ...prev];
    });
  };

  // Switch to interview tab for specific candidate
  const handleSelectCandidateToInterview = (candId: string) => {
    setActiveInterviewCandidateId(candId);
    setActiveTab('interview');
  };

  // Export summary Excel
  const handleExportAllExcel = () => {
    exportCandidatesSummaryExcel(candidates, 'xlsx');
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-neutral-900 flex flex-col selection:bg-blue-500/20 selection:text-blue-700">
      {/* macOS Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        candidates={candidates}
        onAddNewCandidate={() => {
          setCandidateToEdit(null);
          setIsCandidateModalOpen(true);
        }}
        onExportAllExcel={handleExportAllExcel}
        activeInterviewCandidateName={
          activeTab === 'interview' && activeInterviewCandidateId
            ? candidates.find((c) => c.id === activeInterviewCandidateId)?.name
            : undefined
        }
      />

      {/* Main Workspace Tabs */}
      <main className="flex-1 pb-16">
        {activeTab === 'interview' && (
          <InterviewView
            candidates={candidates}
            questionBank={questionBank}
            sections={sections}
            bareemConfig={bareemConfig}
            onUpdateCandidate={handleUpdateCandidate}
            onAddNewCandidate={() => {
              setCandidateToEdit(null);
              setIsCandidateModalOpen(true);
            }}
            initialCandidateId={activeInterviewCandidateId}
            onViewCandidateList={() => setActiveTab('candidates')}
          />
        )}

        {activeTab === 'candidates' && (
          <CandidateListView
            candidates={candidates}
            onSelectCandidateToInterview={handleSelectCandidateToInterview}
            onViewCandidateDetail={(cand) => setCandidateInDetailView(cand)}
            onAddNewCandidate={() => {
              setCandidateToEdit(null);
              setIsCandidateModalOpen(true);
            }}
            onImportCandidates={handleImportCandidates}
            onDeleteCandidate={handleDeleteCandidate}
          />
        )}

        {activeTab === 'question_bank' && (
          <QuestionBankView
            questionBank={questionBank}
            sections={sections}
            onUpdateQuestionBank={(bank) => setQuestionBank(bank)}
          />
        )}

        {activeTab === 'settings' && (
          <BareemSettingsModal
            bareemConfig={bareemConfig}
            sections={sections}
            onUpdateBareemConfig={(cfg) => setBareemConfig(cfg)}
            onUpdateSections={(secs) => setSections(secs)}
          />
        )}
      </main>

      {/* Candidate Creation & Edit Modal */}
      <CandidateModal
        isOpen={isCandidateModalOpen}
        onClose={() => {
          setIsCandidateModalOpen(false);
          setCandidateToEdit(null);
        }}
        onSaveCandidate={handleSaveCandidateFromModal}
        candidateToEdit={candidateToEdit}
      />

      {/* Candidate Full Transcript / Detail Modal */}
      <CandidateDetailModal
        candidate={candidateInDetailView}
        onClose={() => setCandidateInDetailView(null)}
        sections={sections}
        onStartInterview={(candId) => {
          setCandidateInDetailView(null);
          handleSelectCandidateToInterview(candId);
        }}
      />
    </div>
  );
}