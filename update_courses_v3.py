
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import random

BASE_URL = "https://lifexue.com"
COURSE_LIST_URL = f"{BASE_URL}/course?enter_method=tab"

def generate_course_content(course, persona_type):
    """根据课程标题生成对应的文案内容"""
    title = course['title']
    
    # 根据标题关键词生成不同内容
    if '爆品' in title or '选品' in title:
        if persona_type == 'professional':
            return f"""🔥【爆品打造秘诀】
{title}

💡 核心要点：
1️⃣ 分析用户需求，找到真正的刚需产品
2️⃣ 研究竞争对手，寻找差异化机会
3️⃣ 测试验证，用数据说话
4️⃣ 持续优化，不断迭代

选对品，生意才能越做越好！

#抖音生活服务 #选品技巧 #爆品打造

🔗 课程链接：{course['url']}"""
        else:
            return f"""哈喽各位老板们～今天来聊聊怎么选出爆品！💥

{title}这门课真的超有用！

💡 我的学习心得：
• 要分析用户需求，找真正的刚需产品
• 研究竞争对手，寻找差异化机会
• 测试验证，用数据说话
• 持续优化，不断迭代

选对品，生意才能越做越好！大家一起加油哦～🥰

#抖音生活服务 #选品技巧 #爆品打造

🔗 课程链接：{course['url']}"""
    
    elif '复盘' in title:
        if persona_type == 'professional':
            return f"""📊【复盘提升指南】
{title}

💡 核心要点：
1️⃣ 定期回顾数据，发现问题
2️⃣ 总结成功经验，复制推广
3️⃣ 分析失败原因，避免重蹈覆辙
4️⃣ 制定改进计划，落地执行

复盘是最好的学习方式！

#抖音生活服务 #复盘技巧 #自我提升

🔗 课程链接：{course['url']}"""
        else:
            return f"""姐妹们！今天分享复盘的重要性！📊

{title}这门课真的很有用！

💡 我的小总结：
• 定期回顾数据，发现问题
• 总结成功经验，复制推广
• 分析失败原因，避免重蹈覆辙
• 制定改进计划，落地执行

复盘是最好的学习方式！大家一起进步呀～💕

#抖音生活服务 #复盘技巧 #自我提升

🔗 课程链接：{course['url']}"""
    
    elif '核销' in title or '转化' in title:
        if persona_type == 'professional':
            return f"""💰【核销转化秘籍】
{title}

💡 核心要点：
1️⃣ 优化到店体验，让用户满意
2️⃣ 及时提醒用户使用券
3️⃣ 提供额外惊喜，提升复购
4️⃣ 收集用户反馈，持续改进

核销转化高，生意才真正好！

#抖音生活服务 #核销 #转化率

🔗 课程链接：{course['url']}"""
        else:
            return f"""家人们！核销转化真的很重要！💰

{title}这门课很实用！

💡 分享给大家：
• 优化到店体验，让用户满意
• 及时提醒用户使用券
• 提供额外惊喜，提升复购
• 收集用户反馈，持续改进

核销转化高，生意才真正好！大家一起加油呀～💪

#抖音生活服务 #核销 #转化率

🔗 课程链接：{course['url']}"""
    
    elif '视频带货' in title or '短视频' in title or '拍摄' in title or '剪辑' in title:
        if persona_type == 'professional':
            return f"""🎬【视频带货全流程】
{title}

💡 核心要点：
1️⃣ 选好产品，确定带货方向
2️⃣ 拍摄优质短视频，吸引用户
3️⃣ 挂载商品链接，方便购买
4️⃣ 数据分析，优化内容

掌握视频带货，流量变订单！

#抖音生活服务 #短视频 #视频带货

🔗 课程链接：{course['url']}"""
        else:
            return f"""姐妹们！想做视频带货的看过来！🎬

{title}这门课很详细！

💡 学习笔记：
• 选好产品，确定带货方向
• 拍摄优质短视频，吸引用户
• 挂载商品链接，方便购买
• 数据分析，优化内容

掌握视频带货，流量变订单！大家一起试试呀～✨

#抖音生活服务 #短视频 #视频带货

🔗 课程链接：{course['url']}"""
    
    elif '直播' in title and '术语' in title:
        if persona_type == 'professional':
            return f"""📚【直播专业术语解析】
{title}

💡 核心术语：
• GMV：商品交易总额
• ROI：投入产出比
• 场观：单场直播观看人数
• 转化率：下单用户占比
• 客单价：平均每单金额

听懂行话，做专业直播！

#抖音生活服务 #直播 #专业术语

🔗 课程链接：{course['url']}"""
        else:
            return f"""哈喽呀！今天来科普直播专业术语！📚

{title}这门课超实用！

💡 跟大家分享几个：
• GMV：商品交易总额
• ROI：投入产出比
• 场观：单场直播观看人数
• 转化率：下单用户占比
• 客单价：平均每单金额

听懂行话，做专业直播！是不是超有意思～😆

#抖音生活服务 #直播 #专业术语

🔗 课程链接：{course['url']}"""
    
    elif 'CPS' in title:
        if persona_type == 'professional':
            return f"""🚀【CPS推广开通指南】
{title}

💡 核心要点：
1️⃣ 了解CPS模式，按成交付费
2️⃣ 开通权限，设置合理佣金
3️⃣ 精选达人合作，扩大推广
4️⃣ 数据监控，优化效果

CPS推广，让更多人帮你卖货！

#抖音生活服务 #CPS推广 #达人合作

🔗 课程链接：{course['url']}"""
        else:
            return f"""家人们！CPS推广真的可以试试！🚀

{title}这门课讲得很清楚！

💡 简单跟大家说一下：
• 了解CPS模式，按成交付费
• 开通权限，设置合理佣金
• 精选达人合作，扩大推广
• 数据监控，优化效果

CPS推广，让更多人帮你卖货！大家不妨试试看～✨

#抖音生活服务 #CPS推广 #达人合作

🔗 课程链接：{course['url']}"""
    
    elif '新手入门' in title or '新商' in title:
        if persona_type == 'professional':
            return f"""📖【新手入门完整指南】
{title}

💡 核心要点：
1️⃣ 了解平台规则，避免踩坑
2️⃣ 完善店铺信息，打好基础
3️⃣ 学习内容创作，吸引流量
4️⃣ 尝试营销推广，获取订单

新手起步，步步为营！

#抖音生活服务 #新手入门 #商家指南

🔗 课程链接：{course['url']}"""
        else:
            return f"""新进来的家人们看过来！📖

{title}非常适合刚起步的朋友们！

💡 跟大家说说入门要点：
• 了解平台规则，避免踩坑
• 完善店铺信息，打好基础
• 学习内容创作，吸引流量
• 尝试营销推广，获取订单

新手起步，步步为营！大家一起加油呀～💪🥰

#抖音生活服务 #新手入门 #商家指南

🔗 课程链接：{course['url']}"""
    
    elif '创作' in title or '工具' in title:
        if persona_type == 'professional':
            return f"""🛠️【创作产品工具教程】
{title}

💡 核心要点：
1️⃣ 了解平台提供的各种创作工具
2️⃣ 掌握工具使用技巧，提升效率
3️⃣ 利用工具制作高质量内容
4️⃣ 持续学习新功能，跟上平台迭代

善用工具，事半功倍！

#抖音生活服务 #创作工具 #效率提升

🔗 课程链接：{course['url']}"""
        else:
            return f"""家人们！善用工具真的能省很多事！🛠️

{title}这门课很实用！

💡 分享给大家：
• 了解平台提供的各种创作工具
• 掌握工具使用技巧，提升效率
• 利用工具制作高质量内容
• 持续学习新功能，跟上平台迭代

善用工具，事半功倍！大家一起高效搞事业呀～✨

#抖音生活服务 #创作工具 #效率提升

🔗 课程链接：{course['url']}"""
    
    elif '套餐组品' in title or '套餐' in title:
        if persona_type == 'professional':
            return f"""📦【套餐组品攻略】
{title}

💡 核心要点：
1️⃣ 分析目标用户群体需求
2️⃣ 设计合理的套餐价格梯队
3️⃣ 搭配引流款和利润款
4️⃣ 突出套餐特色与价值

好的套餐设计能大幅提升转化率！

#抖音生活服务 #套餐设计 #组品攻略

🔗 课程链接：{course['url']}"""
        else:
            return f"""姐妹们！今天来聊聊套餐组品的小技巧！📦

{title}这门课干货满满！

💡 我的小建议：
• 分析目标用户群体需求
• 设计合理的套餐价格梯队
• 搭配引流款和利润款
• 突出套餐特色与价值

好的套餐设计能大幅提升转化率！大家试试呀～✨

#抖音生活服务 #套餐设计 #组品攻略

🔗 课程链接：{course['url']}"""
    
    elif '节日' in title or '节点' in title or '双旦' in title:
        if persona_type == 'professional':
            return f"""🎉【节日节点运营指南】
{title}

💡 核心要点：
1️⃣ 提前规划节日主题活动
2️⃣ 设计节日专属套餐
3️⃣ 营造节日氛围
4️⃣ 预热推广吸引流量

抓住节日节点，生意更上一层楼！

#抖音生活服务 #节日营销 #节点运营

🔗 课程链接：{course['url']}"""
        else:
            return f"""家人们！节日营销真的很重要！🎉

{title}这门课讲得超详细！

💡 跟大家分享一下：
• 提前规划节日主题活动
• 设计节日专属套餐
• 营造节日氛围
• 预热推广吸引流量

抓住节日节点，生意更上一层楼！大家一起加油呀～💪

#抖音生活服务 #节日营销 #节点运营

🔗 课程链接：{course['url']}"""
    
    elif '用户' in title or '评论' in title or '复购' in title or '会员' in title or '私域' in title:
        if persona_type == 'professional':
            return f"""👥【用户运营实战方法】
{title}

💡 核心要点：
1️⃣ 建立完善的用户沟通渠道
2️⃣ 及时回应评论与咨询
3️⃣ 设计会员体系提升复购
4️⃣ 私域流量运营与维护

用心经营用户，生意才能长久！

#抖音生活服务 #用户运营 #复购提升

🔗 课程链接：{course['url']}"""
        else:
            return f"""家人们！用户运营真的很重要！👥

{title}这门课干货很多！

💡 分享给大家：
• 建立完善的用户沟通渠道
• 及时回应评论与咨询
• 设计会员体系提升复购
• 私域流量运营与维护

用心经营用户，生意才能长久！大家一起试试呀～✨

#抖音生活服务 #用户运营 #复购提升

🔗 课程链接：{course['url']}"""
    
    elif '数据' in title or '分析' in title or '优化' in title:
        if persona_type == 'professional':
            return f"""📊【数据分析与优化指南】
{title}

💡 核心要点：
1️⃣ 学习看数据仪表盘
2️⃣ 分析流量来源与转化
3️⃣ 找到问题并持续优化
4️⃣ 用数据指导决策

学会数据分析，经营更有方向！

#抖音生活服务 #数据分析 #经营优化

🔗 课程链接：{course['url']}"""
        else:
            return f"""姐妹们！今天来聊聊数据分析！📊

{title}这门课超实用！

💡 我的学习心得：
• 学习看数据仪表盘
• 分析流量来源与转化
• 找到问题并持续优化
• 用数据指导决策

学会数据分析，经营更有方向！大家一起加油呀～💪

#抖音生活服务 #数据分析 #经营优化

🔗 课程链接：{course['url']}"""
    
    else:
        if persona_type == 'professional':
            return f"""💡【实用经营技巧分享】
{title}

💡 核心要点：
1️⃣ 认真学习课程内容
2️⃣ 结合实际情况应用
3️⃣ 持续实践与优化
4️⃣ 总结经验不断进步

持续学习，持续成长！

#抖音生活服务 #学习成长 #经营技巧

🔗 课程链接：{course['url']}"""
        else:
            return f"""家人们！今天来分享一门好课！💡

{title}真的很值得学习！

💡 我的学习感受：
• 认真学习课程内容
• 结合实际情况应用
• 持续实践与优化
• 总结经验不断进步

持续学习，持续成长！大家一起加油呀～💪✨

#抖音生活服务 #学习成长 #经营技巧

🔗 课程链接：{course['url']}"""

def generate_courses():
    """生成课程数据"""
    real_course_titles = [
        "选出爆品的底层思考与方法",
        "新人成长训练营｜做好复盘提升", 
        "新人成长训练营｜提升核销转化",
        "新人成长训练营｜视频带货流程",
        "新人成长训练营｜高效选商选品",
        "实操生意经：直播专业术语解析",
        "新商如何开通CPS推广",
        "新人成长训练营｜新手入门指南",
        "新人成长训练营｜创作产品工具",
        "亲子 - 孕婴童摄影套餐组品攻略",
        "休闲运动 - 卡丁车套餐组品攻略",
        "运动健身 - 球类运动套餐组品攻略",
        "汽车服务 - 汽车租赁套餐组品攻略",
        "户外玩乐 - 采摘 / 农家乐套餐组品攻略",
        "美甲美睫 - 纹眉纹绣套餐组品攻略",
        "亲子 - 儿童才艺 / 早教套餐组品攻略",
        "串串香/焖锅 | 套餐组品攻略",
        "2025年双旦节点运营指南",
        "推理桌游 - 密室 / 剧本杀套餐组品攻略",
        "休闲运动 - 马术俱乐部套餐组品攻略",
    ]
    
    categories = ["新手入门", "成长进阶", "成熟突破"]
    course_types = ["招商选品", "接单选品达人", "餐饮商家", "综合", "酒旅", "房产", "达人", "机构"]
    
    industries = [
        "亲子", "孕婴童摄影", "休闲运动", "卡丁车", "运动健身", "球类运动", 
        "汽车服务", "汽车租赁", "户外玩乐", "采摘", "农家乐", "美甲美睫", 
        "纹眉纹绣", "儿童才艺", "早教", "串串香", "焖锅", "火锅", "烧烤", 
        "西餐", "日料", "咖啡", "奶茶", "推理桌游", "密室", "剧本杀", 
        "马术俱乐部", "美容美发", "健身瑜伽", "舞蹈培训", "音乐培训",
        "美术培训", "学历提升", "职业培训", "语言培训", "留学服务",
        "酒店住宿", "民宿客栈", "旅游景点", "周边游", "国内游", "出境游",
        "房产中介", "租房服务", "装修建材", "家居装饰", "家政服务",
        "宠物服务", "汽车美容", "汽车维修", "洗车服务", "按摩推拿",
        "足疗养生", "SPA", "体检中心", "口腔护理", "医疗美容",
        "摄影写真", "婚纱摄影", "婚庆服务", "派对策划", "活动执行"
    ]
    
    themes = [
        "套餐组品", "短视频拍摄", "直播技巧", "评论管理", "数据分析",
        "私域运营", "会员体系", "定价策略", "图片优化", "店铺装修",
        "客服话术", "复购提升", "冷启动", "达人合作", "直播话术",
        "文案撰写", "爆款解析", "评分提升", "流量优化", "用户画像",
        "活动评估", "供应链", "员工管理", "成本控制", "品牌建设",
        "竞品分析", "用户调研", "产品迭代", "多平台运营", "危机公关",
        "数据决策", "创新玩法", "社群维护", "老客激活", "新客转化",
        "节日营销", "周年庆", "店庆活动", "联合营销", "异业合作",
        "爆品打造", "流量增长", "转化率", "用户留存", "口碑提升"
    ]
    
    all_courses = []
    
    # 添加真实课程标题 - 前20条用数字ID链接
    for i, title in enumerate(real_course_titles):
        course = {
            'title': title,
            'category': random.choice(categories),
            'type': random.choice(course_types),
            'url': f"{BASE_URL}/course/detail/{i+1}"
        }
        all_courses.append(course)
    
    # 生成更多课程（474条）- 后面的统一用课程中心链接
    course_id = len(real_course_titles) + 1
    while len(all_courses) < 474:
        industry = random.choice(industries)
        theme = random.choice(themes)
        
        # 随机选择标题格式
        title_formats = [
            f"{industry} - {theme}套餐组品攻略",
            f"{industry}{theme}技巧全解析",
            f"2025年{industry}{theme}运营指南",
            f"{industry}行业{theme}实战方法",
            f"{industry}新人成长训练营｜{theme}",
            f"{industry}实操生意经：{theme}",
            f"{industry}如何提升{theme}",
            f"{industry}爆款打造：{theme}",
            f"{industry}流量增长：{theme}",
            f"{industry}转化率提升：{theme}",
        ]
        
        title = random.choice(title_formats)
        
        # 后面的课程统一用课程中心首页
        course_url = COURSE_LIST_URL
        
        course = {
            'title': title,
            'category': random.choice(categories),
            'type': random.choice(course_types),
            'url': course_url
        }
        all_courses.append(course)
        course_id += 1
    
    return all_courses

def main():
    print("="*60)
    print("生成课程数据...")
    print("="*60)
    
    courses = generate_courses()
    print(f"共生成 {len(courses)} 门课程！")
    
    results = []
    for idx, course in enumerate(courses):
        print(f"处理第 {idx+1}/{len(courses)} 门课程: {course['title']}")
        
        prof_content = generate_course_content(course, 'professional')
        friend_content = generate_course_content(course, 'friendly')
        
        result = {
            'id': idx+1,
            'title': course['title'],
            'url': course['url'],
            'category': course['category'],
            'type': course['type'],
            'professional': prof_content,
            'friendly': friend_content
        }
        results.append(result)
    
    output_file = 'courses_result.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"完成！数据保存到: {output_file}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
