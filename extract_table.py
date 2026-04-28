#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pdfplumber

pdf_path = "朋友圈素材文档.pdf"

print("="*80)
print(f"正在详细分析PDF表格: {pdf_path}")
print("="*80)

with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages, 1):
        print(f"\n{'='*80}")
        print(f"📄 第 {page_num} 页")
        print(f"{'='*80}")
        
        # 尝试提取表格
        tables = page.extract_tables()
        if tables:
            print(f"\n✅ 找到 {len(tables)} 个表格！")
            for table_idx, table in enumerate(tables, 1):
                print(f"\n📊 表格 {table_idx}:")
                print("-"*80)
                for row_idx, row in enumerate(table, 1):
                    print(f"行 {row_idx}: {row}")
        else:
            print("\n❌ 没有找到标准表格，按文字块查看位置关系")
            print("\n" + "-"*80)
            
            # 获取所有文本块及其位置
            words = page.extract_words()
            
            # 按y坐标分组（横向行）
            rows = {}
            for word in words:
                y = round(word['top'], -1)  # 四舍五入到10位精度
                if y not in rows:
                    rows[y] = []
                rows[y].append(word)
            
            # 按y坐标排序
            sorted_rows = sorted(rows.items(), key=lambda x: x[0])
            
            print("\n📋 按行排列的文本（从上到下）:")
            print("-"*80)
            for y, words_in_row in sorted_rows:
                # 按x坐标排序（从左到右）
                words_in_row_sorted = sorted(words_in_row, key=lambda x: x['x0'])
                text = " ".join([w['text'] for w in words_in_row_sorted])
                print(f"y={y:>4}: {text}")
            
            # 查看图片位置
            images = page.get_images()
            if images:
                print(f"\n{'='*80}")
                print(f"🖼️ 第 {page_num} 页有 {len(images)} 张图片")
                print(f"{'='*80}")
                
                # 获取图片在页面上的位置信息
                page_rects = page.annots
                if page_rects:
                    print(f"\n📌 页面注解/位置信息:")
                    for rect in page_rects:
                        print(f"  {rect}")
                        
                # 简单打印图片信息
                for img_idx, img in enumerate(images, 1):
                    print(f"\n图片 {img_idx}:")
                    print(f"  xref: {img[0]}")
                    print(f"  信息: {img}")

print("\n" + "="*80)
print("✅ 分析完成！")
