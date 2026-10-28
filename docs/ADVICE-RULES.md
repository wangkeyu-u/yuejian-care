# 当天照护建议的综合规则

`public/advice.js` 通过固定规则，把已核对的 22 篇健康、8 篇中医、18 篇文化知识组织成当天可以采取的行动。它不是让语言模型临时编写医疗意见，也不做诊断、用药处方、排卵或命运预测。

## 输入与依赖

Node：`require('./public/advice.js')`。浏览器：`window.MoonAdvice`；需先加载 `core.js`、导出 `determineStage` 的 `companion.js`，以及三个知识数据文件。公开接口为 `buildPlan(context)` 和 `getRuleCoverage()`。

`buildPlan` 接收日期、今天、现有 `getCycle` 结果、明确支持选项和已填写的当日感受：

```js
{
  date, today, info,
  partner: { nickname, support, likes, avoid, consent },
  mood, pain, energy, sleep, flow,
  topics: [], activities: [], culture, quiet,
  cultureInfo: { element, label, inspiration, birthKnown }
}
```

- `support` 接受 `ask`、`alone`、`quiet`、`help` 及对应的明确中文选项。只按该字段选择沟通方式；不会从 likes 或 avoid 的关键词推断“其实想要什么”。例如，“不要独处”不会变成独处偏好。
- 昵称和 likes/avoid 仅在 `consent === true` 时使用，且按原话展示。记录许可不是每次行动的许可。调用方仍应让本人当日明确支持方式优先于长期默认值。
- `pain` 为 0–10；`mood` 为平静、紧绷或很难受；`sleep` 为 `poor` 或 `okay`；`flow` 为 `usual`、`heavy` 或 `unexpected`。未填写不等于已经确认无症状。
- `topics` 仅说明想了解的选项：`tcm`、`herbal`、`acupuncture`、`moxibustion`、`movement`、`products`；不表示正在接受某种治疗。
- 当 `date > today` 时，疼痛、情绪、精力、睡眠和流量全部忽略，出血状态不作为未来事实，输出统一标记“未来参考安排”。偏好和想了解的主题仍可用于提前准备。
- 输入是纯数据；输出也不含 HTML。渲染器须转义昵称、偏好及文化灵感文本。函数不写存储、不修改输入、不读取当前时钟。

## 输出与顺序

返回：

```js
{
  phaseLabel, certainty, headline, contextNotes,
  priorities, support, tcm, avoid, culture, ask,
  selectedArticleIds, consideredCount, daily
}
```

每张卡片含 `id`、`title`、`body`、`reason`、`articleIds`、`kind`；优先医疗卡另有 `urgency: 'medical'`。`reason` 写明本次触发依据，`articleIds` 指向现有原文与来源。`consideredCount` 是已加载知识库的唯一文章数，当前为 48；并不表示把 48 篇全文全部显示在一天里。

底层规则卡保留用于核查和 AI 输入。页面使用 `daily` 把它们重新组织为同一份方案：先减轻负担、吃饭与饮水、休息与相处；有医疗优先信号时在最前加入求助。饮食项同时合并经期饮食资料、中医服药忌口条件和可选草药核对；休息项同时使用睡眠/情绪资料与本人支持选择，不把知识分栏堆在页面上。每项保留来源 ID、具体触发原因和资料性质，医疗卡不因重新组织而消失。

## 医疗优先规则

| 触发 | 具体行动 | 原文依据 |
| --- | --- | --- |
| 非未来日期，疼痛至少 8/10 | 协助联系医生或医疗服务，暂停把其他安排放在求助前；急诊情形只作“如果出现”的条件说明 | `health-urgent-pain`、`health-cramps`、`health-help-now` |
| 本人勾选流量明显偏多 | 带上实际日期、用品更换频率、漏出及生活影响，安排医生评估 | `health-heavy-flow`、`health-help-now` |
| 本人勾选经期外或异常出血 | 记录发生日期、流量和伴随不适，与医生讨论，不凭颜色判断原因 | `health-abnormal-bleeding`、`health-irregular`、`health-help-now` |
| 明确 `bleedingState === 'ongoing'` 且周期日超过 7 | 记录仍在出血的实际情况并咨询医生，不按参考天数隐藏变化 | `health-bleeding-days`、`health-heavy-flow` |

“尚未结束”才触发持续出血规则。未知结束日的参考窗口不表示一直出血，已经确认结束日的历史记录也不自动变成“仍在出血”。医疗优先只使用实际输入，不依据生日、生肖、五行、MBTI 或自由文本推断。

选择了解针灸、艾灸或中药不会移走医疗卡，普通饮食和中医问题整理也不能代替求助。医疗优先信号存在时收起文化卡片。

## 周期与当天感受

阶段复用 `MoonCompanion.determineStage`：已确认经期、参考窗口、预计经前 0–7 天、实际结束后 7 天、预计日期已过、周期中段或未知。它只帮助安排，不证明当天一定有任何症状。

- 经前：准备本人熟悉的用品，给行程和约会留出取消或缩短余地。
- 实际经期：接手一件事务，按精力保留活动或休息选择；实际轻中度疼痛时可提供隔布温热敷或温水淋浴选项，不适就停。
- 参考窗口：明确尚未确认出血或结束日，不用预测补造记录。
- 经后：保留实际结束日，逐步恢复日常，回看一件下次想保留的照护。
- 预计日已过：只在本人确认后更新真实日期；持续周期变化需带记录讨论，不自动判断怀孕。
- 未知或普通日期：先整理愿意分享的记录和日常分担，不强制按周期标签休息。

精力低或实际疼痛至少 5/10 会缩短非必要外出和长时间安排；睡眠差会增加睡前收尾、减少晚间咖啡因/屏幕刺激的行动；紧绷或很难受会降低解释与回应压力，并提醒生活已受影响时寻求专业支持。不会据几次勾选诊断 PMS、PMDD 或焦虑障碍。

沟通话术、家务分担与“留出弹性”等为编辑建议，卡片使用 `kind: 'editorial'` 或在原因中说明性质。独处选项只留“需要时联系”的入口，不要求立即回复或强制见面。

## 中医内容怎样落到行动

默认有一张有用的中医日常调护卡：准备实际耐受的普通一餐、规律进食与饮水；若已有服药忌口，先问开方医师适用条件；不因为正在月经期就自动加入调经茶、补药或药膳。

| 想了解的主题 | 具体行动与来源范围 |
| --- | --- |
| 中医基础 | 整理实际起止日、疼痛和现用药，问辨证依据、风险与替代选择。传统诊疗框架不等于生物机制验证，也不生成体质诊断。 |
| 中药/药膳 | 核对产品完整成分、现用中西药和补充剂清单，交医师或药师评估；不照搬他人药方、不加量混用。综合 `tcm-herbal-safety`、`tcm-food-herb-interactions`、`health-medication`。 |
| 针灸 | 同时询问适用性、当地执业资质、一次性无菌针具及复评安排。已收录疗效综述是 2016 年、检索截至 2015 年 9 月，不冒充当前全部研究的实时结论。 |
| 艾灸 | 先了解皮肤不适和烫伤风险；是否适合先专业评估。不提供自行点燃、穴位、距离或时长参数。医院科普不当作高质量疗效试验。 |

最多显示 4 张中医卡：默认卡可合并基础就诊问题，其他三个具体兴趣各一张。安全与知识兴趣不等于确认已在接受治疗。

## 文化栏目与全库可追溯

文化卡仅在 `culture === true`、非安静模式且无优先医疗信号时出现；实际情绪很难受时也收起。它只使用传入的编辑灵感和可选生活安排，不推断命运或改变临床卡片。开启或关闭文化，健康、沟通、中医与需避开卡片保持相同。

18 篇文化知识按日期的固定六日循环分为 6 个阅读主题，每天只显示一组的 3 个来源，避免把全部资料挤进一日。这个循环是产品中的内容轮换，不是民俗择日算法：

1. 年界与生肖：`culture-birth-snake`、`culture-spring-festival-lichun`、`culture-branches-zodiac`。
2. 日干符号：`culture-stem-branch`、`culture-ten-stems-elements`、`culture-day-stem-not-bazi`。
3. 资料与口径：`culture-unknown-birth-hour`、`culture-day-pillar-boundary`、`culture-why-sixty-cycle`。
4. 审美与小仪式：`culture-colors-accessories`、`culture-yi-ji-as-ritual`、`culture-generating-overcoming-cycles`。
5. 记录优先：`culture-calendar-systems`、`culture-cycle-is-personal`、`culture-record-before-interpret`。
6. 不生成健康禁忌：`culture-sheng-ke-terms`、`culture-zodiac-no-taboo`、`culture-emotion-not-deficiency`。

`getRuleCoverage()` 返回每组规则的 ID、触发说明和文章 ID，含全部 48 篇的可执行用途。测试检查没有孤立文章、虚构引用，并实际生成涵盖全部 48 篇的场景输出。知识原文、逐段引用和来源核对说明仍保留在三个数据文件及来源审计文档中。

## 验证范围

测试覆盖阶段差异、严重疼痛/出血优先、实际持续出血与未知/已结束的区分、针灸兴趣不取代求助、独处及自由文本处理、睡眠与精力实质改变计划、草药三方面安全、文化开关不改健康卡片、未来忽略症状、输入纯函数性，以及 48 篇引用覆盖。规则测试验证输出与这些契约一致，不证明对某位使用者的临床疗效。

### 仅依据本人表达的编辑建议

`support-choice` 不引用临床文章：通用陪伴话术来自明确支持选项与编辑安排，不因普通沟通需求而关联焦虑知识。参考经期的用品准备另关联 `health-products`。医疗优先卡只说明落实求助与普通日常照护的边界，针灸与艾灸的证据和风险由选中主题后的独立卡片承担。

## 页面与百科如何衔接（2026-10-28）

`daily` 包含 `summary`、`facts`、`actions`、`message`、`preferences`、`followUp`、`avoid`、`culture`。常规方案三项，有医疗优先时四项；未填感受只给通用安排，未来不确认症状。

- `public/advice-view.js` 将同一份数据渲染成按实际安排顺序阅读的方案，不改变周期数据。
- 百科顶部使用当前方案的摘要与行动，文章显示其被哪些行动引用；没有触发条件的资料不硬加到当天。
- 文化启用后，手记所选元素和仪式同步到方案的可选休息空档；独处、精力等只调整活动安排，不用生肖决定健康措施。关闭文化不改变医学、饮食和陪伴建议。出生年干与日干关系标为两枚传统符号的比较。
- 经期日期与预测收在可展开区域，保留直接记录入口；API 分析和原文阅读位于当前方案之后。

本次重新打开核查了 NHS 痛经、PMS、睡眠与香港卫生署中药服药忌口原文；未声称全库于本日重新审查，也未添加新的疗效承诺。各文章原有核对日期与支持范围继续保留。
