#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import fitz  # PyMuPDF

pdf_path = "朋友圈素材文档.pdf"

print("="*100)
print("📊 PDF第一页图片位置和内容位置分析")
print("="*100)

doc = fitz.open(pdf_path)
page = doc[0]

print(f"\n📄 页面尺寸: {page.rect}")

print("\n" + "="*100)
print("📝 文本块位置:")
print("="*100)

text_blocks = page.get_text("blocks")
for block in text_blocks:
    x0, y0, x1, y1, text, block_no, block_type = block
    if text.strip():
        print(f"位置: ({x0:.1f}, {y0:.1f}) - ({x1:.1f}, {y1:.1f})")
        print(f"内容: {text[:100]}...\n")

print("\n" + "="*100)
print("🖼️ 图片位置:")
print("="*100)

images_info = page.get_images(full=True)
for img_idx, img in enumerate(images_info, 1):
    xref = img[0]
    # 获取图片在页面上的位置
    img_rects = page.get_image_rects(xref)
    if img_rects:
        rect = img_rects[0]
        print(f"图片 {img_idx}:")
        print(f"  位置: ({rect.x0:.1f}, {rect.y0:.1f}) - ({rect.x1:.1f}, {rect.y1:.1f})")
        print(f"  尺寸: {rect.width:.1f} x {rect.height:.1f}")
        
        # 找出这个图片附近的文本
        print(f"  附近文本:")
        for block in text_blocks:
            bx0, by0, bx1, by1, btext, _, _ = block
            if btext.strip() and abs(by0 - rect.y0) < 200:  # 同一区域
                print(f"    - {btext[:80]}...")
        print()

print("\n✅ 分析完成！")
