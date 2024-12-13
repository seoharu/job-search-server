import re
from src.config.config import TECH_KEYWORDS
import os
from datetime import datetime

def extract_tech_stack(description):
    """기술 스택을 추출하는 함수"""
    found_techs = {category: [] for category in TECH_KEYWORDS}

    for category, keywords in TECH_KEYWORDS.items():
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, description, re.IGNORECASE):
                found_techs[category].append(keyword)

    return found_techs

def get_output_filename():
    """저장할 파일 이름 생성"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return os.path.join('data', f'saramin_jobs_{timestamp}.csv')

def ensure_data_directory():
    """데이터 디렉토리 존재 확인 및 생성"""
    os.makedirs('data', exist_ok=True)