import re
import sys

import requests


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 tools/lifexue_fetch_and_find.py <url>", file=sys.stderr)
        return 2

    url = sys.argv[1]
    html = requests.get(url, timeout=30).text
    print("url:", url)
    print("len:", len(html))

    paths = re.findall(r"/rule/(?:detail|detailhistory)/\\d+", html)
    uniq = sorted(set(paths))
    print("rule detail paths:", len(uniq))
    for p in uniq[:50]:
        print("https://lifexue.com" + p)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

