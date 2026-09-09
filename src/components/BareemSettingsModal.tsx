import React, { useState } from 'react';
import { BareemConfig, SectionDefinition } from '../types';
import { RotateCcw, Sliders, Check, AlertCircle } from 'lucide-react';
import { DEFAULT_BAREEM_CONFIG, DEFAULT_SECTIONS } from '../types';

interface BareemSettingsModalProps {
  bareemConfig: BareemConfig;
  sections: SectionDefinition[];
  onUpdateBareemConfig: (cfg: BareemConfig) => void;
  onUpdateSections: (secs: SectionDefinition[]) => void;
}

export const BareemSettingsModal: React.FC<BareemSettingsModalProps> = ({
  bareemConfig,
  sections,
  onUpdateBareemConfig,
  onUpdateSections,
}) => {
  const [passThreshold, setPassThreshold] = useState<number>(bareemConfig.passThreshold);
  const [reserveThreshold, setReserveThreshold] = useState<number>(bareemConfig.reserveThreshold);
  const [localSections, setLocalSections] = useState<SectionDefinition[]>(sections);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalDefaultPoints = localSections.reduce((acc, s) => acc + (Number(s.defaultPoints) || 0), 0);

  const handleSectionPointChange = (id: string, newPoints: number) => {
    const val = Math.max(0, isNaN(newPoints) ? 0 : newPoints);
    setLocalSections(
      localSections.map((s) => (s.id === id ? { ...s, defaultPoints: val } : s))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const passVal = Number(passThreshold);
    const reserveVal = Number(reserveThreshold);

    if (passVal <= reserveVal) {
      setErrorMessage('Ngưỡng Mức Đậu phải lớn hơn Ngưỡng Mức Dự Bị!');
      return;
    }

    onUpdateBareemConfig({
      ...bareemConfig,
      passThreshold: passVal || 75,
      reserveThreshold: reserveVal || 60,
    });
    onUpdateSections(localSections);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Khôi phục barem điểm về chuẩn mặc định của CLB STEM?')) {
      setPassThreshold(DEFAULT_BAREEM_CONFIG.passThreshold);
      setReserveThreshold(DEFAULT_BAREEM_CONFIG.reserveThreshold);
      setLocalSections(DEFAULT_SECTIONS);
      onUpdateBareemConfig(DEFAULT_BAREEM_CONFIG);
      onUpdateSections(DEFAULT_SECTIONS);
      setErrorMessage(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs p-6">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Cấu Hình Barem & Tiêu Chuẩn Điểm Tuyển Quân</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Điều chỉnh ngưỡng điểm xếp loại (Đậu, Dự bị, Trượt) và phân bổ số điểm giữa các phần phỏng vấn.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Classification Thresholds */}
          <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 space-y-4">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block text-sm">
              1. Ngưỡng Điểm Phân Loại Thí Sinh (Thang 100)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                  ✓ Mức ĐẬU (Trúng tuyển chính thức)
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Tổng điểm tối thiểu để trúng tuyển:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">≥</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={passThreshold}
                    onChange={(e) => setPassThreshold(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white dark:bg-neutral-900 font-mono font-bold text-base px-2 py-1 rounded-lg border-0 ring-1 ring-emerald-400 outline-none text-center text-neutral-900 dark:text-neutral-100"
                  />
                  <span className="font-mono text-xs text-neutral-500">/ 100 điểm</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/30 space-y-2">
                <span className="font-bold text-amber-800 dark:text-amber-300 block">
                  ⚠ Mức DỰ BỊ (Xét tuyển bổ sung)
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Từ mức này đến cận mức Đậu:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">≥</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={reserveThreshold}
                    onChange={(e) => setReserveThreshold(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white dark:bg-neutral-900 font-mono font-bold text-base px-2 py-1 rounded-lg border-0 ring-1 ring-amber-400 outline-none text-center text-neutral-900 dark:text-neutral-100"
                  />
                  <span className="font-mono text-xs text-neutral-500">/ 100 điểm</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/50 dark:border-red-900/30 space-y-2">
                <span className="font-bold text-red-800 dark:text-red-300 block">
                  ✕ Mức TRƯỢT (Không trúng tuyển)
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  Tự động phân loại khi dưới ngưỡng Dự bị:
                </span>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs font-semibold text-red-600">
                    &lt; {reserveThreshold} điểm
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Distribution */}
          <div className="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block text-sm">
                2. Phân Bổ Điểm Chuẩn Cho Các Phần Bắt Buộc
              </span>
              <span
                className={`font-mono text-xs px-2.5 py-1 rounded-lg ${
                  totalDefaultPoints === 100
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                Tổng điểm: {totalDefaultPoints} / 100đ {totalDefaultPoints === 100 ? '✓ Chuẩn' : '⚠ Chưa tròn 100đ'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localSections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {sec.roman}. {sec.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sec.defaultPoints}
                        onChange={(e) =>
                          handleSectionPointChange(sec.id, parseFloat(e.target.value))
                        }
                        className="w-16 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold text-center px-2 py-1 rounded-lg border-0 ring-1 ring-neutral-200 dark:ring-neutral-700 outline-none text-neutral-900 dark:text-neutral-100"
                      />
                      <span className="text-neutral-500 font-mono">điểm</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500">{sec.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {saveSuccess && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-4 h-4" /> Đã lưu cài đặt barem thành công!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium shadow-xs hover:opacity-90 transition-opacity"
            >
              Lưu Cấu Hình Barem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BareemSettingsModal;