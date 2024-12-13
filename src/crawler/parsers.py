from bs4 import BeautifulSoup
import requests
from .utils import extract_tech_stack
from config.config import HEADERS
import json

def parse_job_listing(job):
    """채용공고 기본 정보 파싱"""
    try:
        company = job.select_one('.corp_name a').text.strip()
        title = job.select_one('.job_tit a').text.strip()
        link = 'https://www.saramin.co.kr' + job.select_one('.job_tit a')['href']

        conditions = job.select('.job_condition span')
        location = conditions[0].text.strip() if len(conditions) > 0 else ''
        experience = conditions[1].text.strip() if len(conditions) > 1 else ''
        education = conditions[2].text.strip() if len(conditions) > 2 else ''
        employment_type = conditions[3].text.strip() if len(conditions) > 3 else ''

        deadline = job.select_one('.job_date .date').text.strip()

        job_sector = job.select_one('.job_sector')
        sector = job_sector.text.strip() if job_sector else ''

        salary_badge = job.select_one('.area_badge .badge')
        salary = salary_badge.text.strip() if salary_badge else ''

        return {
            'company_name': company,
            'title': title,
            'link': link,
            'location': location,
            'experience_required': experience,
            'education_required': education,
            'employment_type': employment_type,
            'deadline': deadline,
            'job_sector': sector,
            'salary_info': salary
        }
    except AttributeError as e:
        print(f"기본 정보 파싱 중 에러 발생: {e}")
        return None

def parse_job_details(url):
    """채용공고 상세 페이지 파싱"""
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        job_description = soup.select_one('#job_contents')
        description = job_description.text.strip() if job_description else ''

        tech_stack = extract_tech_stack(description)

        benefits = soup.select('.benefit_section .bf_item')
        benefits_list = [benefit.text.strip() for benefit in benefits] if benefits else []

        work_location = soup.select_one('.work_place')
        location_detail = work_location.text.strip() if work_location else ''

        return {
            'description': description,
            'tech_stack': json.dumps(tech_stack, ensure_ascii=False),
            'benefits': json.dumps(benefits_list, ensure_ascii=False),
            'location_detail': location_detail
        }
    except Exception as e:
        print(f"상세 정보 파싱 중 에러 발생: {e}")
        return None