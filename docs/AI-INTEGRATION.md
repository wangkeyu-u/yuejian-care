# 可选 AI 分析

浏览器创建白名单请求，Worker 再验证实际记录、重算日期并选取已核对知识，调用固定的 `https://api.openai.com/v1/responses`。没有任意接口 URL、工具调用、自动记忆或日期写回。

## 用户可见的数据流

1. 点击分析，填写 Key 和模型，查看本次数据预览。
2. 确认同意后，Key 仅在本次请求的 Authorization 头发送至本站，再转发给 OpenAI。
3. 数据包含最多24次周期记录、参考设置、选定日期和结构化选项。身份信息、自由文本小记和喜恶不进入模型请求。
4. Key 不落本项目存储，结果只在当前页面暂存；编辑相关数据后结果失效。

OpenAI 请求为 `store:false`，使用严格 JSON schema。服务端校验结果形状、文章 ID 和完整状态；网络、权限、额度、拒答或结构异常时保留本地建议。模型可以解释规律与不确定性，不能承诺下一次日期或自行补造医学事实。日期统计由 `public/forecast.js` 决定。

## 实现边界

- 同源 Origin 校验、POST/JSON限制、96KiB 请求体限制、模型 ID/Key 基本格式校验、45秒超时。
- 不返回上游错误正文，不记录请求体和 Authorization；无密钥环境变量、数据库或本项目账号计费。
- 默认 `gpt-4.1-mini`，用户可指定有权限且兼容的 `gpt-*` 模型。是否可用以其 API 账号返回结果为准。
- 模型输出可能有语义错误，即使文章 ID 存在也不保证文字完全受来源支持。原文入口和本地医疗优先建议保留可见。
- 本项目不能替托管平台或 OpenAI 保证零日志/零保留；部署者应使用可信托管。不要向不信任的实例提交 Key。

## 官方接口依据

- [API 身份验证与密钥保密](https://developers.openai.com/api/reference/overview#authentication)
- [结构化输出、拒答和不完整响应](https://developers.openai.com/api/docs/guides/structured-outputs)
- [GPT-4.1 mini 模型能力](https://developers.openai.com/api/docs/models/gpt-4.1-mini)

本次以模拟上游请求验证接口契约，尚未用真实用户 Key 做付费端到端调用。不能把模拟响应通过当成实际模型成功。
