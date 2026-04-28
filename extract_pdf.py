#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os

try:
    import pdfplumber
    print("✓ pdfplumber已安装")
except ImportError:
    print("✗ pdfplumber未安装，尝试安装...")
    os.system("pip3 install pdfplumber -q")
    try:
        import pdfplumber
        print("✓ pdfplumber安装成功")
    except:
        print("✗ 安装失败，尝试其他方法...")
        sys.exit(1)

pdf_path = "朋友圈素材文档-4.22.pdf"

if not os.path.exists(pdf_path):
    print(f"✗ 文件不存在: {pdf_path}")
    sys.exit(1)

print(f"\n📖 正在读取: {pdf_path}\n")
print("=" * 80)

try:
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                print(f"\n📄 第 {i+1} 页:")
                print("-" * 80)
                print(text)
                print("-" * 80)
    print("\n" + "=" * 80)
    print("✅ 读取完成！")
except Exception as e:
    print(f"✗ 读取失败: {e}")
    import traceback
    traceback.print_exc()
