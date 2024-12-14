// src/migrations/[timestamp]-update-tech-stack-from-title.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 검색 키워드 정의
    const SEARCH_KEYWORDS = [
     // IT/개발 직군
      'Python 개발자', 'Java 개발자', 'Frontend 개발자', 'Backend 개발자',
      'Node.js 개발자', 'React 개발자', 'Vue.js 개발자', 'iOS 개발자',
      'Android 개발자', 'Full Stack 개발자', 'DevOps 엔지니어',
      '데이터 엔지니어', '데이터 사이언티스트', 'ML 엔지니어',
      '시스템 엔지니어', '클라우드 엔지니어', '네트워크 엔지니어',

      // 경영/기획/관리 직군
      '경영지원', '인사담당자', 'HR매니저', '회계담당자',
      '재무담당자', '전략기획', '경영기획', '사업기획',
      '마케팅 매니저', '브랜드 매니저', '상품기획자',

      // 마케팅/광고 직군
      '디지털마케팅', '퍼포먼스마케팅', '콘텐츠 마케터',
      '그로스해커', 'SNS마케터', '광고기획자', '미디어플래너',

      //  영업/고객관리 직군
      '영업관리', '기술영업', '해외영업', 'PM', '영업기획',
      '고객관리', 'CS매니저', '기술지원',
      // 디자인 직군
     'UI디자이너', 'UX디자이너', '웹디자이너', '그래픽디자이너',
     '콘텐츠기획자', '콘텐츠제작', '카피라이터', '영상편집자',

     // 연구/R&D 직군
      '연구원', '연구개발', 'R&D', '제품개발', '기술연구',
      '생명공학', '화학연구', '기계설계', '전자회로설계',

      // 생산/제조 직군
      '생산관리', '품질관리', '공정관리', '설비관리',
      '안전관리', '자재관리', '물류관리',

      // 건설/건축 직군
      '건축가', '건축설계', '건설현장', '공무', '견적',
      '설비설계', '전기설계', '소방설계', '구조설계',

      // 의료/바이오 직군
     '임상연구', '임상시험', '간호사', '약사', '의료기기', '바이오', '제약', '헬스케어',

      // 금융/투자 직군
      '재무분석', '투자분석', '리스크관리', '자산운용',
      '펀드매니저', '애널리스트', '트레이더', '계리사',

      // 법률/특허 직군
      '변호사', '법무', '특허', '지식재산권', '법률검토',

      // 교육 직군
      '교육기획', '교육컨텐츠', '이러닝', '교육운영',
      '교육프로그램', '강사', '교육매니저',

      // 서비스/컨설팅 직군
      '서비스기획', '컨설턴트', '전략컨설팅', '경영컨설팅',
      'PM컨설턴트', 'ERP컨설턴트', '물류컨설턴트'
]

    // 모든 job 데이터 가져오기
    const jobs = await queryInterface.sequelize.query(
      'SELECT job_id, title FROM Jobs',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // 각 job에 대해 title 분석하여 tech_stack 업데이트
    for (const job of jobs) {
      if (job.title) {
        // title에서 키워드 매칭
        const matchedKeywords = SEARCH_KEYWORDS.filter(keyword =>
          job.title.toLowerCase().includes(keyword.toLowerCase())
        );

        if (matchedKeywords.length > 0) {
          // tech_stack 업데이트
          await queryInterface.sequelize.query(
            `UPDATE Jobs SET tech_stack = ? WHERE job_id = ?`,
            {
              replacements: [JSON.stringify(matchedKeywords), job.job_id],
              type: queryInterface.sequelize.QueryTypes.UPDATE
            }
          );
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백 시 tech_stack을 빈 배열로 되돌림
    await queryInterface.sequelize.query(
      `UPDATE Jobs SET tech_stack = '[]' WHERE tech_stack IS NOT NULL`
    );
  }
};