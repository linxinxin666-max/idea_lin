#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import fitz  # PyMuPDF
from datetime import datetime
import json
import os

# 今天日期：2026-04-28
today = datetime(2026, 4, 28)

def parse_date(date_str):
    """解析日期字符串，格式如 4.16"""
    try:
        month, day = map(int, date_str.split('.'))
        # 默认年份为2026
        return datetime(2026, month, day)
    except:
        return None

# 先尝试4.27的，没有就用4.22
pdf_path = "朋友圈素材文档-4.27.pdf"
if not os.path.exists(pdf_path):
    pdf_path = "朋友圈素材文档-4.22.pdf"

materials = []

doc = fitz.open(pdf_path)

# 提取所有文本并合并
full_text = ""
for page in doc:
    full_text += page.get_text()

lines = full_text.split('\n')

# 查找官方发布的内容
current_material = None
content_buffer = []
current_date = None

i = 0
while i < len(lines):
    line = lines[i].strip()
    
    # 检查是否是官方发布标记
    if line == "官方发布":
        # 如果有之前的内容，先保存
        if current_material and content_buffer:
            current_material['content'] = '\n'.join(content_buffer).strip()
            materials.append(current_material)
        
        # 寻找日期（下一行或之后）
        current_date = None
        for j in range(i+1, min(i+5, len(lines))):
            date_candidate = lines[j].strip()
            if '.' in date_candidate and len(date_candidate) <= 5 and len(date_candidate) >= 3:
                if all(c.isdigit() or c == '.' for c in date_candidate):
                    current_date = date_candidate
                    break
        
        current_material = {
            'type': '官方发布',
            'date_str': current_date,
            'date': parse_date(current_date) if current_date else None,
            'images': []
        }
        content_buffer = []
    elif current_material and line and line not in ["分类", "更新日期", "文案", "图片"]:
        # 累积内容，但跳过表头
        content_buffer.append(line)
    
    i += 1

# 保存最后一个
if current_material and content_buffer:
    current_material['content'] = '\n'.join(content_buffer).strip()
    materials.append(current_material)

# 分类
historical = []
upcoming = []

for mat in materials:
    if mat['date']:
        if mat['date'] < today:
            historical.append(mat)
        else:
            upcoming.append(mat)
    else:
        # 没有日期的默认放到历史
        historical.append(mat)

# 打印结果
print("=" * 80)
print(f"📊 总共解析到 {len(materials)} 条素材")
print(f"   🕒 历史发布: {len(historical)} 条")
print(f"   📅 优先发布: {len(upcoming)} 条")
print("=" * 80)

print("\n📅 优先发布素材 (2026-04-28及之后):")
for i, mat in enumerate(upcoming, 1):
    print(f"\n{i}. 日期: {mat['date_str']}")
    print(mat['content'][:200] + "..." if len(mat['content']) > 200 else mat['content'])

print("\n" + "=" * 80)
print("\n🕒 历史发布素材 (早于2026-04-28):")
for i, mat in enumerate(historical, 1):
    print(f"\n{i}. 日期: {mat['date_str']}")
    print(mat['content'][:150] + "..." if len(mat['content']) > 150 else mat['content'])

# 保存为JSON文件备用
output_data = {
    'historical': historical,
    'upcoming': upcoming
}

with open('materials_data.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2, default=str)

print("\n" + "=" * 80)
print("✅ 数据已保存到 materials_data.json")
