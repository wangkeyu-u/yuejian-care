/*
 * Chinese-medicine literacy for menstrual-care conversations.
 * Sources were read on 2026-10-26. Traditional frameworks, clinical evidence,
 * and editorial communication tips are explicitly distinguished per article.
 * No individual diagnosis, prescription, dose, or self-needling instructions.
 */
(function attachMoonTCM(root, factory) {
  var articles = factory();
  if (typeof module === 'object' && module.exports) module.exports = articles;
  if (root) root.MoonTCMArticles = articles;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMoonTCMArticles() {
  'use strict';
  return [
  {
    "id": "tcm-pain-language",
    "kind": "tcm",
    "category": "中医基础",
    "title": "中医说的“不通则痛”，该怎样理解？",
    "summary": "先分清传统理论的语言，再问清诊断依据，不把一句术语当成病因检查。",
    "body": [
      "北京市中医药管理局的痛经科普用“经行腹痛”介绍经期前后的周期性疼痛，并以“不通则痛”“不荣则痛”概括中医理论中的两类解释。这些是该理论体系的表达，本条不将其写成已经证实的生物机制。",
      "香港卫生署对辨证论治的介绍强调：综合病情资料，分析现时疾病的原因、部位和性质，再作判断。这不支持只凭一个血块、某天的心情或出生五行就自动给出证型。",
      "如果她希望看中医，可以一起问：“这个判断依据哪些表现？还需要什么检查或转介？”本网站帮助整理问题，不输出体质诊断，也不根据这些词生成药方。"
    ],
    "tags": [
      "痛经",
      "传统理论",
      "辨证",
      "不通则痛"
    ],
    "sources": [
      {
        "title": "北京市中医药管理局 · 中医视角下的痛经调理（2026年科普）",
        "url": "https://zyj.beijing.gov.cn/sy/whkp/202602/t20260209_4503394.html"
      },
      {
        "title": "香港卫生署中医药规管办公室 · 中医诊病方法和特点",
        "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Diagnostic_Methods_and_Features_of_CMP.html"
      }
    ],
    "paragraphSources": [
      [
        0
      ],
      [
        1
      ],
      []
    ],
    "verification": {
      "checkedAt": "2026-10-26",
      "basis": "traditional",
      "note": "来源为主管部门科普与传统诊疗框架介绍，不是验证中医病机的生物学实验，也不是具体疗法的疗效试验。最后一段是编辑整理的就诊沟通建议。",
      "sourceNotes": [
        {
          "url": "https://zyj.beijing.gov.cn/sy/whkp/202602/t20260209_4503394.html",
          "supports": "支持第一段的经行腹痛及两类传统病机术语；不能证明这些术语等同于已证实的现代生物机制。"
        },
        {
          "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Diagnostic_Methods_and_Features_of_CMP.html",
          "supports": "支持第二段的综合病情资料与辨证论治原则；不支持凭生日、五行或单项症状自动诊断。"
        }
      ]
    }
  },
  {
    "id": "tcm-visit-preparation",
    "kind": "tcm",
    "category": "中医基础",
    "title": "看中医前，可以把哪些经期记录带上？",
    "summary": "记录实际经过，准备想问的问题；不靠网页自己完成四诊。",
    "body": [
      "香港卫生署介绍的四诊包括观察、听闻、询问及触按等方法；其中问诊会了解发病经过、自觉症状和既往诊治情况。线上勾选几个选项不能代替完整诊察。",
      "记录上可以准备每次实际开始与结束日、疼痛发生的日期及对生活的影响，以及已有检查、正在使用的药物和补充剂。这是帮助她讲清经过的记录建议，不是自行辨证表。她愿意时，伴侣可以协助整理。",
      "香港卫生署的病人权益说明包括了解病情与治疗计划、询问检查或治疗目的、常见副作用及替代方法，以及索取自己的处方。可以把这些问题带进诊室。"
    ],
    "tags": [
      "就诊准备",
      "四诊",
      "记录",
      "知情选择"
    ],
    "sources": [
      {
        "title": "香港卫生署中医药规管办公室 · 中医诊病方法和特点",
        "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Diagnostic_Methods_and_Features_of_CMP.html"
      },
      {
        "title": "香港卫生署中医药规管办公室 · 向中医求诊病人的权益与责任",
        "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Patients_Rights_and_Obligations.html"
      }
    ],
    "paragraphSources": [
      [
        0
      ],
      [
        0
      ],
      [
        1
      ]
    ],
    "verification": {
      "checkedAt": "2026-10-26",
      "basis": "mixed",
      "note": "四诊部分是传统诊疗方法介绍，权益部分是官方就医指导；第二段的经期记录清单是编辑整理，不是一套诊断标准。",
      "sourceNotes": [
        {
          "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Diagnostic_Methods_and_Features_of_CMP.html",
          "supports": "支持第一段四诊与问诊所涵盖的信息；第二段是依此整理的沟通清单，不用于自我诊断。"
        },
        {
          "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Patients_Rights_and_Obligations.html",
          "supports": "支持第三段了解病情、治疗目的、常见副作用、替代方案及索取处方等病人权益；香港具体执业规定不外推到其他地区。"
        }
      ]
    }
  },
  {
    "id": "tcm-diet-conditions",
    "kind": "tcm",
    "category": "中医调护",
    "title": "中医调护里的“忌口”，先问清适用条件",
    "summary": "服药期间的饮食建议与病情、药物和个人情况有关，不自动套用到所有人的经期。",
    "body": [
      "香港卫生署的服药专题说明：中药的服用方法、时间与饮食禁忌，会因病情、年龄和体质而异；文中也反对几乎所有食物都要忌的说法。这是在中医用药语境下的指导，不是“所有女性经期通用”的食物黑名单。",
      "如果她得到饮食调整建议，可以问清针对什么情况、持续多久，以及是否与正在服用的药有关。网站不按经期第几天、属相或日干五行自动禁止某种食物；可以记下她实际感到不舒服的食物，再与专业人员讨论。"
    ],
    "tags": [
      "饮食",
      "忌口",
      "用药沟通",
      "经期调护"
    ],
    "sources": [
      {
        "title": "香港卫生署中医药规管办公室 · 中药服药常识、服药忌口和储存方法",
        "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/feature_articles/Knowledge_of_Taking_Chinese_Medicines_Precautions_and_Storage_Method.html"
      }
    ],
    "paragraphSources": [
      [
        0
      ],
      [
        0
      ]
    ],
    "verification": {
      "checkedAt": "2026-10-26",
      "basis": "traditional",
      "note": "来源是中医服药与饮食管理科普。它支持个体化询问，不证明某种食物普遍导致痛经，也不提供经期所有人的统一禁忌。",
      "sourceNotes": [
        {
          "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/feature_articles/Knowledge_of_Taking_Chinese_Medicines_Precautions_and_Storage_Method.html",
          "supports": "支持第一段服药时间、方法及忌口因人因病而异；第二段是网站据此设计的沟通建议，不是疗效或因果结论。"
        }
      ]
    }
  },
  {
    "id": "tcm-acupuncture-evidence",
    "kind": "tcm",
    "category": "疗法与证据",
    "title": "针灸缓解经痛：看到“研究”后，还要看什么？",
    "summary": "一篇2016年综述提示证据质量的局限；它不是2026年全部研究的实时结论。",
    "body": [
      "Cochrane于2016年发表的这篇综述，检索截至2015年9月，纳入42项试验、4640名参与者，研究针刺或穴位按压对原发性痛经的效果。其结论是证据不足以确定疗效，各比较的证据质量低或很低，多数比较缺少不良事件资料。",
      "这是一篇有明确年份和范围的既有综述，不能直接代表2026年的全部研究，也不能将其结果外推成“所有类型经痛都已证明有效”或“完全无效”。本条用于解释证据的限制，没有做最新研究的完整系统评价。",
      "若她想尝试，可询问专业人员：研究针对哪种经痛、预期改善什么、风险有哪些、费用与复评安排是什么。伴侣可以帮她记下疼痛对生活的影响，不把一次体验当作所有人的效果。"
    ],
    "tags": [
      "针灸",
      "穴位按压",
      "原发性痛经",
      "证据质量"
    ],
    "sources": [
      {
        "title": "Cochrane · Acupuncture for period pain（2016；检索截至2015年9月）",
        "url": "https://www.cochrane.org/evidence/CD007854_acupuncture-period-pain"
      }
    ],
    "paragraphSources": [
      [
        0
      ],
      [
        0
      ],
      []
    ],
    "verification": {
      "checkedAt": "2026-10-26",
      "basis": "clinical",
      "note": "2016年Cochrane系统综述，证据检索截至2015年9月。用于展示该综述的限定结论，不作为2026年全部研究的实时综合或个体疗效保证。最后一段为编辑沟通建议。",
      "sourceNotes": [
        {
          "url": "https://www.cochrane.org/evidence/CD007854_acupuncture-period-pain",
          "supports": "支持第一段的年份、检索截止、样本规模、适用原发性痛经、低或很低证据质量及不良事件资料不足；第二、三段为证据解读与就诊沟通建议。"
        }
      ]
    }
  },
  {
    "id": "tcm-acupuncture-safety",
    "kind": "tcm",
    "category": "疗法与证据",
    "title": "针灸也需要合资格人员与安全管理",
    "summary": "关心疗效时，也问清针具、操作和不适处理；网站不提供自行下针教程。",
    "body": [
      "NCCIH提醒，针具不洁或治疗操作不当可导致并发症；不当针刺可能造成感染、器官损伤等严重不良后果。该页面也介绍一次性无菌针具的安全要求，并提醒不要用针灸推迟必要的就医。",
      "如果她选择针灸，可以先确认提供者在当地具备相应执业资格，并问清针具管理、治疗前需要告知的健康信息及出现不适时的处理。这里提供就诊问题，不提供穴位定位、自针步骤或疗程承诺。"
    ],
    "tags": [
      "针灸安全",
      "专业资质",
      "无菌针具",
      "就医"
    ],
    "sources": [
      {
        "title": "NCCIH · Acupuncture: Effectiveness and Safety",
        "url": "https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety"
      }
    ],
    "paragraphSources": [
      [
        0
      ],
      [
        0
      ]
    ],
    "verification": {
      "checkedAt": "2026-10-26",
      "basis": "clinical",
      "note": "NCCIH的治疗安全信息支持风险沟通与合资格服务选择；不是针对经痛的疗效保证，也不把美国监管制度直接视为其他地区的法律。",
      "sourceNotes": [
        {
          "url": "https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety",
          "supports": "支持第一段针具不洁及操作不当的并发症风险、无菌一次性针具与不得延迟必要就医；第二段为落实这些安全原则的沟通清单。"
        }
      ]
    }
  },
  {
    "id": "tcm-moxibustion-risk",
    "kind": "tcm",
    "category": "疗法与证据",
    "title": "艾灸并非“越热越好”，先了解烫伤风险",
    "summary": "艾灸是传统治疗方法；是否适合与怎样实施，需要先由专业人员评估。",
    "body": [
      "香港卫生署将艾灸介绍为利用灸火热力刺激穴位的中医疗法。这个定义说明它是什么，不等于已经证明它对每一种经痛有效，也不能据此判定每个人都适合。",
      "湖南中医药大学第一附属医院2024年科普提示，居家艾灸可能出现皮肤干燥、瘙痒和烫伤，施灸过久或过量会增加问题。医院的风险提醒是科普信息，不是艾灸治疗经痛的随机试验。",
      "不要因为她怕冷、生日属某种五行，就替她安排艾灸。若她有意尝试，先问合资格专业人员是否适合及如何处理不适；这里不提供穴位、点燃、时长或距离等自行操作步骤。"
    ],
    "tags": [
      "艾灸",
      "烫伤",
      "治疗选择",
      "专业评估"
    ],
    "sources": [
      {
        "title": "香港卫生署中医药规管办公室 · 中医疗法",
        "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Chinese_Medicine_Treatments.html"
      },
      {
        "title": "湖南中医药大学第一附属医院 · 想自己在家艾灸？这几点一定要注意（2024）",
        "url": "https://m.hnzyfy.com/news_hos_yldt/2024/Rb49BgdB.html"
      }
    ],
    "paragraphSources": [
      [
        0
      ],
      [
        1
      ],
      []
    ],
    "verification": {
      "checkedAt": "2026-10-26",
      "basis": "mixed",
      "note": "第一来源介绍传统疗法，第二来源为公立中医院的风险科普；两者均不是艾灸治疗经痛的高质量疗效试验。未采用原文的具体操作或水泡处理步骤。最后一段是本工具的编辑边界与就诊建议。",
      "sourceNotes": [
        {
          "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Chinese_Medicine_Treatments.html",
          "supports": "支持第一段艾灸的传统治疗定义；不支持对所有经痛的疗效与适用性承诺。"
        },
        {
          "url": "https://m.hnzyfy.com/news_hos_yldt/2024/Rb49BgdB.html",
          "supports": "支持第二段居家艾灸的皮肤不适、烫伤以及过久或过量的风险提醒；不采用其操作教学，不将传统解释写成已证实机制。"
        }
      ]
    }
  },
  {
    "id": "tcm-herbal-safety",
    "kind": "tcm",
    "category": "用药安全",
    "title": "“天然中药”也可能有不良反应",
    "summary": "调经用药需要对证、合适用法与质量管理，不根据网页结果自行配药。",
    "body": [
      "香港卫生署提醒，中药并非天然就没有副作用。药材混淆、质量问题、使用不当、过量或长期服用，以及过敏等，都可能带来不良反应；某些中药也可能影响孕妇或胎儿。",
      "其安全使用专题明确反对照搬他人的药方或民间验方，也不建议自行开药、随意增减或配搭。若已由中医处方，应问清诊断、使用方法及是否可以重配，依照专业人员指示使用。",
      "因此，网站不凭经色、血块、生日或“血虚”等标签推荐某个方剂或药材剂量。伴侣可以协助记录她已使用的产品和不适，交由医师或药师评估，不替她购买来历不明的调经药。"
    ],
    "tags": [
      "中药",
      "调经药",
      "不良反应",
      "不自行开方"
    ],
    "sources": [
      {
        "title": "香港卫生署中医药规管办公室 · 中药的不良反应",
        "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Adverse_Reactions_of_CM.html"
      },
      {
        "title": "香港卫生署中医药规管办公室 · 中药的安全使用",
        "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/feature_articles/Safe_Use_of_Chinese_Medicines.html"
      }
    ],
    "paragraphSources": [
      [
        0
      ],
      [
        1
      ],
      [
        0,
        1
      ]
    ],
    "verification": {
      "checkedAt": "2026-10-26",
      "basis": "clinical",
      "note": "香港卫生署的用药安全指导，支持风险与使用原则；不是某个调经方剂的有效性结论，不构成个体处方。",
      "sourceNotes": [
        {
          "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/Adverse_Reactions_of_CM.html",
          "supports": "支持第一段天然不等于无副作用、质量与用法问题、过敏及孕期相关风险。"
        },
        {
          "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/feature_articles/Safe_Use_of_Chinese_Medicines.html",
          "supports": "支持第二段不照搬验方、不自行配方、用药前求诊及明确处方使用安排；第三段为网站据此采用的产品边界。"
        }
      ]
    }
  },
  {
    "id": "tcm-food-herb-interactions",
    "kind": "tcm",
    "category": "用药安全",
    "title": "药膳、调经茶和补充剂，先核对成分",
    "summary": "“药食同源”不代表可以随意把草药加进饭里；合并用药也需要核对。",
    "body": [
      "香港卫生署的药补与食补资料指出，食物和中药的性质、用法及适用范围不同，药补应在中医指导下选择。不应仅因正在月经期，就从网站自动推导出需要进补或使用某种药膳。",
      "NCCIH说明，草药补充剂可增强或减弱一些药物的作用，也可能增加不良反应；许多组合的相互作用资料仍然不足。就诊时，应告知正在使用的全部药物与补充剂，并带上使用清单。",
      "准备调经茶或含药材的食物前，可以把完整成分交给她，并在她愿意时请医师或药师核对，尤其当她已有用药。先问是否想吃，再决定是否准备；不把普通一餐自动变成治疗。"
    ],
    "tags": [
      "药膳",
      "调经茶",
      "补充剂",
      "药物相互作用"
    ],
    "sources": [
      {
        "title": "香港卫生署中医药规管办公室 · 如何选择药补或食补？",
        "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/How_to_Choose_Between_Herbal_Tonics_and_Food_Tonics.html"
      },
      {
        "title": "NCCIH · 6 Tips: How Herbs Can Interact With Medicines",
        "url": "https://www.nccih.nih.gov/health/tips/tips-how-herbs-can-interact-with-medicines"
      }
    ],
    "paragraphSources": [
      [
        0
      ],
      [
        1
      ],
      [
        0,
        1
      ]
    ],
    "verification": {
      "checkedAt": "2026-10-26",
      "basis": "mixed",
      "note": "药补食补部分来自中医药科普；相互作用部分来自NCCIH安全信息。没有核实某个产品或配方，不宣称药膳能治疗痛经。",
      "sourceNotes": [
        {
          "url": "https://www.cmro.gov.hk/html/b5/useful_information/public_health/pamphlet/How_to_Choose_Between_Herbal_Tonics_and_Food_Tonics.html",
          "supports": "支持第一段食物与中药不等同、药补须按专业判断选择；不支持所有经期女性都应进补。"
        },
        {
          "url": "https://www.nccih.nih.gov/health/tips/tips-how-herbs-can-interact-with-medicines",
          "supports": "支持第二段草药补充剂与药物的潜在相互作用、资料不足及告知完整使用清单；不用于判定任何具体配搭安全。"
        }
      ]
    }
  }
];
});
