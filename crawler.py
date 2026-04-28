#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抖音生活服务-学习中心直播爬虫
从 https://lifexue.com/live/list 抓取“近期直播”和“直播回放”的标题、封面图与详情页链接，并生成素材文案。
"""

from __future__ import annotations

import argparse
import datetime
import json
import random
import requests
import time

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
}

BASE_URL = "https://lifexue.com"


def get_session():
    """创建并返回session对象"""
    session = requests.Session()
    session.headers.update(HEADERS)
    return session

def fetch_json(session: requests.Session, url: str, *, method: str, payload: dict | None = None) -> dict:
    method = method.upper().strip()
    headers = {
        "Referer": f"{BASE_URL}/live/list",
        "Origin": BASE_URL,
    }

    if method == "GET":
        resp = session.get(url, headers=headers, timeout=30)
    elif method == "POST":
        resp = session.post(url, headers=headers, json=payload or {}, timeout=30)
    else:
        raise ValueError(f"Unsupported method: {method}")

    resp.raise_for_status()
    time.sleep(random.uniform(0.2, 0.6))
    return resp.json()


def classify_key_points(title: str) -> str:
    t = title or ""
    if "入门" in t or "初级" in t or "初阶" in t:
        return "适合新手快速补齐开播/运营基础，按流程照做即可落地。"
    if "进阶" in t or "特训" in t or "破局" in t:
        return "偏进阶打法，适合想要提升转化/效率/增长的商家做系统优化。"
    if "节点" in t or "冲高" in t or "大促" in t:
        return "偏节点冲刺策略，适合节日前后做爆发式增长与资源倾斜。"
    if "扫码" in t or "上翻" in t:
        return "偏实操提效，围绕到店核销/扫码链路优化与转化提升。"
    if "直播" in t:
        return "聚焦直播间策略、节奏与转化动作，适合边学边改边验证。"
    return "偏通用经营方法论，可结合自身行业做一轮对标与复盘。"


def to_material_item(item: dict, kind: str) -> dict:
    title = item.get("liveName") or ""
    cover = item.get("coverImage") or ""
    detail = item.get("detailPageUrl") or ""
    visit_count = item.get("visitCount")
    link_label = "预约链接" if kind == "近期直播" else "观看链接"
    live_time = item.get("liveTime")

    is_before_today = False
    if live_time:
        try:
            live_date = datetime.datetime.strptime(live_time[:10], "%Y-%m-%d").date()
            is_before_today = live_date < datetime.date.today()
        except Exception:
            is_before_today = False

    primary_line = f"观看人数：{visit_count if visit_count is not None else '-'}" if is_before_today else f"时间：{live_time or '-'}"
    return {
        "kind": kind,
        "activityId": item.get("activityId"),
        "title": title,
        "coverImage": cover,
        "detailUrl": detail,
        "liveTime": live_time,
        "liveStatus": item.get("liveStatus"),
        "visitCount": visit_count,
        "linkLabel": link_label,
        "copywriting": (
            f"【{kind}】{title}\n"
            f"{primary_line}\n"
            f"看点：{classify_key_points(title)}\n"
            f"{link_label}：{detail}"
        ),
    }


def check_detail_pages(session: requests.Session, materials: list[dict]) -> None:
    headers = {"Referer": f"{BASE_URL}/live/list"}
    for m in materials:
        url = m.get("detailUrl")
        if not url:
            continue
        resp = session.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        time.sleep(random.uniform(0.2, 0.6))


def build_markdown(materials: list[dict]) -> str:
    lines: list[str] = []
    by_kind: dict[str, list[dict]] = {"近期直播": [], "直播回放": []}
    for m in materials:
        by_kind.setdefault(m["kind"], []).append(m)

    for kind in ["近期直播", "直播回放"]:
        items = by_kind.get(kind, [])
        lines.append(f"## {kind}（{len(items)}条）")
        lines.append("")
        for idx, m in enumerate(items, 1):
            lines.append(f"### {idx}. {m['title']}")
            lines.append("")
            lines.append(f"- 时间：{m.get('liveTime') or '-'}")
            lines.append(f"- 观看人数：{m.get('visitCount') if m.get('visitCount') is not None else '-'}")
            lines.append(f"- 详情页：{m.get('detailUrl') or '-'}")
            if m.get("coverImage"):
                lines.append("")
                lines.append(f"![]({m.get('coverImage')})")
            lines.append("")
            lines.append("素材文案：")
            lines.append("")
            lines.append("```")
            lines.append(m.get("copywriting") or "")
            lines.append("```")
            lines.append("")
    return "\n".join(lines).strip() + "\n"


def crawl_live_materials(session: requests.Session) -> list[dict]:
    recent_api = f"{BASE_URL}/api/live/recentList"
    live_list_api = f"{BASE_URL}/api/live/liveList"

    recent_resp = fetch_json(session, recent_api, method="POST", payload={})
    recent_list = (recent_resp.get("data") or {}).get("list") or []

    live_resp = fetch_json(session, live_list_api, method="POST", payload={})
    live_list = (live_resp.get("data") or {}).get("list") or []

    recent_ids = {x.get("activityId") for x in recent_list if x.get("activityId")}
    playback_list = [x for x in live_list if x.get("activityId") and x.get("activityId") not in recent_ids and x.get("liveStatus") == 3]

    materials: list[dict] = []
    materials.extend([to_material_item(x, "近期直播") for x in recent_list])
    materials.extend([to_material_item(x, "直播回放") for x in playback_list])
    return materials

def main():
    """主函数"""
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-detail", action="store_true")
    parser.add_argument("--json-out", default="live_materials.json")
    parser.add_argument("--md-out", default="live_materials.md")
    args = parser.parse_args()

    session = get_session()
    materials = crawl_live_materials(session)

    if args.check_detail:
        check_detail_pages(session, materials)

    with open(args.json_out, "w", encoding="utf-8") as f:
        json.dump(materials, f, ensure_ascii=False, indent=2)

    md = build_markdown(materials)
    with open(args.md_out, "w", encoding="utf-8") as f:
        f.write(md)

    preview = materials[: min(6, len(materials))]
    print(json.dumps(preview, ensure_ascii=False, indent=2))
    return materials

if __name__ == "__main__":
    main()
