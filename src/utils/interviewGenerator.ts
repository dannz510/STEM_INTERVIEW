import {
  Candidate,
  Department,
  InterviewQuestion,
  QuestionBankItem,
  SectionDefinition,
  SectionKey,
  BareemConfig,
  InterviewResult,
} from '../types';
import { DEFAULT_SECTIONS } from '../data/defaultQuestionBank';

export const DEFAULT_BAREEM_CONFIG: BareemConfig = {
  passThreshold: 75,
  reserveThreshold: 60,
  sections: DEFAULT_SECTIONS,
};

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateInterviewQuestions(
  candidate: Candidate,
  questionBank: QuestionBankItem[],
  sections: SectionDefinition[] = DEFAULT_SECTIONS,
  activeDepartment?: Department | 'multi'
): InterviewQuestion[] {
  const interviewQuestions: InterviewQuestion[] = [];
  const candidateDepts = candidate.departments;
  const primaryDept = activeDepartment && activeDepartment !== 'multi'
    ? activeDepartment
    : candidateDepts[0] || 'ky_thuat';
  const isMulti = activeDepartment === 'multi' || candidate.departments.length > 1;

  for (const section of sections) {
    // 1. Get bank questions for this section matching candidate's departments
    const sectionBankItems = questionBank.filter((item) => {
      if (item.sectionKey !== section.id) return false;
      if (item.department === 'common') return true;
      if (isMulti) {
        return candidateDepts.includes(item.department);
      }
      return item.department === primaryDept;
    });

    // 2. Separate into fixed and non-fixed questions
    const fixedItems = sectionBankItems.filter((item) => item.isFixed);
    const nonFixedItems = sectionBankItems.filter((item) => !item.isFixed);

    // 3. Shuffle non-fixed items to get fair random pool
    const shuffledNonFixed = shuffleArray(nonFixedItems);

    // 4. Select questions: ALL fixed items first, then fill from random pool
    const selectedItems: QuestionBankItem[] = [];

    // Add fixed items first (must have first question fixed per prompt requirement)
    for (const fixed of fixedItems) {
      if (!selectedItems.some((s) => s.id === fixed.id)) {
        selectedItems.push(fixed);
      }
    }

    // Ensure we have at least 1 fixed question if available, else pick first available
    if (selectedItems.length === 0 && sectionBankItems.length > 0) {
      selectedItems.push(sectionBankItems[0]);
    }

    // Add randomized questions to reach target pool count
    const targetCount = Math.max(
      selectedItems.length,
      section.requiredFixedCount + section.randomPoolCount
    );

    for (const item of shuffledNonFixed) {
      if (selectedItems.length >= targetCount) break;
      if (!selectedItems.some((s) => s.id === item.id)) {
        selectedItems.push(item);
      }
    }

    // If still less than 2 questions, try any other department's questions in this section
    if (selectedItems.length === 0) {
      const fallback = questionBank.filter((item) => item.sectionKey === section.id);
      if (fallback.length > 0) {
        selectedItems.push(fallback[0]);
      }
    }

    // 5. Calibrate point values so sum equals section.defaultPoints
    const rawTotalPoints = selectedItems.reduce((sum, item) => sum + (item.defaultPoints || 5), 0);
    const targetSectionPoints = section.defaultPoints;

    selectedItems.forEach((item, index) => {
      let allocatedPoints: number;

      // If raw total matches target, keep item.defaultPoints
      if (rawTotalPoints === targetSectionPoints) {
        allocatedPoints = item.defaultPoints;
      } else {
        // Proportionally scale points and round to clean step (0.5 or integer)
        const ratio = (item.defaultPoints || 5) / rawTotalPoints;
        const rawScaled = ratio * targetSectionPoints;
        allocatedPoints = Math.round(rawScaled * 2) / 2; // round to nearest 0.5
      }

      // On the last item of section, adjust for any small rounding discrepancy
      if (index === selectedItems.length - 1) {
        const sumSoFar = selectedItems
          .slice(0, index)
          .reduce((sum, _, i) => sum + (interviewQuestions[interviewQuestions.length - (selectedItems.length - 1) + i]?.maxPoints || 0), 0);
        const remainder = targetSectionPoints - sumSoFar;
        if (remainder > 0) {
          allocatedPoints = remainder;
        }
      }

      if (allocatedPoints <= 0) allocatedPoints = 1;

      interviewQuestions.push({
        id: `iq_${section.id}_${index + 1}_${Math.random().toString(36).substring(2, 7)}`,
        bankQuestionId: item.id,
        sectionKey: section.id,
        sectionTitle: `${section.roman}. ${section.title}`,
        department: item.department,
        text: item.text,
        isFixed: item.isFixed,
        maxPoints: allocatedPoints,
        awardedScore: null,
        candidateAnswerNote: '',
        rubric: item.rubric,
      });
    });
  }

  return interviewQuestions;
}

export function evaluateInterviewResult(
  totalScore: number,
  config: BareemConfig = DEFAULT_BAREEM_CONFIG
): InterviewResult {
  if (totalScore >= config.passThreshold) return 'pass';
  if (totalScore >= config.reserveThreshold) return 'reserve';
  return 'fail';
}

export function computeCandidateScoreStats(
  questions: InterviewQuestion[],
  sections: SectionDefinition[] = DEFAULT_SECTIONS,
  config: BareemConfig = DEFAULT_BAREEM_CONFIG
) {
  let totalScore = 0;
  let maxScore = 0;

  const sectionScores: Record<SectionKey, { awarded: number; max: number }> = {
    competence: { awarded: 0, max: 0 },
    eq: { awarded: 0, max: 0 },
    situation: { awarded: 0, max: 0 },
    attitude: { awarded: 0, max: 0 },
    bonus: { awarded: 0, max: 0 },
  };

  for (const q of questions) {
    const pts = typeof q.awardedScore === 'number' ? q.awardedScore : 0;
    totalScore += pts;
    maxScore += q.maxPoints;

    if (sectionScores[q.sectionKey]) {
      sectionScores[q.sectionKey].awarded += pts;
      sectionScores[q.sectionKey].max += q.maxPoints;
    }
  }

  // Round to 1 decimal place
  totalScore = Math.round(totalScore * 10) / 10;
  maxScore = Math.round(maxScore * 10) / 10;

  const result = evaluateInterviewResult(totalScore, config);

  return {
    totalScore,
    maxScore,
    result,
    sectionScores,
  };
}
