
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

# 读取爬虫生成的数据
with open('courses_result.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

# 提取两种风格的文案
professional_business = courses['professional']
friendly_business = courses['friendly']

# 读取demo.html
with open('demo.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# 找到需要替换的位置
import re

# 替换 professional 的 business 数组
# 找到 professional: { business: [ ... ] } 的内容
# 先找到 professional.business 的开始位置
prof_start_match = re.search(r'professional:\s*\{[^}]*business:\s*\[', html_content, re.DOTALL)
if prof_start_match:
    prof_start = prof_start_match.end()
    # 找到对应的结束位置，需要匹配成对的括号
    count = 1
    i = prof_start
    while i < len(html_content) and count > 0:
        if html_content[i] == '[':
            count += 1
        elif html_content[i] == ']':
            count -= 1
        i += 1
    prof_end = i - 1
    
    # 生成新的数组内容
    prof_array_content = ',\n'.join([json.dumps(text, ensure_ascii=False) for text in professional_business])
    
    # 替换
    html_content = html_content[:prof_start] + '\n' + prof_array_content + '\n' + html_content[prof_end:]

# 替换 friendly 的 business 数组
friend_start_match = re.search(r'friendly:\s*\{[^}]*business:\s*\[', html_content, re.DOTALL)
if friend_start_match:
    friend_start = friend_start_match.end()
    # 找到对应的结束位置
    count = 1
    i = friend_start
    while i < len(html_content) and count > 0:
        if html_content[i] == '[':
            count += 1
        elif html_content[i] == ']':
            count -= 1
        i += 1
    friend_end = i - 1
    
    # 生成新的数组内容
    friend_array_content = ',\n'.join([json.dumps(text, ensure_ascii=False) for text in friendly_business])
    
    # 替换
    html_content = html_content[:friend_start] + '\n' + friend_array_content + '\n' + html_content[friend_end:]

# 保存更新后的html
with open('demo.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"成功更新demo.html！")
print(f"共更新了 {len(professional_business)} 条专业顾问风格文案和 {len(friendly_business)} 条亲切伙伴风格文案！")
