(function attachMoonCulture(root, factory) {
  var articles = factory();
  if (root) root.MoonCultureArticles = articles;
  if (typeof module === 'object' && module.exports) module.exports = articles;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMoonCultureArticles() {
  return [
    {
      id: 'culture-birth-snake',
      category: '历法与八字',
      title: '为什么公历年初不能只看年份判生肖？',
      summary: '先确认具体公历日期，再核对春节、立春与所采用的年界。',
      body: [
        '公历年初可能仍处在农历上一年，不能只看公历年份最后一位或年份数字判断生肖。应先核对具体日期，再查看正月初一、立春以及所采用排盘口径对应的年界。',
        '这里是历法换算，不是人格证明。临近年界的日期要写清采用哪套规则，并核对时区与地点；生肖不会决定性格、健康或经期安排。'
      ],
      tags: ['公历生日', '年界', '生肖'],
      sources: [
        { title: '香港天文台：今夕是何年？', url: 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html' },
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' },
        { title: '香港天文台：十二生肖', url: 'https://www.weather.gov.hk/sc/gts/time/12animals.htm' }
      ]
    },
    {
      id: 'culture-stem-branch',
      category: '五行与生肖',
      title: '天干和地支是什么关系？',
      summary: '天干和地支来自两套序列，合在一起才是一个干支名称。',
      body: [
        '天干是甲、乙、丙、丁、戊、己、庚、辛、壬、癸，地支是子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥；两者按顺序配对，形成六十干支循环。',
        '把某个天干、地支对应到五行，是传统符号系统的读法，不等于身体里有某种物质。年干、年支合起来，才是一个有时间上下文的文化坐标，不是体质、症状或经期风险。'
      ],
      tags: ['天干', '地支', '六十干支'],
      sources: [
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' }
      ]
    },
    {
      id: 'culture-day-stem-not-bazi',
      category: '历法与八字',
      title: '日干五行不等于完整八字',
      summary: '日干是一个历法符号，不能单独代表人的体质或性格。',
      body: [
        '日干五行只描述某一天干在传统符号中的对应，如甲乙木、丙丁火等，不能代表一个人的体质、情绪或当天宜忌。网站显示它，是为了阅读历法，不是给身体贴标签。',
        '完整八字要把出生年、月、日、时四柱合看，还涉及年界、节气、时区等规则。没有出生时刻时，最多只能讨论部分符号，不能称为完整命盘。'
      ],
      tags: ['日干', '四柱', '证据边界'],
      sources: [
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' },
        { title: '香港天文台：今夕是何年？', url: 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html' }
      ]
    },
    {
      id: 'culture-unknown-birth-hour',
      category: '历法与八字',
      title: '出生时刻未知时，八字能看到多少？',
      summary: '出生时刻未知时不补猜时柱，只说明资料边界。',
      body: [
        '只知道公历日期但不知道出生时刻时，八字的时柱仍然缺少必要资料。靠猜测时辰会改变四柱组合，因此网站不补猜、不排喜用神，也不把缺失部分解释成五行不足。',
        '出生地点可在需要时帮助确认所用时区或换算口径，但地点本身不能替代出生时间。资料不完整时只保留透明的历法标签，文化栏目也可以随时关闭。'
      ],
      tags: ['出生时刻', '出生地点', '不补猜'],
      sources: [
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' },
        { title: '香港天文台：今夕是何年？', url: 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html' }
      ]
    },
    {
      id: 'culture-spring-festival-lichun',
      category: '历法与八字',
      title: '春节和立春为什么不是同一天？',
      summary: '春节是农历年首，立春是节气节点，属于两套相关但不同的规则。',
      body: [
        '春节是农历正月初一，立春是二十四节气之一，两者属于不同规则。香港天文台说明，官方农历干支年以正月初一零时交替；部分命理排盘以立春交替，属于另一种口径。',
        '对接近年界的公历日期来说，可能同时早于立春和春节，也可能只跨过其中一个节点。遇到临界日期时，应先写清采用哪套口径，再按具体日期核对，不用年份数字直接猜生肖。'
      ],
      tags: ['春节', '立春', '年界'],
      sources: [
        { title: '香港天文台：今夕是何年？', url: 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html' },
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' }
      ]
    },
    {
      id: 'culture-calendar-systems',
      category: '历法与八字',
      title: '农历、节气、月相和经期周期能互相预测吗？',
      summary: '它们记录不同的时间系统，不能把天文日期当作身体预测器。',
      body: [
        '农历是阴阳合历：月份跟朔望月相关，节气按太阳在黄道上的位置划分；它们回答的是历法日期和季节位置。月相或节气不会读取子宫变化，也不能预测某人何时来月经。',
        '网站只把这些信息作为日期背景。经期第一天始终以本人真实记录为准，预测也只按已记录的周期长度做日期运算。'
      ],
      tags: ['农历', '节气', '月相', '经期'],
      sources: [
        { title: '香港天文台：今夕是何年？', url: 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html' },
        { title: '香港天文台：公历与农历对照表', url: 'https://www.hko.gov.hk/tc/gts/time/conversion.htm' }
      ]
    },
    {
      id: 'culture-cycle-is-personal',
      category: '经期与民俗',
      title: '周期参考参数应该怎样理解？',
      summary: '常见参考参数由使用者自定，不是由生肖、月相或干支推导出的结论。',
      body: [
        '周期长度由使用者根据自己的记录设置，定义为一次月经第一天到下一次第一天的间隔；出血持续天数另记。它是个人记录参数，不是由农历月份、生肖或当天干支推出来的。',
        '常见参考值不能替代个人数据。周期变动、疼痛或情绪影响生活时，先记录实际情况并与医生讨论；文化栏不参与周期判断，也不用于避孕。'
      ],
      tags: ['周期参数', '周期定义', '真实记录'],
      sources: [
        { title: 'NHS：Periods and fertility in the menstrual cycle', url: 'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/' },
        { title: 'NHS：Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }
      ]
    },
    {
      id: 'culture-sheng-ke-terms',
      category: '五行与生肖',
      title: '“生、克、合、冲”会造成身体风险吗？',
      summary: '它们是传统系统里的关系词，不是现代医学因果。',
      body: [
        '“生”“克”“合”“冲”是传统术语，用来描述干支或五行系统里的关系。它们不是现代医学的因果机制，也不能说明某天一定顺利、冲突、疼痛或情绪变差。',
        '当栏目出现关系词时，可以把它当成文化阅读提示；是否休息、工作、运动、见人，仍由当日疼痛、精力和本人意愿决定。'
      ],
      tags: ['生克', '合冲', '文化术语'],
      sources: [
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' },
        { title: 'NHS：Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }
      ]
    },
    {
      id: 'culture-zodiac-no-taboo',
      category: '五行与生肖',
      title: '生肖可以制定经期行为禁忌吗？',
      summary: '生肖不会自动生成经期的“能做”或“不能做”。',
      body: [
        '生肖是按历法年界归类的十二地支符号。某个生肖不代表经期第一天必须忌讳运动、洗澡、见人或工作，也不代表某些活动一定不适合。',
        '如果某个安排让身体不舒服，可以因为实际感受而调整；调整理由应来自自己的体验或专业建议，而不是生肖禁忌。文化兴趣可以保留，健康判断要分开。'
      ],
      tags: ['生肖', '经期禁忌', '自主选择'],
      sources: [
        { title: '香港天文台：今夕是何年？', url: 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html' },
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' }
      ]
    },
    {
      id: 'culture-colors-accessories',
      category: '五行与生肖',
      title: '五行颜色和饰物应该怎么用？',
      summary: '可以把它们当作审美或仪式感，不当作治疗或补元素。',
      body: [
        '把五行配成颜色、材质或饰物，是一种可选的审美和仪式感。喜欢绿色、金色或某件首饰都可以，只要让人舒服；它们没有被本栏目当作治疗、补元素或改变经期的工具。',
        '若皮肤、气味或材质引起不适，应停止使用。健康问题仍按可靠医疗信息处理；五行标签不能替代医生、药品说明或对身体的观察。'
      ],
      tags: ['颜色', '饰物', '审美选择'],
      sources: [
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' }
      ]
    },
    {
      id: 'culture-emotion-not-deficiency',
      category: '经期与民俗',
      title: '情绪不舒服是不是因为缺某个五行？',
      summary: '不能用五行缺失解释焦虑、低落或疲惫。',
      body: [
        '焦虑、低落、易怒或疲惫都是真实感受，但不能凭一次记录断言“缺某个五行”。情绪可能受睡眠、压力、身体状态、环境等多因素影响，文化符号不能替代评估。',
        '如果焦虑影响睡眠、学习、工作或日常生活，优先寻求心理健康专业支持；网站的记录和小练习只帮助整理体验，不做诊断，也不把心理标签写成命理结论。'
      ],
      tags: ['情绪', '焦虑', '不做诊断'],
      sources: [
        { title: 'NIMH：Anxiety disorders', url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders' },
        { title: 'NHS：Premenstrual syndrome', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }
      ]
    },
    {
      id: 'culture-yi-ji-as-ritual',
      category: '经期与民俗',
      title: '今天的“宜忌”可以换成什么？',
      summary: '把日历词汇改写成自主生活仪式，而不是服从清单。',
      body: [
        '传统日历里的“宜”“忌”属于特定民俗文本的表达，不是医学处方。网站不把它改写成经期禁令，而是把它转成可自主选择的小仪式：整理桌面、听歌、散步、休息，或什么都不做。',
        '选择应随当天感受调整；不舒服就停下，不需要向日历证明自己做对了。经期照护以真实症状、个人偏好和专业建议为准。'
      ],
      tags: ['宜忌', '生活仪式', '按感受'],
      sources: [
        { title: '香港天文台：公历与农历对照表', url: 'https://www.hko.gov.hk/tc/gts/time/conversion.htm' },
        { title: 'NHS：Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }
      ]
    },
    {
      id: 'culture-day-pillar-boundary',
      category: '历法与八字',
      title: '日柱换日口径不同怎么办？',
      summary: '临近子时要核对时刻和排盘口径，不把猜测的日柱当命盘。',
      body: [
        '日柱并非只把公历日期直接贴上标签。不同排盘规则可能采用不同的换日时刻，临近子时尤其需要核对出生时刻、地点和所用历法；香港天文台也列出子时为 23 时至 01 时。',
        '如果出生时刻未知，网站不会把一个推测的日柱当作完整四柱或命盘，也不会据此推断经期、人格或吉凶。若以后补充资料，应同时记录采用的排盘口径。'
      ],
      tags: ['日柱', '子时', '排盘口径'],
      sources: [
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' },
        { title: '香港天文台：今夕是何年？', url: 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html' }
      ]
    },
    {
      id: 'culture-record-before-interpret',
      category: '经期与民俗',
      title: '为什么先记录，再谈文化灵感？',
      summary: '本人当天的感受比任何标签更接近真实生活。',
      body: [
        '周期日、疼痛、精力和情绪是可以由本人补充或修改的记录。连续记录至少两个周期，才更方便观察是否存在稳定的时间模式；一次不舒服不能直接归因于经期、生肖或五行。',
        '文化栏可以提供颜色、文字或小仪式的灵感，但不改变照护建议。若疼痛或情绪已影响日常生活，应把记录带给医生或心理健康专业人员讨论。'
      ],
      tags: ['连续记录', '两周期', '本人表达'],
      sources: [
        { title: 'NHS：Premenstrual syndrome', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' },
        { title: 'NHS：Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }
      ]
    },
    {
      id: 'culture-ten-stems-elements',
      category: '五行与生肖',
      title: '十天干怎样对应五行？',
      summary: '十天干两两归入五行，并保留阴阳的差别。',
      body: [
        '传统对应把十天干两两归入五行：甲、乙属木；丙、丁属火；戊、己属土；庚、辛属金；壬、癸属水。每一组仍有阴阳差别，例如甲阳乙阴，不能只剩一个“元素标签”。',
        '如果某个干支组合含有辛，它可按传统记作金。它是符号分类，作用是帮助读懂干支名称；这里不把“金”解释成体质、饮食或经期处方。'
      ],
      tags: ['十天干', '五行对应', '辛金'],
      sources: [
        { title: '国家标准术语公开稿：十干配五行', url: 'https://std.samr.gov.cn/dcpspTools/gbPlan/download?path=%2Fzxd%2F2018101248%2F20_%E6%A0%87%E5%87%86%E8%B5%B7%E8%8D%89%2F20_WD_2018101248_%E4%B8%AD%E5%8C%BB%E5%9F%BA%E7%A1%80%E7%90%86%E8%AE%BA%E6%9C%AF%E8%AF%AD.pdf' },
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' }
      ]
    },
    {
      id: 'culture-branches-zodiac',
      category: '五行与生肖',
      title: '十二地支和十二生肖怎样配对？',
      summary: '生肖动物与地支是一一对应的十二年循环。',
      body: [
        '十二地支与十二生肖一一配对：子鼠、丑牛、寅虎、卯兔、辰龙、巳蛇、午马、未羊、申猴、酉鸡、戌狗、亥猪。生肖年首先是一个十二年循环的纪年符号，和十天干组合后才得到具体干支年名。',
        '因此“巳”可读作蛇的生肖地支，但这只是历法与民俗对应。它不替代出生日期核对，也不规定经期行为或性格。'
      ],
      tags: ['十二地支', '十二生肖', '巳蛇'],
      sources: [
        { title: '香港天文台：十二生肖', url: 'https://www.weather.gov.hk/sc/gts/time/12animals.htm' },
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' }
      ]
    },
    {
      id: 'culture-generating-overcoming-cycles',
      category: '五行与生肖',
      title: '五行相生和相克的两条循环是什么？',
      summary: '相生与相克是传统关系图上的两条方向不同的循环。',
      body: [
        '传统五行有两条常见循环。相生为木生火、火生土、土生金、金生水、水生木；相克为木克土、土克水、水克火、火克金、金克木。相生讲滋养推进，相克讲制约平衡，两个循环同时存在。',
        '如果某个符号组合同时涉及火与金，按这张表可说呈火克金的符号关系；它只说明五行系统里的配对，不是身体风险或经期预言。'
      ],
      tags: ['相生', '相克', '五行循环'],
      sources: [
        { title: '北京市中医药对外交流信息网：五行的涵义', url: 'https://zyj.beijing.gov.cn/dwjlxxw/whcb/202203/t20220329_2642280.html' },
        { title: '国家标准术语公开稿：五行相克术语', url: 'https://std.samr.gov.cn/dcpspTools/gbPlan/download?path=%2Fzxd%2F2018101248%2F20_%E6%A0%87%E5%87%86%E8%B5%B7%E8%8D%89%2F20_WD_2018101248_%E4%B8%AD%E5%8C%BB%E5%9F%BA%E7%A1%80%E7%90%86%E8%AE%BA%E6%9C%AF%E8%AF%AD.pdf' }
      ]
    },
    {
      id: 'culture-why-sixty-cycle',
      category: '历法与八字',
      title: '六十干支为什么不是一百二十种？',
      summary: '十天干与十二地支按顺序配对，两个周期重新同时回到起点要 60 步。',
      body: [
        '十天干有 10 个位置，十二地支有 12 个位置；按干支顺序从甲子开始，天干和地支一起回到起点要经过两个周期的最小公倍数 60 步，所以形成六十甲子，而不是把 10 和 12 直接相乘成 120 个传统组合。',
        '干支组合可循环纪年、纪月、纪日、纪时。它记录的是时间序列；网站把六十甲子当作文化知识，不把它当成个人健康、性格或吉凶计算器。'
      ],
      tags: ['六十甲子', '循环', '干支顺序'],
      sources: [
        { title: '香港天文台：天干和地支', url: 'https://www.hko.gov.hk/sc/gts/time/stemsandbranches.htm' },
        { title: '香港天文台：今夕是何年？', url: 'https://www.hko.gov.hk/sc/education/astronomy-and-time/time-service/00506-what-year-is-it-today.html' }
      ]
    }
  ];
});
