/*
 * Moon & Me health knowledge cards.
 *
 * The linked pages were opened and checked on 2026-10-26. Clinical facts are
 * kept separate from product/editorial suggestions; this file has no
 * diagnosis or treatment engine.
 */
(function attachMoonHealth(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MoonHealthArticles = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeHealthArticles() {
  return [
    {
      id:'health-cycle-four-phases',category:'周期常识',title:'四个阶段怎样看？',summary:'月经、卵泡发育、排卵、黄体变化，不能简单等分成四周。',
      body:['月经第一天是周期第一天。卵泡期从周期开始延续至排卵，月经期与它有重叠；应用为了看日历，单列月经期和经后卵泡期。排卵是释放卵子的事件，黄体期位于排卵后至下一次月经前。','NHS说明排卵通常距下一次月经约10—16天，很难靠日历精确定位。网站用14天作为展示锚点，不是个人实测；标出的排卵参考日不表示排卵持续一天或避孕安全期。','今天可做：核对最近一次实际开始与结束日，再看标注是已记录、估算还是人工标注；不能仅按阶段假定她有某种情绪或需要限制活动。'],paragraphSources:[[0,1],[0],[]],tags:['四阶段','卵泡期','黄体期','排卵'],
      sources:[{title:'NHS · Periods and fertility in the menstrual cycle',url:'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/'},{title:'NIH MeSH · Follicular Phase',url:'https://www.ncbi.nlm.nih.gov/mesh?Cmd=DetailsSearch&Db=mesh&Term=%22Follicular+Phase%22%5BMeSH+Terms%5D'}],
      verification:{checkedAt:'2026-10-28',basis:'mixed',note:'阶段关系与排卵时间来自官方资料；14天展示锚点、日历分段和操作步骤是产品规则，不是个体确认。',sourceNotes:[{url:'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/',supports:'周期起点、排卵与下次月经间隔约10—16天，难以精确定位。'},{url:'https://www.ncbi.nlm.nih.gov/mesh?Cmd=DetailsSearch&Db=mesh&Term=%22Follicular+Phase%22%5BMeSH+Terms%5D',supports:'卵泡期从月经开始延续到排卵。'}]}
    },
    {
      id:'health-phase-signals',category:'周期常识',title:'聊天和身体线索能说明什么？',summary:'记录明确报告，保留日期；日历和情绪不能确认排卵。',
      body:['LH试纸记录反映激素变化，用来寻找可能的排卵窗口，并不等同已经排卵。基础体温需要连续、同条件记录，单个温度不用于本应用自动确认阶段。分泌物观察也受其他情况影响。','本人在聊天里说月经开始、结束或测到某个结果，可以先提取为候选，再核对日期和原句。回复慢、想独处、疲惫或焦虑会影响怎样照护，不能据此确认黄体期。','今天可做：逐条记录她明确分享的原话；日期不清楚先问清楚。需要判断是否排卵时，可把已有检测与记录带给医生；本应用不代替检测或临床判断。'],paragraphSources:[[0],[],[]],tags:['LH','基础体温','聊天记录','行为','阶段线索'],
      sources:[{title:'Office on Women’s Health · Trying to conceive',url:'https://womenshealth.gov/pregnancy/you-get-pregnant/trying-conceive'}],
      verification:{checkedAt:'2026-10-28',basis:'mixed',note:'检测与观察的用途来自OWH；聊天整理、人工核对及不从情绪分期是产品边界。',sourceNotes:[{url:'https://womenshealth.gov/pregnancy/you-get-pregnant/trying-conceive',supports:'日历、连续基础体温、宫颈黏液、LH试纸用于观察周期与可能的易孕窗口，需结合记录。'}]}
    },

    {
      id: 'health-cycle-day-one', category: '周期常识', title: '周期第 1 天怎么算？',
      summary: '真正开始出血的第一天，记作这一次周期的第 1 天。',
      body: ['月经周期从一次月经开始出血的第一天算起，到下一次月经开始前一天结束；周期长度因人而异，常见范围约为 21–35 天。“28 天”只是参考，不是必须达成的标准。', '网站会把你填写的真实开始日与参考周期分开保存。它可以帮你安排和回看，但不会检测排卵、怀孕或把预计日期自动变成真实月经。'],
      paragraphSources: [[0], []],
      tags: ['周期第1天', '月经周期', '28天'],
      sources: [{ title: 'NHS · Irregular periods', url: 'https://www.nhs.uk/symptoms/irregular-periods/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '周期第 1 天、周期末日和 21–35 天范围来自 NHS；应用如何保存与预测是编辑说明。', sourceNotes: [{ url: 'https://www.nhs.uk/symptoms/irregular-periods/', supports: '说明第 1 天是月经第一天，周期末日是下一次月经前一天，平均约 28 天且少于 21 天或超过 35 天可视为不规律。' }] }
    },
    {
      id: 'health-bleeding-days', category: '周期常识', title: '出血几天算常见？',
      summary: '很多人的经期约 2–7 天，长短和流量可能每个月不同。',
      body: ['经期通常持续 2–7 天，平均约 5 天，前两天可能较多；每个人的基线不同，一次变化不一定代表有问题，连续记录更有帮助。', '如果经期持续超过 7 天、突然比平时长很多，或出血变化已经影响工作、学习和生活，可以把日期、流量和伴随症状带给妇科医生。'],
      paragraphSources: [[0, 1], [0]],
      tags: ['经期几天', '出血持续', '记录'],
      sources: [{ title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }, { title: 'NHS · Periods', url: 'https://www.nhs.uk/conditions/periods/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: '持续天数、前两天较多和就医线索均可在 NHS 页面核对。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/periods/period-problems/', supports: '给出通常 2–7 天、平均 5 天，并建议在出血或周期问题影响生活时记录并咨询医生。' }, { url: 'https://www.nhs.uk/conditions/periods/', supports: '说明经期通常 2–7 天、约 5 天，前两天出血较多。' }] }
    },
    {
      id: 'health-first-day', category: '身体照护', title: '经期第一天可以怎么安排？',
      summary: '按疼痛、精力和必须完成的事做一个可调整的版本。',
      body: ['第一天不必自动停掉所有活动，也不必强迫自己照常高强度工作。可以先记下疼痛、精力和情绪，再把安排拆成一件必须做的事、一件可选的小事和一段留白。', '温水淋浴、隔布温热敷、轻柔瑜伽或散步都可以作为尝试；如果某项让你更不舒服，就停下。照护建议应该跟着你的身体反应调整。'],
      paragraphSources: [[], [0]],
      tags: ['经期第一天', '安排', '休息'],
      sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '温热和轻柔活动来自 NHS；拆分任务、保留留白和按感受调整属于编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/symptoms/period-pain/', supports: '列出温水澡或淋浴、包裹热水袋或热垫，以及瑜伽、游泳、散步、骑车等轻柔活动。' }] }
    },
    {
      id: 'health-cramps', category: '身体照护', title: '为什么会痛经？',
      summary: '子宫收缩参与常见痛经，但严重或变重的疼痛需要评估。',
      body: ['经期时子宫收缩帮助排出经血，这是常见痛经的一部分；疼痛可出现在下腹，并向腰背或大腿放射。', '如果疼痛比平时明显更重、止痛处理无效，或已经让你无法上班、上学、睡觉和完成日常活动，不要只把它归为“忍一忍就好”，可以预约妇科评估。'],
      paragraphSources: [[0], [0]],
      tags: ['痛经', '腹痛', '子宫收缩'],
      sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: '删除了无法从可打开页面核对的前列腺素和伴随症状扩展，只保留 NHS 明确支持的内容。', sourceNotes: [{ url: 'https://www.nhs.uk/symptoms/period-pain/', supports: '说明子宫收缩会导致经期疼痛，疼痛可放射到背部和大腿，并列出疼痛加重、影响日常活动时的就医建议。' }] }
    },
    {
      id: 'health-heat-bath', category: '身体照护', title: '热敷和洗澡有用吗？',
      summary: '温热可能让一部分人的痉挛更舒服，注意温度和皮肤安全。',
      body: ['热水澡、温水淋浴、热水袋或加热垫可以作为缓解痛经的自我照护选项。热水袋或加热垫应隔着衣物或毛巾使用，温度以舒服为准，不要直接贴皮肤睡着。', '它们是“可以试试”的方法，不是所有人都有效。如果疼痛持续加重或影响日常生活，温热不能替代医疗评估。'],
      paragraphSources: [[0], [0]],
      tags: ['热敷', '洗澡', '痛经缓解'],
      sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '温水和包裹热源来自 NHS；“隔布、不贴皮肤睡着”和停止条件是安全编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/symptoms/period-pain/', supports: '列出温水澡、淋浴和用毛巾包裹的热水袋或热垫作为缓解选择，并建议疼痛严重或加重时求助。' }] }
    },
    {
      id: 'health-movement-swim', category: '饮食活动', title: '经期能运动或游泳吗？',
      summary: '身体允许时，轻柔活动可能有帮助；不舒服就降低强度或休息。',
      body: ['NHS把瑜伽、游泳、散步和骑车列为可以尝试的轻柔活动。活动量应看当日疼痛、出血、头晕和精力；如果活动让你明显不舒服，就降低强度或休息。', '游泳时选择自己熟悉、合适的经期用品，按照产品说明使用。'],
      paragraphSources: [[0], []],
      tags: ['经期运动', '游泳', '瑜伽'],
      sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '活动类型来自 NHS；按当天症状调整和用品选择属于编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/symptoms/period-pain/', supports: '列出瑜伽、游泳、散步和骑车等轻柔活动作为缓解痛经的选择。' }] }
    },
    {
      id: 'health-cold-drinks', category: '饮食活动', title: '冷饮、红糖水和“忌口”怎么理解？',
      summary: '冷饮不是每个人都必须禁止；先观察个人体验，饮食保持均衡。',
      body: ['网站不把冷饮或红糖水设为自动禁忌。NHS 的 PMS 建议包括均衡饮食、规律睡眠、运动和减压；如果某种饮食让你确实更不舒服，可以把它作为个人体验记录。', '红糖水或某一种食物不能替代诊断和治疗。编辑建议：优先规律进食、足够水分和自己能接受的均衡饮食；新的补充剂或“调经”产品先问医生或药师。'],
      paragraphSources: [[0], [0]],
      tags: ['冷饮', '红糖水', '经期饮食'],
      sources: [{ title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '均衡饮食和补充剂先咨询来自 NHS；“不设自动禁忌”和按个人体验记录是本产品的编辑边界。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/', supports: '建议健康均衡饮食、充足睡眠、规律运动、减压，并提醒开始规律补充剂前询问医生或药师。' }] }
    },
    {
      id: 'health-caffeine', category: '饮食活动', title: '咖啡因和酒精需要完全戒掉吗？',
      summary: '是否减少取决于你的症状和摄入量，睡眠受影响时可观察减少后的变化。',
      body: ['咖啡因可能让人更难入睡，酒精也可能让后半夜睡眠变差；如果经前不适时发现它们让自己更难受，可以记录摄入时间和症状后尝试减少。', '这里不设置因为“经期”而自动执行的统一禁令；编辑建议：先观察自己在不同摄入量和时间下的睡眠与不适，再决定是否减少。如果正在服药、存在怀孕可能性，或摄入已经困扰生活，再咨询医生或药师。'],
      paragraphSources: [[1, 2], []],
      tags: ['咖啡因', '酒精', 'PMS饮食'],
      sources: [{ title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }, { title: 'NHS · Sleep problems', url: 'https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/?ac=224404' }, { title: 'NHS · Self-help tips to fight tiredness', url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/self-help-tips-to-fight-fatigue/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '咖啡因、酒精与睡眠的关系来自 NHS；按个人症状记录和减少是编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/?ac=224404', supports: '说明晚间咖啡因可能让人保持清醒，酒精可能先让人困但随后影响睡眠。' }, { url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/self-help-tips-to-fight-fatigue/', supports: '说明咖啡因是兴奋剂、可能干扰睡眠，酒精会让睡眠不深。' }, { url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/', supports: '列出 PMS 的生活方式建议，包括均衡饮食、睡眠、运动和减压。' }] }
    },
    {
      id: 'health-sleep', category: '情绪睡眠', title: '经期睡不好怎么办？',
      summary: '稳定作息、舒适的温度和减少刺激可以作为简单尝试。',
      body: ['疼痛、焦虑、乳房胀痛和环境温度都可能让睡眠更难。可以把睡前流程做得简单：固定起床时间，按感觉热敷或淋浴，减少晚间咖啡因和屏幕刺激。', '几晚睡不好通常不必立即下结论。如果睡眠困难持续、白天明显受影响，或伴随严重情绪低落和焦虑，记录下来并寻求专业支持。'],
      paragraphSources: [[0, 1, 2], [2]],
      tags: ['经期睡眠', '失眠', '作息'],
      sources: [{ title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }, { title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }, { title: 'NHS · Sleep problems', url: 'https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/?ac=224404' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: 'PMS 症状、热水照护和睡眠习惯来自 NHS；组合成睡前流程是编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/', supports: '列出焦虑、疲劳、睡眠困难、腹胀和乳房胀痛等 PMS 症状。' }, { url: 'https://www.nhs.uk/symptoms/period-pain/', supports: '列出温水澡、淋浴和热垫等痛经照护。' }, { url: 'https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/?ac=224404', supports: '建议规律作息、晚间减少咖啡因和睡前放下手机，并说明长期睡眠问题影响日常时应求助。' }] }
    },
    {
      id: 'health-pms', category: '情绪睡眠', title: 'PMS 是什么？',
      summary: '经前反复出现的身体和情绪变化，是否影响生活是重要线索。',
      body: ['PMS 可能包括腹胀、乳房胀痛、头痛、疲劳、食欲变化、易怒、焦虑和睡眠问题。症状通常出现在月经前，月经开始后缓解；每个人的组合和程度不一样。', '网站可以帮你记录每天的感受，但不能根据几次选择自动诊断 PMS。至少记录两个周期，连同月经日期和对生活的影响一起带给医生，会比只记“心情不好”更有帮助。'],
      paragraphSources: [[0, 1], [0]],
      tags: ['PMS', '经前综合征', '症状记录'],
      sources: [{ title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }, { title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: 'PMS 症状、经前时间和至少记录两个周期来自 NHS PMS 页面；月经开始后缓解来自 NHS Period problems 页面；网站不做自动诊断是产品边界。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/', supports: '列出腹胀/痉挛、乳房胀痛、头痛、疲劳或睡眠困难、食欲变化、焦虑等常见 PMS 症状，并建议至少记录两个周期。' }, { url: 'https://www.nhs.uk/conditions/periods/period-problems/', supports: '说明 PMS 症状通常在经前两周开始或加重，并在月经开始后缓解和消失。' }] }
    },
    {
      id: 'health-pmdd', category: '情绪睡眠', title: 'PMDD 和普通经前波动有什么区别？',
      summary: 'PMDD 是需要专业评估的严重经前症状模式，不能靠网页自测确诊。',
      body: ['PMDD 的情绪和身体症状更强烈，可能明显影响工作、关系和日常生活。关键不是某一个症状，而是症状是否在多个周期呈现清楚的时间模式，并在月经后缓解。', '如果你怀疑 PMDD，可以连续记录至少两个周期，预约妇科或心理健康专业人员评估。若出现自伤或轻生想法，请立即联系当地急救、危机热线或可信任的人，不要独自等待周期过去。'],
      paragraphSources: [[0], [0, 1]],
      tags: ['PMDD', '情绪', '周期记录'],
      sources: [{ title: 'NHS · PMDD', url: 'https://www.nhs.uk/conditions/pmdd-premenstrual-dysphoric-disorder/' }, { title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: 'PMDD 的严重程度、时间特点和危机求助来自 NHS；记录两个周期沿用 NHS 的 PMS 记录建议。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/pmdd-premenstrual-dysphoric-disorder/', supports: '说明 PMDD 症状严重、通常在经前 1–2 周开始并在月经开始后改善，影响工作和关系时应就医，并提供危机帮助入口。' }, { url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/', supports: '建议至少记录两个周期后带给医生。' }] }
    },
    {
      id: 'health-anxiety-cycle', category: '情绪睡眠', title: '焦虑和经期有关系吗？',
      summary: '焦虑可能随周期变化，也可能整个月存在；不要只用经期解释严重焦虑。',
      body: ['有些人会在经前感到焦虑、易怒或低落；焦虑也可能在经前以外持续存在，不要只用经期解释全部体验。记录“什么时候出现、持续多久、影响了什么”，比给自己贴标签更有用。', '如果焦虑已经影响睡眠、学习、工作或关系，可以联系心理咨询师、精神科或全科医生。这个网站只能帮助记录和做可选的放松练习，不能替代诊断、治疗或危机支持。'],
      paragraphSources: [[0, 1], [1]],
      tags: ['经期焦虑', '焦虑记录', '心理支持'],
      sources: [{ title: 'NHS · PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' }, { title: 'NIMH · Anxiety disorders', url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '经前焦虑症状来自 NHS；焦虑也可能持续并干扰生活、以及记录和求助边界来自 NIMH 与编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/', supports: '把焦虑、情绪变化和睡眠问题列为可能的 PMS 症状。' }, { url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders', supports: '说明焦虑障碍不只是偶尔担心，可能持续、加重并影响工作、学习和关系。' }] }
    },
    {
      id: 'health-products', category: '用品卫生', title: '卫生巾、卫生棉条、月经杯怎么选？',
      summary: '多种产品都可以使用，选择舒适、能按说明更换和清洁的那一种。',
      body: ['卫生巾、卫生棉条、月经杯和经期内裤各有使用方式。没有一种产品适合所有人，可以根据流量、活动、预算、皮肤感受和接受程度选择；第一次尝试时给自己留出熟悉的时间。', '产品包装上的使用说明优先。留意是否漏液、疼痛、刺激或异味；如果某种产品让你明显不舒服，可以换回熟悉的方式并咨询专业人员。'],
      paragraphSources: [[0], [0]],
      tags: ['卫生用品', '卫生巾', '月经杯', '卫生棉条'],
      sources: [{ title: 'NHS · Periods', url: 'https://www.nhs.uk/conditions/periods/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '产品种类和棉条说明来自 NHS；按流量、活动与接受程度选择是编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/periods/', supports: '列出卫生巾、棉条、月经杯和经期内裤，说明棉条应按产品说明使用且疼痛时应检查是否放置正确。' }] }
    },
    {
      id: 'health-tampon-cup', category: '用品卫生', title: '卫生棉条和月经杯要注意什么？',
      summary: '洗手并按说明定期更换或清洁，不要为了省事超时使用。',
      body: ['使用卫生棉条或月经杯前后洗手，并遵循包装说明的更换、清洁和储存要求。不要超过产品建议的最长使用时间；流量多时可能需要更早更换或倒空。', '如果使用时出现发热、寒战、呕吐、腹泻、头晕、皮疹或明显不适，应取出棉条或杯并尽快获得医疗帮助。中毒性休克综合征很罕见，但需要认真对待。'],
      paragraphSources: [[0, 1], [0]],
      tags: ['卫生棉条', '月经杯', 'TSS', '更换'],
      sources: [{ title: 'NHS · Toxic shock syndrome', url: 'https://www.nhs.uk/conditions/toxic-shock-syndrome/' }, { title: 'NHS · Periods', url: 'https://www.nhs.uk/conditions/periods/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: '手卫生、按说明使用、TSS 症状和取出用品后求助均来自 NHS。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/toxic-shock-syndrome/', supports: '说明 TSS 罕见但可能危及生命，列出发热、寒战、呕吐腹泻、皮疹、头晕等症状，并建议取出棉条或月经杯后求助。' }, { url: 'https://www.nhs.uk/conditions/periods/', supports: '说明棉条应有使用说明，月经杯可清洗重复使用。' }] }
    },
    {
      id: 'health-vulva-cleaning', category: '用品卫生', title: '经期怎么清洁？',
      summary: '清洁外阴、勤换用品即可，不需要冲洗阴道或使用香味产品。',
      body: ['经期可以用温水清洁外阴，避免香味皂、洗液或凝胶。阴道有自我清洁能力，不需要把水、洗液或香味产品冲进阴道；过度清洁可能造成刺激。', '如果出现持续异常异味或异常分泌物，先暂停刺激性产品并预约医生。清洁不能代替对感染或皮肤问题的诊断。'],
      paragraphSources: [[0], [0]],
      tags: ['经期清洁', '外阴', '卫生'],
      sources: [{ title: 'Devon Sexual Health · Genital hygiene', url: 'https://www.devonsexualhealth.nhs.uk/your-sexual-health/genital-hygiene/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: '外阴清洁、避免香味产品和不冲洗阴道均来自 NHS 性健康服务页面。', sourceNotes: [{ url: 'https://www.devonsexualhealth.nhs.uk/your-sexual-health/genital-hygiene/', supports: '建议用温水清洁、避免香味皂和凝胶，明确不要冲洗阴道，并说明过度清洗可能造成干燥和刺激。' }] }
    },
    {
      id: 'health-contraception', category: '周期常识', title: '月经预测能当避孕方法吗？',
      summary: '不能。参考周期只是在日期上做估算，不等于排卵检测或避孕保护。',
      body: ['只按月经第几天做预测，不是完整的生育力意识方法。NHS 说明完整方法需要每天记录体温、阴道分泌物和月经，并接受专业指导；本网站的周期预测不能当作避孕保护。', '自然计划不能预防性传播感染。如果不想怀孕，请选择适合自己的避孕方式并正确使用；发生无保护性行为、避孕失败或月经明显推迟时，可以咨询药师或医生并按需要做妊娠检测。'],
      paragraphSources: [[0], [0]],
      tags: ['周期预测', '避孕', '排卵'],
      sources: [{ title: 'NHS · Natural family planning', url: 'https://www.nhs.uk/contraception/methods-of-contraception/natural-family-planning/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '生育力意识方法的组成、专业指导和 STI 边界来自 NHS；明确本网站不能作为避孕方法是产品边界。', sourceNotes: [{ url: 'https://www.nhs.uk/contraception/methods-of-contraception/natural-family-planning/', supports: '说明自然计划需要记录体温、分泌物和周期、接受专业指导，且不能预防 STI；仅按日期不能替代完整方法。' }] }
    },
    {
      id: 'health-heavy-flow', category: '就医判断', title: '怎样算出血量偏多？',
      summary: '需要频繁更换、影响生活或反复漏出的情况值得记录并咨询。',
      body: ['如果需要每 1–2 小时更换一次卫生巾或棉条、需要同时使用两种用品、经常夜间漏出，或月经量已经影响日常生活，这些都可以作为“流量偏多”的线索。不要只凭别人说的“正常”。', '记录每天使用的用品、是否漏出、血块、疲劳和气短，预约医生评估。长期大量出血可能导致缺铁性贫血；如果还有疲劳、气短或心悸，也应一并说明。'],
      paragraphSources: [[0], [0, 1]],
      tags: ['月经过多', '经量', '漏血', '贫血'],
      sources: [{ title: 'NHS · Heavy periods', url: 'https://www.nhs.uk/conditions/heavy-periods/' }, { title: 'NHS · Iron deficiency anaemia', url: 'https://www.nhs.uk/conditions/iron-deficiency-anaemia/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: '出血量线索来自 NHS 重经量页面；大量出血与缺铁性贫血的关系来自 NHS 贫血页面。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/heavy-periods/', supports: '列出每 1–2 小时更换、同时使用两种用品、超过 7 天、较大血块、漏出和影响日常活动等线索。' }, { url: 'https://www.nhs.uk/conditions/iron-deficiency-anaemia/', supports: '说明重经量是缺铁性贫血的常见原因，并列出疲劳、气短和心悸等可能症状。' }] }
    },
    {
      id: 'health-irregular', category: '就医判断', title: '周期变得不规律怎么办？',
      summary: '一次提前或推迟不一定严重，但反复变化要找原因。',
      body: ['压力、焦虑、体重明显变化、运动量变化、激素避孕、怀孕、甲状腺问题和多囊卵巢综合征等都可能影响周期。网站的预测会显示“尚未记录”或“已过预计日”，不会把变化掩盖成整齐的 28 天。', '如果周期经常少于 21 天或超过 35 天、经期超过 7 天、两次月经之间出血，或月经突然停止，请把记录带给医生。'],
      paragraphSources: [[0], [0, 1]],
      tags: ['月经不规律', '周期推迟', '周期提前'],
      sources: [{ title: 'NHS · Irregular periods', url: 'https://www.nhs.uk/symptoms/irregular-periods/' }, { title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '可能原因和就医线索来自 NHS；网站如何显示未确认预测是产品行为。', sourceNotes: [{ url: 'https://www.nhs.uk/symptoms/irregular-periods/', supports: '列出压力和焦虑、体重变化、运动、怀孕、激素避孕、PCOS/PMOS 和甲状腺问题等原因，并建议不规律或超过 7 天时就医。' }, { url: 'https://www.nhs.uk/conditions/periods/period-problems/', supports: '说明周期可提前或推迟、流量和持续天数会变化，并建议记录周期问题。' }] }
    },
    {
      id: 'health-urgent-pain', category: '就医判断', title: '哪些疼痛信号不能只靠忍？',
      summary: '严重、加重、异常位置或影响日常的疼痛，应获得医疗评估。',
      body: ['如果疼痛严重或比平时明显加重，常规自我照护没有帮助，或者已经影响走路、工作、学习、睡眠和日常生活，应联系医生或当地急诊服务。经期疼痛不是“必须忍耐”的证明。', '性交、排尿或排便时疼痛，非经期也疼，伴随发热、晕厥、异常出血或怀孕可能性，也应尽快咨询。医生会根据病史和检查判断是否需要进一步检查。'],
      paragraphSources: [[0], [0, 1]],
      tags: ['严重痛经', '盆腔痛', '就医'],
      sources: [{ title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }, { title: 'NHS · Pelvic pain', url: 'https://www.nhs.uk/symptoms/pelvic-pain/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: '严重或加重的经期痛、性交/排尿/排便痛以及发热、晕厥、异常出血和怀孕可能性等信号均可在 NHS 页面核对。', sourceNotes: [{ url: 'https://www.nhs.uk/symptoms/period-pain/', supports: '建议疼痛严重、加重、影响日常活动，或性交、排尿、排便时疼痛时就医。' }, { url: 'https://www.nhs.uk/symptoms/pelvic-pain/', supports: '列出发热、呕吐腹泻、可能怀孕、严重或加重、头晕晕厥和大量阴道出血等盆腔痛求助信号。' }] }
    },
    {
      id: 'health-abnormal-bleeding', category: '就医判断', title: '经期之外出血要管吗？',
      summary: '经间出血、性交后出血或绝经后出血值得咨询医生。',
      body: ['两次月经之间出血、性交后出血，或原本规律的周期突然改变，都应该记录日期、出血量、疼痛和是否可能怀孕，再和医生讨论。原因可能很多，不能仅凭颜色或一个月的记录判断。', '如果出血量很大，伴随明显头晕或晕厥、剧烈腹痛或怀孕可能性，不要只等下一次月经；按所在地的急诊或医疗咨询流程获取帮助。'],
      paragraphSources: [[0, 1], [0, 1, 2]],
      tags: ['经间出血', '异常出血', '性交后出血'],
      sources: [{ title: 'NHS · Periods', url: 'https://www.nhs.uk/conditions/periods/' }, { title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }, { title: 'NHS · Pelvic pain', url: 'https://www.nhs.uk/symptoms/pelvic-pain/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: '经间/性交后出血和严重伴随症状的求助边界来自 NHS；记录方式是编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/periods/', supports: '说明经间出血、性交后出血和绝经后出血需要医生检查。' }, { url: 'https://www.nhs.uk/conditions/periods/period-problems/', supports: '把经间出血列为周期问题，并建议记录和咨询医生。' }, { url: 'https://www.nhs.uk/symptoms/pelvic-pain/', supports: '列出阴道异常出血、严重疼痛、晕厥和可能怀孕时的急诊求助信号。' }] }
    },
    {
      id: 'health-medication', category: '就医判断', title: '止痛药要怎么选？',
      summary: '药物要结合禁忌、既往病史和正在使用的药物，不按网页自行加量。',
      body: ['对部分人而言，医生或药师建议的止痛药可以缓解痛经。不同药物有不同禁忌；NHS 特别提醒，有哮喘或胃、心脏、肾脏、肝脏问题时，不要自行使用布洛芬或阿司匹林。包装说明和专业人员建议优先，不要因为“经期”就自动增加剂量或混用。', '如果你有慢性病、正在备孕或怀孕可能性、过敏史，或之前吃药没有效果，先问医生或药师。网站只提供记录，不开药方，也不记录用药剂量。'],
      paragraphSources: [[0, 1], [0, 1]],
      tags: ['痛经用药', '止痛药', '药师'],
      sources: [{ title: 'NHS · Period problems', url: 'https://www.nhs.uk/conditions/periods/period-problems/' }, { title: 'NHS · Period pain', url: 'https://www.nhs.uk/symptoms/period-pain/' }],
      verification: { checkedAt: '2026-10-26', basis: 'clinical', note: '止痛药可选项与布洛芬/阿司匹林的病史提醒来自 NHS；不加量、不混用和个体化咨询是安全边界。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/periods/period-problems/', supports: '列出常见非处方止痛药，并提醒哮喘或胃、心脏、肾脏、肝脏问题时不要使用布洛芬或阿司匹林。' }, { url: 'https://www.nhs.uk/symptoms/period-pain/', supports: '把对乙酰氨基酚和布洛芬列为可缓解经期疼痛的药物，并建议严重或加重时求助。' }] }
    },
    {
      id: 'health-help-now', category: '就医判断', title: '什么时候需要马上求助？',
      summary: '严重身体症状或心理危机都值得立即获得当地专业帮助。',
      body: ['高热、晕厥、意识混乱、持续呕吐腹泻、突然剧烈腹痛、大量出血或怀孕可能性下的疼痛出血，都不适合只靠网站观察。联系当地急救或急诊服务，并说明症状、经期和可能使用的用品。', '如果出现自伤或轻生想法，立刻联系当地危机热线、急救服务或可信任的人，尽量不要独处。网站的落地练习只帮助把注意力放回眼前，不要求控制呼吸，也不能替代危机干预。'],
      paragraphSources: [[0, 1], [2]],
      tags: ['急症', '危机求助', '自伤想法'],
      sources: [{ title: 'NHS · Toxic shock syndrome', url: 'https://www.nhs.uk/conditions/toxic-shock-syndrome/' }, { title: 'NHS · Pelvic pain', url: 'https://www.nhs.uk/symptoms/pelvic-pain/' }, { title: 'NHS · PMDD', url: 'https://www.nhs.uk/conditions/pmdd-premenstrual-dysphoric-disorder/' }],
      verification: { checkedAt: '2026-10-26', basis: 'mixed', note: '急症信号和心理危机求助来自 NHS；说明症状、用品与落地练习是产品编辑建议。', sourceNotes: [{ url: 'https://www.nhs.uk/conditions/toxic-shock-syndrome/', supports: '列出 TSS 的高热、寒战、呕吐腹泻、皮疹、头晕和意识混乱等快速求助信号。' }, { url: 'https://www.nhs.uk/symptoms/pelvic-pain/', supports: '列出严重/加重腹盆腔痛、晕厥、呼吸困难、怀孕可能性和大量阴道出血等急症信号。' }, { url: 'https://www.nhs.uk/conditions/pmdd-premenstrual-dysphoric-disorder/', supports: '说明出现心理危机时应获得紧急心理健康帮助。' }] }
    }
  ];
});
