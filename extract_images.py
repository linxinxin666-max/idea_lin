#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import fitz  # PyMuPDF

pdf_path = "朋友圈素材文档.pdf"
output_dir = "posters"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"正在读取PDF: {pdf_path}")

try:
    doc = fitz.open(pdf_path)
    
    image_count = 0
    for page_num in range(len(doc)):
        page = doc[page_num]
        images = page.get_images(full=True)
        
        print(f"\n第 {page_num + 1} 页发现 {len(images)} 张图片")
        
        for img_idx, img in enumerate(images):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            image_filename = f"poster_page{page_num + 1}_img{img_idx + 1}.{image_ext}"
            image_path = os.path.join(output_dir, image_filename)
            
            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)
            
            print(f"  保存图片: {image_filename}")
            image_count += 1
    
    print(f"\n✅ 总共提取了 {image_count} 张图片到 {output_dir} 文件夹")
    
    if image_count > 0:
        print("\n📁 图片文件列表:")
        for filename in os.listdir(output_dir):
            if filename.startswith("poster_"):
                print(f"  - {filename}")
                
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()
