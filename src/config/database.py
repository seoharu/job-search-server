import pandas as pd
import mysql.connector
import uuid
import json
import os
import time
from dotenv import load_dotenv
from datetime import datetime, timedelta

def generate_id():
    return str(uuid.uuid4())[:20]

def connect_to_db():
    load_dotenv()

    # 연결 전에 환경변수 확인
    print(f"DB_HOST: {os.getenv('DB_HOST')}")
    print(f"DB_USER: {os.getenv('DB_USER')}")
    print(f"DB_PORT: {os.getenv('DB_PORT')}")

    return mysql.connector.connect(
        database='WSD03',
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=int(os.getenv('DB_PORT', '10013'))
    )

def clean_value(value, default='', allow_null=True):
    """
    NaN 값을 처리하는 함수
    value: 처리할 값
    default: 기본값 (NaN일 때 반환할 값)
    allow_null: True면 None 반환 허용, False면 default 값 반환
    """
    if pd.isna(value) or str(value).lower() == 'nan':
        return default if not allow_null else None
    return str(value)

def parse_date(date_str):
    """날짜 문자열을 datetime 객체로 변환"""
    try:
        if pd.isna(date_str):
            return datetime.now()

        # '등록일 24/12/03' 형식 처리
        if '등록일' in str(date_str):
            date_part = date_str.replace('등록일', '').strip()
            # YY/MM/DD 형식을 YYYY-MM-DD 형식으로 변환
            year = f"20{date_part.split('/')[0]}"
            month = date_part.split('/')[1]
            day = date_part.split('/')[2]
            try:
                return datetime(int(year), int(month), int(day))
            except ValueError as e:
                print(f"날짜 변환 실패: {str(e)}")
                return datetime.now()

        return datetime.now()
    except Exception as e:
        print(f"날짜 처리 중 에러 발생: {str(e)}")
        return datetime.now()


def insert_company(cursor, row):
    """회사 정보를 Companies 테이블에 삽입"""
    # 1. 먼저 회사가 이미 존재하는지 확인
    try:
        cursor.execute("SELECT company_id FROM Companies WHERE name = %s", (clean_value(row['company_name']),))
        existing_company = cursor.fetchone()
        if existing_company:
            print(f"기존 회사 ID 반환: {existing_company[0]}")
            return existing_company[0]
    except Exception as e:
        print(f"회사 조회 중 에러: {str(e)}")
        raise e

    # 2. 존재하지 않는 경우 새로 생성
    try:
        company_id = generate_id()
        created_date = parse_date(row['createdAt'])

        # description에 url 정보 포함
        description = clean_value(row['description'])
        if not description:
            description = f"채용공고 URL: {row['url']}"

        company_data = {
            'company_id': company_id,
            'name': clean_value(row['company_name']),
            'company_registration_number': f"REG-{company_id[:15]}",  # 더 명확한 형식
            'location': clean_value(row['address_total']),
            'size': 'medium',
            'industry': clean_value(row['job_group']) or 'Not specified',
            'description': description,
            'status': 'active',
            'created_at': parse_date(row['createdAt'])
        }

        insert_query = """
        INSERT INTO Companies (
            company_id, name, company_registration_number, location,
            size, industry, description, status, created_at
        ) VALUES (
            %(company_id)s, %(name)s, %(company_registration_number)s, %(location)s,
            %(size)s, %(industry)s, %(description)s, %(status)s, %(created_at)s
        )
        """

        cursor.execute(insert_query, company_data)
        print(f"새 회사 ID 생성: {company_id}")
        return company_id

    except mysql.connector.IntegrityError as e:
        print(f"회사 삽입 중 무결성 에러: {str(e)}")
        # 다시 한번 조회 시도
        cursor.execute("SELECT company_id FROM Companies WHERE name = %s", (clean_value(row['company_name']),))
        result = cursor.fetchone()
        if result:
            print(f"재시도로 찾은 회사 ID: {result[0]}")
            return result[0]
        raise e


def parse_salary(salary_str):
    """급여 정보 파싱"""
    try:
        # 숫자만 추출
        import re
        numbers = re.findall(r'\d+', salary_str.replace(',', ''))
        if len(numbers) >= 2:
            return int(numbers[0]), int(numbers[1])
        elif len(numbers) == 1:
            return int(numbers[0]), int(numbers[0])
        return 0, 0
    except:
        return 0, 0

def parse_deadline(deadline_str):
    """마감일자 문자열을 datetime 객체로 변환"""
    try:
        if pd.isna(deadline_str):
            return datetime.now() + timedelta(days=30)

        # 문자열 정리
        deadline_str = str(deadline_str).replace('시마감', ':00')

        # 다양한 형식 처리
        if '/' in deadline_str:
            # YY/MM/DD 형식 처리
            date_part = deadline_str.split()[0]
            year = f"20{date_part.split('/')[0]}"
            month = date_part.split('/')[1]
            day = date_part.split('/')[2]
            return datetime(int(year), int(month), int(day))
        elif '-' in deadline_str:
            # YYYY-MM-DD 형식 처리
            date_part = deadline_str.split()[0]
            year = date_part.split('-')[0]
            month = date_part.split('-')[1]
            day = date_part.split('-')[2]
            try:
                return datetime(int(year), int(month), int(day))
            except ValueError:
                # 잘못된 날짜 형식이면 현재 날짜 + 30일
                return datetime.now() + timedelta(days=30)

        # 기타 형식이나 파싱 실패 시
        return datetime.now() + timedelta(days=30)

    except Exception as e:
        print(f"날짜 파싱 에러: {str(e)} for input: {deadline_str}")
        return datetime.now() + timedelta(days=30)

def insert_job(cursor, row, company_id):
    """채용공고 정보를 Jobs 테이블에 삽입"""
    # company_id 유효성 검사 추가
    if not company_id:
        raise ValueError("유효하지 않은 company_id")

    cursor.execute("SELECT company_id FROM Companies WHERE company_id = %s", (company_id,))
    if not cursor.fetchone():
        raise ValueError(f"존재하지 않는 company_id: {company_id}")

    job_id = generate_id()
    bookmark_id = generate_id()  # 새로운 북마크 ID 생성

    # createdAt 처리
    created_date = parse_date(row['createdAt'])

    # deadline 처리를 parse_deadline 함수 사용하도록 수정
    deadline_date = parse_deadline(row['deadline'])

    job_data = {
        'job_id': job_id,
        'company_id': company_id,
        'bookmark_id': bookmark_id,
        'title': clean_value(row['title'], default='제목 없음', allow_null=False),
        'description': clean_value(row['description'], default='상세 내용 없음', allow_null=False),  # description에 기본값 설정
        'requirements': clean_value(row['experience'], default='', allow_null=False),  # 요구사항도 기본값 설정
        'salary': clean_value(row['salary'], default='미정', allow_null=False),
        'location': clean_value(row['address_total'], default='위치 미정', allow_null=False),
        'employment_type': clean_value(row['employment_type'], default='정규직', allow_null=False),
        'experience_level': clean_value(row['experience'], default='경력 무관', allow_null=False),
        'deadline': deadline_date,  # 수정된 부분['deadline']) else None,
        'status': 'active',
        'created_at': created_date
    }

    insert_query = """
    INSERT INTO Jobs (
        job_id, company_id, bookmark_id, title, description, requirements,
        salary, location, employment_type, experience_level, deadline,
        status, created_at
    ) VALUES (
        %(job_id)s, %(company_id)s, %(bookmark_id)s, %(title)s, %(description)s,
        %(requirements)s, %(salary)s, %(location)s, %(employment_type)s,
        %(experience_level)s, %(deadline)s, %(status)s, %(created_at)s
    )
    """

    cursor.execute(insert_query, job_data)
    return job_id

def insert_salary(cursor, row, job_id):
    """급여 정보를 Salaries 테이블에 삽입"""
    salary_id = generate_id()
    min_salary, max_salary = parse_salary(str(row['salary']))

    salary_data = {
        'salary_id': salary_id,
        'job_id': job_id,
        'amount': max_salary,  # 최대 급여를 기본값으로 설정
        'year': datetime.now().year,
        'min_salary': min_salary,
        'max_salary': max_salary,
        'currency': 'KRW',
        'salary_type': 'yearly',
        'negotiable': '협의' in str(row['salary'])
    }

    insert_query = """
    INSERT INTO Salaries (
        salary_id, job_id, amount, year, min_salary, max_salary,
        currency, salary_type, negotiable
    ) VALUES (
        %(salary_id)s, %(job_id)s, %(amount)s, %(year)s, %(min_salary)s,
        %(max_salary)s, %(currency)s, %(salary_type)s, %(negotiable)s
    )
    """

    cursor.execute(insert_query, salary_data)

def insert_job_skills(cursor, row, job_id):
    """기술 스택 정보를 JobSkills 테이블에 삽입"""
    try:
        if pd.isna(row['tech_stack']):
            print("기술 스택 정보가 없습니다.")
            return

        tech_stack = str(row['tech_stack']).split('|')

        for idx, tech in enumerate(tech_stack):
            if not tech.strip():
                continue

            jobskill_id = generate_id()

            # job_skill을 1로 설정 (tinyint(1)이므로)
            skill_data = {
                'jobskill_id': jobskill_id,
                'job_id': job_id,
                'job_skill': 1,  # tinyint(1) 타입이므로 1로 설정
                'level': 'intermediate',
                'is_required': 1,
                'priority': idx + 1,
                'idx_jobskill_level': tech.strip()  # 실제 스킬 이름은 이 컬럼에 저장
            }

            insert_query = """
            INSERT INTO JobSkills (
                jobskill_id, job_id, job_skill, level, is_required, priority, idx_jobskill_level
            ) VALUES (
                %(jobskill_id)s, %(job_id)s, %(job_skill)s, %(level)s,
                %(is_required)s, %(priority)s, %(idx_jobskill_level)s
            )
            """

            try:
                cursor.execute(insert_query, skill_data)
                print(f"기술 스택 추가됨: {tech.strip()}")
            except Exception as e:
                print(f"개별 기술 스택 추가 중 에러 발생: {tech.strip()} - {str(e)}")
                continue

    except Exception as e:
        print(f"기술 스택 전체 처리 중 에러: {str(e)}")
        print(f"처리하려던 tech_stack: {row['tech_stack']}")
        raise e

def insert_job_stats(cursor, job_id):
    """채용공고 통계 정보를 JobStats 테이블에 삽입"""
    jobstat_id = generate_id()

    stats_data = {
        'jobstat_id': jobstat_id,
        'job_id': job_id,
        'views': 0,
        'applications': 0,
        'bookmarks': 0
    }

    insert_query = """
    INSERT INTO JobStats (
        jobstat_id, job_id, views, applications, bookmarks
    ) VALUES (
        %(jobstat_id)s, %(job_id)s, %(views)s, %(applications)s, %(bookmarks)s
    )
    """

    cursor.execute(insert_query, stats_data)

def insert_benefits(cursor, row, job_id, company_id):
    """복리후생 정보를 Benefits 테이블에 삽입"""
    try:
        # 기본적인 복리후생 항목 설정
        benefits = [
            {
                "name": "4대보험",
                "category": "보험",
                "description": "국민연금, 건강보험, 고용보험, 산재보험"
            },
            {
                "name": "퇴직금",
                "category": "보상",
                "description": "1년 이상 근무시 퇴직금 지급"
            },
            {
                "name": "연차휴가",
                "category": "휴가",
                "description": "연차휴가 제공"
            },
            {
                "name": "경조사 지원",
                "category": "지원",
                "description": "경조사비 지원"
            },
            {
                "name": "교육 지원",
                "category": "자기개발",
                "description": "직무 교육 지원"
            }
        ]

        for benefit in benefits:
            benefit_id = generate_id()

            benefit_data = {
                'benefit_id': benefit_id,
                'job_id': job_id,
                'company_id': company_id,
                'name': benefit['name'],
                'category': benefit['category'],
                'description': benefit['description'],
            }

            insert_query = """
            INSERT INTO Benefits (
                benefit_id, job_id, company_id, name, category, description
            ) VALUES (
                %(benefit_id)s, %(job_id)s, %(company_id)s, %(name)s,
                %(category)s, %(description)s
            )
            """

            try:
                cursor.execute(insert_query, benefit_data)
                print(f"복리후생 추가됨: {benefit['name']}")
            except Exception as e:
                print(f"개별 복리후생 추가 중 에러 발생: {benefit['name']} - {str(e)}")
                continue

    except Exception as e:
        print(f"복리후생 전체 처리 중 에러: {str(e)}")
        raise e

def main():
    print("작업 시작...")

    try:
        print("CSV 파일 읽기 시도...")
        df = pd.read_csv('crawler/src/data2/jobs.csv', na_values=['nan', 'NaN', ''], keep_default_na=True)
        print(f"CSV 파일 읽기 성공. 총 {len(df)} 행")

        conn = connect_to_db()
        cursor = conn.cursor(buffered=True)

        # 데이터베이스 설정 조정
        cursor.execute("SET SESSION innodb_lock_wait_timeout = 180")  # 3분으로 증가
        cursor.execute("SET SESSION transaction_isolation = 'READ-COMMITTED'")

        companies_processed = {}
        success_count = 0
        error_count = 0
        retry_max = 3

        for idx, row in df.iterrows():
            retry_count = 0
            while retry_count < retry_max:
                try:
                    print(f"\n처리 중인 행: {idx} (시도: {retry_count + 1})")
                    print(f"회사명: {row['company_name']}")
                    print(f"공고제목: {row['title']}")

                    # 새로운 연결 시도
                    if retry_count > 0:
                        cursor.close()
                        conn.close()
                        conn = connect_to_db()
                        cursor = conn.cursor(buffered=True)

                    # 회사 정보 처리
                    company_id = None
                    try:
                        if row['company_name'] not in companies_processed:
                            company_id = insert_company(cursor, row)
                            companies_processed[row['company_name']] = company_id
                        else:
                            company_id = companies_processed[row['company_name']]
                        conn.commit()  # 회사 정보 즉시 커밋
                        print(f"회사 처리 완료: {company_id}")
                    except Exception as e:
                        print(f"회사 정보 처리 중 에러: {str(e)}")
                        conn.rollback()
                        raise e

                    # 잠시 대기
                    time.sleep(0.5)

                    # 채용공고 처리
                    try:
                        job_id = insert_job(cursor, row, company_id)
                        conn.commit()  # 채용공고 정보 즉시 커밋
                        print(f"채용공고 처리 완료: {job_id}")
                    except Exception as e:
                        print(f"채용공고 처리 중 에러: {str(e)}")
                        conn.rollback()
                        raise e

                    # 잠시 대기
                    time.sleep(0.5)

                    # 나머지 정보 처리
                    try:
                        insert_salary(cursor, row, job_id)
                        conn.commit()
                        insert_job_skills(cursor, row, job_id)
                        conn.commit()

                        insert_benefits(cursor, row, job_id, company_id)  # 추가
                        conn.commit()

                        insert_job_stats(cursor, job_id)
                        conn.commit()
                        print("부가 정보 처리 완료")
                    except Exception as e:
                        print(f"부가 정보 처리 중 에러: {str(e)}")
                        conn.rollback()
                        raise e

                    success_count += 1
                    print(f"행 {idx} 처리 완료\n")
                    break  # 성공하면 while 루프 종료

                except mysql.connector.Error as e:
                    if e.errno == 1205 and retry_count < retry_max - 1:  # Lock timeout error
                        retry_count += 1
                        print(f"락 타임아웃 발생. {retry_count}번째 재시도...")
                        time.sleep(2 * retry_count)  # 재시도 간격을 점점 늘림
                        continue
                    else:
                        print(f"SQL 에러 발생: {str(e)}")
                        error_count += 1
                        break

                except Exception as e:
                    print(f"행 {idx} 처리 중 에러: {str(e)}")
                    error_count += 1
                    print("\n문제가 발생한 데이터:")
                    for column in df.columns:
                        print(f"{column}: {row[column]}")
                    break

        print(f"\n처리 완료")
        print(f"성공: {success_count}")
        print(f"실패: {error_count}")

    except Exception as e:
        print(f"치명적 에러 발생: {str(e)}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    main()