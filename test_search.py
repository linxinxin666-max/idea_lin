
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
from urllib.parse import quote

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

base_url = "https://lifexue.com"

# 尝试几种常见的搜索URL格式
search_tests = [
    f"{base_url}/course?search=爆品",
    f"{base_url}/course?keyword=爆品",
    f"{base_url}/course?q=爆品",
    f"{base_url}/search?q=爆品",
    f"{base_url}/course?enter_method=tab&search=爆品",
]

for url in search_tests:
    try:
        print(f"\n尝试: {url}")
        response = requests.get(url, headers=HEADERS, timeout=10)
        print(f"状态码: {response.status_code}")
        if '爆品' in response.text:
            print("✓ 搜索可能有效！")
        else:
            print("可能无效，但先记录下来")
    except Exception as e:
        print(f"错误: {e}")
