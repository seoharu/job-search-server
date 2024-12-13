from src.crawler.crawler import crawl_saramin_enhanced
from src.config.config import SEARCH_KEYWORDS, PAGES_PER_KEYWORD
from src.crawler.utils import ensure_data_directory

if __name__ == "__main__":
    # 데이터 디렉토리 확인
    ensure_data_directory()

    # 크롤링 실행
    df = crawl_saramin_enhanced(
        search_keywords=SEARCH_KEYWORDS,
        pages_per_keyword=PAGES_PER_KEYWORD
    )

    print("\n크롤링이 완료되었습니다.")