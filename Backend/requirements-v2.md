# 双智能体婚恋相亲平台｜完整开发需求文档

***

## 一、产品核心定位

本产品为**双智能体自主婚恋撮合平台**，核心创新：

- 每个人拥有**专属数字化婚恋智能体**
- 由两个智能体代替真人完成筛选、三观磨合、聊天测评
- 高度适配后才开放真人见面

**一句话：智能体先谈恋爱，真人再奔现。**

***

## 二、系统整体架构

1. **前端层**：页面交互、表单录入、状态展示、聊天窗口、AI对话实时气泡展示
2. **后端服务层**：接口逻辑、用户数据、匹配调度、权限控制、对话消息推送
3. **智能体算法层**：人格蒸馏、双AI对话、适配测评、风险检测

***

## 三、前端技术栈

| 类别     | 技术选型                      |
| ------ | ------------------------- |
| 框架     | Vue 3 / React 18          |
| 状态管理   | Pinia / Redux Toolkit     |
| 路由     | Vue Router / React Router |
| UI组件库  | Element Plus / Ant Design |
| HTTP请求 | Axios                     |
| 样式     | SCSS / Tailwind CSS       |
| 实时通信   | WebSocket / SSE           |
| 构建工具   | Vite                      |
| 代码规范   | ESLint + Prettier         |

***

## 四、前端页面结构

### 4.1 页面路由

| 路由路径            | 页面名称 | 访问权限  | 说明        |
| --------------- | ---- | ----- | --------- |
| /               | 首页   | 公开    | 引导页、品牌展示  |
| /login          | 登录   | 公开    | 手机号登录/注册  |
| /register       | 注册   | 公开    | 创建智能体     |
| /distill        | 人格蒸馏 | 已登录   | 填写人格资料    |
| /distill-result | 蒸馏结果 | 已登录   | 查看蒸馏状态    |
| /match          | 发起匹配 | 已蒸馏   | 匹配首页      |
| /matching       | 匹配中  | 匹配中   | AI对话实时展示  |
| /report         | 适配报告 | 报告生成后 | 查看匹配报告    |
| /unlock         | 解锁确认 | 报告查看后 | 同意/拒绝解锁   |
| /chat           | 真人聊天 | 已解锁   | 聊天界面      |
| /profile        | 个人中心 | 已登录   | 用户信息、匹配记录 |
| /settings       | 设置   | 已登录   | 账号设置      |

### 4.2 页面流程图

```
登录页 → 注册页 → 人格蒸馏 → 匹配首页 → 匹配中(AI对话) → 适配报告 → 解锁确认 → 真人聊天
                                    ↓
                               个人中心 ←→ 设置
```

***

## 五、前端功能模块

### 5.1 登录/注册模块

#### 功能描述

- 手机号验证码登录
- 首次注册自动创建智能体

#### 页面元素

- 手机号输入框
- 验证码输入框
- 发送验证码按钮（60秒倒计时）
- 登录/注册按钮
- 用户协议勾选

#### 交互逻辑

1. 用户输入手机号 → 点击发送验证码
2. 输入验证码 → 点击登录
3. 判断是否首次登录 → 首次则跳转人格蒸馏
4. 非首次则跳转匹配首页

***

### 5.2 人格蒸馏模块

#### 功能描述

收集用户说话风格、性格、恋爱模式、三观、雷点底线等人格数据

#### 页面元素

**第一步：基本信息**

| 元素   | 类型    | 说明             |
| ---- | ----- | -------------- |
| 头像上传 | 图片选择器 | 用户真实照片或卡通头像    |
| 昵称输入 | 文本输入  | 2-10个字符        |
| 性别选择 | 单选按钮  | 男/女            |
| 出生年月 | 日期选择  | 用于计算年龄         |
| 身高   | 数字输入  | 150-200cm      |
| 学历   | 下拉选择  | 高中/大专/本科/硕士/博士 |
| 职业   | 文本输入  | 当前职业           |
| 所在地  | 省市区选择 | 工作城市           |

**第二步：人格画像**

| 元素   | 类型      | 选项                       |
| ---- | ------- | ------------------------ |
| 说话风格 | 单选/卡片选择 | 幽默风趣、温柔细腻、直接干脆、文艺清新、霸气外露 |
| 性格类型 | 单选/卡片选择 | 外向开朗、内向文静、沉稳务实、活泼可爱、成熟稳重 |
| 恋爱模式 | 单选/卡片选择 | 浪漫型、务实型、陪伴型、独立型、粘人型      |

**第三步：婚恋三观**

| 元素     | 类型  | 说明                |
| ------ | --- | ----------------- |
| 婚姻观    | 单选  | 必须结婚/看缘分/不着急/单身主义 |
| 消费观    | 单选  | 节约型/享受型/平衡型       |
| 家庭观    | 单选  | 以家庭为重/个人独立/平衡     |
| 理想伴侣描述 | 文本域 | 描述理想伴侣的样子的        |

**第四步：雷点底线**

| 元素       | 类型   | 说明                    |
| -------- | ---- | --------------------- |
| 最不能接受的行为 | 多选标签 | 出轨、冷暴力、妈宝、赌博、酗酒、暴力、其他 |
| 最不能接受的习惯 | 多选标签 | 不讲卫生、抠门、沉迷游戏、好吃懒做、其他  |
| 底线补充说明   | 文本域  | 其他底线说明                |

#### 交互逻辑

1. 分步骤填写（4个步骤）
2. 每步有上一步/下一步按钮
3. 最后一步提交
4. 提交后显示"蒸馏中"状态
5. 轮询查询蒸馏结果

***

### 5.3 发起匹配模块

#### 功能描述

用户发起婚恋匹配，触发平台匹配逻辑

#### 页面元素

- 当前状态卡片（显示是否已完成蒸馏）
- 匹配说明文字
- 发起匹配按钮
- 历史匹配记录列表

#### 交互逻辑

1. 检查是否完成人格蒸馏
2. 未完成 → 引导完成蒸馏
3. 已完成 → 点击发起匹配
4. 调用后端接口 → 开始匹配流程

***

### 5.4 AI对话实时展示模块（核心功能）

#### 功能描述

实时展示双智能体对话内容，以聊天气泡形式呈现

#### 页面元素

**顶部状态栏**

| 元素      | 说明                     |
| ------- | ---------------------- |
| 匹配进度指示器 | 显示当前阶段：匹配中/AI对话中/报告生成中 |
| 匹配ID    | 匹配唯一标识                 |
| 对话轮数    | 当前第N轮对话                |

**对话区域**

| 元素     | 说明                |
| ------ | ----------------- |
| 聊天气泡容器 | 滚动容器，自动滚动到底部      |
| 左侧气泡   | 我方智能体发言（蓝色/主题色）   |
| 右侧气泡   | 对方智能体发言（灰色）       |
| 头像     | 智能体卡通头像           |
| 发言者名称  | "我方智能体" / "对方智能体" |
| 消息时间   | 消息发送时间            |
| 打字中动画  | 对方正在输入的动画效果       |

**底部信息栏**

| 元素     | 说明                  |
| ------ | ------------------- |
| 匹配说明   | "双方智能体正在沟通中，请稍候..." |
| 预估剩余时间 | 预计对话还需多长时间          |

#### 交互逻辑

1. 发起匹配后自动进入
2. 轮询调用 `/api/match/progress` 获取状态
3. 轮询调用 `/api/match/chat-record` 获取对话
4. 每获取新消息 → 渲染新气泡 → 自动滚动到底部
5. 对话结束 → 自动跳转到报告页面
6. 禁止用户任何操作，仅观看

#### UI/UX要求

**聊天气泡样式**

```
┌─────────────────┐
│ 我方智能体      │
│                 │
│ 消息内容消息内容 │
│          10:00  │
└─────────────────┘

          ┌─────────────────┐
          │ 对方智能体      │
          │                 │
          │ 消息内容消息内容│
          │           10:05│
          └─────────────────┘
```

**动画效果**

- 新消息出现：淡入 + 上滑效果（300ms）
- 气泡切换：平滑过渡
- 打字中：三个点脉冲动画
- 自动滚动：平滑滚动到底部

**沉浸式体验**

- 背景渐变/模糊效果
- 对话区域全屏展示
- 禁止返回/退出（需确认）
- 背景音乐（可选）

***

### 5.5 适配报告模块

#### 功能描述

展示双智能体匹配生成的适配报告

#### 页面元素

**报告头部**

| 元素   | 说明     |
| ---- | ------ |
| 匹配ID | 匹配唯一标识 |
| 匹配时间 | 匹配发生时间 |

**总分展示**

| 元素   | 说明              |
| ---- | --------------- |
| 匹配总分 | 0-100分，圆环/仪表盘展示 |
| 匹配等级 | 优秀/良好/一般/较差     |

**五维评分雷达图**

| 维度      | 说明         |
| ------- | ---------- |
| 情感契合度   | 情感交流匹配程度   |
| 价值观匹配度  | 人生观价值观一致程度 |
| 沟通舒适度   | 沟通风格契合程度   |
| 生活方式匹配度 | 生活习惯相近程度   |
| 未来规划契合度 | 对未来规划一致程度  |

**详细分析**

| 元素   | 说明       |
| ---- | -------- |
| 优势分析 | 双方匹配的优势点 |
| 风险提示 | 需要注意的问题  |
| 婚恋建议 | 给用户的建议   |

**操作按钮**

| 按钮   | 功能        |
| ---- | --------- |
| 同意解锁 | 同意解锁真人聊天  |
| 拒绝匹配 | 拒绝并结束匹配   |
| 分享报告 | 分享给朋友（可选） |

#### 交互逻辑

1. 调用 `/api/match/report` 获取报告数据
2. 渲染总分、五维雷达图、详细分析
3. 用户点击同意/拒绝 → 调用 `/api/match/unlock`

***

### 5.6 解锁确认模块

#### 功能描述

用户确认是否解锁真人聊天

#### 页面元素

- 当前选择状态（同意/拒绝）
- 对方头像（模糊/隐藏）
- 确认按钮
- 取消按钮

#### 交互逻辑

1. 用户选择同意/拒绝
2. 调用 `/api/match/unlock` 提交
3. 判断双方是否都已同意
4. 双方都同意 → 跳转到真人聊天
5. 有一方拒绝 → 显示匹配结束

***

### 5.7 真人聊天模块

#### 功能描述

解锁成功后，真人之间进行聊天

#### 页面元素

**顶部导航**

| 元素     | 说明       |
| ------ | -------- |
| 返回按钮   | 返回上一页    |
| 对方昵称   | 对方用户昵称   |
| 查看资料按钮 | 跳转查看对方资料 |

**消息区域**

| 元素    | 说明               |
| ----- | ---------------- |
| 消息列表  | 聊天消息             |
| 气泡样式  | 左对齐（对方）/ 右对齐（自己） |
| 时间分割线 | 显示消息时间           |

**底部输入区域**

| 元素    | 说明          |
| ----- | ----------- |
| 文本输入框 | 输入聊天内容      |
| 发送按钮  | 发送消息        |
| 表情按钮  | 打开表情选择器（可选） |

#### 交互逻辑

1. 进入页面调用 `/api/chat/list` 获取历史消息
2. 发送消息调用 `/api/chat/send`
3. 轮询或WebSocket获取新消息
4. 点击查看资料调用 `/api/user/other`

***

### 5.8 个人中心模块

#### 功能描述

展示用户个人信息及匹配记录

#### 页面元素

**用户信息卡片**

| 元素    | 说明          |
| ----- | ----------- |
| 头像    | 用户头像        |
| 昵称    | 用户昵称        |
| 性别/年龄 | 性别+年龄       |
| 智能体状态 | 已创建/未创建     |
| 蒸馏状态  | 已完成/进行中/未完成 |

**统计数据**

| 数据项   | 说明      |
| ----- | ------- |
| 匹配次数  | 历史匹配总次数 |
| 解锁次数  | 成功解锁次数  |
| 匹配成功率 | 解锁/匹配次数 |

**匹配记录列表**

| 元素   | 说明        |
| ---- | --------- |
| 匹配记录 | 每次匹配的简要信息 |
| 匹配时间 | 匹配发生时间    |
| 匹配结果 | 适配分数/是否解锁 |

***

## 六、前端组件设计

### 6.1 通用组件

| 组件名称    | 说明                  |
| ------- | ------------------- |
| Button  | 按钮组件（主要/次要/危险/禁用状态） |
| Input   | 输入框（文本/数字/验证码）      |
| Select  | 下拉选择器               |
| Card    | 卡片容器                |
| Modal   | 弹窗                  |
| Toast   | 提示消息                |
| Loading | 加载动画                |
| Empty   | 空状态                 |
| Avatar  | 头像                  |

### 6.2 业务组件

| 组件名称            | 说明          |
| --------------- | ----------- |
| PhoneInput      | 手机号输入+验证码   |
| StepWizard      | 步骤向导（人格蒸馏用） |
| PersonalityCard | 人格选项卡片      |
| TagSelect       | 标签多选（雷点选择）  |
| ChatBubble      | 聊天气泡        |
| ChatList        | 消息列表容器      |
| TypingIndicator | 打字中动画       |
| MatchProgress   | 匹配进度指示器     |
| ScoreGauge      | 分数仪表盘       |
| RadarChart      | 雷达图（五维评分）   |
| MatchRecordCard | 匹配记录卡片      |

***

## 七、前端状态管理

### 7.1 全局状态（Store）

```javascript
// 用户状态
{
  userId: string,
  phone: string,
  nick: string,
  gender: number,
  age: number,
  avatar: string,
  agentId: string,
  distillStatus: number, // 0-未完成 1-已完成
}

// 匹配状态
{
  matchId: string,
  status: number, // 0-匹配中 1-AI对话中 2-报告已生成 3-待确认 4-已终止 5-已解锁
  partnerId: string,
  chatRound: number,
  sessionId: string,
}

// 聊天状态
{
  messages: Message[],
  loading: boolean,
  hasMore: boolean,
}
```

### 7.2 本地状态（组件内部）

| 页面    | 本地状态             |
| ----- | ---------------- |
| 登录页   | 验证码倒计时、表单校验状态    |
| 蒸馏页   | 当前步骤、已填写数据缓存     |
| AI对话页 | 消息列表、滚动位置、打字动画状态 |
| 报告页   | 报告数据、按钮loading状态 |
| 聊天页   | 输入框内容、分页信息       |

***

## 八、前端API调用规范

### 8.1 请求封装

```javascript
// 请求拦截
- 添加token到Header
- 统一处理登录过期
- 统一处理业务错误

// 响应拦截
- 统一解析响应结构
- 统一处理错误提示
```

### 8.2 轮询封装

```javascript
// 匹配状态轮询
startPollingProgress(matchId)
stopPollingProgress()

// 对话记录轮询
startPollingChatRecord(matchId)
stopPollingChatRecord()

// 真人聊天轮询（可选WebSocket）
startPollingMessages(matchId)
stopPollingMessages()
```

***

## 九、数据库表结构（MySQL 5张表）

### 1. 用户表 user

```sql
CREATE TABLE `user` (
  id bigint AUTO_INCREMENT PRIMARY KEY,
  user_id varchar(64) UNIQUE NOT NULL,
  phone varchar(32),
  nick varchar(64),
  gender tinyint,
  age int,
  bottom_line json,
  create_time datetime DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 智能体表 user\_agent

```sql
CREATE TABLE `user_agent` (
  id bigint AUTO_INCREMENT PRIMARY KEY,
  agent_id varchar(64) UNIQUE NOT NULL,
  user_id varchar(64) UNIQUE NOT NULL,
  personality varchar(32)
);
```

### 3. 人格蒸馏表 user\_distill

```sql
CREATE TABLE `user_distill` (
  id bigint AUTO_INCREMENT PRIMARY KEY,
  user_id varchar(64) UNIQUE NOT NULL,
  speak_style varchar(32),
  character varchar(32),
  love_style varchar(32),
  values_view json,
  taboo json
);
```

### 4. 匹配记录表 match\_record

```sql
CREATE TABLE `match_record` (
  id bigint AUTO_INCREMENT PRIMARY KEY,
  match_id varchar(64) UNIQUE NOT NULL,
  user_a varchar(64),
  user_b varchar(64),
  status tinyint DEFAULT 0,
  a_op varchar(16),
  b_op varchar(16),
  unlock tinyint DEFAULT 0
);
```

### 5. 适配报告表 match\_report

```sql
CREATE TABLE `match_report` (
  id bigint AUTO_INCREMENT PRIMARY KEY,
  match_id varchar(64),
  score int,
  advantage text,
  risk text,
  suggest varchar(64)
);
```

***

1. 十、后端接口（11个核心接口）
   ### 1. POST /api/agent/init - 创建用户专属智能体
   #### 接口描述
   用于用户注册时创建专属婚恋智能体，绑定用户ID与智能体ID
   #### 请求参数
   | 参数名          | 类型     | 必填 | 说明           |
   | ------------ | ------ | -- | ------------ |
   | phone        | string | 是  | 用户手机号        |
   | nick         | string | 是  | 用户昵称         |
   | gender       | int    | 是  | 性别：1-男，2-女   |
   | age          | int    | 是  | 年龄           |
   | bottom\_line | object | 否  | 底线要求（JSON对象） |
   #### 请求示例
   ```json
   {
     "phone": "13800138000",
     "nick": "小明",
     "gender": 1,
     "age": 28,
     "bottom_line": {
       "min_age": 25,
       "max_age": 35,
       "min_height": 170,
       "education": "本科及以上"
     }
   }
   ```
   #### 响应参数
   | 参数名            | 类型     | 说明          |
   | -------------- | ------ | ----------- |
   | code           | int    | 状态码（200=成功） |
   | msg            | string | 提示信息        |
   | data           | object | 返回数据        |
   | data.user\_id  | string | 用户ID        |
   | data.agent\_id | string | 智能体ID       |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "智能体创建成功",
     "data": {
       "user_id": "user_20240101_001",
       "agent_id": "agent_20240101_001"
     }
   }
   ```
   ***
   ### 2. POST /api/user/distill - 保存人格蒸馏数据
   #### 接口描述
   保存用户的说话风格、性格、恋爱模式、三观、雷点底线等人格数据，并触发AI模型生成
   #### 请求参数
   | 参数名          | 类型     | 必填 | 说明                     |
   | ------------ | ------ | -- | ---------------------- |
   | user\_id     | string | 是  | 用户ID                   |
   | speak\_style | string | 是  | 说话风格（如：幽默、温柔、直接）       |
   | character    | string | 是  | 性格类型（如：外向、内向、沉稳）       |
   | love\_style  | string | 是  | 恋爱模式（如：浪漫、务实、陪伴）       |
   | values\_view | object | 是  | 三观（JSON对象：婚恋观、消费观、家庭观） |
   | taboo        | object | 是  | 雷点底线（JSON对象：不能接受的行为）   |
   #### 请求示例
   ```json
   {
     "user_id": "user_20240101_001",
     "speak_style": "幽默风趣",
     "character": "外向开朗",
     "love_style": "浪漫型",
     "values_view": {
       "marriage_view": "婚姻是人生大事",
       "money_view": "钱够用就好",
       "family_view": "重视家庭"
     },
     "taboo": {
       "hate_behavior": ["出轨", "冷暴力", "妈宝"],
       "hate_habit": ["赌博", "酗酒"]
     }
   }
   ```
   #### 响应参数
   | 参数名                 | 类型     | 说明                        |
   | ------------------- | ------ | ------------------------- |
   | code                | int    | 状态码                       |
   | msg                 | string | 提示信息                      |
   | data                | object | 返回数据                      |
   | data.status         | string | 蒸馏状态：processing/completed |
   | data.model\_version | string | 模型版本号                     |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "人格蒸馏数据保存成功，模型生成中",
     "data": {
       "status": "processing",
       "model_version": "v1.0.20240101"
     }
   }
   ```
   ***
   ### 3. POST /api/match/start - 发起匹配
   #### 接口描述
   触发平台匹配逻辑，生成唯一匹配ID，开启匹配流程
   #### 请求参数
   | 参数名      | 类型     | 必填 | 说明     |
   | -------- | ------ | -- | ------ |
   | user\_id | string | 是  | 当前用户ID |
   #### 请求示例
   ```json
   {
     "user_id": "user_20240101_001"
   }
   ```
   #### 响应参数
   | 参数名            | 类型     | 说明         |
   | -------------- | ------ | ---------- |
   | code           | int    | 状态码        |
   | msg            | string | 提示信息       |
   | data           | object | 返回数据       |
   | data.match\_id | string | 匹配ID       |
   | data.status    | int    | 匹配状态：0-匹配中 |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "匹配已发起",
     "data": {
       "match_id": "match_20240101_001",
       "status": 0
     }
   }
   ```
   ***
   ### 4. GET /api/match/progress - 查询匹配状态
   #### 接口描述
   实时获取当前匹配状态，前端轮询调用
   #### 请求参数
   | 参数名       | 类型     | 必填 | 说明   |
   | --------- | ------ | -- | ---- |
   | match\_id | string | 是  | 匹配ID |
   | user\_id  | string | 是  | 用户ID |
   #### 请求示例
   ```
   GET /api/match/progress?match_id=match_20240101_001&user_id=user_20240101_001
   ```
   #### 响应参数
   | 参数名              | 类型     | 说明                                           |
   | ---------------- | ------ | -------------------------------------------- |
   | code             | int    | 状态码                                          |
   | msg              | string | 提示信息                                         |
   | data             | object | 返回数据                                         |
   | data.match\_id   | string | 匹配ID                                         |
   | data.status      | int    | 匹配状态：0-匹配中，1-AI对话中，2-报告已生成，3-待确认，4-已终止，5-已解锁 |
   | data.partner\_id | string | 对应用户ID（如已匹配）                                 |
   | data.chat\_round | int    | 当前对话轮数                                       |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "success",
     "data": {
       "match_id": "match_20240101_001",
       "status": 1,
       "partner_id": "user_20240101_002",
       "chat_round": 15
     }
   }
   ```
   ***
   ### 5. GET /api/match/chat-record - 获取AI实时对话记录
   #### 接口描述
   实时获取双智能体对话记录，前端轮询调用用于渲染聊天气泡
   #### 请求参数
   | 参数名       | 类型     | 必填 | 说明              |
   | --------- | ------ | -- | --------------- |
   | match\_id | string | 是  | 匹配ID            |
   | since\_id | string | 否  | 上次最新消息ID，用于增量获取 |
   #### 请求示例
   ```
   GET /api/match/chat-record?match_id=match_20240101_001&since_id=msg_099
   ```
   #### 响应参数
   | 参数名                       | 类型     | 说明                                   |
   | ------------------------- | ------ | ------------------------------------ |
   | code                      | int    | 状态码                                  |
   | msg                       | string | 提示信息                                 |
   | data                      | object | 返回数据                                 |
   | data.records              | array  | 消息列表                                 |
   | data.records\[].id        | string | 消息ID                                 |
   | data.records\[].speaker   | string | 发言者：agent\_a（我方智能体）/ agent\_b（对方智能体） |
   | data.records\[].content   | string | 消息内容                                 |
   | data.records\[].timestamp | string | 时间戳                                  |
   | data.has\_more            | bool   | 是否还有更多消息                             |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "success",
     "data": {
       "records": [
         {
           "id": "msg_100",
           "speaker": "agent_a",
           "content": "你好呀，很高兴认识你！",
           "timestamp": "2024-01-01 10:00:00"
         },
         {
           "id": "msg_101",
           "speaker": "agent_b",
           "content": "你好，我是来自北京的小姐姐~",
           "timestamp": "2024-01-01 10:00:05"
         }
       ],
       "has_more": false
     }
   }
   ```
   ***
   ### 6. POST /api/match/unlock - 同意或拒绝解锁真人聊天
   #### 接口描述
   用户提交同意解锁真人聊天，或拒绝终止匹配
   #### 请求参数
   | 参数名       | 类型     | 必填 | 说明                       |
   | --------- | ------ | -- | ------------------------ |
   | match\_id | string | 是  | 匹配ID                     |
   | user\_id  | string | 是  | 用户ID                     |
   | operation | string | 是  | 操作：agree（同意）/ reject（拒绝） |
   #### 请求示例
   ```json
   {
     "match_id": "match_20240101_001",
     "user_id": "user_20240101_001",
     "operation": "agree"
   }
   ```
   #### 响应参数
   | 参数名                 | 类型     | 说明               |
   | ------------------- | ------ | ---------------- |
   | code                | int    | 状态码              |
   | msg                 | string | 提示信息             |
   | data                | object | 返回数据             |
   | data.unlock\_status | int    | 解锁状态：0-未解锁，1-已解锁 |
   | data.both\_agreed   | bool   | 是否双方都同意          |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "操作成功，等待对方确认",
     "data": {
       "unlock_status": 0,
       "both_agreed": false
     }
   }
   ```
   ***
   ### 7. GET /api/match/report - 获取适配报告
   #### 接口描述
   拉取本次匹配完整测评报告
   #### 请求参数
   | 参数名       | 类型     | 必填 | 说明   |
   | --------- | ------ | -- | ---- |
   | match\_id | string | 是  | 匹配ID |
   | user\_id  | string | 是  | 用户ID |
   #### 请求示例
   ```
   GET /api/match/report?match_id=match_20240101_001&user_id=user_20240101_001
   ```
   #### 响应参数
   | 参数名                           | 类型     | 说明          |
   | ----------------------------- | ------ | ----------- |
   | code                          | int    | 状态码         |
   | msg                           | string | 提示信息        |
   | data                          | object | 返回数据        |
   | data.match\_id                | string | 匹配ID        |
   | data.score                    | int    | 匹配总分（0-100） |
   | data.dimensions               | object | 五维评分        |
   | data.dimensions.emotion       | int    | 情感契合度       |
   | data.dimensions.value         | int    | 价值观匹配度      |
   | data.dimensions.communication | int    | 沟通舒适度       |
   | data.dimensions.lifestyle     | int    | 生活方式匹配度     |
   | data.dimensions.future        | int    | 未来规划契合度     |
   | data.advantage                | string | 优势分析        |
   | data.risk                     | string | 风险提示        |
   | data.suggest                  | string | 婚恋建议        |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "success",
     "data": {
       "match_id": "match_20240101_001",
       "score": 85,
       "dimensions": {
         "emotion": 90,
         "value": 88,
         "communication": 82,
         "lifestyle": 80,
         "future": 85
       },
       "advantage": "双方价值观契合度高，沟通风格互补",
       "risk": "女生较为被动，需要男方主动推进关系",
       "suggest": "建议尽快线下见面加深了解"
     }
   }
   ```
   ***
   ### 8. POST /api/chat/send - 发送真人消息
   #### 接口描述
   解锁成功后，真人之间发送聊天消息
   #### 请求参数
   | 参数名        | 类型     | 必填 | 说明      |
   | ---------- | ------ | -- | ------- |
   | match\_id  | string | 是  | 匹配ID    |
   | sender\_id | string | 是  | 发送者用户ID |
   | content    | string | 是  | 消息内容    |
   #### 请求示例
   ```json
   {
     "match_id": "match_20240101_001",
     "sender_id": "user_20240101_001",
     "content": "今天天气真好呀~"
   }
   ```
   #### 响应参数
   | 参数名              | 类型     | 说明   |
   | ---------------- | ------ | ---- |
   | code             | int    | 状态码  |
   | msg              | string | 提示信息 |
   | data             | object | 返回数据 |
   | data.message\_id | string | 消息ID |
   | data.timestamp   | string | 发送时间 |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "消息发送成功",
     "data": {
       "message_id": "chat_msg_001",
       "timestamp": "2024-01-01 15:30:00"
     }
   }
   ```
   ***
   ### 9. GET /api/chat/list - 获取聊天记录
   #### 接口描述
   加载双方真人聊天历史记录
   #### 请求参数
   | 参数名        | 类型     | 必填 | 说明        |
   | ---------- | ------ | -- | --------- |
   | match\_id  | string | 是  | 匹配ID      |
   | user\_id   | string | 是  | 用户ID      |
   | page       | int    | 否  | 页码，默认1    |
   | page\_size | int    | 否  | 每页数量，默认20 |
   #### 请求示例
   ```
   GET /api/chat/list?match_id=match_20240101_001&user_id=user_20240101_001&page=1&page_size=20
   ```
   #### 响应参数
   | 参数名                         | 类型     | 说明    |
   | --------------------------- | ------ | ----- |
   | code                        | int    | 状态码   |
   | msg                         | string | 提示信息  |
   | data                        | object | 返回数据  |
   | data.messages               | array  | 消息列表  |
   | data.messages\[].id         | string | 消息ID  |
   | data.messages\[].sender\_id | string | 发送者ID |
   | data.messages\[].content    | string | 消息内容  |
   | data.messages\[].timestamp  | string | 发送时间  |
   | data.page                   | int    | 当前页码  |
   | data.total                  | int    | 总消息数  |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "success",
     "data": {
       "messages": [
         {
           "id": "chat_msg_001",
           "sender_id": "user_20240101_001",
           "content": "你好呀",
           "timestamp": "2024-01-01 15:30:00"
         },
         {
           "id": "chat_msg_002",
           "sender_id": "user_20240101_002",
           "content": "你好~很高兴认识你",
           "timestamp": "2024-01-01 15:31:00"
         }
       ],
       "page": 1,
       "total": 50
     }
   }
   ```
   ***
   ### 10. GET /api/user/me - 获取当前用户信息
   #### 接口描述
   个人中心加载自身账号、人格、匹配记录等信息
   #### 请求参数
   | 参数名      | 类型     | 必填 | 说明   |
   | -------- | ------ | -- | ---- |
   | user\_id | string | 是  | 用户ID |
   #### 请求示例
   ```
   GET /api/user/me?user_id=user_20240101_001
   ```
   #### 响应参数
   | 参数名                  | 类型     | 说明               |
   | -------------------- | ------ | ---------------- |
   | code                 | int    | 状态码              |
   | msg                  | string | 提示信息             |
   | data                 | object | 返回数据             |
   | data.user\_id        | string | 用户ID             |
   | data.nick            | string | 昵称               |
   | data.gender          | int    | 性别               |
   | data.age             | int    | 年龄               |
   | data.agent\_id       | string | 智能体ID            |
   | data.distill\_status | int    | 蒸馏状态：0-未完成，1-已完成 |
   | data.match\_count    | int    | 匹配次数             |
   | data.unlock\_count   | int    | 解锁次数             |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "success",
     "data": {
       "user_id": "user_20240101_001",
       "nick": "小明",
       "gender": 1,
       "age": 28,
       "agent_id": "agent_20240101_001",
       "distill_status": 1,
       "match_count": 3,
       "unlock_count": 1
     }
   }
   ```
   ***
   ### 11. GET /api/user/other - 查看对方资料
   #### 接口描述
   仅匹配解锁成功后可调用，查看对方用户资料，未解锁接口拦截
   #### 请求参数
   | 参数名       | 类型     | 必填 | 说明     |
   | --------- | ------ | -- | ------ |
   | user\_id  | string | 是  | 当前用户ID |
   | match\_id | string | 是  | 匹配ID   |
   #### 请求示例
   ```
   GET /api/user/other?user_id=user_20240101_001&match_id=match_20240101_001
   ```
   #### 响应参数
   | 参数名                  | 类型     | 说明          |
   | -------------------- | ------ | ----------- |
   | code                 | int    | 状态码         |
   | msg                  | string | 提示信息        |
   | data                 | object | 返回数据        |
   | data.user\_id        | string | 对方用户ID      |
   | data.nick            | string | 昵称          |
   | data.gender          | int    | 性别          |
   | data.age             | int    | 年龄          |
   | data.distill\_info   | object | 对方人格信息（脱敏后） |
   | data.match\_duration | string | 匹配时长        |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "success",
     "data": {
       "user_id": "user_20240101_002",
       "nick": "小红",
       "gender": 2,
       "age": 26,
       "distill_info": {
         "speak_style": "温柔型",
         "character": "内向文静"
       },
       "match_duration": "3天"
     }
   }
   ```
   ***
   ## 十一、智能体算法接口（4个核心接口）
   ### 1. POST /api/agent/algo/model-refresh - 生成专属AI模型
   #### 接口描述
   将用户蒸馏人格数据灌入AI，生成唯一专属数字分身模型
   #### 请求参数
   | 参数名          | 类型     | 必填 | 说明    |
   | ------------ | ------ | -- | ----- |
   | user\_id     | string | 是  | 用户ID  |
   | agent\_id    | string | 是  | 智能体ID |
   | speak\_style | string | 是  | 说话风格  |
   | character    | string | 是  | 性格类型  |
   | love\_style  | string | 是  | 恋爱模式  |
   | values\_view | object | 是  | 三观数据  |
   | taboo        | object | 是  | 雷点底线  |
   #### 请求示例
   ```json
   {
     "user_id": "user_20240101_001",
     "agent_id": "agent_20240101_001",
     "speak_style": "幽默风趣",
     "character": "外向开朗",
     "love_style": "浪漫型",
     "values_view": {
       "marriage_view": "婚姻是人生大事",
       "money_view": "钱够用就好",
       "family_view": "重视家庭"
     },
     "taboo": {
       "hate_behavior": ["出轨", "冷暴力"],
       "hate_habit": ["赌博"]
     }
   }
   ```
   #### 响应参数
   | 参数名                 | 类型     | 说明                |
   | ------------------- | ------ | ----------------- |
   | code                | int    | 状态码               |
   | msg                 | string | 提示信息              |
   | data                | object | 返回数据              |
   | data.model\_version | string | 模型版本号             |
   | data.status         | string | 状态：success/failed |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "模型生成成功",
     "data": {
       "model_version": "v1.0.20240101",
       "status": "success"
     }
   }
   ```
   ***
   ### 2. POST /api/agent/algo/chat-start - 启动双AI对话
   #### 接口描述
   启动双方智能体自动对话（20-50轮），模拟真人婚恋沟通，对话内容实时推送前端
   #### 请求参数
   | 参数名          | 类型     | 必填 | 说明          |
   | ------------ | ------ | -- | ----------- |
   | match\_id    | string | 是  | 匹配ID        |
   | agent\_id\_a | string | 是  | 我方智能体ID     |
   | agent\_id\_b | string | 是  | 对方智能体ID     |
   | round\_limit | int    | 否  | 对话轮数上限，默认30 |
   #### 请求示例
   ```json
   {
     "match_id": "match_20240101_001",
     "agent_id_a": "agent_20240101_001",
     "agent_id_b": "agent_20240101_002",
     "round_limit": 30
   }
   ```
   #### 响应参数
   | 参数名               | 类型     | 说明                            |
   | ----------------- | ------ | ----------------------------- |
   | code              | int    | 状态码                           |
   | msg               | string | 提示信息                          |
   | data              | object | 返回数据                          |
   | data.session\_id  | string | 对话会话ID                        |
   | data.chat\_status | string | 对话状态：running/completed/failed |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "对话已启动",
     "data": {
       "session_id": "session_20240101_001",
       "chat_status": "running"
     }
   }
   ```
   ***
   ### 3. POST /api/agent/algo/generate-report - 生成适配测评报告
   #### 接口描述
   基于全程对话数据，计算匹配总分、五维适配评分、优势、风险、婚恋建议
   #### 请求参数
   | 参数名         | 类型     | 必填 | 说明     |
   | ----------- | ------ | -- | ------ |
   | session\_id | string | 是  | 对话会话ID |
   | match\_id   | string | 是  | 匹配ID   |
   #### 请求示例
   ```json
   {
     "session_id": "session_20240101_001",
     "match_id": "match_20240101_001"
   }
   ```
   #### 响应参数
   | 参数名             | 类型     | 说明   |
   | --------------- | ------ | ---- |
   | code            | int    | 状态码  |
   | msg             | string | 提示信息 |
   | data            | object | 返回数据 |
   | data.score      | int    | 匹配总分 |
   | data.dimensions | object | 五维评分 |
   | data.advantage  | string | 优势分析 |
   | data.risk       | string | 风险提示 |
   | data.suggest    | string | 婚恋建议 |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "报告生成成功",
     "data": {
       "score": 85,
       "dimensions": {
         "emotion": 90,
         "value": 88,
         "communication": 82,
         "lifestyle": 80,
         "future": 85
       },
       "advantage": "双方价值观契合度高，沟通风格互补",
       "risk": "女生较为被动，需要男方主动推进关系",
       "suggest": "建议尽快线下见面加深了解"
     }
   }
   ```
   ***
   ### 4. POST /api/agent/algo/risk-detect - 风险检测
   #### 接口描述
   实时检测情绪化、敷衍、利己、套路等婚恋风险，输出风险标签与拦截建议
   #### 请求参数
   | 参数名          | 类型     | 必填 | 说明         |
   | ------------ | ------ | -- | ---------- |
   | session\_id  | string | 是  | 对话会话ID     |
   | chat\_record | array  | 是  | 对话记录（最近N轮） |
   #### 请求示例
   ```json
   {
     "session_id": "session_20240101_001",
     "chat_record": [
       {"speaker": "agent_a", "content": "你好呀"},
       {"speaker": "agent_b", "content": "嗯"}
     ]
   }
   ```
   #### 响应参数
   | 参数名                 | 类型     | 说明          |
   | ------------------- | ------ | ----------- |
   | code                | int    | 状态码         |
   | msg                 | string | 提示信息        |
   | data                | object | 返回数据        |
   | data.risk\_tags     | array  | 风险标签列表      |
   | data.risk\_score    | int    | 风险分数（0-100） |
   | data.block\_suggest | string | 拦截建议        |
   #### 响应示例
   ```json
   {
     "code": 200,
     "msg": "检测完成",
     "data": {
       "risk_tags": ["敷衍", "冷漠"],
       "risk_score": 45,
       "block_suggest": "建议终止匹配，对方互动积极性较低"
     }
   }
   ```
   ***
   ## 十二、完整业务流程
   1. 用户注册
   2. 生成专属智能体
   3. 完成人格蒸馏
2. 加载智能体模型
3. 发起匹配
4. **双智能体自动对话 → 前端实时展示气泡滚动**
5. 生成适配报告
6. 用户查看报告
7. 双方同意 → 解锁真人聊天
8. 任何一方拒绝 → 匹配结束

***

## 十三、完整闭环接口调用流程

### 1. 初始化用户智能体

- **前端 → 调用** `POST /api/agent/init` → **后端**
- **作用**：注册账号、创建用户专属婚恋智能体、绑定用户ID

### 2. 完成用户人格蒸馏

- **前端 → 调用** `POST /api/user/distill` → **后端**
- **后端【内部】** `POST /api/agent/algo/model-refresh`

### 3. 发起婚恋匹配

- **前端 → 调用** `POST /api/match/start` → **后端**
- **后端【内部】** `POST /api/agent/algo/chat-start`

### 4. 实时监测匹配状态 + 沉浸式AI对话展示

- **前端 → 轮询** `GET /api/match/progress`
- **前端 → 轮询** `GET /api/match/chat-record`

### 5. 对话全程风险检测

- **后端【内部】** `POST /api/agent/algo/risk-detect`

### 6. 生成适配测评报告

- **后端【内部】** `POST /api/agent/algo/generate-report`

### 7. 用户查看适配报告

- **前端 → 调用** `GET /api/match/report`

### 8. 用户确认解锁/拒绝匹配

- **前端 → 调用** `POST /api/match/unlock`

### 9. 个人信息展示

- **前端 → 调用** `GET /api/user/me`

### 10. 查看对方资料（仅解锁后）

- **前端 → 调用** `GET /api/user/other`

### 11. 真人聊天互动

- **前端 → 调用** `POST /api/chat/send`
- **前端 → 调用** `GET /api/chat/list`

***

## 十四、前端必须实现：AI对话实时展示

- 实时显示**双方智能体的对话内容**
- 以**聊天气泡**左右样式展示
- 自动**底部滚动**，增强沉浸感
- 每一轮对话依次出现，不可一次性展示完全
- 不展示用户真实信息，仅显示「我方智能体」「对方智能体」

***

## 十五、状态定义（统一规范）

| 状态码 | 含义             |
| --- | -------------- |
| 0   | 匹配中            |
| 1   | 智能体对话中（实时气泡展示） |
| 2   | 报告已生成          |
| 3   | 待用户确认          |
| 4   | 已终止            |
| 5   | 已解锁            |

***

## 十六、开发强制规则

1. 一人只能拥有一个智能体
2. 同一时间仅允许一个匹配
3. 未完成人格蒸馏不能发起匹配
4. 智能体必须使用蒸馏数据对话
5. **AI对话期间必须实时展示气泡，不可隐藏**
6. 对话期间用户不可操作
7. 必须双向同意才能解锁
8. 解锁前不可查看对方资料
9. 所有隐私数据默认隐藏

***

## 十七、接口汇总表

| 序号 | 接口                              | 方法   | 调用方  | 作用       |
| -- | ------------------------------- | ---- | ---- | -------- |
| 1  | /api/agent/init                 | POST | 前端   | 初始化用户智能体 |
| 2  | /api/user/distill               | POST | 前端   | 保存人格蒸馏数据 |
| 3  | /api/agent/algo/model-refresh   | POST | 后端内部 | 生成专属AI模型 |
| 4  | /api/match/start                | POST | 前端   | 发起匹配     |
| 5  | /api/agent/algo/chat-start      | POST | 后端内部 | 启动双AI对话  |
| 6  | /api/match/progress             | GET  | 前端轮询 | 获取匹配状态   |
| 7  | /api/match/chat-record          | GET  | 前端轮询 | 获取AI对话记录 |
| 8  | /api/agent/algo/risk-detect     | POST | 后端内部 | 风险检测     |
| 9  | /api/agent/algo/generate-report | POST | 后端内部 | 生成适配报告   |
| 10 | /api/match/report               | GET  | 前端   | 查看适配报告   |
| 11 | /api/match/unlock               | POST | 前端   | 同意/拒绝解锁  |
| 12 | /api/user/me                    | GET  | 前端   | 获取个人信息   |
| 13 | /api/user/other                 | GET  | 前端   | 查看对方资料   |
| 14 | /api/chat/send                  | POST | 前端   | 发送真人消息   |
| 15 | /api/chat/list                  | GET  | 前端   | 获取聊天记录   |

***

## 十八、流程简图

```
注册 → 创建智能体 → 人格蒸馏 → 发起匹配 → 双AI实时对话气泡展示 → 生成报告 → 双向确认 → 解锁聊天
```

