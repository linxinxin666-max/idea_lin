import json
import random

# 直播课程数据
live_courses = [
    {"title": "《节点冲高-商家直播进阶课》-西餐异国菜", "viewers": 850, "link": "https://lifexue.com/live/list"},
    {"title": "码上有生意—初级扫码实操课", "viewers": 10299, "link": "https://lifexue.com/live/list"},
    {"title": "流量破局 商家特训课", "viewers": 4956, "link": "https://lifexue.com/live/list"},
    {"title": "餐饮商家专场——抖音生活服务扫码上翻实战指南", "viewers": 1174, "link": "https://lifexue.com/live/list"},
    {"title": "摄影商家专场——抖音生活服务扫码上翻实战指南", "viewers": 861, "link": "https://lifexue.com/live/list"},
    {"title": "休娱商家专场——抖音生活服务扫码上翻实战指南", "viewers": 427, "link": "https://lifexue.com/live/list"},
    {"title": "3月 VIP 商家尊享赋能营", "viewers": 670, "link": "https://lifexue.com/live/list"},
    {"title": "服饰商家专场——抖音生活服务扫码上翻实战指南", "viewers": 132, "link": "https://lifexue.com/live/list"},
    {"title": "《节点冲高-商家直播进阶课》-非餐", "viewers": 1450, "link": "https://lifexue.com/live/list"},
    {"title": "教培商家专场——抖音生活服务扫码上翻实战指南", "viewers": 215, "link": "https://lifexue.com/live/list"},
    {"title": "《节点冲高-商家直播进阶课》-餐", "viewers": 834, "link": "https://lifexue.com/live/list"},
    {"title": "餐饮商家专场——抖音生活服务扫码上翻实战指南", "viewers": 331, "link": "https://lifexue.com/live/list"},
    {"title": "运健商家专场——抖音生活服务扫码上翻实战指南", "viewers": 260, "link": "https://lifexue.com/live/list"},
    {"title": "超市商场烟酒商家专场——抖音生活服务扫码上翻实战指南", "viewers": 274, "link": "https://lifexue.com/live/list"},
    {"title": "丽人商家专场——抖音生活服务扫码上翻实战指南", "viewers": 241, "link": "https://lifexue.com/live/list"},
    {"title": "《破局增长-商家直播入门课》-非餐", "viewers": 1619, "link": "https://lifexue.com/live/list"},
    {"title": "《破局增长-商家直播入门课》-餐", "viewers": 1264, "link": "https://lifexue.com/live/list"},
    {"title": "流量破局 商家特训课", "viewers": 2821, "link": "https://lifexue.com/live/list"},
    {"title": "【S级】【辞旧迎新 冲锋贺岁】 0213BIGDAY政策宣贯", "viewers": 600, "link": "https://lifexue.com/live/list"},
    {"title": "春节不打烊·酒旅商家专场——扫码上翻实战指南", "viewers": 721, "link": "https://lifexue.com/live/list"}
]

# 生成专业顾问风格文案
def generate_professional_live_content(course):
    templates = [
        f"🎥【直播推荐】\n{course['title']}\n\n👥 {course['viewers']} 人已观看，高质量课程不容错过！\n\n💡 推荐理由：\n• 专业导师讲解，内容干货满满\n• 实战案例丰富，可直接落地使用\n• 助力商家提升运营能力\n\n点击链接马上学习！\n\n#抖音生活服务 #直播学习 #商家成长\n\n🔗 观看链接：{course['link']}",
        f"📺【精品直播课】\n{course['title']}\n\n👀 {course['viewers']} 人都在看的好课！\n\n✨ 课程亮点：\n• 系统梳理运营知识体系\n• 提供实用工具和方法论\n• 帮助商家快速突破瓶颈\n\n不要错过学习机会！\n\n#抖音生活服务 #精品课程 #能力提升\n\n🔗 学习链接：{course['link']}",
        f"💼【商家必看】\n{course['title']}\n\n🔥 {course['viewers']} 人学习的热门课程！\n\n📊 课程价值：\n• 紧跟平台最新政策和玩法\n• 掌握高效运营的核心技巧\n• 助力店铺业绩持续增长\n\n点击开始学习吧！\n\n#抖音生活服务 #商家运营 #业绩增长\n\n🔗 课程链接：{course['link']}"
    ]
    return random.choice(templates)

# 生成亲切伙伴风格文案
def generate_friendly_live_content(course):
    templates = [
        f"🎬【好课推荐！】\n{course['title']}\n\n有 {course['viewers']} 个小伙伴已经看过啦！\n\n真的很不错哦～\n✨ 内容很实用，听完就会有收获！\n✨ 讲解很清晰，新手也能轻松懂！\n✨ 方法很落地，直接就能用上！\n\n推荐给大家，一起学习进步！💪\n\n#抖音生活服务 #好课分享 #一起学习\n\n🔗 学习链接：{course['link']}",
        f"🎉【发现好课啦！】\n{course['title']}\n\n{course['viewers']} 人都在学的好课！\n\n来和大家分享一下～\n😊 课程内容很接地气！\n😊 学完就能用得上！\n😊 帮助我们把生意做得更好！\n\n快来一起学习吧！🌟\n\n#抖音生活服务 #学习成长 #干货分享\n\n🔗 观看链接：{course['link']}",
        f"✨【今日推荐好课！】\n{course['title']}\n\n{course['viewers']} 人正在学习中～\n\n真的很实用哦！\n• 都是实实在在的干货！\n• 老师讲得特别清楚！\n• 看完就能动手实践！\n\n分享给大家，不要错过呀～🥰\n\n#抖音生活服务 #好课推荐 #实用干货\n\n🔗 课程链接：{course['link']}"
    ]
    return random.choice(templates)

# 生成所有直播课程文案
professional_live_contents = []
friendly_live_contents = []

for course in live_courses:
    professional_live_contents.append(generate_professional_live_content(course))
    friendly_live_contents.append(generate_friendly_live_content(course))

# 保存结果
result = {
    "professional": professional_live_contents,
    "friendly": friendly_live_contents
}

with open("live_courses_result.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"✅ 成功生成 {len(live_courses)} 条直播课程文案！")
print(f"   - 专业顾问风格：{len(professional_live_contents)} 条")
print(f"   - 亲切伙伴风格：{len(friendly_live_contents)} 条")
print(f"   - 已保存到 live_courses_result.json")
