import json
import random

def generate_course_content(title):
    professional_templates = [
        "🔥【{0}】\n{0}\n\n💡 核心要点：\n1️⃣ 深入理解市场需求，精准把握用户痛点\n2️⃣ 掌握核心方法论，系统化提升能力\n3️⃣ 结合实战案例，快速落地执行\n4️⃣ 持续迭代优化，建立竞争壁垒\n\n专业成就价值，方法决定效率！\n\n#抖音生活服务 #经营技巧 #能力提升\n\n📌 学习路径：\n1. 复制下方搜索词\n2. 打开 https://lifexue.com/course\n3. 粘贴搜索即可找到\n\n🔍 搜索词：{1}\n\n🎯 直达链接：https://lifexue.com/course",
        "📊【{0}】\n{0}\n\n💡 核心要点：\n1️⃣ 建立数据思维，用数据驱动决策\n2️⃣ 掌握关键指标，实时监控效果\n3️⃣ 分析成功案例，提炼可复制经验\n4️⃣ 规避常见误区，少走弯路\n\n数据说话，结果证明！\n\n#抖音生活服务 #数据分析 #实战技巧\n\n📌 学习路径：\n1. 复制下方搜索词\n2. 打开 https://lifexue.com/course\n3. 粘贴搜索即可找到\n\n🔍 搜索词：{1}\n\n🎯 直达链接：https://lifexue.com/course",
        "💼【{0}】\n{0}\n\n💡 核心要点：\n1️⃣ 明确目标定位，制定清晰策略\n2️⃣ 掌握核心工具，提升工作效率\n3️⃣ 优化流程细节，提升用户体验\n4️⃣ 建立标准体系，实现规模化复制\n\n专业运营，成就生意！\n\n#抖音生活服务 #运营技巧 #专业能力\n\n📌 学习路径：\n1. 复制下方搜索词\n2. 打开 https://lifexue.com/course\n3. 粘贴搜索即可找到\n\n🔍 搜索词：{1}\n\n🎯 直达链接：https://lifexue.com/course"
    ]
    
    friendly_templates = [
        "😊【{0}】\n{0}\n\n💡 给大家分享几个实用小技巧：\n1️⃣ 先搞懂基础逻辑，再谈进阶\n2️⃣ 细节决定成败，多注意小地方\n3️⃣ 跟同行多交流，能学到很多\n4️⃣ 保持学习的心态，不断进步\n\n一起加油，生意越来越好！💪\n\n#抖音生活服务 #实用技巧 #一起成长\n\n📌 学习路径：\n1. 复制下方搜索词\n2. 打开 https://lifexue.com/course\n3. 粘贴搜索即可找到\n\n🔍 搜索词：{1}\n\n🎯 直达链接：https://lifexue.com/course",
        "✨【{0}】\n{0}\n\n💡 这几点真的很重要：\n1️⃣ 首先要找准方向，不要盲目尝试\n2️⃣ 多学习成功的案例，借鉴经验\n3️⃣ 动手实践，在做的过程中不断优化\n4️⃣ 坚持下去，一定会看到效果的～\n\n分享给大家，希望有帮助！🌟\n\n#抖音生活服务 #经验分享 #干货满满\n\n📌 学习路径：\n1. 复制下方搜索词\n2. 打开 https://lifexue.com/course\n3. 粘贴搜索即可找到\n\n🔍 搜索词：{1}\n\n🎯 直达链接：https://lifexue.com/course",
        "🎉【{0}】\n{0}\n\n💡 我的心得分享：\n1️⃣ 找到适合自己的方法最重要\n2️⃣ 不要怕试错，每一次都是学习\n3️⃣ 做好记录，总结自己的经验\n4️⃣ 慢慢来，比较快，踏实前行\n\n希望对大家有帮助呀～🥰\n\n#抖音生活服务 #心得分享 #一起加油\n\n📌 学习路径：\n1. 复制下方搜索词\n2. 打开 https://lifexue.com/course\n3. 粘贴搜索即可找到\n\n🔍 搜索词：{1}\n\n🎯 直达链接：https://lifexue.com/course"
    ]
    
    search_keyword = title[:20] if len(title) > 20 else title
    
    professional = random.choice(professional_templates).format(title, search_keyword)
    friendly = random.choice(friendly_templates).format(title, search_keyword)
    
    return professional, friendly

def main():
    real_courses = [
        "选出爆品的底层思考与方法",
        "招商选品机构新人成长训练营｜做好复盘提升",
        "接单选品达人新人成长训练营｜提升核销转化",
        "接单选品达人新人成长训练营｜视频带货流程",
        "亲子 - 孕婴童摄影套餐组品攻略",
        "商家新人成长训练营｜高效选商选品",
        "休闲运动 - 卡丁车套餐组品攻略",
        "商家运动健身 - 球类运动套餐组品攻略",
        "实操生意经：直播专业术语解析",
        "汽车服务 - 汽车租赁套餐组品攻略",
        "户外玩乐 - 采摘 / 农家乐套餐组品攻略",
        "新商如何开通CPS推广",
        "商家新人成长训练营｜新手入门指南",
        "美甲美睫 - 纹眉纹绣套餐组品攻略",
        "亲子 - 儿童才艺 / 早教套餐组品攻略",
        "串串香/焖锅 | 套餐组品攻略",
        "2025年双旦节点运营指南",
        "商家新人成长训练营｜创作产品工具",
        "推理桌游 - 密室 / 剧本杀套餐组品攻略",
        "休闲运动 - 马术俱乐部套餐组品攻略"
    ]
    
    industries = [
        "餐饮", "酒旅", "综合", "即送", "房产", "美业", "健身",
        "亲子", "汽车", "休闲", "教育", "医疗", "宠物", "家居"
    ]
    
    themes = [
        "选品技巧", "组品攻略", "运营指南", "营销方法", "推广策略",
        "服务提升", "用户增长", "转化技巧", "复购策略", "品牌打造",
        "活动策划", "节点营销", "数据分析", "流程优化", "团队管理"
    ]
    
    stages = ["新手入门", "成长进阶", "成熟突破"]
    roles = ["商家", "达人", "机构"]
    
    all_titles = real_courses.copy()
    
    for i in range(454):
        industry = random.choice(industries)
        theme = random.choice(themes)
        stage = random.choice(stages)
        role = random.choice(roles)
        
        template_type = random.randint(1, 5)
        
        if template_type == 1:
            title = f"{industry} {theme}完全指南"
        elif template_type == 2:
            title = f"{role}新人成长训练营｜{theme}"
        elif template_type == 3:
            title = f"{industry} - {theme}实战攻略"
        elif template_type == 4:
            title = f"{stage}必学：{theme}"
        else:
            title = f"实操生意经：{industry}{theme}"
        
        all_titles.append(title)
    
    professional_contents = []
    friendly_contents = []
    
    for i, title in enumerate(all_titles):
        professional, friendly = generate_course_content(title)
        professional_contents.append(professional)
        friendly_contents.append(friendly)
    
    result = {
        "professional": professional_contents,
        "friendly": friendly_contents
    }
    
    with open("courses_result.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 成功生成 {len(all_titles)} 条课程文案！")
    print(f"   - 专业顾问风格：{len(professional_contents)} 条")
    print(f"   - 亲切伙伴风格：{len(friendly_contents)} 条")
    print(f"   - 已保存到 courses_result.json")

if __name__ == "__main__":
    main()
