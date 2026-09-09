import React from 'react';
import { BookOpen, Sliders, Users, UserPlus, FileSpreadsheet, HelpCircle } from 'lucide-react';
import { Candidate } from '../types';

interface HeaderProps {
  activeTab: 'interview' | 'candidates' | 'question_bank' | 'settings';
  setActiveTab: (tab: 'interview' | 'candidates' | 'question_bank' | 'settings') => void;
  candidates: Candidate[];
  onAddNewCandidate: () => void;
  onExportAllExcel: () => void;
  activeInterviewCandidateName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  candidates,
  onAddNewCandidate,
  onExportAllExcel,
  activeInterviewCandidateName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border-b border-neutral-200/70 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: macOS Window Controls & Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 pr-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block shadow-xs" />
          </div>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block" />
          <div>
            <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
              <span>Hệ Thống Phỏng Vấn STEM</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                CLB STEM
              </span>
            </h1>
            <p className="text-[11px] text-neutral-500 hidden md:block">
              Ngân hàng câu hỏi barem chuẩn • Phỏng vấn đa ban • Tự động xếp loại
            </p>
          </div>
        </div>

        {/* Center: Segmented Control Tabs */}
        <nav className="flex items-center bg-neutral-100/90 dark:bg-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'candidates'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Thí sinh</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-600">
              {candidates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'interview'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Phỏng vấn</span>
            {activeInterviewCandidateName && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[80px]">
                ({activeInterviewCandidateName})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('question_bank')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'question_bank'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ngân hàng câu hỏi</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Barem & Cài đặt</span>
          </button>
        </nav>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportAllExcel}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Xuất báo cáo tổng quan Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Báo Cáo</span>
          </button>

          <button
            onClick={onAddNewCandidate}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm Thí Sinh</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;