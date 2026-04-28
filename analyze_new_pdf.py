#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import fitz  # PyMuPDF

pdf_path = "朋友圈素材文档-4.22.pdf"

print("="*100)
print(f"正在分析PDF：{pdf_path}")
print("="*100)

doc = fitz.open(pdf_path)
print(f"\n总页数：{len(doc)}")

for page_num, page in enumerate(doc, 1):
    print(f"\n{'='*100}")
    print(f"第 {page_num} 页")
    print(f"{'='*100}")
    
    # 获取文本
    text = page.get_text()
    print(text)
    
    # 获取图片
    images = page.get_images(full=True)
    print(f"\n图片数量：{len(images)}")
    for img_idx, img in enumerate(images, 1):
        print(f"  图片 {img_idx}：xref={img[0]}")

print("\n✅ 分析完成！")
