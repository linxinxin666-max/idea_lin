#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import fitz  # PyMuPDF

pdf_path = "朋友圈素材文档.pdf"

print("="*100)
print("📊 PDF第一页内容和图片位置")
print("="*100)

doc = fitz.open(pdf_path)
page = doc[0]

print(f"\n📄 页面尺寸: {page.rect}")

print("\n" + "="*100)
print("📝 文本内容:")
print("="*100)

text = page.get_text("text")
print(text)

print("\n" + "="*100)
print("🖼️ 图片信息:")
print("="*100)

images = page.get_images(full=True)
print(f"找到 {len(images)} 张图片\n")

for img_idx, img in enumerate(images, 1):
    xref = img[0]
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    image_ext = base_image["ext"]
    
    print(f"图片 {img_idx}:")
    print(f"  格式: {image_ext}")
    print(f"  大小: {len(image_bytes)} bytes")
    
    # 保存图片
    img_filename = f"view_poster_{img_idx}.{image_ext}"
    with open(img_filename, "wb") as f:
        f.write(image_bytes)
    print(f"  已保存为: {img_filename}")

# 保存整个页面为图片
print("\n" + "="*100)
print("📷 保存页面为图片...")
print("="*100)

pix = page.get_pixmap()
pix.save("page_1_full.png")
print("页面已保存为: page_1_full.png")

print("\n✅ 分析完成！")
