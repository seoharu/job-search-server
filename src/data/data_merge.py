import pandas as pd
import os

def merge_csv_files():
    # 병합할 파일 목록
    target_files = [
        'saramin_jobs_all_20241206_220544.csv',
        'saramin_jobs_all_20241207_060918.csv',
        'saramin_jobs_all_20241207_150104.csv',
        'saramin_jobs_all_20241208_002538.csv'
    ]

    # 현재 디렉토리
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # DataFrame 리스트
    dfs = []

    # 각 파일 읽기
    for file in target_files:
        file_path = os.path.join(current_dir, file)
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            dfs.append(df)
            print(f"Read {len(df)} records from {file}")
        else:
            print(f"Warning: File {file} not found")

    if not dfs:
        print("No files were found to merge")
        return

    # DataFrame 병합
    merged_df = pd.concat(dfs, ignore_index=True)
    print(f"\nTotal records before removing duplicates: {len(merged_df)}")

    # 중복 제거 (company_name, title, url 기준)
    merged_df = merged_df.drop_duplicates(subset=['company_name', 'title', 'url'])
    print(f"Total records after removing duplicates: {len(merged_df)}")

    # 결과 저장
    output_file = os.path.join(current_dir, 'merged_saramin_jobs.csv')
    merged_df.to_csv(output_file, index=False)
    print(f"\nMerged data saved to: {output_file}")

if __name__ == "__main__":
    merge_csv_files()