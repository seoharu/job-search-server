import pandas as pd
from sqlalchemy import create_engine, text
import hashlib
import os
from datetime import datetime
import json
import sys
from tqdm import tqdm
from urllib.parse import quote_plus
import logging
from typing import List, Dict, Optional
sys.path.append('../')

class DataProcessor:
    """데이터 처리를 위한 클래스"""

    def __init__(self):
        """데이터베이스 연결 설정 및 로거 초기화"""
        self._setup_logger()
        self._setup_database()

    def _setup_logger(self) -> None:
        """로깅 설정"""
        self.logger = logging.getLogger('DataProcessor')
        self.logger.setLevel(logging.INFO)

        # 파일 핸들러
        file_handler = logging.FileHandler('data_processor.log')
        file_handler.setLevel(logging.INFO)

        # 콘솔 핸들러
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)

        # 포맷 설정
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)

    def _setup_database(self) -> None:
        """데이터베이스 연결 설정"""
        try:
            from dotenv import load_dotenv
            load_dotenv()

            self.engine = create_engine(
                f"mysql+pymysql://{os.getenv('DB_USER')}:{quote_plus(os.getenv('DB_PASSWORD'))}@"
                f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/WSD03?charset=utf8mb4"
            )
            self.logger.info("Database connection established successfully")
        except Exception as e:
            self.logger.error(f"Database connection error: {str(e)}")
            raise

    def generate_id(self, text: str) -> str:
        """고유 ID 생성"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()[:20]

    def insert_skill(self, conn, skill: str) -> str:
        """Skills 테이블에 데이터 삽입"""
        try:
            skill_id = self.generate_id(skill)

            query = text("""
                INSERT INTO Skills (
                    skill_id, name, category, description
                ) VALUES (
                    :skill_id, :name, 'technical', :description
                )
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    category = VALUES(category),
                    description = VALUES(description)
            """)

            params = {
                'skill_id': skill_id,
                'name': skill,
                'description': f'Technical skill: {skill}'
            }

            conn.execute(query, params)
            return skill_id
        except Exception as e:
            self.logger.error(f"Error inserting skill {skill}: {str(e)}")
            raise

    def extract_skills(self, tech_stack: str) -> List[str]:
        """JSON 형태의 tech_stack에서 기술 스택 추출"""
        if pd.isna(tech_stack):
            return []

        skills = []
        try:
            # 먼저 JSON으로 파싱 시도
            try:
                tech_data = json.loads(tech_stack)
                for category in tech_data.values():
                    if isinstance(category, list):
                        skills.extend([skill.strip() for skill in category if skill.strip()])
            except json.JSONDecodeError:
                # JSON 파싱 실패시 콤마로 분리된 문자열로 처리
                skills = [skill.strip() for skill in tech_stack.split(',') if skill.strip()]

        except Exception as e:
            self.logger.warning(f"Error parsing tech_stack: {str(e)}")
            return []

        return list(set(skills))  # 중복 제거

    def load_and_merge_data(self) -> Optional[pd.DataFrame]:
        """병합된 CSV 파일 로드"""
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(current_dir, 'merged_saramin_jobs.csv')

            if os.path.exists(file_path):
                df = pd.read_csv(file_path)
                self.logger.info(f"Successfully loaded {len(df)} records from merged_saramin_jobs.csv")
                return df
            else:
                self.logger.error("merged_saramin_jobs.csv not found")
                return None
        except Exception as e:
            self.logger.error(f"Error loading data: {str(e)}")
            return None

#     def insert_job(self, conn, job_id: str, company_id: str, row: pd.Series) -> bool:
#         """Jobs 테이블에 데이터 삽입"""
#         try:
#             query = text("""
#                 INSERT INTO Jobs (
#                     job_id, company_id, title, description,
#                     requirements, location, employment_type,
#                     experience_level, deadline, status, search_keyword, bookmark_id
#                 ) VALUES (
#                     :job_id, :company_id, :title, :description,
#                     :requirements, :location, :employment_type,
#                     :experience_level, :deadline, 'active', :search_keyword, :bookmark_id
#                 )
#                 ON DUPLICATE KEY UPDATE
#                     title = VALUES(title),
#                     description = VALUES(description),
#                     requirements = VALUES(requirements),
#                     location = VALUES(location),
#                     employment_type = VALUES(employment_type),
#                     experience_level = VALUES(experience_level),
#                     deadline = VALUES(deadline),
#                     status = VALUES(status),
#                     search_keyword = VALUES(search_keyword)
#             """)
#
#             deadline = row.deadline if pd.notna(row.get('deadline')) else None
#
#             params = {
#                 'job_id': job_id,
#                 'company_id': company_id,
#                 'title': row.title,
#                 'description': row.description if pd.notna(row.description) else '',
#                 'requirements': f"{row.experience}, {row.education}",
#                 'location': row.location_detail if pd.notna(row.location_detail) else row.location,
#                 'employment_type': row.employment_type if pd.notna(row.employment_type) else '미지정',
#                 'experience_level': row.experience,
#                 'deadline': row.deadline if pd.notna(row.deadline) else '2024-12-31 23:59:59',
#                 'search_keyword': row.tech_stack[:50] if pd.notna(row.tech_stack) else '',
#                 'bookmark_id': ''
#             }
#
#             conn.execute(query, params)
#             return True
#         except Exception as e:
#             self.logger.error(f"Error inserting job {row.title}: {str(e)}")
#             return False

    def insert_job_skills(self, conn, job_id: str, skills: List[str]) -> bool:
        """JobSkills 테이블에 데이터 삽입"""
        try:
            for skill in skills:
                # 먼저 Skills 테이블에 스킬 삽입
                skill_id = self.insert_skill(conn, skill)
                jobskill_id = self.generate_id(f"{job_id}_{skill}")

                query = text("""
                    INSERT INTO JobSkills (
                        jobskill_id, job_id, skill_id,
                        level, is_required, priority
                    ) VALUES (
                        :jobskill_id, :job_id, :skill_id,
                        'intermediate', TRUE, 1
                    )
                    ON DUPLICATE KEY UPDATE
                        level = VALUES(level),
                        is_required = VALUES(is_required),
                        priority = VALUES(priority)
                """)

                params = {
                    'jobskill_id': jobskill_id,
                    'job_id': job_id,
                    'skill_id': skill_id
                }

                print('query', query)
                print(params)
                exit()

                conn.execute(query, params)
                exit()
            return True
        except Exception as e:
            print(e)
#             self.logger.error(f"Error inserting job skills for job_id {job_id}: {str(e)}")
            exit()
            return False

    def insert_benefits(self, conn, job_id: str, company_id: str, benefits_data: str) -> bool:
        """Benefits 테이블에 데이터 삽입"""
        try:
            if pd.isna(benefits_data):
                return True

            benefits = []
            try:
                benefits = json.loads(benefits_data)
                if not isinstance(benefits, list):
                    benefits = [b.strip() for b in benefits_data.split(',') if b.strip()]
            except json.JSONDecodeError:
                benefits = [b.strip() for b in benefits_data.split(',') if b.strip()]

            for benefit in benefits:
                if benefit.strip():
                    benefit_id = self.generate_id(f"{job_id}_{benefit}")

                    query = text("""
                        INSERT INTO Benefits (
                            benefit_id, job_id, company_id,
                            name, category
                        ) VALUES (
                            :benefit_id, :job_id, :company_id,
                            :name, 'welfare'
                        )
                        ON DUPLICATE KEY UPDATE
                            name = VALUES(name),
                            category = VALUES(category)
                    """)

                    params = {
                        'benefit_id': benefit_id,
                        'job_id': job_id,
                        'company_id': company_id,
                        'name': benefit[:255]
                    }

                    conn.execute(query, params)
            return True
        except Exception as e:
            self.logger.error(f"Error inserting benefits for job_id {job_id}: {str(e)}")
            return False

    def insert_salary(self, conn, job_id: str, salary_data: str) -> bool:
        """Salaries 테이블에 데이터 삽입"""
        try:
            if pd.isna(salary_data):
                salary_data = "회사 내규에 따름"

            salary_id = self.generate_id(f"{job_id}_salary")

            # 급여 정보에서 숫자 추출 시도
            amount = 0
            if isinstance(salary_data, str):
                import re
                numbers = re.findall(r'\d+', salary_data)
                if numbers:
                    amount = int(numbers[0]) * 10000  # 만원 단위를 원 단위로 변환

            query = text("""
                INSERT INTO Salaries (
                    salary_id, job_id, amount, currency,
                    salary_type, negotiable, description, year
                ) VALUES (
                    :salary_id, :job_id, :amount, 'KRW',
                    'yearly', TRUE, :description, :year
                )
                ON DUPLICATE KEY UPDATE
                    amount = VALUES(amount),
                    currency = VALUES(currency),
                    salary_type = VALUES(salary_type),
                    negotiable = VALUES(negotiable),
                    description = VALUES(description),
                    year = VALUES(year)
            """)

            params = {
                'salary_id': salary_id,
                'job_id': job_id,
                'amount': amount,
                'description': salary_data,
                'year': datetime.now().year
            }

            conn.execute(query, params)
            return True
        except Exception as e:
            self.logger.error(f"Error inserting salary for job_id {job_id}: {str(e)}")
            return False

    def insert_job_stats(self, conn, job_id: str) -> bool:
        """JobStats 테이블에 데이터 삽입"""
        try:
            jobstat_id = self.generate_id(f"{job_id}_stats")

            query = text("""
                INSERT INTO JobStats (
                    jobstat_id, job_id, views, applications,
                    bookmarks, daily_views, weekly_views,
                    application_rate, active_applications
                ) VALUES (
                    :jobstat_id, :job_id, 0, 0, 0, 0, 0, 0.0, 0
                )
                ON DUPLICATE KEY UPDATE
                    views = VALUES(views),
                    applications = VALUES(applications),
                    bookmarks = VALUES(bookmarks),
                    daily_views = VALUES(daily_views),
                    weekly_views = VALUES(weekly_views),
                    application_rate = VALUES(application_rate),
                    active_applications = VALUES(active_applications)
            """)

            params = {
                'jobstat_id': jobstat_id,
                'job_id': job_id
            }

            conn.execute(query, params)
            return True
        except Exception as e:
            self.logger.error(f"Error inserting job stats for job_id {job_id}: {str(e)}")
            return False


    def process_and_save(self) -> None:
        """데이터 처리 및 저장 메인 함수"""
        try:
            merged_df = self.load_and_merge_data()
            if merged_df is None:
                return

            total_success = 0
            total_processed = 0

            for _, row in tqdm(merged_df.iterrows(), total=len(merged_df), desc="Processing jobs"):
                with self.engine.connect() as conn:
                    with conn.begin():
                        try:
                            total_processed += 1

                            job_id = self.generate_id(f"{row.company_name}{row.title}{row.url}")
                            company_id = self.generate_id(row.company_name)

                            # 각 테이블 데이터 삽입
                            success = True

#                             if not self.insert_job(conn, job_id, company_id, row):
#                                 success = False

                            skills = self.extract_skills(row.search_keyword)
                            print("start inserting job skill")
                            if not self.insert_job_skills(conn, job_id, skills):
                                success = False

                            print(success)
                            exit()
#
#                             if not self.insert_benefits(conn, job_id, company_id, row.benefits):
#                                 success = False
#
#                             if not self.insert_salary(conn, job_id, row.salary):
#                                 success = False
#
#                             if not self.insert_job_stats(conn, job_id):
#                                 success = False

                            if success:
                                total_success += 1

                        except Exception as e:
                            self.logger.error(f"Error processing job {row.title}: {str(e)}")
                            continue

            self.logger.info(f"Successfully processed {total_success} out of {total_processed} jobs")

        except Exception as e:
            self.logger.error(f"Error during processing: {str(e)}")
            raise

if __name__ == "__main__":
    processor = DataProcessor()
    processor.process_and_save()