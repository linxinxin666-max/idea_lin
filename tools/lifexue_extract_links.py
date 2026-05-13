import re
import sys
import urllib.parse

import requests


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python3 tools/lifexue_extract_links.py <keyword>", file=sys.stderr)
        return 2

    keyword = " ".join(sys.argv[1:]).strip()
    url = "https://lifexue.com/search?keyword=" + urllib.parse.quote(keyword, safe="")
    html = requests.get(url, timeout=30).text

    print(url)

    script_srcs = re.findall(r'<script[^>]+src="([^"]+)"', html)
    if script_srcs:
        print("\n[scripts]")
        for s in script_srcs[:20]:
            print(s)

    api_candidates = sorted(
        set(re.findall(r"https?://[^\"'\\s>]+/(?:api|graphql)/[^\"'\\s>]+", html))
    )
    if api_candidates:
        print("\n[api candidates]")
        for a in api_candidates[:50]:
            print(a)

    paths = re.findall(r"/(?:rule|knowledge)/(?:detail|detailhistory)/\d+", html)
    unique_paths = sorted(set(paths))
    if unique_paths:
        print("\n[detail candidates]")
        for p in unique_paths[:50]:
            print("https://lifexue.com" + p)

    print("\n[html head]")
    print(html[:1200].replace("\n", "\\n"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
