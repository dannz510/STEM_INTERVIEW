export type Department = 'ky_thuat' | 'truyen_thong' | 'doi_ngoai' | 'hau_can';

export type CandidateStatus = 'pending' | 'in_progress' | 'completed';
export type InterviewResult = 'pass' | 'reserve' | 'fail' | 'not_evaluated';

export interface DepartmentConfig {
  id: Department;
  name: string;
  shortName: string;
  isMain?: boolean;
  color: string;
  bgLight: string;
  badgeClass: string;
}

export const DEPARTMENTS: Record<Department, DepartmentConfig> = {
  ky_thuat: {
    id: 'ky_thuat',
    name: 'Ban Kỹ Thuật (Main)',
    shortName: 'Kỹ Thuật',
    isMain: true,
    color: '#2563eb',
    bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeClass: 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  truyen_thong: {
    id: 'truyen_thong',
    name: 'Ban Truyền Thông',
    shortName: 'Truyền Thông',
    color: '#7c3aed',
    bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeClass: 'bg-purple-100/70 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
  },
  doi_ngoai: {
    id: 'doi_ngoai',
    name: 'Ban Đối Ngoại',
    shortName: 'Đối Ngoại',
    color: '#059669',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeClass: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  hau_can: {
    id: 'hau_can',
    name: 'Ban Hậu Cần',
    shortName: 'Hậu Cần',
    color: '#d97706',
    bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeClass: 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
};

export type SectionKey = 'competence' | 'eq' | 'situation' | 'attitude' | 'bonus';

export interface SectionDefinition {
  id: SectionKey;
  roman: string;
  title: string;
  defaultPoints: number;
  description: string;
  requiredFixedCount: number;
  randomPoolCount: number;
}

export interface QuestionBankItem {
  id: string;
  department: Department | 'common';
  sectionKey: SectionKey;
  sectionTitle: string;
  text: string;
  isFixed: boolean;
  defaultPoints: number;
  rubric?: string;
  tags?: string[];
}

export interface InterviewQuestion {
  id: string;
  bankQuestionId: string;
  sectionKey: SectionKey;
  sectionTitle: string;
  department: Department | 'common';
  text: string;
  isFixed: boolean;
  maxPoints: number;
  awardedScore: number | null;
  candidateAnswerNote: string;
  rubric?: string;
}

export interface Candidate {
  id: string;
  submissionId?: string;
  name: string;
  className: string;
  departments: Department[];
  isMultiDepartment?: boolean;
  email?: string;
  phone?: string;
  facebookUrl?: string;
  introduction?: string;
  experienceMedia?: string;
  experienceTeamwork?: string;
  languages?: string;
  experienceTechnical?: string;
  status: CandidateStatus;
  result: InterviewResult;
  totalScore: number;
  maxScore: number;
  sectionScores?: Record<SectionKey, { awarded: number; max: number }>;
  interviewQuestions?: InterviewQuestion[];
  interviewerName?: string;
  generalNotes?: string;
  interviewedAt?: string;
}

export interface BareemConfig {
  passThreshold: number;
  reserveThreshold: number;
  sections: SectionDefinition[];
}

export const DEFAULT_SECTIONS: SectionDefinition[] = [
  {
    id: 'competence',
    roman: 'I',
    title: 'Năng lực & Kinh nghiệm',
    defaultPoints: 15,
    description: 'Đánh giá năng lực nền tảng, mức độ phù hợp và kinh nghiệm thực tế với ban ứng tuyển.',
    requiredFixedCount: 2,
    randomPoolCount: 1,
  },
  {
    id: 'eq',
    roman: 'II',
    title: 'EQ & Làm việc nhóm',
    defaultPoints: 20,
    description: 'Đánh giá trí tuệ cảm xúc, khả năng đồng cảm, giữ bình tĩnh và làm việc nhóm dưới áp lực cao.',
    requiredFixedCount: 1,
    randomPoolCount: 2,
  },
  {
    id: 'situation',
    roman: 'III',
    title: 'Xử lý tình huống',
    defaultPoints: 35,
    description: 'Đánh giá khả năng phản xạ, tư duy giải quyết vấn đề thực tế và xoay sở trước các sự cố khó.',
    requiredFixedCount: 1,
    randomPoolCount: 3,
  },
  {
    id: 'attitude',
    roman: 'IV',
    title: 'Thái độ & Cam kết',
    defaultPoints: 30,
    description: 'Đánh giá tinh thần trách nhiệm, mức độ cam kết, sự nhiệt huyết và sự sẵn sàng cống hiến cho CLB.',
    requiredFixedCount: 1,
    randomPoolCount: 2,
  },
  {
    id: 'bonus',
    roman: 'V',
    title: 'Điểm thưởng / Dự án đặc biệt',
    defaultPoints: 10,
    description: 'Đánh giá các kỹ năng đặc biệt, giải thưởng KHKT/Olympic hoặc thành tích ấn tượng ngoài barem.',
    requiredFixedCount: 0,
    randomPoolCount: 1,
  },
];

export const DEFAULT_BAREEM_CONFIG: BareemConfig = {
  passThreshold: 75,
  reserveThreshold: 60,
  sections: DEFAULT_SECTIONS,
};

// Thêm loại Tab mới vào App
export type ActiveTab = 'interview' | 'candidates' | 'question_bank' | 'exam_bank' | 'settings';

// Cấu trúc Dạng bài/Phân loại đề thi
export type ExamCategory = 'trac_nghiem' | 'tu_luan' | 'code_snippet' | 'logic_iq' | 'tinh_huong';

export interface ExamQuestion {
  id: string;
  code: string; // Mã câu hỏi (VD: EXAM-KT-01)
  sectionKey: string; // Khớp với SectionDefinition (chung, kien_thuc, tinh_huong...)
  department: Department | 'common'; // Phân loại theo Ban
  category: ExamCategory; // Dạng câu hỏi
  title: string; // Nội dung câu hỏi / Đề bài
  options?: string[]; // Các phương án chọn (nếu là trắc nghiệm)
  correctAnswer?: string; // Đáp án đúng / Gợi ý đáp án
  rubric?: string; // Barem/Thang điểm chi tiết
  points: number; // Điểm chuẩn của câu hỏi (mặc định)
  difficulty: 'de' | 'trung_binh' | 'kho';
}

export interface ExamPaper {
  id: string;
  title: string;
  department: Department | 'common';
  durationMinutes: number;
  totalPoints: number;
  questionIds: string[];
  createdAt: string;
}