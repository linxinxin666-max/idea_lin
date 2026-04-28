#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import json
import time

import requests

BASE = "https://lifexue.com"


def post(path: str, payload: dict) -> dict:
    url = BASE + path
    r = requests.post(
        url,
        headers={"User-Agent": "Mozilla/5.0", "Referer": BASE + "/course?enter_method=tab"},
        json=payload,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def main() -> None:
    tests = [
        ("/api/course/list_v2", {"pageInfo": {"page": 1, "pageSize": 10}}),
        ("/api/course/list_v2", {"pageInfo": {"page": 2, "pageSize": 10}}),
        ("/api/course/list_v2", {"pageInfo": "{\"page\":2,\"pageSize\":10}"}),
        ("/api/course/list_v2", {"pageInfo": "{\"page\":2,\"pageSize\":20}"}),
        ("/api/entity/recommend/feed", {"page": 1, "pageSize": 10, "tag": ["1001"], "feedSort": "Composite"}),
        ("/api/entity/recommend/feed", {"page": 2, "pageSize": 10, "tag": ["1001"], "feedSort": "Composite"}),
        ("/api/entity/recommend/feed", {"page": 1, "pageSize": 10, "tag": ["progress_basis"], "feedSort": "Composite"}),
        ("/api/entity/recommend/feed", {"page": 1, "pageSize": 10, "tag": [], "feedSort": "Composite"}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 1, "pageSize": 10}, "tag": ["1001"], "feedSort": "Composite"}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 1, "pageSize": 10}, "tag": ["progress_basis"], "feedSort": "Composite"}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 1, "pageSize": 10}, "tag": ["1001"]}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 2, "pageSize": 10}, "tag": ["1001"]}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 1, "pageSize": 10}, "tag": ["1001"], "feedSort": 0}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 2, "pageSize": 10}, "tag": ["1001"], "feedSort": 0}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 2, "pageSize": 10}, "tag": ["1001"], "feedSort": 1}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 1, "pageSize": 10}, "tag": ["1001"], "feedSort": 2}),
        ("/api/entity/recommend/feed", {"pageInfo": {"page": 2, "pageSize": 10}, "tag": ["1001"], "feedSort": 2}),
    ]

    for path, payload in tests:
        try:
            data = post(path, payload)
            inner = data.get("data") or {}
            keys = sorted(inner.keys())[:20] if isinstance(inner, dict) else []
            sample = None
            for k in ["courseList", "feedItems", "list", "items"]:
                if isinstance(inner, dict) and k in inner:
                    sample = inner.get(k)
                    break
            length = len(sample) if isinstance(sample, list) else None
            page_info = inner.get("pageInfo") if isinstance(inner, dict) else None
            print("\n===", path, "payload", json.dumps(payload, ensure_ascii=False))
            print("status_code", data.get("status_code"), "msg", data.get("status_msg"))
            print("data keys", keys)
            print("list key len", length, "pageInfo", page_info)
            if isinstance(sample, list) and sample:
                first = sample[0]
                if isinstance(first, dict):
                    print("first item keys", sorted(first.keys())[:25])
                    for kk in ["entityType", "entityId", "name", "title", "courseId", "detailPageUrl", "cover", "tagsZh"]:
                        if kk in first:
                            print("  ", kk, first.get(kk))
        except Exception as e:
            print("\n===", path, "payload", payload)
            print("ERROR", repr(e))
        time.sleep(0.2)


if __name__ == "__main__":
    main()
