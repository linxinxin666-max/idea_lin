#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pdfplumber

pdf_path = "朋友圈素材文档.pdf"

print("="*100)
print("📊 PDF第一页详细文本和图片的位置关系")
print("="*100)

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]
    
    print(f"\n📄 页面尺寸: {page.width} x {page.height}")
    
    print("\n" + "="*100)
    print("📝 所有文本内容及其位置:")
    print("="*100)
    
    words = page.extract_words(keep_blank_chars=True, extra_attrs=['fontname', 'size'])
    
    # 按y排序，再按x
    for word in sorted(words):
        y = round(word['top'], -1)
        words_sorted = sorted(word for word in words if round(word['top'], -1) == y, key=lambda x: x['x0'])
        text = " ".join([w['text'] for w in words_sorted])
        print(f"y={y:>4}: {text}")

    print("\n" + "="*100)
    print("🖼️ 图片信息:")
    print("="*100)
    
    images = page.get_images(full=True)
    for img_idx, img in enumerate(images, 1):
        print(f"\n图片 {img_idx}: {img}")
