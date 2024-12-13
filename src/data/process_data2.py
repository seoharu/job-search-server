import pandas as pd
from sqlalchemy import create_engine, text
import hashlib
import os
from datetime import datetime
import json
import sys
from tqdm import tqdm
from urllib.parse import quote_plus
sys.path.append('../')

class DataProcessor:
    def __init__(self):
        """데이터베이스 연결 설정"""
        from dotenv import load_dotenv
        load_dotenv()  # .env 파일 로드

        # 환경변수에서 DB 설정 가져오기
        self.engine = create_engine(
            f"mysql+pymysql://{os.getenv('DB_USER')}:{quote_plus(os.getenv('DB_PASSWORD'))}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/WSD03?charset=utf8mb4"
        )


        print(self.engine)


    def generate_id(self, text):
        """고유 ID 생성"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()[:20]

    def extract_skills(self, tech_stack):
        """JSON 형태의 tech_stack에서 기술 스택 추출"""
        if pd.isna(tech_stack):
            return []

        skills = []
        try:
            tech_data = json.loads(tech_stack)
            # languages, frameworks, databases, cloud, tools에서 스킬 추출
            for category in tech_data.values():
                if isinstance(category, list):
                    skills.extend([skill.strip() for skill in category if skill.strip()])
        except Exception as e:
            print(f"Error parsing tech_stack: {e}")
            # JSON 파싱 실패 시 빈 리스트 반환
        return skills

    def load_and_merge_data(self):
        """병합된 CSV 파일 로드"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, 'merged_saramin_jobs.csv')

        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            print(f"Read {len(df)} records from merged_saramin_jobs.csv")
            return df
        else:
            print("Error: merged_saramin_jobs.csv not found")
            return None

#     def process_and_save(self):
#         """데이터 처리 및 저장 메인 함수"""
#         try:
#             merged_df = self.load_and_merge_data()
#
#             with self.engine.connect() as conn:
# #                 # 1. Companies 테이블
# #                 print("Processing Companies...", conn)
# #
# #                 for _, row in tqdm(merged_df.iterrows(), desc='add data to Companies'):
# #                     try:
# #                         company_id = self.generate_id(row.company_name)
# #
# #                         # SQL 실행
# #                         query = text("""
# #                             INSERT INTO Companies (
# #                                 company_id, name, location, size, search_keyword, company_registration_number, industry,
# #                                 description, status
# #                             ) VALUES (
# #                                 :company_id, :name, :location, :size, :search_keyword, :company_registration_number, :industry,
# #                                 :description, 'active'
# #                             )
# #                             ON DUPLICATE KEY UPDATE
# #                                 name = VALUES(name),
# #                                 location = VALUES(location),
# #                                 size = VALUES(size),
# #                                 search_keyword = VALUES(search_keyword),
# #                                 description = VALUES(description),
# #                                 status = VALUES(status)
# #                         """)
# #
# #                         params = {
# #                             'company_id': company_id,
# #                             'name': row.company_name,
# #                             'location': row.location,
# #                             'size': 'medium',
# #                             'search_keyword': row.tech_stack[:50] if pd.notna(row.tech_stack) else None,
# #                             'description': row.description if pd.notna(row.description) else '',
# #                             'company_registration_number': '000-00-00000',
# #                             'industry': ''
# #                         }
# #
# #                         conn.execute(query, params)
# #                         conn.commit()
# #
# # #                         query = text("""
# # #                             INSERT IGNORE INTO Companies (
# # #                                 company_id, name, location, size, search_keyword,
# # #                                 description, status
# # #                             ) VALUES (
# # #                                 :company_id, :name, :location, :size, :search_keyword,
# # #                                 :description, 'active'
# # #                             )
# # #                         """), {
# # #                             'company_id': company_id,
# # #                             'name': row.company_name,
# # #                             'location': row.location,
# # #                             'size': 'medium',
# # #                             'search_keyword': row.tech_stack[:50] if pd.notna(row.tech_stack) else None,
# # #                             'description': row.description if pd.notna(row.description) else ''
# # #                         }
# #
# #                     except Exception as e:
# #                         # 오류 로깅
# #                         print(f"Error inserting row with company_name={row.company_name}: {e}")
# #                         # 필요하다면 추가 로깅이나 오류 데이터를 저장
# #                         continue
#
#
#                 # 2. Skills 테이블
#                 print("Processing Skills...", conn)
#                 all_skills = set()  # all_skills 세트 초기화 추가
#
#                 for _, row in merged_df.iterrows():
#                     try:
#                         skills = self.extract_skills(row.tech_stack)
#                         all_skills.update(skills)
#
#                         for skill in all_skills:
#                             if not skill:  # 빈 스킬 건너뛰기
#                                 continue
#
#                             skill_id = self.generate_id(skill)  # skill_id 생성
#
#                             # SQL 실행
#                             query = text("""
#                                 INSERT INTO Skills (
#                                     skill_id, name, category, search_keyword, description, level, parent_skill_id, status
#                                 ) VALUES (
#                                     :skill_id, :name, 'technical', :search_keyword, :description, 'basic', NULL, 'active'
#                                 )
#                                 ON DUPLICATE KEY UPDATE
#                                     name = VALUES(name),
#                                     category = VALUES(category),
#                                     search_keyword = VALUES(search_keyword),
#                                     updated_at = CURRENT_TIMESTAMP
#                             """)
#
#                             params = {
#                                 'skill_id': skill_id,
#                                 'name': skill,
#                                 'search_keyword': skill[:50],
#                                 'description': f'{skill} 관련 기술'
#                             }
#
#                             conn.execute(query, params)
#                             conn.commit()
#
#                     except Exception as e:
#                         # 오류 로깅
#                         print(f"Error inserting row with company_name={row.company_name}: {e}")
#                         # 필요하다면 추가 로깅이나 오류 데이터를 저장
#                         continue
#
#
#                 # 3. Jobs 테이블 및 연관 테이블들
#                 print("Processing Jobs and related tables...")
#
#                 try:
#                     for _, row in merged_df.iterrows():
#                         job_id = self.generate_id(f"{row.company_name}{row.title}{row.url}")
#                         company_id = self.generate_id(row.company_name)
#
#                         # deadline 처리
#                         deadline = None
#                         try:
#                             if pd.notna(row.deadline) and isinstance(row.deadline, str):
#                                 deadline_str = row.deadline.split('(')[0].strip()
#                                 if '-' in deadline_str:  # 예: '2024-12-08'
#                                     deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
#                                 elif '/' in deadline_str:  # 예: '12/08'
#                                     deadline = datetime.strptime(deadline_str, '%m/%d')
#                         except Exception as e:
#                             print(f"Error parsing deadline='{row.deadline}': {e}")
#
#                         # Jobs 테이블 삽입
#                         query = text("""
#                             INSERT INTO Jobs (
#                                 job_id, company_id, title, description,
#                                 requirements, location, employment_type,
#                                 experience_level, deadline, status, search_keyword
#                             ) VALUES (
#                                 :job_id, :company_id, :title, :description,
#                                 :requirements, :location, :employment_type,
#                                 :experience_level, :deadline, 'active', :search_keyword
#                             )
#                             ON DUPLICATE KEY UPDATE
#                                     title = VALUES(title),
#                                     description = VALUES(description),
#                                     requirements = VALUES(requirements),
#                                     location = VALUES(location),
#                                     employment_type = VALUES(employment_type),
#                                     experience_level = VALUES(experience_level),
#                                     deadline = VALUES(deadline),
#                                     status = VALUES(status),
#                                     search_keyword = VALUES(search_keyword)
#                         """)
#
#                         params = {
#                             'job_id': job_id,
#                             'company_id': company_id,
#                             'title': row.title,
#                             'description': row.description if pd.notna(row.description) else '',
#                             'requirements': f"{row.experience}, {row.education}",
#                             'location': row.location_detail if pd.notna(row.location_detail) else row.location,
#                             'employment_type': row.employment_type,
#                             'experience_level': row.experience,
#                             'deadline': datetime.strptime(row.deadline.split('(')[0].strip(), '~ %m/%d') if pd.notna(row.deadline) else None,
#                             'search_keyword': row.tech_stack[:50] if pd.notna(row.tech_stack) else None
#                         }
#
#                         with engine.connect() as conn:
#                             conn.execute(query, params)
#
#
#                     # JobSkills 테이블
#                     skills = self.extract_skills(row.tech_stack)
#                     for skill in skills:
#                         try:
#                             skill_id = self.generate_id(skill)
#                             jobskill_id = self.generate_id(f"{job_id}_{skill}")
#                             query = text("""
#                                 INSERT INTO JobSkills (
#                                     jobskill_id, job_id, skill_id,
#                                     level, is_required, priority
#                                 ) VALUES (
#                                     :jobskill_id, :job_id, :skill_id,
#                                     'intermediate', TRUE, 1
#                                 )
#                                 ON DUPLICATE KEY UPDATE
#                                     level = VALUES(level),
#                                     is_required = VALUES(is_required),
#                                     priority = VALUES(priority)
#                             """)
#                             params = {
#                                 'jobskill_id': jobskill_id,
#                                 'job_id': job_id,
#                                 'skill_id': skill_id
#                             }
#
#                         except Exception as e:
#                                 print(f"Error inserting JobSkill for job_id={job_id} and skill={skill}: {e}")
#                                 continue
#
#                     # Benefits 테이블
#                     if pd.notna(row.benefits):
#                         try:
#                             benefits = json.loads(row.benefits)
#                             if isinstance(benefits, list):
#                                 for benefit in benefits:
#                                     if benefit.strip():
#                                         benefit_id = self.generate_id(f"{job_id}_{benefit}")
#                                         query = text("""
#                                             INSERT INTO Benefits (
#                                                 benefit_id, job_id, company_id,
#                                                 name, category
#                                             ) VALUES (
#                                                 :benefit_id, :job_id, :company_id,
#                                                 :name, 'welfare'
#                                             )
#                                             ON DUPLICATE KEY UPDATE
#                                                 name = VALUES(name),
#                                                 category = VALUES(category)
#                                         """)
#
#                                         params = {
#                                             'benefit_id': benefit_id,
#                                             'job_id': job_id,
#                                             'company_id': company_id,
#                                             'name': benefit[:255]
#                                         }
#
#                         except json.JSONDecodeError:
#                             benefits = [b.strip() for b in row.benefits.split(',') if b.strip()]
#                             for benefit in benefits:
#                                 benefit_id = self.generate_id(f"{job_id}_{benefit}")
#                                 query = text("""
#                                     INSERT IGNORE INTO Benefits (
#                                         benefit_id, job_id, company_id,
#                                         name, category
#                                     ) VALUES (
#                                         :benefit_id, :job_id, :company_id,
#                                         :name, 'welfare'
#                                     )
#                                     ON DUPLICATE KEY UPDATE
#                                         name = VALUES(name),
#                                         category = VALUES(category)
#
#                                 """)
#                                 params = {
#                                     'benefit_id': benefit_id,
#                                     'job_id': job_id,
#                                     'company_id': company_id,
#                                     'name': benefit[:255]
#                                 }
#
#                     # Salaries 테이블
#                     salary_id = self.generate_id(f"{job_id}_salary")
#                     query = text("""
#                         INSERT IGNORE INTO Salaries (
#                             salary_id, job_id, amount, currency,
#                             salary_type, negotiable, description
#                         ) VALUES (
#                             :salary_id, :job_id, 0, 'KRW',
#                             'yearly', TRUE, :description
#                         )
#                         ON DUPLICATE KEY UPDATE
#                             amount = VALUES(amount),
#                             currency = VALUES(currency),
#                             salary_type = VALUES(salary_type),
#                             negotiable = VALUES(negotiable),
#                             description = VALUES(description)
#                     """)
#                     params = {
#                         'salary_id': salary_id,
#                         'job_id': job_id,
#                         'description': row.salary if pd.notna(row.salary) else None
#                     }
#
#                     # JobStats 테이블
#                     jobstat_id = self.generate_id(f"{job_id}_stats")
#                     query = text("""
#                         INSERT IGNORE INTO JobStats (
#                             jobstat_id, job_id, views, applications,
#                             bookmarks, daily_views, weekly_views,
#                             application_rate, active_applications
#                         ) VALUES (
#                             :jobstat_id, :job_id, 0, 0, 0, 0, 0, 0.0, 0
#                         )
#                         ON DUPLICATE KEY UPDATE
#                             views = VALUES(views),
#                             applications = VALUES(applications),
#                             bookmarks = VALUES(bookmarks),
#                             daily_views = VALUES(daily_views),
#                             weekly_views = VALUES(weekly_views),
#                             application_rate = VALUES(application_rate),
#                             active_applications = VALUES(active_applications)
#                     """)
#                     params = {
#                         'jobstat_id': jobstat_id,
#                         'job_id': job_id
#                     }
#
#                     conn.commit()
#                     print("Successfully processed and saved all data")
#
#                 except Exception as e:
#                     print(f"Error during processing: {str(e)}")
#                     raise
#
#          except Exception as e:
#              print(f"Error during processing: {str(e)}")
#              raise


    def process_and_save(self):
#     """데이터 처리 및 저장 메인 함수"""
        try:
            merged_df = self.load_and_merge_data()

            with self.engine.connect() as conn:

                # 외래 키 체크 일시 중지
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

                # 2. Skills 테이블
                print("Processing Skills...", conn)

                all_skills = set()

                # 먼저 모든 skills 수집
                for _, row in merged_df.iterrows():
                    skills = self.extract_skills(row.tech_stack)
                    all_skills.update(skills)

                # 수집된 skills 처리
                for skill in all_skills:
                    if not skill:  # 빈 스킬 건너뛰기
                        continue

                    try:
                        skill_id = self.generate_id(skill)
                        query = text("""
                            INSERT INTO Skills (
                                jobskill_id, user_id, name, category, description,
                                created_at, updated_at, idx_skill_name, skill_id,
                                search_keyword
                            ) VALUES (
                                    :jobskill_id, NULL, :name, 'technical', :description,
                                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, :idx_skill_name, :skill_id,
                                    :search_keyword
                            )
                            ON DUPLICATE KEY UPDATE
                                name = VALUES(name),
                                category = VALUES(category),
                                description = VALUES(description),
                                updated_at = CURRENT_TIMESTAMP,
                                idx_skill_name = VALUES(idx_skill_name),
                                search_keyword = VALUES(search_keyword)
                        """)

                        params = {
                            'jobskill_id': self.generate_id(f"jobskill_{skill}"),
                            'name': skill,
                            'description': f'{skill} 관련 기술',
                            'idx_skill_name': f"idx_{skill}",
                            'skill_id': self.generate_id(skill),
                            'search_keyword': skill[:50]
                        }

                        conn.execute(query, params)
                    except Exception as e:
                        print(f"Error processing skill {skill}: {e}")
                        continue

                # 3. Jobs 테이블 및 연관 테이블들
                print("Processing Jobs and related tables...")
                for _, row in merged_df.iterrows():
                    try:
                        job_id = self.generate_id(f"{row.company_name}{row.title}{row.url}")
                        company_id = self.generate_id(row.company_name)

                        # deadline 처리
                        deadline = '2024-12-31 23:59:59'
                        try:
                            if pd.notna(row.deadline) and isinstance(row.deadline, str):
                                deadline_str = row.deadline.split('(')[0].strip()
                                if '-' in deadline_str:
                                    deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
                                elif '/' in deadline_str:
                                    deadline = datetime.strptime(deadline_str, '%m/%d')
                        except Exception as e:
                            print(f"Error parsing deadline='{row.deadline}': {e}")

                        # Jobs 테이블 삽입
                        query = text("""
                            INSERT INTO Jobs (
                                job_id, company_id, title, description,
                                requirements, location, employment_type,
                                experience_level, deadline, status, search_keyword, bookmark_id
                            ) VALUES (
                                :job_id, :company_id, :title, :description,
                                :requirements, :location, :employment_type,
                                :experience_level, :deadline, 'active', :search_keyword, :bookmark_id
                            )
                            ON DUPLICATE KEY UPDATE
                                title = VALUES(title),
                                description = VALUES(description),
                                requirements = VALUES(requirements),
                                location = VALUES(location),
                                employment_type = VALUES(employment_type),
                                experience_level = VALUES(experience_level),
                                deadline = VALUES(deadline),
                                status = VALUES(status),
                                search_keyword = VALUES(search_keyword)

                        """)

                        params = {
                            'job_id': job_id,
                            'company_id': company_id,
                            'title': row.title,
                            'description': row.description if pd.notna(row.description) else '',
                            'requirements': f"{row.experience}, {row.education}",
                            'location': row.location_detail if pd.notna(row.location_detail) else row.location,
                            'employment_type': row.employment_type if pd.notna(row.employment_type) else '미지정',  # nan 대신 기본값 설정,
                            'experience_level': row.experience,
                            'deadline': deadline,
                            'search_keyword': row.tech_stack[:50] if pd.notna(row.tech_stack) else None,
                            'bookmark_id': '',
                        }

                        conn.execute(query, params)

                        # JobSkills 테이블
                        skills = self.extract_skills(row.tech_stack)
                        for skill in skills:
                            try:
                                skill_id = self.generate_id(skill)
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
                                conn.execute(query, params)
                            except Exception as e:
                                print(f"Error inserting JobSkill for job_id={job_id} and skill={skill}: {e}")
                                exit()
                                continue

                        # Benefits 테이블
                        if pd.notna(row.benefits):
                            try:
                                benefits = json.loads(row.benefits)
                                if isinstance(benefits, list):
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
                            except json.JSONDecodeError:
                                benefits = [b.strip() for b in row.benefits.split(',') if b.strip()]

                            for benefit in benefits:
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

                        # Salaries 테이블
                        salary_id = self.generate_id(f"{job_id}_salary")
                        query = text("""
                            INSERT INTO Salaries (
                                salary_id, job_id, amount, currency,
                                salary_type, negotiable, description, year
                            ) VALUES (
                                :salary_id, :job_id, 0, 'KRW',
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
                            'description': row.salary if pd.notna(row.salary) else None,
                            'year': datetime.now().year
                        }
                        conn.execute(query, params)

                        # JobStats 테이블
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

                    except Exception as e:
                        print(f"Error processing job {row.title}: {e}")
                        exit()
                        continue


            # 모든 데이터 처리가 끝난 후 외래 키 체크 재개
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            conn.commit()
            print("Successfully processed and saved all data")

        except Exception as e:
            print(f"Error during processing: {str(e)}")
            raise

if __name__ == "__main__":
    processor = DataProcessor()
    processor.process_and_save()