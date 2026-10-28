# 每日分析与连续对话

## 接口与状态

`POST /api/day` 接收 `mode: analysis | chat | memory`。前后端共同使用 `public/day-context.js` 清洗记录、构建签名和选择资料。服务端重新验证日期、实际经期与参考设置，不采信客户端传来的预测。

analysis 返回四领域 sections（culture、tcm、western、psychology）、food、摘要与不确定性。每个领域需1至3条结构化行动 `{when,task,how,adjust}`；food 需早餐、午餐、晚餐各含 `{slot,foods,swap,prepare}`，并含行动、公开营养来源、依据与限制。chat 返回回答、结构化行动、资料 ID 和不确定性。客户端按日期保存，并用签名与请求序号检查响应是否仍对应当前记录；切换日期、保存相关设置或关闭框会取消旧请求。

会话保存在 `yuejian.days.v1`，每日期独立。每次追问携带当日四块分析和最近最多6轮消息（浏览器将90KiB预算内保留最近的完整轮次）；本机保存最多50轮，超出前提示先导出再开启新一段，不静默删除旧消息。重新生成保留上一版 previous 快照；目前没有完整的无限版本历史 UI。

签名包含资料/提示版本、所选日期、当前上海日期、模型、周期、当天感受、明确偏好、已确认且有效的记忆及提取开关、文化设置；不含 API Key。日期跨日或相关输入改变后旧结果过期，不能继续作为有效上下文。新增待确认候选不会改变建议签名；确认、修改、删除或关闭使用会立即使相关旧分析过期。过去日期的参考预测只使用该日及之前的实际开始记录，后录入的信息仍可能改变回看结果，旧分析保留可核对。

## 数据流

1. Key 在设置中由用户填写，保存在当前页面内存或用户勾选的标签页 sessionStorage；不进入 localStorage、数据库、备份或应用日志。
2. 用户打开日期后可先修改实际情况。未保存的草稿不会悄悄进入 AI，生成前要求先保存。
3. 用户确认范围后，浏览器将 Key 置于 Authorization 头，白名单资料发往本站同源接口。
4. 服务端以生日计算文化符号后移除原生日与签名，不把昵称、城市发给模型。模型接收明确同意发送的饮食限制、结构化感受、文字小记、已同意的喜恶、相关资料、同日分析及对话。已确认长期背景由服务端清洗后以 JSON 数据块追加到 instructions，静态规则明确其不是指令或医学确证；不复制原始来源全文。
5. 以固定 HTTPS OpenAI Responses 端点、store:false、严格 JSON schema 调用，不允许用户指定任意转发地址或工具执行。
6. 验证完成状态、拒答、四块唯一性、每块行动、三餐完整性、文本边界和来源 ID/领域；饮食引用限 nutrition-资料；错误不覆盖已有记录。

限制：同源 Origin、POST/JSON、96KiB 输入、45秒上游超时；模型需支持 Responses 与结构化输出。API 账户权限、额度或模型能力以实际返回为准。应用不承诺平台或 OpenAI 零日志保留。

## 已知验证与限制

API 测试使用模拟上游，不证明实际 Key 有权限或当前模型输出质量。日期对话和设置在真实浏览器复验，测试记录为虚构数据。文章 ID 校验不能证明每句模型文字有充分支持，也不能把文化和传统理论变成临床结论。

本地规则独立保留医疗优先提示。AI 不自动写入经期、记录、用药或诊断；明确的长期信息可带逐字原句提取为候选，核对后采用；临时症状仍应保存到当天情况。记忆机制和限制见 [LONG-TERM-MEMORY.md](LONG-TERM-MEMORY.md)。

## 行动与饮食的边界

`public/care-output.js` 由服务端及浏览器共用。新结果缺行动、时间/做法/调整、餐次/替换/准备步骤时不保存；旧记录的字符串行动和缺 food 状态仍可查看，但版本签名使其过期，需重新生成才可继续对话。追问带上本日饮食方案；饮食设置变化即时更新上下文。

具体安排与菜式为可调整示例，不能把日程时间当医学阈值。未知过敏/膳食医嘱时先确认；已知限制发送并要求遵守。结构校验和引用 ID 不能保证每道菜适合个人，也不能保证所有语义具体、正确。书籍目录/简介仅用于百科阅读导航，书籍全文未发送模型。

## 官方接口依据

- [提示词角色与指令优先级](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)
- [手动传递对话状态](https://developers.openai.com/api/docs/guides/conversation-state)
- [结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)
- [API 身份验证与密钥保密](https://developers.openai.com/api/reference/overview#authentication)
