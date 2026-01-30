export type BoardCategory = '전북대' | '단과대' | '학과' | '사업단';

export interface BoardMeta {
    name: string;
    category: BoardCategory;
}

export const BOARD_MAP: Record<string, BoardMeta> = {
    // 전북대 본부 공지
    home_campus: { name: "교내공지", category: "전북대" },
    home_student: { name: "학생공지", category: "전북대" },
    home_lecture: { name: "특강&세미나", category: "전북대" },
    home_news: { name: "JBNU News", category: "전북대" },
    home_newsplus: { name: "JBNU Newsplus", category: "전북대" },
    home_policy: { name: "교육정책/주요대학소식", category: "전북대" },
    home_contest: { name: "공모/스터디", category: "전북대" },
    home_parttime: { name: "아르바이트", category: "전북대" },
    home_housing: { name: "자취/하숙", category: "전북대" },
    home_lostandfound: { name: "분실/습득", category: "전북대" },
    home_poster: { name: "전자대자보", category: "전북대" },

    // 단과대
    college_nursing: { name: "간호대학", category: "단과대" },
    college_cbe: { name: "경상대학", category: "단과대" },
    college_eng: { name: "공과대학", category: "단과대" },
    college_sies: { name: "국제이공학부", category: "단과대" },
    college_agri: { name: "농업생명과학대학", category: "단과대" },
    college_coe: { name: "사범대학", category: "단과대" },
    college_social: { name: "사회과학대학", category: "단과대" },
    college_he: { name: "생활과학대학", category: "단과대" },
    college_vetmed: { name: "수의과대학", category: "단과대" },
    college_pharm: { name: "약학대학", category: "단과대" },
    college_arts: { name: "예술대학", category: "단과대" },
    college_med: { name: "의과대학", category: "단과대" },
    college_human: { name: "인문대학", category: "단과대" },
    college_natural: { name: "자연과학대학", category: "단과대" },
    college_dent: { name: "치과대학", category: "단과대" },
    college_convergence: { name: "융합자율전공학부", category: "단과대" },

    // 학과
    dept_business: { name: "경영학과", category: "학과" },
    dept_economics: { name: "경제학부", category: "학과" },
    dept_mechanical: { name: "기계공학", category: "학과" },
    dept_mse: { name: "기계시스템공학부", category: "학과" },
    dept_animalsci: { name: "동물자원과학과", category: "학과" },
    dept_trade: { name: "무역학과", category: "학과" },
    dept_lis: { name: "문헌정보학과", category: "학과" },
    dept_physics: { name: "물리학과", category: "학과" },
    dept_semi: { name: "반도체과학기술학과", category: "학과" },
    dept_molbio: { name: "분자생물학과", category: "학과" },
    dept_history: { name: "사학과", category: "학과" },
    dept_welfare: { name: "사회복지학과", category: "학과" },
    dept_sociology: { name: "사회학과", category: "학과" },
    dept_biotech: { name: "생명공학부", category: "학과" },
    dept_bioedu: { name: "생물교육학과", category: "학과" },
    dept_bime: { name: "생물산업기계공학과", category: "학과" },
    dept_bioenv: { name: "생물환경화학과", category: "학과" },
    dept_foodtech: { name: "식품공학과", category: "학과" },
    dept_fshn: { name: "식품영양학과", category: "학과" },
    dept_child: { name: "아동학과", category: "학과" },
    dept_english: { name: "영어영문학과", category: "학과" },
    dept_ethedu: { name: "윤리교육학과", category: "학과" },
    dept_fashion: { name: "의류학과", category: "학과" },
    dept_crop: { name: "작물생명과학과", category: "학과" },
    dept_electronics: { name: "전자공학부", category: "학과" },
    dept_political: { name: "정치외교학과", category: "학과" },
    dept_housing: { name: "주거환경학과", category: "학과" },
    dept_chinese: { name: "중어중문학과", category: "학과" },
    dept_earthedu: { name: "지구과학교육학과", category: "학과" },
    dept_csai: { name: "컴퓨터인공지능학부", category: "학과" },
    dept_statistics: { name: "통계학과", category: "학과" },
    dept_french: { name: "프랑스아프리카학과", category: "학과" },
    dept_admin: { name: "행정학과", category: "학과" },
    dept_chemistry: { name: "화학과", category: "학과" },
    dept_chemical: { name: "화학공학부", category: "학과" },
    dept_chemedu: { name: "화학교육학과", category: "학과" },
    dept_accounting: { name: "회계학과", category: "학과" },

    // 사업단
    agency_sw: { name: "SW중심대학사업단", category: "사업단" },
};

/**
 * 게시판 코드로 이름 조회
 */
export const getBoardName = (code: string): string => {
    return BOARD_MAP[code]?.name || code;
};

/**
 * 카테고리별 게시판 목록 (Select 옵션용)
 */
export const BOARD_OPTIONS = Object.entries(BOARD_MAP).map(([code, meta]) => ({
    code,
    name: meta.name,
    category: meta.category,
}));

export const CATEGORIES = ['전북대', '단과대', '학과', '사업단'] as const;
