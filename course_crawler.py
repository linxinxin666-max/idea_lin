#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import http.cookies
import json
import os
import random
import re
import time
from dataclasses import dataclass
from typing import Any

import requests

BASE_URL = "https://lifexue.com"
COURSE_CLASSIFICATION_TAG_ID = "1001"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
}


@dataclass
class CourseItem:
    course_id: str
    title: str
    cover: str
    detail_url: str
    view_num: str | None
    tags_zh: list[str]


def get_session(cookie: str | None = None) -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    if cookie:
        cookie = cookie.strip()
        if cookie.lower().startswith("cookie:"):
            cookie = cookie.split(":", 1)[1].strip()
        cookie = re.sub(r"[\r\n]+", "; ", cookie).strip("; ").strip()

        jar = http.cookies.SimpleCookie()
        jar.load(cookie)
        for k, morsel in jar.items():
            if not k:
                continue
            s.cookies.set(k, morsel.value, domain="lifexue.com")
    return s


def fetch_json(session: requests.Session, url: str, *, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    resp = session.post(
        url,
        headers={"Referer": f"{BASE_URL}/course?enter_method=tab", "Origin": BASE_URL},
        json=payload or {},
        timeout=30,
    )
    resp.raise_for_status()
    time.sleep(random.uniform(0.2, 0.6))
    return resp.json()

def fetch_json_with_referer(session: requests.Session, url: str, *, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    resp = session.post(
        url,
        headers={"Referer": f"{BASE_URL}/course?enter_method=tab", "Origin": BASE_URL},
        json=payload or {},
        timeout=30,
    )
    try:
        resp.raise_for_status()
    except Exception as e:
        msg = resp.text[:500] if resp is not None and hasattr(resp, "text") else ""
        raise RuntimeError(f"HTTP请求失败: {e}; body={msg}") from e
    time.sleep(random.uniform(0.2, 0.6))
    return resp.json()


def parse_course_list(items: list[dict[str, Any]]) -> list[CourseItem]:
    results: list[CourseItem] = []
    for it in items:
        course_id = str(it.get("entityId") or it.get("courseId") or "").strip()
        title = str(it.get("name") or "").strip()
        cover = str(it.get("cover") or "").strip()
        detail_url = str(it.get("detailPageUrl") or "").strip()
        view_num = it.get("viewNum")
        tags_zh = it.get("tagsZh") or []

        if not course_id or not title or not detail_url:
            continue

        results.append(
            CourseItem(
                course_id=course_id,
                title=title,
                cover=cover,
                detail_url=detail_url,
                view_num=str(view_num) if view_num is not None else None,
                tags_zh=[str(x) for x in tags_zh if x],
            )
        )
    return results


def _extract_total(data: dict[str, Any]) -> int | None:
    for k in ["total", "totalCount", "totalNum", "total_num", "countTotal", "totalCourseNum"]:
        v = data.get(k)
        if isinstance(v, int):
            return v
        if isinstance(v, str) and v.isdigit():
            return int(v)
    page_info = data.get("pageInfo")
    if isinstance(page_info, dict):
        v = page_info.get("totalCount") or page_info.get("total") or page_info.get("totalNum")
        if isinstance(v, int):
            return v
        if isinstance(v, str) and v.isdigit():
            return int(v)
    return None


def list_courses_paginated(
    session: requests.Session,
    *,
    page_size: int = 50,
    max_pages: int = 200,
    tag: list[str] | None = None,
    feed_sort: int | None = None,
    debug: bool = False,
) -> tuple[list[CourseItem], int | None]:
    url = f"{BASE_URL}/api/entity/recommend/feed"

    def fetch_list(payload: dict[str, Any], method: str) -> dict[str, Any]:
        method = method.upper().strip()
        headers = {"Referer": f"{BASE_URL}/course?enter_method=tab", "Origin": BASE_URL}
        if method == "GET":
            resp = session.get(url, headers=headers, params=payload, timeout=30)
        else:
            resp = session.post(url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        time.sleep(random.uniform(0.15, 0.35))
        return resp.json()

    candidates: list[dict[str, Any]] = [{"pageInfo": {"page": 1, "pageSize": page_size}}]

    base_filter: dict[str, Any] = {}
    if tag:
        base_filter["tag"] = tag
    if feed_sort:
        base_filter["feedSort"] = feed_sort

    candidates = [{**base_filter, **c} for c in candidates]

    def get_ids(d: dict[str, Any]) -> list[str]:
        inner = d.get("data") or {}
        items = inner.get("feedItems") or []
        ids: list[str] = []
        for it in items[:5]:
            cid = it.get("entityId") or it.get("courseId")
            if cid is not None:
                ids.append(str(cid))
        return ids

    def make_page2_payload(p: dict[str, Any]) -> dict[str, Any]:
        p2 = json.loads(json.dumps(p, ensure_ascii=False))
        if "pageInfo" in p2 and isinstance(p2["pageInfo"], dict):
            p2["pageInfo"]["page"] = 2
            p2["pageInfo"]["pageSize"] = page_size
        return p2

    best_payload = None
    best_len = -1
    best_total: int | None = None
    best_paging_ok = False
    best_method = "POST"
    for p in candidates:
        for method in ["POST", "GET"]:
            try:
                data = fetch_list(p, method)
                inner = data.get("data") or {}
                items = inner.get("feedItems") or []
                length = len(items)
                total = _extract_total(inner)
                ids1 = get_ids(data)
                paging_ok = False
                if length > 0:
                    data2 = fetch_list(make_page2_payload(p), method)
                    ids2 = get_ids(data2)
                    paging_ok = bool(ids2) and ids2 != ids1
                if debug:
                    page_info = inner.get("pageInfo")
                    print("probe", method, p, "len", length, "total", total, "paging", paging_ok, "ids1", ids1[:3], "pageInfo", page_info)
                if paging_ok and not best_paging_ok:
                    best_len = length
                    best_payload = p
                    best_total = total
                    best_paging_ok = True
                    best_method = method
                elif paging_ok == best_paging_ok and length > best_len:
                    best_len = length
                    best_payload = p
                    best_total = total
                    best_method = method
            except Exception:
                if debug:
                    import traceback

                    print("probe_err", method, p)
                    print(traceback.format_exc().splitlines()[-1])
                continue

    if not best_payload:
        data = fetch_list({}, "POST")
        inner = data.get("data") or {}
        items = inner.get("courseList") or []
        return parse_course_list(items), _extract_total(inner)

    mode = "pageInfo"

    all_items: list[CourseItem] = []
    seen: set[str] = set()
    total: int | None = None

    page_no = 1
    offset = 0
    cursor: Any = 0

    for _ in range(max_pages):
        payload = dict(best_payload)
        payload["pageInfo"] = dict(payload.get("pageInfo") or {})
        payload["pageInfo"]["page"] = page_no
        payload["pageInfo"]["pageSize"] = page_size

        data = fetch_list(payload, best_method)
        inner = data.get("data") or {}
        if total is None:
            total = _extract_total(inner)

        items = inner.get("feedItems") or []
        parsed = parse_course_list(items)
        new = [c for c in parsed if c.course_id not in seen]
        for c in new:
            seen.add(c.course_id)
        all_items.extend(new)

        if debug:
            print("page", payload, "got", len(parsed), "new", len(new), "acc", len(all_items), "total", total, "pageInfo", inner.get("pageInfo"))

        if not parsed or not new:
            break

        if total is not None and len(all_items) >= total:
            break

        page_no += 1

    return all_items, total


def list_courses_via_search(
    session: requests.Session,
    *,
    keyword: str,
    page_size: int,
    max_pages: int,
    debug: bool = False,
) -> tuple[list[CourseItem], int | None]:
    url = f"{BASE_URL}/api/entity/search"
    all_items: list[CourseItem] = []
    seen: set[str] = set()
    total: int | None = None

    for page in range(1, max_pages + 1):
        payload: dict[str, Any] = {"entityType": 1, "keyword": keyword, "pageInfo": {"page": page, "pageSize": page_size}}
        data = fetch_json_with_referer(session, url, payload=payload)
        inner = data.get("data") or {}
        if total is None:
            total = _extract_total(inner)

        items = None
        for k in ["feedItems", "entityList", "entityItems", "list", "items", "resultList", "searchList"]:
            if isinstance(inner, dict) and isinstance(inner.get(k), list):
                items = inner.get(k)
                break
        if items is None:
            items = []

        parsed = parse_course_list(items)
        parsed = [c for c in parsed if "/course/detail/" in (c.detail_url or "")]
        new = [c for c in parsed if c.course_id not in seen]
        for c in new:
            seen.add(c.course_id)
        all_items.extend(new)

        if debug:
            page_info = inner.get("pageInfo") if isinstance(inner, dict) else None
            print("search_page", page, "got", len(parsed), "new", len(new), "acc", len(all_items), "total", total, "pageInfo", page_info)

        if not parsed or not new:
            break

        if total is not None and len(all_items) >= total:
            break

    return all_items, total


def list_courses_via_multi_search(
    session: requests.Session,
    *,
    keywords: list[str],
    page_size: int,
    max_keywords: int,
    debug: bool = False,
) -> tuple[list[CourseItem], int | None]:
    url = f"{BASE_URL}/api/entity/search"
    all_items: list[CourseItem] = []
    seen: set[str] = set()

    def normalize_kw(s: str) -> str:
        return re.sub(r"\\s+", "", (s or "")).strip()

    def expand_keywords_from_course(raw_item: dict[str, Any]) -> list[str]:
        out: list[str] = []
        tags = raw_item.get("tagsZh") or []
        for t in tags:
            if isinstance(t, str) and len(t.strip()) >= 2:
                out.append(t.strip())

        title = str(raw_item.get("name") or "").strip()
        if title:
            parts = re.split(r"[\\s\\|｜丨—/_:：\\-]+", title)
            for p in parts:
                p = p.strip()
                if 2 <= len(p) <= 8:
                    out.append(p)
            for n in [2, 3, 4]:
                if len(title) >= n:
                    out.append(title[:n])

        return out

    queue: list[str] = [normalize_kw(k) for k in keywords if normalize_kw(k)]
    queued: set[str] = set(queue)
    used = 0

    while queue:
        kw = queue.pop(0)
        used += 1
        if max_keywords > 0 and used > max_keywords:
            break

        payload: dict[str, Any] = {"entityType": 1, "keyword": kw, "pageInfo": {"page": 1, "pageSize": page_size}}
        data = fetch_json_with_referer(session, url, payload=payload)
        inner = data.get("data") or {}

        items = None
        for k in ["feedItems", "entityList", "entityItems", "list", "items", "resultList", "searchList"]:
            if isinstance(inner, dict) and isinstance(inner.get(k), list):
                items = inner.get(k)
                break
        if items is None:
            items = []

        parsed = parse_course_list(items)
        parsed = [c for c in parsed if "/course/detail/" in (c.detail_url or "")]
        new = [c for c in parsed if c.course_id not in seen]
        for c in new:
            seen.add(c.course_id)
        all_items.extend(new)

        for it in items:
            if isinstance(it, dict):
                for nk in expand_keywords_from_course(it):
                    nk = normalize_kw(nk)
                    if not nk or nk in queued:
                        continue
                    queued.add(nk)
                    queue.append(nk)

        if debug:
            print("search_kw", kw, "got", len(parsed), "new", len(new), "acc", len(all_items), "queue", len(queue))

    return all_items, None


def get_course_detail_json(session: requests.Session, course_id: str) -> tuple[dict[str, Any] | None, str | None]:
    url = f"{BASE_URL}/api/course/detail"
    try:
        data = fetch_json_with_referer(session, url, payload={"courseId": course_id})
    except Exception as e:
        return None, f"请求失败：{e}"

    status_code = data.get("status_code")
    if status_code == 0:
        return data, None
    return None, str(data.get("status_msg") or f"status_code={status_code}")


def iter_text(value: Any) -> list[str]:
    out: list[str] = []

    def walk(v: Any) -> None:
        if v is None:
            return
        if isinstance(v, str):
            s = v.strip()
            if s:
                out.append(s)
            return
        if isinstance(v, (int, float, bool)):
            return
        if isinstance(v, dict):
            for vv in v.values():
                walk(vv)
            return
        if isinstance(v, list):
            for vv in v:
                walk(vv)
            return

    walk(value)
    return out


def extract_key_points_from_text(text: str, *, limit: int = 5) -> list[str]:
    if not text:
        return []

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    candidates = re.split(r"[。\n]\s*", text)
    cleaned: list[str] = []
    seen = set()
    for c in candidates:
        c = c.strip(" -•·\t")
        if len(c) < 10:
            continue
        if len(c) > 80:
            c = c[:80].rstrip() + "…"
        if c in seen:
            continue
        seen.add(c)
        cleaned.append(c)
        if len(cleaned) >= limit:
            break
    return cleaned


def extract_intro_from_detail(detail_data: dict[str, Any]) -> str:
    data = detail_data.get("data") if isinstance(detail_data, dict) else None
    if not isinstance(data, dict):
        return ""

    candidates: list[str] = []
    preferred_keys = [
        "courseIntro",
        "courseIntroduction",
        "introduction",
        "intro",
        "brief",
        "courseBrief",
        "courseDesc",
        "description",
        "desc",
        "summary",
        "简介",
        "课程简介",
    ]

    def walk(obj: Any, path: str = "") -> None:
        if obj is None:
            return
        if isinstance(obj, str):
            s = obj.strip()
            if s and len(s) >= 20 and not s.startswith("http"):
                candidates.append(s)
            return
        if isinstance(obj, (int, float, bool)):
            return
        if isinstance(obj, list):
            for i, v in enumerate(obj):
                walk(v, f"{path}[{i}]")
            return
        if isinstance(obj, dict):
            for k, v in obj.items():
                key = str(k)
                if any(pk.lower() in key.lower() for pk in preferred_keys):
                    if isinstance(v, str):
                        s = v.strip()
                        if s and not s.startswith("http"):
                            candidates.append(s)
                    else:
                        walk(v, f"{path}.{key}" if path else key)
                else:
                    walk(v, f"{path}.{key}" if path else key)

    walk(data)
    if not candidates:
        return ""

    candidates = sorted({c.replace("\r", "").strip() for c in candidates}, key=len, reverse=True)
    best = candidates[0]

    def extract_quill_ops(obj: Any) -> list[dict[str, Any]]:
        ops: list[dict[str, Any]] = []

        def walk(v: Any) -> None:
            if v is None:
                return
            if isinstance(v, dict):
                if isinstance(v.get("ops"), list):
                    for op in v.get("ops") or []:
                        if isinstance(op, dict):
                            ops.append(op)
                for vv in v.values():
                    walk(vv)
            elif isinstance(v, list):
                for vv in v:
                    walk(vv)

        walk(obj)
        return ops

    def quill_to_text(raw: str) -> str:
        s = raw.strip()
        if not s.startswith("{") or not s.endswith("}"):
            return s
        if "ops" not in s:
            return s
        try:
            obj = json.loads(s)
        except Exception:
            return s

        ops = extract_quill_ops(obj)
        if not ops:
            return s

        lines: list[str] = []
        current = ""
        pending_bullet = False
        for op in ops:
            ins = op.get("insert")
            if not isinstance(ins, str):
                continue
            if ins == "\n":
                if current.strip():
                    lines.append(current.strip())
                current = ""
                pending_bullet = False
                continue
            if ins == "*":
                pending_bullet = True
                continue
            chunk = ins.replace("\u200b", "")
            chunk = re.sub(r"[ \t]+", " ", chunk).strip()
            if not chunk:
                continue
            if pending_bullet:
                if current.strip():
                    lines.append(current.strip())
                current = f"• {chunk}"
                pending_bullet = False
            else:
                if not current:
                    current = chunk
                else:
                    if current.endswith(("：", ":", "—", "-", "·")):
                        current = f"{current} {chunk}"
                    else:
                        current = f"{current}{chunk}"
        if current.strip():
            lines.append(current.strip())

        text = "\n".join(lines)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    best = quill_to_text(best)
    best = re.sub(r"\n{3,}", "\n\n", best)
    return best.strip()


def fallback_key_points(course: CourseItem) -> list[str]:
    tags = [t for t in course.tags_zh if t and t not in {"新手入门"}]
    tag_hint = "、".join(tags[:3]) if tags else ""

    points = [
        "适合新手快速建立抖音生活服务经营基础，避免踩坑。",
        "按“目标-动作-复盘”三步走，边学边做，效果更快。",
        "结合行业场景拆解关键动作，降低上手门槛。",
        "建议学习后立刻在店铺/直播间做一次小改动验证。",
    ]
    if tag_hint:
        points.insert(1, f"覆盖方向：{tag_hint}（更贴近你的经营场景）。")
    return points[:4]


def build_moment_copy(course: CourseItem, *, key_points: list[str]) -> str:
    points = key_points[:5] if key_points else []
    bullets = "\n".join([f"{i+1}️⃣ {p}" for i, p in enumerate(points)])

    return (
        f"📚【新手入门｜经营技巧】\n"
        f"{course.title}\n"
        f"\n"
        f"💡 课程总结：\n"
        f"{bullets}\n\n"
        f"🎯 课程直达链接：{course.detail_url}\n\n"
    ).strip()


def to_material(course: CourseItem, detail_data: dict[str, Any] | None, detail_err: str | None) -> dict[str, Any]:
    intro = extract_intro_from_detail(detail_data) if detail_data else ""
    key_points = extract_key_points_from_text(intro, limit=5)
    if not key_points:
        key_points = fallback_key_points(course)

    material = {
        "category": "新手入门",
        "courseId": course.course_id,
        "title": course.title,
        "coverImage": course.cover,
        "detailUrl": course.detail_url,
        "viewNum": course.view_num,
        "tagsZh": course.tags_zh,
        "intro": intro,
        "keyPoints": key_points,
        "copywriting": build_moment_copy(course, key_points=key_points),
    }
    if detail_err:
        material["detailFetchWarning"] = detail_err
    return material


def build_markdown(materials: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    lines.append("## 新手入门｜课程素材（示例）")
    lines.append("")
    for idx, m in enumerate(materials, 1):
        lines.append(f"### {idx}. {m.get('title')}")
        lines.append("")
        if m.get("coverImage"):
            lines.append(f"![]({m.get('coverImage')})")
            lines.append("")
        if m.get("detailUrl"):
            lines.append(f"- 详情地址：{m.get('detailUrl')}")
        if m.get("viewNum"):
            lines.append(f"- 观看人数：{m.get('viewNum')} 人")
        if m.get("detailFetchWarning"):
            lines.append(f"- 详情抓取提示：{m.get('detailFetchWarning')}")
        lines.append("")
        lines.append("素材文案：")
        lines.append("")
        lines.append("```")
        lines.append(m.get("copywriting") or "")
        lines.append("```")
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument("--json-out", default="course_materials_newbie.json")
    parser.add_argument("--md-out", default="course_materials_newbie.md")
    parser.add_argument("--cookie", default=os.environ.get("LIFEXUE_COOKIE", ""))
    parser.add_argument("--cookie-file", default="")
    parser.add_argument("--page-size", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=200)
    parser.add_argument("--debug-pages", action="store_true")
    parser.add_argument("--bd-out", default="course_materials_business.json")
    parser.add_argument("--source", choices=["feed", "search", "search_multi"], default="feed")
    parser.add_argument("--keyword", default="")
    parser.add_argument("--max-keywords", type=int, default=500)
    args = parser.parse_args()

    cookie = (args.cookie or "").strip()
    if args.cookie_file:
        with open(args.cookie_file, "r", encoding="utf-8") as f:
            cookie = f.read().strip()
    session = get_session(cookie=cookie or None)
    if args.source == "search_multi":
        default_keywords = [
            "新手入门",
            "入驻",
            "来客",
            "抖音来客",
            "团购",
            "核销",
            "转化",
            "直播",
            "开播",
            "短视频",
            "商品",
            "上架",
            "套餐",
            "组品",
            "选品",
            "评分",
            "评论",
            "客服",
            "复购",
            "流量",
            "数据",
            "规则",
            "退款",
            "履约",
            "CPS",
            "达人",
            "机构",
            "本地推",
            "投放",
            "餐饮",
            "酒旅",
            "综合",
            "房产",
            "丽人",
            "亲子",
            "汽车",
            "洗车",
            "维修",
            "租赁",
            "健身",
            "瑜伽",
            "舞蹈",
            "美甲",
            "美容",
            "美发",
            "纹绣",
            "摄影",
            "婚纱",
            "婚庆",
            "宠物",
            "口腔",
            "医美",
            "体检",
            "按摩",
            "足疗",
            "推拿",
            "亲子乐园",
            "早教",
            "才艺",
            "乐园",
            "密室",
            "剧本杀",
            "桌游",
            "卡丁车",
            "马术",
            "采摘",
            "农家乐",
            "民宿",
            "酒店",
            "景区",
            "周边游",
            "旅行",
            "团单",
            "券",
            "到店",
            "履约率",
            "差评",
            "申诉",
            "保证金",
            "信用",
            "保障",
            "素材",
            "剪辑",
            "拍摄",
            "脚本",
            "文案",
            "话术",
            "直播间",
            "封面",
            "标题",
            "主页",
            "人设",
            "定位",
            "冷启动",
            "爆款",
            "案例",
            "节点",
            "大促",
            "节日",
            "会员",
            "私域",
            "拉新",
            "留存",
            "增长",
            "GMV",
            "ROI",
            "客单价",
            "转化率",
            "成交",
            "退款率",
            "配送",
            "区域代理",
            "子账号",
        ]
        keywords = [k.strip() for k in (args.keyword.split(",") if args.keyword else []) if k.strip()]
        if not keywords:
            keywords = default_keywords
        courses, total = list_courses_via_multi_search(
            session,
            keywords=keywords,
            page_size=args.page_size,
            max_keywords=args.max_keywords,
            debug=args.debug_pages,
        )
    elif args.source == "search":
        courses, total = list_courses_via_search(
            session,
            keyword=args.keyword.strip() or "新手入门",
            page_size=args.page_size,
            max_pages=args.max_pages,
            debug=args.debug_pages,
        )
    else:
        courses, total = list_courses_paginated(
            session,
            page_size=args.page_size,
            max_pages=args.max_pages,
            tag=[COURSE_CLASSIFICATION_TAG_ID],
            feed_sort=2,
            debug=args.debug_pages,
        )
    newbie = [c for c in courses if "新手入门" in set(c.tags_zh)]
    picked = newbie[: max(0, args.limit)]

    materials: list[dict[str, Any]] = []
    for c in picked:
        detail_data, detail_err = get_course_detail_json(session, c.course_id)
        materials.append(to_material(c, detail_data, detail_err))

    with open(args.json_out, "w", encoding="utf-8") as f:
        json.dump(materials, f, ensure_ascii=False, indent=2)
    with open(args.md_out, "w", encoding="utf-8") as f:
        f.write(build_markdown(materials))

    bd_payload = [
        {
            "title": m.get("title"),
            "coverImage": m.get("coverImage"),
            "detailUrl": m.get("detailUrl"),
            "keyPoints": m.get("keyPoints") or [],
            "copywriting": m.get("copywriting") or "",
        }
        for m in materials
    ]
    with open(args.bd_out, "w", encoding="utf-8") as f:
        json.dump(bd_payload, f, ensure_ascii=False, indent=2)

    preview = {
        "totalFromApi": total,
        "fetched": len(courses),
        "newbie": len(newbie),
        "preview": materials,
    }
    print(json.dumps(preview, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
