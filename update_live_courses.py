import json
import re

# 读取直播课程数据
with open('live_courses_result.json', 'r', encoding='utf-8') as f:
    live_courses = json.load(f)

# 读取 demo.html
with open('demo.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# 在 professional 的 business 数组后面添加 live 数组
# 先找到 professional 的结束位置
professional_pattern = r'(professional:\s*\{[^}]*business:\s*\[[^\]]*\]\s*,?\s*)'
professional_match = re.search(professional_pattern, html_content, re.DOTALL)

if professional_match:
    # 在 business 数组后面添加 live 数组
    live_professional_array = ',\n'.join([json.dumps(text, ensure_ascii=False) for text in live_courses['professional']])
    professional_replacement = f'{professional_match.group(1)}live: [\n{live_professional_array}\n],\n'
    
    # 替换 professional 部分
    html_content = re.sub(professional_pattern, professional_replacement, html_content, 1, re.DOTALL)

# 在 friendly 的 business 数组后面添加 live 数组
friendly_pattern = r'(friendly:\s*\{[^}]*business:\s*\[[^\]]*\]\s*,?\s*)'
friendly_match = re.search(friendly_pattern, html_content, re.DOTALL)

if friendly_match:
    # 在 business 数组后面添加 live 数组
    live_friendly_array = ',\n'.join([json.dumps(text, ensure_ascii=False) for text in live_courses['friendly']])
    friendly_replacement = f'{friendly_match.group(1)}live: [\n{live_friendly_array}\n],\n'
    
    # 替换 friendly 部分
    html_content = re.sub(friendly_pattern, friendly_replacement, html_content, 1, re.DOTALL)

# 保存更新后的 html
with open('demo.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"✅ 成功更新 demo.html！")
print(f"   - 添加了 {len(live_courses['professional'])} 条专业顾问风格直播文案")
print(f"   - 添加了 {len(live_courses['friendly'])} 条亲切伙伴风格直播文案")
