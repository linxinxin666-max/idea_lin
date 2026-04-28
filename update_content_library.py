import json
import re

# 读取直播课程数据
with open('live_courses_result.json', 'r', encoding='utf-8') as f:
    live_courses = json.load(f)

# 读取 demo.html
with open('demo.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# 1. 首先处理 professional 部分：
# 在 business 数组后添加 live 数组
# 找到 professional.business 的结束位置
professional_business_pattern = r'(professional:\s*\{[^}]*business:\s*\[[^\]]*\]\s*,?\s*)'
professional_business_match = re.search(professional_business_pattern, html_content, re.DOTALL)

if professional_business_match:
    # 构建 live 数组
    live_professional_content = ',\n'.join([json.dumps(text, ensure_ascii=False) for text in live_courses['professional']])
    live_professional_array = f'live: [\n{live_professional_content}\n],\n'
    
    # 在 business 后插入 live
    professional_with_live = professional_business_match.group(1) + live_professional_array
    html_content = re.sub(professional_business_pattern, professional_with_live, html_content, 1, re.DOTALL)

# 2. 然后处理 friendly 部分：
# 先删除 inspire 数组
friendly_inspire_pattern = r'(,\s*inspire:\s*\[[^\]]*\]\s*,?\s*)'
html_content = re.sub(friendly_inspire_pattern, '', html_content, 1, re.DOTALL)

# 然后在 friendly.business 后添加 live 数组
friendly_business_pattern = r'(friendly:\s*\{[^}]*business:\s*\[[^\]]*\]\s*,?\s*)'
friendly_business_match = re.search(friendly_business_pattern, html_content, re.DOTALL)

if friendly_business_match:
    # 构建 live 数组
    live_friendly_content = ',\n'.join([json.dumps(text, ensure_ascii=False) for text in live_courses['friendly']])
    live_friendly_array = f'live: [\n{live_friendly_content}\n],\n'
    
    # 在 business 后插入 live
    friendly_with_live = friendly_business_match.group(1) + live_friendly_array
    html_content = re.sub(friendly_business_pattern, friendly_with_live, html_content, 1, re.DOTALL)

# 保存更新后的 html
with open('demo.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"✅ 成功更新 demo.html！")
print(f"   - 添加了 {len(live_courses['professional'])} 条专业顾问风格直播文案")
print(f"   - 添加了 {len(live_courses['friendly'])} 条亲切伙伴风格直播文案")
print(f"   - 删除了励志鸡汤内容")
