import pandas as pd
import mysql.connector
from datetime import datetime
import uuid
import random
import json

# CSV 파일 읽기
df = pd.read_csv('saramin_jobs_20241206_091400.csv')

# MySQL 연결 설정
db_config = {
    'host': 'localhost',
    'user': 'your_username',
    'password': 'your_password',
    'database': 'job_board'
}

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

def generate_id():
    return str(uuid.uuid4())[:20]

def generate_business_number():
    return f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(10000,99999)}"

# 1. Companies 테이블
def insert_companies():
    companies = {}
    for _, row in df.iterrows():
        if row['company_name'] not in companies:
            company_id = generate_id()
            companies[row['company_name']] = company_id

            query = """
            INSERT INTO Companies (
                company_id, name, company_registration_number, location,
                size, industry, employee_count, status, benefits
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                company_id,
                row['company_name'],
                generate_business_number(),
                row['location'],
                'small',
                row['job_sector'] if pd.notna(row['job_sector']) else '기타',
                random.randint(10, 1000),
                'active',
                '기본 복리후생'
            )
            cursor.execute(query, values)
    return companies

# 2. Skills 테이블 (추가 모델 1)
def insert_skills():
    skills = {}
    common_skills = ['Python', 'Java', 'JavaScript', 'React', 'Node.js', 'MySQL', 'AWS']

    for skill_name in common_skills:
        skill_id = generate_id()
        skills[skill_name] = skill_id

        query = """
        INSERT INTO Skills (skill_id, name, category, description)
        VALUES (%s, %s, %s, %s)
        """
        values = (
            skill_id,
            skill_name,
            'development',
            f'{skill_name} 개발 기술'
        )
        cursor.execute(query, values)
    return skills

# 3. Jobs 테이블
def insert_jobs(companies):
    jobs = {}
    for _, row in df.iterrows():
        job_id = generate_id()
        company_id = companies[row['company_name']]

        if 'deadline' in row and pd.notna(row['deadline']):
            if '상시' in str(row['deadline']):
                deadline = datetime(2024, 12, 31)
            else:
                deadline_str = str(row['deadline']).replace('~ ', '')
                try:
                    deadline = datetime.strptime(deadline_str, '%m/%d(%a)')
                    deadline = deadline.replace(year=2024)
                except:
                    deadline = datetime(2024, 12, 31)
        else:
            deadline = datetime(2024, 12, 31)

        query = """
        INSERT INTO Jobs (
            job_id, company_id, title, description, requirements,
            salary, location, employment_type, experimence_level,
            deadline, status, views
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            job_id,
            company_id,
            row['title'],
            row['description'] if pd.notna(row['description']) else '',
            row['experience_required'] if pd.notna(row['experience_required']) else '',
            row['salary_info'] if pd.notna(row['salary_info']) else '',
            row['location'],
            row['employment_type'] if pd.notna(row['employment_type']) else '정규직',
            row['experience_required'] if pd.notna(row['experience_required']) else '경력무관',
            deadline,
            'active',
            random.randint(10, 1000)  # 초기 조회수
        )
        cursor.execute(query, values)
        jobs[job_id] = row
    return jobs

# 4. JobSkills 테이블 (추가 모델 1의 연결)
def insert_job_skills(jobs, skills):
    for job_id in jobs:
        # 각 채용공고당 2-4개의 기술 요구사항 무작위 추가
        selected_skills = random.sample(list(skills.keys()), random.randint(2, 4))
        for skill_name in selected_skills:
            jobskill_id = generate_id()

            query = """
            INSERT INTO JobSkills (
                jobskill_id, job_id, skill_id, level, is_required, priority
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            values = (
                jobskill_id,
                job_id,
                skills[skill_name],
                random.choice(['beginner', 'intermediate', 'advanced', 'expert']),
                True,
                random.randint(1, 5)
            )
            cursor.execute(query, values)

# 5. Benefits 테이블 (추가 모델 2)
def insert_benefits(companies, jobs):
    benefit_list = [
        "유연근무제", "원격근무", "점심식사 제공", "의료보험",
        "퇴직연금", "성과급", "주식옵션", "교육지원"
    ]

    for company_id in companies.values():
        for job_id in jobs.keys():
            # 각 회사/채용공고 조합당 2-4개의 복리후생 무작위 추가
            selected_benefits = random.sample(benefit_list, random.randint(2, 4))
            for benefit_name in selected_benefits:
                benefit_id = generate_id()

                query = """
                INSERT INTO Benefits (
                    benefit_id, job_id, company_id, name, category
                ) VALUES (%s, %s, %s, %s, %s)
                """
                values = (
                    benefit_id,
                    job_id,
                    company_id,
                    benefit_name,
                    '기본혜택'
                )
                cursor.execute(query, values)

# 6. JobStats 테이블 (추가 모델 3)
def insert_job_stats(jobs):
    for job_id in jobs:
        jobstat_id = generate_id()

        query = """
        INSERT INTO JobStats (
            jobstat_id, job_id, views, applications, bookmarks,
            daily_views, weekly_views, application_rate,
            conversion_rate, active_applications, completed_applications
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            jobstat_id,
            job_id,
            random.randint(100, 1000),  # 총 조회수
            random.randint(5, 50),      # 총 지원자 수
            random.randint(10, 100),    # 총 북마크 수
            random.randint(10, 100),    # 일일 조회수
            random.randint(50, 500),    # 주간 조회수
            random.uniform(1.0, 10.0),  # 지원률
            random.uniform(1.0, 5.0),   # 전환율
            random.randint(1, 10),      # 진행 중인 지원
            random.randint(0, 5)        # 완료된 지원
        )
        cursor.execute(query, values)

# 7. Users 테이블
def insert_test_users():
    users = {}
    test_users = [
        ("test1@example.com", "김테스트", "010-1234-5678"),
        ("test2@example.com", "이테스트", "010-2345-6789"),
        ("test3@example.com", "박테스트", "010-3456-7890")
    ]

    for email, name, phone in test_users:
        user_id = generate_id()
        users[email] = user_id

        query = """
        INSERT INTO Users (
            user_id, email, password, name, phone,
            status, last_login_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            user_id,
            email,
            "encoded_password_base64",
            name,
            phone,
            'active',
            datetime.now()
        )
        cursor.execute(query, values)
    return users

# 8. Bookmarks 테이블
def insert_bookmarks(users, jobs):
    bookmarks = {}
    for user_id in users.values():
        for job_id in list(jobs.keys())[:random.randint(2,3)]:
            bookmark_id = generate_id()
            bookmarks[(user_id, job_id)] = bookmark_id

            query = """
            INSERT INTO Bookmarks (
                bookmark_id, user_id, job_id, note,
                notification, user_job
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            values = (
                bookmark_id,
                user_id,
                job_id,
                "관심있는 채용공고입니다.",
                False,
                True
            )
            cursor.execute(query, values)
    return bookmarks

# 9. Applications 테이블
def insert_applications(users, jobs):
    for user_id in users.values():
        for job_id in list(jobs.keys())[:random.randint(1,2)]:
            application_id = generate_id()

            query = """
            INSERT INTO Applications (
                application_id, job_id, user_id, status,
                resume_version, cover_letter, job_user
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                application_id,
                job_id,
                user_id,
                'pending',
                '1.0',
                '열정적인 개발자입니다.',
                True
            )
            cursor.execute(query, values)

try:
    # 기존 데이터 삭제
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    tables = ['Applications', 'Bookmarks', 'JobStats', 'Benefits',
              'JobSkills', 'Skills', 'Jobs', 'Companies', 'Users']
    for table in tables:
        cursor.execute(f"TRUNCATE TABLE {table}")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

    # 데이터 삽입 실행
    print("1. Inserting companies...")
    companies = insert_companies()

    print("2. Inserting skills...")
    skills = insert_skills()

    print("3. Inserting jobs...")
    jobs = insert_jobs(companies)

    print("4. Inserting job skills...")
    insert_job_skills(jobs, skills)

    print("5. Inserting benefits...")
    insert_benefits(companies, jobs)

    print("6. Inserting job stats...")
    insert_job_stats(jobs)

    print("7. Inserting test users...")
    users = insert_test_users()

    print("8. Inserting bookmarks...")
    bookmarks = insert_bookmarks(users, jobs)

    print("9. Inserting applications...")
    insert_applications(users, jobs)

    conn.commit()
    print("Data migration completed successfully!")

except Exception as e:
    print(f"Error occurred: {e}")
    conn.rollback()

finally:
    cursor.close()
    conn.close()