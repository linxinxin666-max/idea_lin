import json
import re

# 读取直播课程数据
with open('live_courses_result.json', 'r', encoding='utf-8') as f:
    live_courses = json.load(f)

# 读取 demo.html
with open('demo.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# 1. 处理 professional 部分：在 business 和 platform 之间插入 live
# 找到 professional 的 business 结束位置（在 platform 之前）
professional_business_end_pattern = r'(\s*business:\s*\[[^\]]*\]\s*),\s*platform:'
professional_match = re.search(professional_business_end_pattern, html_content, re.DOTALL)

if professional_match:
    # 构建 live 数组
    live_professional_text = ',\n'.join([json.dumps(text, ensure_ascii=False) for text in live_courses['professional']])
    live_professional_array = f'{professional_match.group(1)},\nlive: [\n{live_professional_text}\n],\nplatform:'
    
    # 替换
    html_content = re.sub(professional_business_end_pattern, live_professional_array, html_content, 1, re.DOTALL)

# 2. 处理 friendly 部分：
# 先删除 inspire 数组
friendly_inspire_pattern = r'(,\s*inspire:\s*\[[^\]]*\]\s*),\s*platform:'
friendly_inspire_match = re.search(friendly_inspire_pattern, html_content, re.DOTALL)

if friendly_inspire_match:
    # 直接把 inspire 去掉，替换回 platform 前
    html_content = re.sub(friendly_inspire_pattern, ', platform:', html_content, 1, re.DOTALL)

# 然后在 friendly 的 business 和 platform 之间插入 live
friendly_business_end_pattern = r'(\s*business:\s*\[[^\]]*\]\s*),\s*platform:'
friendly_match = re.search(friendly_business_end_pattern, html_content, re.DOTALL)

if friendly_match:
    # 构建 live 数组
    live_friendly_text = ',\n'.join([json.dumps(text, ensure_ascii=False) for text in live_courses['friendly']])
    live_friendly_array = f'{friendly_match.group(1)},\nlive: [\n{live_friendly_text}\n],\nplatform:'
    
    # 替换
    html_content = re.sub(friendly_business_end_pattern, live_friendly_array, html_content, 1, re.DOTALL)

# 保存更新后的 html
with open('demo.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"✅ 成功更新 demo.html！")
print(f"   - 添加了 {len(live_courses['professional'])} 条专业顾问风格直播文案")
print(f"   - 添加了 {len(live_courses['friendly'])} 条亲切伙伴风格直播文案")
print(f"   - 删除了励志鸡汤内容")
