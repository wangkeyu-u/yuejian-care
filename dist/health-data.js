/*
 * Moon & Me health knowledge cards.
 * Public-facing educational copy, checked against the linked NHS, ACOG, WHO,
 * and NIMH pages. This file has no diagnosis or treatment engine.
 */
(function attachMoonHealth(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MoonHealthArticles = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeHealthArticles() {
  return [
    {
      id: 'health-cycle-day-one', category: '周期常识', title: '周期第 1 天怎么算？',
      summary: '真正开始出血的第一天，记作这一次周期的第 1 天。',
      body: ['月经周期是从一次月经开始出血的第一天，算到下一次月经开始出血的前一天。周期长度因人而异，常见范围大约是 21–35 天；“28 天”只是参考，不是必须达成的标准。', '网站会把你填写的真实开始日与参考周期分开保存。它可以帮你安排和回看，但不会检测排卵、怀孕或把预计日期自动变成真实月经。'],
      tags: ['周期第1天', '月经周期', '28天'], sources: [{ title: 'NHS · Irregular periods', url: 'https://www.nhs.uk/symptoms/irregular-periods/' }, { title: 'WHO · Menstrual health', url: 'https://www.who.int/news-room/fact-sheets/detail/menstrual-health' }]
    },
    {
      id: 'health-bleeding-days', category: '周期常识', title: '出血几天算常见？',
      summary: '很多人的经期约 2–7 天，长短和流量可能每个月不同。',
      body: ['经期常见持续 2–7 天，平均约 5 天，但每个人的基线不同。前几天可能较多，之后逐渐减少；一次变化不一定代表有问题，连续记录更有帮助。', '如果经期持续超过 7 天、突然比平时长很多，或出血变化已经影响工作、学习和生活，可以把日期、流量和伴随症状带给妇科医生。'],
      tags: ['经期几天', '出血持续', '记录'], sources: [{ title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }]
    },
    {
      id: 'health-first-day', category: '身体照护', title: '经期第一天可以怎么安排？',
      summary: '按疼痛、精力和必须完成的事做一个可调整的版本。',
      body: ['第一天不必自动停掉所有活动，也不必强迫自己照常高强度工作。可以先记下疼痛、精力和情绪，再把安排拆成一件必须做的事、一件可选的小事和一段留白。', '温水淋浴、隔布温热敷、轻柔拉伸或散步都可以作为尝试；如果某项让你更不舒服，就停下。照护建议应该跟着你的身体反应调整。'],
      tags: ['经期第一天', '安排', '休息'], sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }, { title: 'ACOG · Dysmenorrhea', url: 'https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods' }]
    },
    {
      id: 'health-cramps', category: '身体照护', title: '为什么会痛经？',
      summary: '子宫收缩和前列腺素参与常见痛经，但严重或变重的疼痛需要评估。',
      body: ['月经来潮时，子宫收缩帮助排出内膜，相关的前列腺素会让人感到下腹或腰背部痉挛。恶心、头痛、腹泻和头晕也可能伴随疼痛出现。', '如果疼痛一年比一年重、止痛处理无效，或已经让你无法上班、上学、睡觉和完成日常活动，不要只把它归为“忍一忍就好”，可以预约妇科评估。'],
      tags: ['痛经', '腹痛', '前列腺素'], sources: [{ title: 'ACOG · Painful periods', url: 'https://www.acog.org/womens-health/faqs/painful-periods' }, { title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }]
    },
    {
      id: 'health-heat-bath', category: '身体照护', title: '热敷和洗澡有用吗？',
      summary: '温热可能让一部分人的痉挛更舒服，注意温度和皮肤安全。',
      body: ['热水澡、温水淋浴、热水袋或加热垫可以作为缓解痛经的自我照护选项。热水袋或加热垫应隔着衣物或毛巾使用，温度以舒服为准，不要直接贴皮肤睡着。', '它们是“可以试试”的方法，不是所有人都有效。如果疼痛持续加重或影响日常生活，温热不能替代医疗评估。'],
      tags: ['热敷', '洗澡', '痛经缓解'], sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }, { title: 'ACOG · Painful periods', url: 'https://www.acog.org/womens-health/faqs/painful-periods' }]
    },
    {
      id: 'health-movement-swim', category: '饮食活动', title: '经期能运动或游泳吗？',
      summary: '身体允许时，轻到中等强度活动可能有帮助；不舒服就降低强度或休息。',
      body: ['散步、瑜伽、骑车、游泳等温和活动可能缓解部分人的疼痛和紧绷感。经期没有统一的“禁止运动”清单，活动量应看当日疼痛、出血、头晕和精力。', '如果活动让你头晕、气短、疼痛明显加重或出血异常增多，就停止并休息。游泳时选择自己熟悉、合适的经期用品，按照产品说明使用。'],
      tags: ['经期运动', '游泳', '瑜伽'], sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }, { title: 'ACOG · Dysmenorrhea', url: 'https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods' }]
    },
    {
      id: 'health-cold-drinks', category: '饮食活动', title: '冷饮、红糖水和“忌口”怎么理解？',
      summary: '冷饮不是每个人都必须禁止；先观察个人体验，饮食保持均衡。',
      body: ['常见的经期照护指南会谈到均衡饮食、睡眠、运动和减压，但没有把冷饮列为所有人的普遍禁忌；这句话是对指南覆盖范围的编辑归纳，不是证明冷饮绝对不会影响任何人。如果你喝冷饮后确实更不舒服，可以按个人体验减少。', '红糖水或某一种食物也不能替代诊断和治疗。优先保证规律进食、足够水分和自己能接受的均衡饮食；新的补充剂或“调经”产品先问医生或药师。'],
      tags: ['冷饮', '红糖水', '经期饮食'], sources: [{ title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }, { title: 'ACOG · PMS', url: 'https://www.acog.org/womens-health/faqs/Premenstrual-Syndrome' }]
    },
    {
      id: 'health-caffeine', category: '饮食活动', title: '咖啡因和酒精需要完全戒掉吗？',
      summary: '是否减少取决于你的症状和摄入量，PMS明显时可观察减少后的变化。',
      body: ['咖啡、浓茶、能量饮料和酒精可能让部分人的睡眠、焦虑、乳房胀痛或情绪波动更明显。可以记录摄入时间和症状，再尝试逐步减少，而不是突然用极端禁令要求自己。', '如果你已经在服药、怀孕可能性存在，或对咖啡因很敏感，具体摄入量可以咨询医生或药师。网站不会根据周期自动给出统一的饮品禁令。'],
      tags: ['咖啡因', '酒精', 'PMS饮食'], sources: [{ title: 'ACOG · PMS', url: 'https://www.acog.org/womens-health/faqs/Premenstrual-Syndrome' }, { title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }]
    },
    {
      id: 'health-sleep', category: '情绪睡眠', title: '经期睡不好怎么办？',
      summary: '稳定作息、舒适的温度和减少刺激可以作为简单尝试。',
      body: ['疼痛、焦虑、乳房胀痛和温度变化都可能影响睡眠。可以把睡前流程做得简单：固定起床时间，提前准备好用品，按感觉热敷或淋浴，睡前减少影响自己的咖啡因和屏幕刺激。', '一两晚睡不好不等于身体出了大问题。如果睡眠困难持续、白天明显受影响，或伴随严重情绪低落和焦虑，记录下来并寻求专业支持。'],
      tags: ['经期睡眠', '失眠', '作息'], sources: [{ title: 'ACOG · PMS', url: 'https://www.acog.org/womens-health/faqs/Premenstrual-Syndrome' }, { title: 'ACOG · Painful periods', url: 'https://www.acog.org/womens-health/faqs/painful-periods' }]
    },
    {
      id: 'health-pms', category: '情绪睡眠', title: 'PMS 是什么？',
      summary: '经前反复出现的身体和情绪变化，是否影响生活是重要线索。',
      body: ['PMS 可能包括腹胀、乳房胀痛、头痛、疲劳、食欲变化、易怒、焦虑、睡眠和注意力变化。症状通常出现在月经前，月经开始后缓解；每个人的组合和程度不一样。', '网站可以帮你记录每天的感受，但不能根据几次选择自动诊断 PMS。至少记录两个周期，连同月经日期和对生活的影响一起带给医生，会比只记“心情不好”更有帮助。'],
      tags: ['PMS', '经前综合征', '症状记录'], sources: [{ title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }, { title: 'ACOG · PMS', url: 'https://www.acog.org/womens-health/faqs/Premenstrual-Syndrome' }]
    },
    {
      id: 'health-pmdd', category: '情绪睡眠', title: 'PMDD 和普通经前波动有什么区别？',
      summary: 'PMDD 是需要专业评估的严重经前症状模式，不能靠网页自测确诊。',
      body: ['PMDD 的情绪和身体症状更强烈，可能明显影响工作、关系和日常生活。关键不是某一个症状，而是症状是否在多个周期呈现清楚的时间模式，并在月经后缓解。', '如果你怀疑 PMDD，可以连续记录至少两个周期，预约妇科或心理健康专业人员评估。若出现自伤或轻生想法，请立即联系当地急救、危机热线或可信任的人，不要独自等待周期过去。'],
      tags: ['PMDD', '情绪', '周期记录'], sources: [{ title: 'NHS · PMDD', url: 'https://www.nhs.uk/conditions/pmdd-premenstrual-dysphoric-disorder/' }]
    },
    {
      id: 'health-anxiety-cycle', category: '情绪睡眠', title: '焦虑和经期有关系吗？',
      summary: '焦虑可能随周期变化，也可能整个月存在；不要只用经期解释严重焦虑。',
      body: ['有些人会在月经前或月经中感到更焦虑、易怒或低落，但这些感受也可能来自睡眠、压力、关系和原有的焦虑障碍。记录“什么时候出现、持续多久、影响了什么”，比给自己贴标签更有用。', '如果焦虑已经影响睡眠、学习、工作或关系，可以联系心理咨询师、精神科或全科医生。这个网站只能帮助记录和做可选的放松练习，不能替代诊断、治疗或危机支持。'],
      tags: ['经期焦虑', '焦虑记录', '心理支持'], sources: [{ title: 'NIMH · Anxiety disorders', url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders' }, { title: 'WHO · Menstrual health', url: 'https://www.who.int/news-room/fact-sheets/detail/menstrual-health' }]
    },
    {
      id: 'health-products', category: '用品卫生', title: '卫生巾、卫生棉条、月经杯怎么选？',
      summary: '多种产品都可以使用，选择舒适、能按说明更换和清洁的那一种。',
      body: ['卫生巾、卫生棉条、月经杯和经期内裤各有使用方式。没有一种产品适合所有人，可以根据流量、活动、预算、皮肤感受和接受程度选择；第一次尝试时给自己留出熟悉的时间。', '产品包装上的使用说明优先。使用前后洗手，留意是否漏液、疼痛、刺激或异味；如果某种产品让你明显不舒服，可以换回熟悉的方式并咨询专业人员。'],
      tags: ['卫生用品', '卫生巾', '月经杯', '卫生棉条'], sources: [{ title: 'NHS · Periods', url: 'https://www.nhs.uk/conditions/periods/' }, { title: 'WHO · Menstrual health', url: 'https://www.who.int/news-room/fact-sheets/detail/menstrual-health' }]
    },
    {
      id: 'health-tampon-cup', category: '用品卫生', title: '卫生棉条和月经杯要注意什么？',
      summary: '洗手并按说明定期更换或清洁，不要为了省事超时使用。',
      body: ['使用卫生棉条或月经杯前后洗手，并遵循包装说明的更换、清洁和储存要求。不要超过产品建议的最长使用时间；流量多时可能需要更早更换或倒空。', '如果使用时出现发热、寒战、呕吐、腹泻、头晕、皮疹或明显不适，应取出棉条/杯并尽快获得医疗帮助。中毒性休克综合征很罕见，但需要认真对待。'],
      tags: ['卫生棉条', '月经杯', 'TSS', '更换'], sources: [{ title: 'NHS · Toxic shock syndrome', url: 'https://www.nhs.uk/conditions/toxic-shock-syndrome/' }, { title: 'NHS · Periods', url: 'https://www.nhs.uk/conditions/periods/' }]
    },
    {
      id: 'health-vulva-cleaning', category: '用品卫生', title: '经期怎么清洁？',
      summary: '清洁外阴、勤换用品即可，不需要冲洗阴道或使用香味产品。',
      body: ['经期可以按平时习惯清洁外阴，保持干爽，使用干净的手和用品。阴道有自我清洁能力，不需要把水、洗液或香味产品冲进阴道；过度清洁可能造成刺激。', '如果出现持续瘙痒、灼痛、异常异味、异常分泌物或排尿疼痛，先暂停刺激性产品并预约医生。清洁不能代替对感染或皮肤问题的诊断。'],
      tags: ['经期清洁', '外阴', '卫生'], sources: [{ title: 'NHS Devon Sexual Health · Genital hygiene', url: 'https://www.devonsexualhealth.nhs.uk/your-sexual-health/genital-hygiene/' }]
    },
    {
      id: 'health-contraception', category: '周期常识', title: '月经预测能当避孕方法吗？',
      summary: '不能。参考周期只是在日期上做估算，不等于排卵检测或避孕保护。',
      body: ['即使周期看起来规律，排卵时间也可能因为压力、疾病、睡眠、体重变化、药物或其他原因改变。只用“第几天”推算安全期，不能可靠地避免怀孕，也不能预防性传播感染。', '如果不想怀孕，选择适合自己的避孕方式并正确使用；如果发生无保护性行为、避孕失败或月经明显推迟，可以咨询药师或医生并按需要做妊娠检测。'],
      tags: ['周期预测', '避孕', '排卵'], sources: [{ title: 'NHS · Natural family planning', url: 'https://www.nhs.uk/contraception/methods-of-contraception/natural-family-planning/' }]
    },
    {
      id: 'health-heavy-flow', category: '就医判断', title: '怎样算出血量偏多？',
      summary: '需要频繁更换、影响生活或反复漏出的情况值得记录并咨询。',
      body: ['如果需要每 1–2 小时更换一次卫生巾或棉条、需要同时使用两种用品、经常夜间漏出，或月经量已经影响日常生活，这些都可以作为“流量偏多”的线索。不要只凭别人说的“正常”。', '记录每天使用的用品、是否漏出、血块、头晕和疲劳，预约医生评估。长期大量出血可能带来缺铁性贫血，也可能和子宫、凝血或激素相关问题有关。'],
      tags: ['月经过多', '经量', '漏血', '贫血'], sources: [{ title: 'NHS · Heavy periods', url: 'https://www.nhs.uk/conditions/heavy-periods/' }, { title: 'WHO · Menstrual health', url: 'https://www.who.int/news-room/fact-sheets/detail/menstrual-health' }]
    },
    {
      id: 'health-irregular', category: '就医判断', title: '周期变得不规律怎么办？',
      summary: '一次提前或推迟不一定严重，但反复变化要找原因。',
      body: ['压力、焦虑、体重明显变化、运动量变化、激素避孕、怀孕、甲状腺问题和多囊卵巢综合征等都可能影响周期。网站的预测会显示“尚未记录”或“已过预计日”，不会把变化掩盖成整齐的 28 天。', '如果周期经常少于 21 天或超过 35 天、经期超过 7 天、两次月经之间出血，或月经突然停止，请把记录带给医生。'],
      tags: ['月经不规律', '周期推迟', '周期提前'], sources: [{ title: 'NHS · Irregular periods', url: 'https://www.nhs.uk/symptoms/irregular-periods/' }, { title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }]
    },
    {
      id: 'health-urgent-pain', category: '就医判断', title: '哪些疼痛信号不能只靠忍？',
      summary: '严重、加重、异常位置或影响日常的疼痛，应获得医疗评估。',
      body: ['如果疼痛严重或比平时明显加重，常规自我照护没有帮助，或者已经影响走路、工作、学习、睡眠和日常生活，应联系医生或当地急诊服务。经期疼痛不是“必须忍耐”的证明。', '性交、排尿或排便时疼痛，非经期也疼，伴随发热、晕厥、异常出血或怀孕可能性，也应尽快咨询。医生会根据病史和检查判断是否需要进一步检查。'],
      tags: ['严重痛经', '盆腔痛', '就医'], sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }, { title: 'ACOG · Painful periods', url: 'https://www.acog.org/womens-health/faqs/painful-periods' }]
    },
    {
      id: 'health-abnormal-bleeding', category: '就医判断', title: '经期之外出血要管吗？',
      summary: '经间出血、性交后出血或绝经后出血值得咨询医生。',
      body: ['两次月经之间出血、性交后出血，或原本规律的周期突然改变，都应该记录日期、出血量、疼痛和是否可能怀孕，再和医生讨论。原因可能很多，不能仅凭颜色或一个月的记录判断。', '如果出血量很大，伴随明显头晕、虚弱、剧烈腹痛或怀孕可能性，不要只等下一次月经；按所在地的急诊或医疗咨询流程获取帮助。'],
      tags: ['经间出血', '异常出血', '性交后出血'], sources: [{ title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }, { title: 'NHS · Pelvic pain', url: 'https://www.nhs.uk/symptoms/pelvic-pain/' }]
    },
    {
      id: 'health-medication', category: '就医判断', title: '止痛药要怎么选？',
      summary: '药物要结合禁忌、既往病史和正在使用的药物，不按网页自行加量。',
      body: ['对部分人而言，医生或药师建议的止痛药可以缓解痛经；不同药物对胃、肾、肝、哮喘、出血风险和其他药物的影响不同。包装说明和专业人员建议优先，不要因为“经期”就自动增加剂量或混用。', '如果你有慢性病、正在备孕或怀孕可能性、过敏史，或之前吃药没有效果，先问医生或药师。网站只提供记录，不开药方，也不记录用药剂量。'],
      tags: ['痛经用药', '止痛药', '药师'], sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }, { title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }]
    },
    {
      id: 'health-help-now', category: '就医判断', title: '什么时候需要马上求助？',
      summary: '严重身体症状或心理危机都值得立即获得当地专业帮助。',
      body: ['高热、晕厥、意识混乱、持续呕吐腹泻、突然剧烈腹痛、大量出血或怀孕可能性下的疼痛出血，都不适合只靠网站观察。联系当地急救或急诊服务，并说明症状、经期和可能使用的用品。', '如果出现自伤或轻生想法，立刻联系当地危机热线、急救服务或可信任的人，尽量不要独处。网站的落地练习只帮助把注意力放回眼前，不要求控制呼吸，也不能替代危机干预。'],
      tags: ['急症', '危机求助', '自伤想法'], sources: [{ title: 'NHS · Toxic shock syndrome', url: 'https://www.nhs.uk/conditions/toxic-shock-syndrome/' }, { title: 'NHS · PMDD', url: 'https://www.nhs.uk/conditions/pmdd-premenstrual-dysphoric-disorder/' }]
    }
  ];
});
