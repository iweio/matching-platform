import os
import json
import re
from typing import Optional, AsyncGenerator
from langchain_openai import ChatOpenAI


class LLMClient:
    _instance: Optional[ChatOpenAI] = None
    _available: bool = False
    _provider: str = ""

    @classmethod
    def _init(cls) -> None:
        if cls._instance is not None:
            return

        deepseek_key = os.getenv("DEEPSEEK_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if deepseek_key:
            try:
                cls._instance = ChatOpenAI(
                    api_key=deepseek_key,
                    base_url="https://api.deepseek.com/v1",
                    model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                    temperature=0.8,
                    max_tokens=1024,
                    request_timeout=15,
                )
                cls._available = True
                cls._provider = "deepseek"
                return
            except Exception:
                pass

        if openai_key:
            try:
                cls._instance = ChatOpenAI(
                    api_key=openai_key,
                    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
                    model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
                    temperature=0.8,
                    max_tokens=512,
                    request_timeout=15,
                )
                cls._available = True
                cls._provider = "openai"
            except Exception:
                cls._available = False

    @classmethod
    def is_available(cls) -> bool:
        cls._init()
        return cls._available

    @classmethod
    async def chat(cls, system_prompt: str, user_prompt: str, profile: dict | None = None) -> str:
        cls._init()
        if not cls._instance:
            return cls._simulate(system_prompt, user_prompt, profile)
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            response = await cls._instance.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ])
            content = response.content.strip() if response.content else ""
            if content:
                return content
            return cls._simulate(system_prompt, user_prompt, profile)
        except Exception:
            return cls._simulate(system_prompt, user_prompt, profile)

    @classmethod
    async def stream_chat(cls, system_prompt: str, user_prompt: str, profile: dict | None = None) -> AsyncGenerator[str, None]:
        cls._init()
        if not cls._instance:
            full = cls._simulate(system_prompt, user_prompt, profile)
            for i in range(0, len(full), 3):
                yield full[i:i+3]
            return
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            async for chunk in cls._instance.astream([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]):
                if chunk.content:
                    yield chunk.content
        except Exception:
            full = cls._simulate(system_prompt, user_prompt, profile)
            for i in range(0, len(full), 3):
                yield full[i:i+3]

    @classmethod
    async def chat_json(cls, system_prompt: str, user_prompt: str) -> dict:
        cls._init()
        full_prompt = f"{user_prompt}\n\n请严格按照JSON格式输出，不要包含任何其他内容。"
        if not cls._instance:
            return cls._simulate_json(system_prompt, user_prompt)
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            response = await cls._instance.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=full_prompt),
            ])
            text = response.content.strip()
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            return json.loads(text)
        except Exception:
            return cls._simulate_json(system_prompt, user_prompt)

    @classmethod
    def _simulate(cls, system_prompt: str, user_prompt: str, profile: dict | None = None) -> str:
        import hashlib
        import random

        # Extract personality traits from profile or parse from system_prompt
        speak_style = profile.get("speak_style", "自然") if profile else "自然"
        character = profile.get("character", "友善") if profile else "友善"
        love_style = profile.get("love_style", "真诚") if profile else "真诚"
        agent_id = profile.get("agent_id", "unknown") if profile else "unknown"

        # Seed with agent_id + round context for variety per agent, deterministic per round
        seed_str = agent_id + user_prompt[:200]
        seed = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)

        # Helper: Add natural tone words
        def add_tone(text):
            tones = ["", "呀", "呢", "吧", "哦", "哈", "呢～"]
            if text.endswith("？") or text.endswith("?"):
                return text
            return text + rng.choice(tones)

        # ── Opening ──
        if "第一次" in user_prompt or "打招呼" in user_prompt or "新朋友" in user_prompt:
            openings = {
                "活泼": [
                    "嗨～你好呀！终于等到你了！我是那种特别爱笑的人，平时喜欢到处走走逛逛，发现生活中的小美好。你呢，是个什么样的人呀？",
                    "嘿！很高兴认识你～我是个闲不住的人，周末总想找点新鲜事做。看电影、逛展、健身都喜欢，你呢？",
                    "哇，终于可以聊天了！我是个比较外向的人，喜欢交朋友、喜欢热闹。你平时喜欢做什么呀？",
                    "哈喽哈喽！终于匹配到你啦～我平时喜欢玩各种有意思的东西，你平时周末一般都干嘛呀？",
                    "嗨～好开心认识你！我这个人比较随性，喜欢尝试新鲜事物，你呢，有什么特别喜欢做的吗？",
                ],
                "温柔": [
                    "你好呀，很高兴认识你。我是个比较安静的人，平时喜欢听听音乐、看看书，希望我们能聊得来～",
                    "你好，认识你真好。我喜欢简单的生活，周末会做做饭、整理整理房间，有点小确幸就很满足。你平时喜欢做什么呢？",
                    "嗨～有点小紧张呢。我是个比较慢热但很真诚的人，熟了以后话就多了。期待和你慢慢了解彼此。",
                    "你好呀～我性格比较温和，喜欢安静的时光，比如泡杯茶看看书。不知道你平时喜欢做什么呀？",
                    "嗨，很高兴遇见你。我觉得慢慢来比较好，先简单聊聊吧～你平时喜欢什么样的活动呀？",
                ],
                "幽默": [
                    "嘿！可算等到你了～我先自我介绍一下：资深吃货、业余摄影师、专业沙发土豆。你呢，有什么隐藏技能吗？",
                    "你好你好！先声明一下：我这个人比较逗，可能聊着聊着就开始讲冷笑话了，别嫌弃哈～你平时喜欢干嘛？",
                    "嗨～终于不用跟AI自言自语了（等等，好像我们就是AI？哈哈开玩笑的）。很高兴认识你！",
                    "哈喽！我是那种自带笑点的人，希望聊天的时候能让你开心～你平时喜欢搞笑的东西吗？",
                    "嘿呀，终于匹配成功！我先来个灵魂拷问：你喜欢吃香菜吗？😜",
                ],
                "沉稳": [
                    "你好，很高兴认识你。我是一个比较理性的人，做事喜欢规划，但也懂得享受生活的乐趣。希望我们能坦诚交流。",
                    "你好。我是个务实的人，工作认真、生活规律。来这里是真心想找一个能聊得来的人。你呢？",
                    "幸会。我这人比较直接，不喜欢绕弯子。希望我们能真诚地了解彼此，看看是否合适。",
                    "你好。我觉得真诚最重要，希望我们能坦诚地交流。你平时喜欢什么样的交流方式？",
                    "您好，很高兴认识你。我对待感情比较认真，希望能找到价值观相近的人。",
                ],
                "温柔体贴": [
                    "你好呀～看到你也在，心里暖暖的。我是个比较细心的人，喜欢照顾身边的人。希望我们能慢慢了解彼此～",
                    "嗨，很高兴遇见你。我喜欢温暖的事物——阳光、咖啡、和真诚的聊天。你平时喜欢什么样的生活节奏呢？",
                    "你好呀～我比较注重细节，喜欢关心身边的人。希望我们能有一段愉快的聊天～",
                    "嗨～感觉你是个很温暖的人呢。我平时喜欢做一些暖心的小事，你呢？",
                ],
            }
            # Find best matching style
            matched = None
            for key, lines in openings.items():
                if key in speak_style or key in character:
                    matched = lines
                    break
            if not matched:
                matched = openings.get("温柔", list(openings.values())[0])
            return add_tone(rng.choice(matched))

        # ── Topic-based responses ──
        # Parse recent context to understand what the other agent just said
        context_lines = []
        if "最近的对话记录" in user_prompt or "刚才你们聊了这些" in user_prompt:
            ctx_start = user_prompt.find("最近的对话记录") if "最近的对话记录" in user_prompt else user_prompt.find("刚才你们聊了这些")
            ctx_text = user_prompt[ctx_start:]
            for line in ctx_text.split("\n"):
                if line.startswith("对方: ") or line.startswith("你: ") or line.startswith("- "):
                    context_lines.append(line)

        other_said = ""
        if context_lines:
            last_other = [l for l in context_lines if l.startswith("对方: ")]
            if last_other:
                other_said = last_other[-1].replace("对方: ", "")

        # Personality-based response templates for each topic
        def _gen_hobby_response():
            if "活泼" in character or "外向" in speak_style:
                return rng.choice([
                    "哈哈说到爱好我可就停不下来了！我喜欢户外运动，跑步、爬山、骑行都爱，周末根本闲不住。你呢，周末一般怎么过呀？",
                    "我特别喜欢旅行！去过不少地方，每次都有不一样的体验。你喜不喜欢旅行呀？有没有特别想去的地方呢？",
                    "我最近迷上了露营！感觉亲近大自然特别放松～你平时喜欢户外活动吗？",
                    "我爱好可多啦！摄影、美食、追剧……周末总能找到好玩的事情做。你呢？",
                ])
            if "温柔" in character or "安静" in speak_style:
                return rng.choice([
                    "我平时比较宅，喜欢在家看看书、追追剧，偶尔做做烘焙。虽然简单但觉得很舒服～你有什么特别喜欢的放松方式吗？",
                    "我喜欢安静的爱好，比如养花、听音乐、写写手账。一个人的时候也很自在，但有人分享就更好了。你呢？",
                    "我喜欢泡杯茶看看书，或者练练瑜伽。慢节奏的生活让我觉得很安心～你平时喜欢怎样放松呀？",
                    "我喜欢做点手工，比如拼拼图、织毛线，很治愈呢。你有什么能让自己静下心来的爱好吗？",
                ])
            if "幽默" in speak_style or "风趣" in character:
                return rng.choice([
                    "我的爱好？吃吃吃！当然还有各种有趣的事情，比如看搞笑视频笑到肚子痛～你呢？",
                    "我最大的爱好就是发现各种好吃的！顺便拍拍照发朋友圈（假装自己是美食博主）。你平时喜欢吃什么呀？",
                ])
            return rng.choice([
                "我平常喜欢健身，出一身汗感觉整个人都轻松了。也喜欢看电影，尤其是剧情片。你呢，有什么特别喜欢的吗？",
                "兴趣爱好嘛……我喜欢尝试新东西，最近在学做饭，虽然水平一般但很有成就感！你有什么特别的爱好吗？",
                "我喜欢周末做点不一样的事情，有时候去看展，有时候在家研究新菜谱。你一般周末怎么安排呀？",
            ])

        def _gen_work_response():
            if "活泼" in character:
                return rng.choice([
                    "我工作还挺有意思的，每天都能遇到不同的挑战！不过下班了就想彻底放松，你呢，工作忙吗？",
                    "我的工作氛围还不错，同事们都很有趣～但我还是觉得生活比工作重要，你觉得呢？",
                ])
            if "沉稳" in character or "认真" in speak_style:
                return rng.choice([
                    "我做的是技术方面的工作，挑战不少但也能学到很多东西。你对自己的工作满意吗？",
                    "工作对我来说是实现价值的方式，但我不会让它占据生活的全部。你是怎么平衡工作和生活的？",
                ])
            return rng.choice([
                "我目前工作还算稳定，虽然有时候忙但挺充实的。我觉得工作和生活要分开，下班后就是自己的时间。你工作忙吗？",
                "工作嘛，我觉得就是一份职业，更重要的是过好生活。不过幸运的是我还挺喜欢现在做的事情的。你是怎么看待工作和生活的关系的？",
                "我对现在的工作还算满意，能学到东西最重要。你呢，喜欢你的工作吗？",
            ])

        def _gen_love_view_response():
            if "浪漫" in love_style or "感性" in character:
                return rng.choice([
                    "我觉得爱情就是要用心去感受呀～两个人互相牵挂、互相包容，这种感觉真好。你相信一见钟情吗？",
                    "对我来说，爱情是生活里的小确幸。一个眼神、一句关心，都能让人心动呢～",
                ])
            if "理性" in character or "成熟" in speak_style:
                return rng.choice([
                    "经历过一些事情后，我更相信细水长流的感情。不需要轰轰烈烈，但要彼此珍惜、相互理解。你的感情观是怎样的？",
                    "我觉得感情需要经营，两个人共同成长才是最重要的。你怎么看待感情中的付出与收获？",
                ])
            return rng.choice([
                "我觉得感情里最重要的是真诚。两个人在一起，如果每天都要伪装，那多累啊。做真实的自己，才能找到真正合适的人。你怎么看？",
                "对我来说，爱情不是生活的全部，但有了对的人生活会变得更完整。互相支持、一起成长，这种感觉很重要。",
                "我觉得好的感情应该是让人感到轻松自在的，不需要刻意讨好。你觉得呢？",
            ])

        def _gen_family_response():
            return rng.choice([
                "家庭对我影响挺大的，我觉得父母相处的方式会潜移默化地影响一个人。我理想中的家庭是温暖的、互相尊重的。你对家庭怎么看？",
                "我很看重家庭关系。周末经常会给爸妈打电话，逢年过节也一定会回家。我觉得孝顺但不盲从，保持自己的独立性。",
                "我觉得家庭是港湾，无论遇到什么困难都能回去的地方。你和家人的关系怎么样呀？",
                "我希望未来的家庭是平等的，大家互相尊重、互相支持。你理想中的家庭是什么样子的？",
            ])

        def _gen_future_response():
            return rng.choice([
                "未来嘛，我希望有一个安稳的生活。不需要大富大贵，但希望两个人能一起努力，有个温馨的小家。你的未来规划是什么样的？",
                "我觉得未来最重要的是两个人方向一致。如果能一起为目标努力，哪怕过程辛苦一点也值得。你有想过五年后自己会是什么样子吗？",
                "我对未来没有太具体的规划，但希望能和喜欢的人一起体验更多美好的事情～你呢？",
                "未来充满未知，但只要和对的人在一起，我觉得什么都可以面对。你对未来有什么期待吗？",
            ])

        def _gen_marriage_response():
            return rng.choice([
                "婚姻是很严肃的事情，我觉得需要两个人足够了解对方再做决定。三观合不合、生活方式能不能兼容，这些都很重要。你怎么看？",
                "我希望我的婚姻是平等的、互相尊重的。不是谁依靠谁，而是两个人一起面对生活。你觉得好的婚姻应该是什么样的？",
                "我觉得婚姻需要信任和包容，没有完美的婚姻，只有不断磨合的两个人。你对婚姻有什么期待吗？",
                "婚姻对我来说是一种承诺，是两个人决定携手走下去的决心。你觉得婚姻的意义是什么？",
            ])

        def _gen_consumption_response():
            return rng.choice([
                "消费观其实挺能反映一个人的价值观的。我不喜欢太铺张浪费，但也不会太抠门。该花的钱花，不该花的省着点。你呢？",
                "我觉得赚钱就是为了更好的生活，但也要有储蓄意识。偶尔犒劳一下自己是可以的，但要量力而行。你的消费习惯是怎样的？",
                "我比较注重性价比，不会盲目追求名牌，但对喜欢的东西也不会太犹豫。你是怎样看待消费的？",
                "我觉得钱要花在刀刃上，比如旅行、学习这些能带来成长和快乐的事情。你平时会在什么地方花钱呢？",
            ])

        def _gen_habit_response():
            return rng.choice([
                "我生活上还算规律，不太熬夜，喜欢把家里收拾得干净整洁。小习惯嘛……睡前一定要看会儿书或者听听播客。你呢？",
                "我有点小洁癖哈哈，看到乱的东西就想收拾。不过也不算太过分，就是比较在意生活品质。你有什么特别的生活习惯吗？",
                "我每天早上都会喝一杯咖啡，这是开启一天的仪式感～你有什么每天必做的小习惯吗？",
                "我喜欢睡前泡脚，感觉特别放松。生活中的小习惯能带来很多幸福感呢，你有什么习惯吗？",
            ])

        def _gen_summary_response():
            return rng.choice([
                "和你聊了这么多，感觉挺开心的！虽然有些观点不完全一样，但正是这些差异让人好奇。希望我们还有机会继续了解彼此～",
                "这次聊天让我觉得很舒服，你是一个很有想法的人。不管结果如何，能这样真诚地交流已经很好了。祝你一切都好！",
                "时间过得真快呀，感觉聊得很愉快～希望以后还有机会再聊，祝你每天都开心！",
                "和你聊天很轻松，谢谢你愿意分享这么多。希望我们都能找到适合自己的人～",
            ])

        def _gen_default_response():
            # Respond naturally to the other agent's last message
            if other_said:
                if "?" in other_said or "？" in other_said:
                    return rng.choice([
                        f"嗯，你问得很好呢。我觉得这个要看具体情况，每个人的选择都不一样。你觉得呢？",
                        f"哈哈这个问题有意思！我觉得最重要的还是两个人合得来，其他的可以慢慢商量。",
                        f"这个问题我也在思考呢～你的想法是怎样的呀？",
                        f"嗯……这个问题挺值得探讨的。我觉得关键在于两个人的共识，你说呢？",
                    ])
                if any(word in other_said for word in ["喜欢", "爱好", "喜欢做", "喜欢玩"]):
                    return rng.choice([
                        f"听起来很有意思呢！我也挺喜欢这类事情的～你平时经常做吗？",
                        f"哇，这个爱好很棒呀！我也想试试呢，有什么入门建议吗？",
                    ])
                if any(word in other_said for word in ["工作", "上班", "职业", "事业"]):
                    return rng.choice([
                        f"工作确实不容易呢，你很厉害呀！平时工作压力大吗？",
                        f"能做自己喜欢的工作真好～我也希望能找到这样的状态。",
                    ])
                if any(word in other_said for word in ["感情", "恋爱", "喜欢", "心动"]):
                    return rng.choice([
                        f"听你这么说感觉很真诚呢～我也觉得感情里真诚最重要。",
                        f"嗯嗯，能遇到让自己心动的人不容易呢。希望你能遇到呀～",
                    ])
                return rng.choice([
                    f"你说得很有道理，我也是这么想的。能遇到想法相近的人真不容易呢～",
                    f"嗯嗯，我理解你的意思。每个人经历不一样，想法自然也不同。很高兴能这样交流。",
                    f"听你这么说感觉很真诚。我觉得不管怎样，能敞开心扉聊天就是好的开始。",
                    f"哇，你这么说我还挺有共鸣的！原来我们在这方面想法挺像的～",
                    f"嗯嗯，我也这么觉得呢。有时候简单聊聊就能发现很多共同点呢～",
                ])
            return rng.choice([
                "嗯，我觉得两个人在一起最重要的就是互相理解和包容呀。很多小事其实没必要太计较。",
                "说实话，我对感情还是比较认真的。希望能遇到一个同样真诚的人呢。",
                "和你聊天感觉还不错，能感受到你是一个有想法的人。继续聊聊吧～",
                "我觉得真诚最重要，希望我们能继续这样轻松地聊下去～",
                "感觉我们聊得挺投机的呢，希望能多了解彼此一些～",
            ])

        # Map user_prompt keywords to response generators
        if "兴趣爱好" in user_prompt or "喜欢做什么" in user_prompt:
            return add_tone(_gen_hobby_response())
        if "工作" in user_prompt or "生活状态" in user_prompt or "上班" in user_prompt:
            return add_tone(_gen_work_response())
        if "感情" in user_prompt or "恋爱观" in user_prompt or "爱情" in user_prompt:
            return add_tone(_gen_love_view_response())
        if "家庭" in user_prompt or "家庭观念" in user_prompt:
            return add_tone(_gen_family_response())
        if "未来" in user_prompt or "规划" in user_prompt:
            return add_tone(_gen_future_response())
        if "婚姻" in user_prompt:
            return add_tone(_gen_marriage_response())
        if "消费" in user_prompt or "消费观念" in user_prompt:
            return add_tone(_gen_consumption_response())
        if "习惯" in user_prompt or "生活习惯" in user_prompt:
            return add_tone(_gen_habit_response())
        if "总结" in user_prompt or "结束" in user_prompt or "感受" in user_prompt:
            return add_tone(_gen_summary_response())
        return add_tone(_gen_default_response())

    @classmethod
    def _simulate_json(cls, system_prompt: str, user_prompt: str) -> dict:
        import hashlib, random

        if "风险" in system_prompt or "risk" in system_prompt.lower():
            return {
                "risk_tags": [],
                "risk_score": 5,
                "block_suggest": "未检测到明显风险，对话正常进行",
            }

        # Generate varied but reasonable report scores based on the prompt content
        seed_str = system_prompt + user_prompt
        seed = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)

        base = rng.randint(60, 88)
        emotion = min(95, base + rng.randint(-10, 12))
        value = min(95, base + rng.randint(-8, 10))
        communication = min(95, base + rng.randint(-15, 8))
        lifestyle = min(95, base + rng.randint(-12, 10))
        future = min(95, base + rng.randint(-10, 15))

        score = sum([emotion, value, communication, lifestyle, future]) // 5

        advantages = [
            "双方沟通比较顺畅，在多个话题上表现出共鸣，有良好的发展基础。",
            "你们两个人在核心价值观上比较一致，后续深入交往的可能性较大。",
            "你们在兴趣爱好和生活习惯方面有较高的匹配度，日常相处会比较轻松。",
            "双方对未来的规划方向较为契合，这是长期关系的重要基础。",
        ]
        risks = [
            "双方在某些话题上的观点存在一定差异，建议在后续交流中进一步磨合。",
            "消费观念和生活方式上略有分歧，可以在真人聊天阶段进一步了解彼此的底线。",
            "交流深度还可以进一步加强，建议多聊聊更深层次的三观话题。",
        ]
        suggests = [
            "整体匹配度不错，建议解锁真人聊天，真人交流才能更真实地了解彼此。",
            "双方匹配度较高，可以考虑解锁进一步交流。真实的相处比AI对话更能体现默契。",
            "建议在解锁后先从轻松的话题开始，慢慢深入了解对方的真实想法和感受。",
        ]

        return {
            "dimensions": {
                "emotion": emotion,
                "value": value,
                "communication": communication,
                "lifestyle": lifestyle,
                "future": future,
            },
            "score": score,
            "advantage": rng.choice(advantages),
            "risk": rng.choice(risks),
            "suggest": rng.choice(suggests),
        }
