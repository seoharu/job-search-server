// src/migrations/[timestamp]-add-tech-stack-and-modify-salary.js
'use strict';

module.exports = {
 up: async (queryInterface, Sequelize) => {
   // tech_stack 칼럼 추가
   await queryInterface.addColumn('Jobs', 'tech_stack', {
     type: Sequelize.JSON,
     allowNull: true,
     defaultValue: []
   });

   // 기존 salary 데이터 가져오기
   const jobs = await queryInterface.sequelize.query(
     'SELECT job_id, salary FROM Jobs',
     { type: queryInterface.sequelize.QueryTypes.SELECT }
   );

   // 새로운 salary 칼럼들 추가
   await queryInterface.addColumn('Jobs', 'salary_min', {
     type: Sequelize.INTEGER,
     allowNull: true
   });
   await queryInterface.addColumn('Jobs', 'salary_max', {
     type: Sequelize.INTEGER,
     allowNull: true
   });

   // 기존 salary 데이터를 새로운 칼럼으로 이전
   for (const job of jobs) {
     if (job.salary) {
       // salary 문자열에서 숫자만 추출
       const numbers = job.salary.replace(/[^0-9]/g, ' ')
         .split(' ')
         .filter(n => n)
         .map(Number);

       // 최소값과 최대값 설정
       const salaryMin = numbers.length > 0 ? numbers[0] : null;
       const salaryMax = numbers.length > 1 ? numbers[1] : salaryMin;

       // 추출한 값으로 새로운 칼럼 업데이트
       await queryInterface.sequelize.query(
         `UPDATE Jobs SET salary_min = ?, salary_max = ? WHERE job_id = ?`,
         {
           replacements: [salaryMin, salaryMax, job.job_id],
           type: queryInterface.sequelize.QueryTypes.UPDATE
         }
       );
     }
   }
 },

 // 롤백 시 실행될 코드
 down: async (queryInterface, Sequelize) => {
   // 추가한 칼럼들 제거
   await queryInterface.removeColumn('Jobs', 'tech_stack');
   await queryInterface.removeColumn('Jobs', 'salary_min');
   await queryInterface.removeColumn('Jobs', 'salary_max');
 }
};