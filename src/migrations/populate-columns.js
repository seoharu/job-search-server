// src/migrations/[timestamp]-populate-new-columns.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // tech_stack 업데이트 함수
    // requirements 필드에서 기술 스택 추출하여 tech_stack에 넣기
    const updateTechStack = async () => {
      const jobs = await queryInterface.sequelize.query(
        'SELECT job_id, requirements FROM Jobs',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      for (const job of jobs) {
        if (job.requirements) {
          // 기술 스택 추출 로직 (예시)
          const techKeywords = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Spring']; // 찾고자 하는 기술 키워드들
          const foundTechs = techKeywords.filter(tech =>
            job.requirements.toLowerCase().includes(tech.toLowerCase())
          );

          await queryInterface.sequelize.query(
            `UPDATE Jobs SET tech_stack = ? WHERE job_id = ?`,
            {
              replacements: [JSON.stringify(foundTechs), job.job_id],
              type: queryInterface.sequelize.QueryTypes.UPDATE
            }
          );
        }
      }
    };

    // salary 필드 업데이트 함수
    const updateSalaryFields = async () => {
      const jobs = await queryInterface.sequelize.query(
        'SELECT job_id, salary FROM Jobs',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      for (const job of jobs) {
        if (job.salary) {
          // 급여 문자열에서 숫자 추출 (예: "3000만원~5000만원" -> [3000, 5000])
          const numbers = job.salary.replace(/[^0-9]/g, ' ')
            .split(' ')
            .filter(n => n)
            .map(Number);

          const salaryMin = numbers.length > 0 ? numbers[0] : null;
          const salaryMax = numbers.length > 1 ? numbers[1] : salaryMin;

          await queryInterface.sequelize.query(
            `UPDATE Jobs SET salary_min = ?, salary_max = ? WHERE job_id = ?`,
            {
              replacements: [salaryMin, salaryMax, job.job_id],
              type: queryInterface.sequelize.QueryTypes.UPDATE
            }
          );
        }
      }
    };

    // 업데이트 실행
    await updateTechStack();
    await updateSalaryFields();
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백시 필요한 작업
    await queryInterface.sequelize.query(
      `UPDATE Jobs SET tech_stack = NULL, salary_min = NULL, salary_max = NULL`
    );
  }
};