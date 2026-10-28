# 分期照护知识组织与来源审计 · 4.5

数据唯一来源为 `public/phase-knowledge.js`。百科、日期框与AI上下文共用它；不复制成三份分别维护的文案。

## 固定层级

`阶段 → 栏目 → 条目 → 来源`。四份指南的ID为 `phase-care-menstrual`、`phase-care-follicular`、`phase-care-ovulation`、`phase-care-luteal`；“经后卵泡期”是界面阅读区间，医学卵泡期仍从月经开始，不能掩盖重叠。

每份严格按同一顺序：

| 栏目ID | 用户看到的栏目 | 放什么 |
| --- | --- | --- |
| overview | 认识这个阶段 | 定义、边界及界面拆分 |
| changes | 可能的变化 | 可出现但非必然的变化，不能代写本人症状 |
| actions | 今天怎么照护 | 有条件的照护原则、可拒绝的具体安排 |
| food_movement | 饮食与活动 | 各期通用原则、根据本人情况安排；不制造专属必吃食物 |
| seek_help | 何时寻求帮助 | 明确条件下的求助，不因阶段降低医疗优先级 |
| limits | 不能据此判断什么 | 记录、预测和医学确认的区别 |

条目主键是“指南ID / 栏目ID / 条目ID”。共用条目保留一致ID并标 `shared:true`，显示为“各期通用”。阶段名不是适用于每个人的行动指令。

## 事实与行动分开

- `fact`：资料事实，必须有 `refs`，逐项可点原文。
- `care`：来源支持的照护原则，同样必须有 `refs`，有适用条件时保留 `when`。
- `editorial`：本站把原则落成沟通、做饭、分担任务的行动示例，明确标注，不伪装成原文建议或治疗方案。
- `limit`：产品的边界说明；若附来源，来源支持相关背景，不表示来源研究过本网站或聊天算法。

`refs` 关联中央来源ID；每个来源含标题、URL、核对日期、支持范围。生成的文章 `body/paragraphSources/sources/verification` 与六栏目保持同一顺序，供既有百科、引用和AI接口使用。来源核对日期不是医学审稿或指南发布日期。

## 阅读与建议如何融合

百科保留三个顶层模块，百科内部为“相关书籍 / 分期照护 / 照护指南”。分期照护只用阶段筛选，专题指南使用原有领域/问题筛选，两种筛选不叠在一起。

日期框显示所选阶段的一条可拒绝行动及该指南入口。阶段未知时只提供四份阅读选择，不替用户选定阶段。

服务端依据 `phaseAssessment` 默认加入当前阶段的一份指南；问题明确提到其他阶段或从百科带入资料时，可以并列阅读，但不改写所选日期的阶段或个人记录。医学知识供western领域引用；心理支持继续使用心理学来源，中医/文化保留各自边界，不从这些资料制造分期辨证、五行禁忌或疗效。饮食引用仍需已有nutrition-来源。

知识升级改变上下文版本，旧AI分析需重新生成。没有API响应时，本地知识与行动示例明确标为资料/编辑内容，不标为AI已分析。

## 已核对来源

以下12个来源均于2026-10-28打开核对公开内容。只摘要支持范围，不复制整篇或书籍全文。

| 来源ID | 原文 | 支持范围 |
| --- | --- | --- |
| cycle | [NHS · Periods and fertility in the menstrual cycle](https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/) | 周期起点、排卵事件、与下次月经的间隔及其不确定性。 |
| menstruation | [NICHD · About Menstruation](https://www.nichd.nih.gov/health/topics/menstruation/conditioninfo) | 月经的定义、周期起点、出血后卵泡及内膜变化。 |
| follicular | [NLM MeSH · Follicular Phase](https://www.ncbi.nlm.nih.gov/mesh?Cmd=DetailsSearch&Db=mesh&Term=%22Follicular+Phase%22%5BMeSH+Terms%5D) | 卵泡期从月经开始至排卵，卵泡发育、雌激素与内膜增生。 |
| luteal | [NLM MeSH · Luteal Phase](https://www.ncbi.nlm.nih.gov/mesh?Cmd=DetailsSearch&Db=mesh&Term=%22Luteal+Phase%22%5BMeSH+Terms%5D) | 排卵后黄体发育及孕酮增加，至下一次月经开始的分期定义。 |
| pain | [NHS · Period pain](https://www.nhs.uk/symptoms/period-pain/) | 痛经可能表现、包裹热源及轻柔活动、严重或异常疼痛的求助条件。 |
| ovulationPain | [NHS · Ovulation pain](https://www.nhs.uk/symptoms/ovulation-pain/) | 部分人的单侧疼痛、相似病因、反复或严重疼痛及可能怀孕时的求助。 |
| pms | [NHS · PMS (premenstrual syndrome)](https://www.nhs.uk/conditions/pre-menstrual-syndrome/) | 可能的经前症状、生活照护、至少两个周期日记及影响生活时的就医建议。 |
| meals | [NHS · The Eatwell Guide](https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/) | 食物组及一天或一周的整体饮食平衡，不是分期专属食谱。 |
| iron | [NIH ODS · Iron: Fact Sheet for Consumers](https://ods.od.nih.gov/factsheets/Iron-Consumer/) | 含铁食物、经量多的缺铁风险及补充剂风险，不是贫血诊断。 |
| activity | [Office on Women’s Health · Physical activity and your menstrual cycle](https://womenshealth.gov/getting-active/physical-activity-menstrual-cycle) | 个人精力可不同、观察运动时感受；不支持为每个阶段强制统一运动强度。 |
| signals | [Office on Women’s Health · Trying to conceive](https://womenshealth.gov/pregnancy/you-get-pregnant/trying-conceive) | 体温、分泌物及LH观察的用途和局限，不是聊天或日历确认排卵的方法。 |
| bleeding | [NHS · Vaginal bleeding between periods or after sex](https://www.nhs.uk/symptoms/vaginal-bleeding-between-periods-or-after-sex/) | 经间或性交后出血应检查；月经推迟、异常出血伴腹痛需尽快评估。 |

自动检查覆盖四阶段、六栏目顺序、事实与原则的逐项引用、来源映射、专题/分期过滤、日期上下文选择及模型引用领域。它们不证明医学语义永远正确；语义本次按公开原文人工核对。真实付费模型的建议质量尚未实测。
