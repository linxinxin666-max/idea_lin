#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import fitz  # PyMuPDF
import os

pdf_path = "朋友圈素材文档-4.22.pdf"

print("="*100)
print("提取PDF中的图片")
print("="*100)

# 创建新的posters目录
os.makedirs("posters_new", exist_ok=True)

doc = fitz.open(pdf_path)

for page_num, page in enumerate(doc, 1):
    print(f"\n处理第 {page_num} 页")
    
    images = page.get_images(full=True)
    
    for img_idx, img in enumerate(images, 1):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # 保存图片
        img_filename = f"posters_new/page{page_num}_img{img_idx}.{image_ext}"
        with open(img_filename, "wb") as f:
            f.write(image_bytes)
        
        print(f"  保存图片：{img_filename}")
        
        # 获取图片位置
        img_rects = page.get_image_rects(xref)
        if img_rects:
            rect = img_rects[0]
            print(f"  位置：({rect.x0:.1f}, {rect.y0:.1f}) - ({rect.x1:.1f}, {rect.y1:.1f})")

# 分析文本块位置
print("\n" + "="*100)
print("分析文本块位置")
print("="*100)

page = doc[0]
text_blocks = page.get_text("blocks")

for block in text_blocks:
    x0, y0, x1, y1, text, block_no, block_type = block
    if text.strip():
        text_preview = text[:100].replace('\n', ' ')
        print(f"位置(y={y0:.1f})：{text_preview}...")

print("\n✅ 图片提取完成！")
