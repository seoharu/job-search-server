import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from datetime import datetime
import re
import random
import json
import os
from urllib.parse import quote
from tqdm import tqdm

# 상수 정의
DATA_DIR = 'src/data2'
CSV_FILENAME_FORMAT = 'saramin_jobs_{timestamp}.csv'
ENCODING = 'utf-8-sig'


def extract_tech_stack(description):
    """기술 스택을 추출하는 함수"""
    tech_keywords = {
        'languages': ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Ruby', 'Swift', 'Kotlin', 'Go', 'PHP', 'R'],
        'frameworks': ['Django', 'Flask', 'FastAPI', 'Spring', 'Node.js', 'React', 'Vue.js', 'Angular', 'Express', 'Ruby on Rails'],
        'databases': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'SQLite'],
        'cloud': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Linux'],
        'tools': ['Git', 'Jenkins', 'Jira', 'Confluence', 'Slack', 'Teams']
    }

    found_techs = {category: [] for category in tech_keywords}

    for category, keywords in tech_keywords.items():
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, description, re.IGNORECASE):
                found_techs[category].append(keyword)

    return found_techs

def get_job_details(url, headers):
    """채용공고 상세 페이지에서 메타 정보를 크롤링하는 함수"""
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # 메타 description 태그에서 정보 추출
        meta_desc = soup.select_one('meta[name="description"]')
        if meta_desc:
            _tech = soup.select_one('meta[name="keywords"]')
            content = meta_desc.get('content', '')
            # 콤마로 구분된 정보를 분리
            info_parts = content.split(',')

            job_info = {
                'company': '',
                'position': '',
                'experience': '',
                'education': '',
                'salary': '',
                'deadline': '',
                'website': '',
                'description': content,
                'tech_stack': _tech.get('content', '').split(','),
                'benefits': '',
                'location_detail': '',
            }
            # 회사명은 첫 번째 항목
            if info_parts:
                job_info['company'] = info_parts[0].strip()

            # 직무는 두 번째 항목
            if len(info_parts) > 1:
                job_info['position'] = info_parts[1].strip()

            # 나머지 정보 파싱
            for part in info_parts:
                part = part.strip()
                if '경력:' in part:
                    job_info['experience'] = part.split('경력:')[1].strip()
                elif '학력:' in part:
                    job_info['education'] = part.split('학력:')[1].strip()
                elif '마감일:' in part:
                    job_info['deadline'] = part.split('마감일:')[1].strip()
                elif '홈페이지:' in part:
                    job_info['website'] = part.split('홈페이지:')[1].strip()

            salary_part = [item for item in info_parts if item.find('연봉') >= 0 or item.find('만원') >= 0]
            if len(salary_part) > 0:
                try:
                    salary_part = ((''.join(salary_part)).strip().replace('연봉', '').replace(':', '')).replace(' ', '')
                    job_info['salary'] = salary_part
                except:
                    job_info['salary'] = ''

            if len(job_info['salary']) == 0:
                job_info['salary'] = '협의 후 결정'

        # og:title에서 제목 정보 추출
        title_meta = soup.select_one('meta[property="og:title"]')
        if title_meta:
            job_info['full_title'] = title_meta.get('content', '')

        return job_info

    except Exception as e:
        print(f"상세 정보 크롤링 중 에러 발생: {e}")
        return None

# def get_job_details(url, headers):
#     """채용공고 상세 페이지에서 추가 정보를 크롤링하는 함수"""
#     try:
#         response = requests.get(url, headers=headers)
#         response.raise_for_status()
#         soup = BeautifulSoup(response.text, 'html.parser')
#
#
#         job_description = soup.select_one('#job_contents')
#         description = job_description.text.strip() if job_description else ''
#
#         tech_stack = extract_tech_stack(description)
#
#         benefits = soup.select('.benefit_section .bf_item')
#         benefits_list = [benefit.text.strip() for benefit in benefits] if benefits else []
#
#         work_location = soup.select_one('.work_place')
#         location_detail = work_location.text.strip() if work_location else ''
#
#         salary_info = soup.select_one('.salary')
#         salary = salary_info.text.strip() if salary_info else ''
#
#         deadline = soup.select_one('.deadline_txt')
#         deadline = deadline.text.strip() if deadline else ''
#
#         return {
#             'description': description,
#             'tech_stack': tech_stack,
#             'benefits': benefits_list,
#             'location_detail': location_detail,
#             'salary': salary,
#             'deadline': deadline
#         }
#     except Exception as e:
#         print(f"상세 정보 크롤링 중 에러 발생: {e}")
#         return None


def crawl_saramin_enhanced(search_keywords, pages_per_keyword=1):
    """사람인 채용공고 크롤링 메인 함수"""
    # 데이터 저장 디렉토리 생성
    os.makedirs(DATA_DIR, exist_ok=True)

    all_jobs = []
    processed_urls = set()

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.saramin.co.kr/'
    }

    for keyword in search_keywords:
        keyword_jobs = []  # 현재 키워드의 채용공고를 저장할 리스트
        print(f"\n{keyword} 키워드 크롤링 시작...")
        encoded_keyword = quote(keyword)

        for page in range(1, pages_per_keyword + 1):
            url = f"https://www.saramin.co.kr/zf_user/search/recruit?searchType=search&searchword={encoded_keyword}&recruitPage={page}&recruitPageCount=1500"

            try:
                print(f"페이지 요청: {url}")
                response = requests.get(url, headers=headers)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, 'html.parser')
                job_listings = soup.select('div.item_recruit')
                print(soup)

                exit()
                print(f"발견된 채용공고 수: {len(job_listings)}")

                for job in tqdm(job_listings):
                    try:
                        job_link = job.select_one('h2.job_tit a')
                        if not job_link:
                            continue

                        job_url = 'https://www.saramin.co.kr' + job_link.get('href', '')
                        if job_url in processed_urls:
                            continue

                        processed_urls.add(job_url)
                        title = job_link.text.strip()
                        company = job.select_one('strong.corp_name a')
                        company_name = company.text.strip() if company else "기업명 없음"

                        details = get_job_details(job_url, headers)

                        job_data = {
                            'search_keyword': keyword,
                            'company_name': company_name,
                            'title': title,
                            'url': job_url,
                            'crawled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        }

                        conditions = job.select('div.job_condition span')
                        if conditions:
                            job_data.update({
                                'location': conditions[0].text.strip() if len(conditions) > 0 else '',
                                'experience': conditions[1].text.strip() if len(conditions) > 1 else '',
                                'education': conditions[2].text.strip() if len(conditions) > 2 else '',
                                'employment_type': conditions[3].text.strip() if len(conditions) > 3 else ''
                            })

                        if details:

                            job_data.update({
                                'description': details['description'],
                                'tech_stack': json.dumps(details['tech_stack'], ensure_ascii=False),
#                                 'benefits': json.dumps(details['benefits'], ensure_ascii=False),
                                'location_detail': job_data['location'],
                                'salary': details['salary'],
                                'deadline': details['deadline']
                            })

                            job_data['location'] = job_data['location'].split(' ')[0]

                        keyword_jobs.append(job_data)
                        all_jobs.append(job_data)
                        print(f"채용공고 추가: {company_name} - {title}")
                        time.sleep(random.uniform(2, 5))

                    except Exception as e:
                        print(f"채용공고 파싱 중 에러: {str(e)}")
                        continue

                wait_time = random.uniform(7, 13)
                print(f"{wait_time}초 대기...")
                time.sleep(wait_time)

            except Exception as e:
                print(f"페이지 크롤링 중 에러: {str(e)}")
                continue

        # 각 키워드 완료 시 저장
        if keyword_jobs:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

            # 키워드별 결과 저장
            keyword_df = pd.DataFrame(keyword_jobs)
            keyword_filename = os.path.join(DATA_DIR, f'saramin_jobs_{keyword.replace(" ", "_")}_{timestamp}.csv')
            keyword_df.to_csv(keyword_filename, index=False, encoding=ENCODING)
            print(f"\n{keyword} 키워드 크롤링 완료! {len(keyword_jobs)}개의 채용공고가 {keyword_filename}에 저장되었습니다.")

            # 전체 결과도 백업
            all_df = pd.DataFrame(all_jobs)
            all_filename = os.path.join(DATA_DIR, f'saramin_jobs_all_{timestamp}.csv')
            all_df.to_csv(all_filename, index=False, encoding=ENCODING)
            print(f"전체 {len(all_jobs)}개의 채용공고가 {all_filename}에 저장되었습니다.")

    # 최종 결과
    final_df = pd.DataFrame(all_jobs)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    final_filename = os.path.join(DATA_DIR, f'saramin_jobs_final_{timestamp}.csv')
    final_df.to_csv(final_filename, index=False, encoding=ENCODING)
    print(f"\n크롤링 완료! 총 {len(all_jobs)}개의 채용공고가 최종적으로 {final_filename}에 저장되었습니다.")

    return final_df

if __name__ == "__main__":

    search_keywords = [
#         # IT/개발 직군
#         'Python 개발자', 'Java 개발자', 'Frontend 개발자', 'Backend 개발자',
#         'Node.js 개발자', 'React 개발자', 'Vue.js 개발자', 'iOS 개발자',
#         'Android 개발자', 'Full Stack 개발자', 'DevOps 엔지니어',
#         '데이터 엔지니어', '데이터 사이언티스트', 'ML 엔지니어',
#         '시스템 엔지니어', '클라우드 엔지니어', '네트워크 엔지니어',
#
#         # 경영/기획/관리 직군
#         '경영지원', '인사담당자',
        'HR매니저', '회계담당자',
        '재무담당자', '전략기획', '경영기획', '사업기획',

        # 마케팅/광고 직군
        '디지털마케팅', '퍼포먼스마케팅', '콘텐츠 마케터',
        'SNS마케터', '광고기획자', '미디어플래너',

        # 디자인/콘텐츠 직군
        'UI디자이너', 'UX디자이너', '웹디자이너', '그래픽디자이너',
        '콘텐츠기획자', '콘텐츠제작', '카피라이터',

        # 영업/고객관리 직군
        '영업관리', '기술영업', '해외영업', '영업기획',
        '고객관리', 'CS매니저', '기술지원'
    ]

    df = crawl_saramin_enhanced(search_keywords, pages_per_keyword=1)