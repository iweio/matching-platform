import urllib.request
import urllib.error
import json
import time
import sys
import socket
import uuid

BASE_URL = "http://localhost:8001"
passed = 0
failed = 0
TIMEOUT_LONG = 180
TIMEOUT_SHORT = 30


def request(method: str, path: str, body: dict = None, timeout: int = TIMEOUT_SHORT) -> tuple[int, dict]:
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if data else {},
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body_bytes = resp.read()
                return resp.status, json.loads(body_bytes.decode("utf-8"))
        except urllib.error.HTTPError as e:
            body_bytes = e.read()
            try:
                return e.code, json.loads(body_bytes.decode("utf-8"))
            except Exception:
                return e.code, {"raw": body_bytes.decode("utf-8", errors="replace")}
        except (urllib.error.URLError, socket.timeout, ConnectionError) as e:
            if attempt < 2:
                time.sleep(1)
                continue
            return 0, {"error": str(e)}
        except Exception as e:
            return 0, {"error": str(e)}
    return 0, {"error": "max retries"}


def test(name: str, status_code: int, ok: bool, detail: str = ""):
    global passed, failed
    icon = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{icon}] {name}")
    if detail:
        for line in detail.strip().split("\n"):
            print(f"         {line}")
    print()


suffix = uuid.uuid4().hex[:6]

# ============================================================
print("=" * 60)
print("  智能体算法服务 完整接口测试")
print(f"  运行ID: {suffix}")
print("=" * 60)
print()

# ---- 1. 健康检查 ----
print("[1/6] 健康检查 GET /health")
code, data = request("GET", "/health")
ok = code == 200 and data.get("status") == "ok" and data.get("service") == "agent-service"
test("健康检查应返回 status=ok", code, ok, json.dumps(data, ensure_ascii=False, indent=2))

if code != 200:
    print("!!! 服务不可用，终止测试 !!!")
    sys.exit(1)


# ---- 2. 人格蒸馏 ----
print("[2/6] 人格蒸馏 POST /api/agent/algo/model-refresh")

agent_a = {
    "user_id": f"test_user_{suffix}_a",
    "agent_id": f"test_agent_{suffix}_a",
    "speak_style": "幽默风趣",
    "character": "外向开朗",
    "love_style": "浪漫型",
    "values_view": {
        "marriage_view": "婚姻是人生大事，需要慎重对待",
        "money_view": "钱够用就好，不追求奢侈",
        "family_view": "家庭是港湾，重视家庭关系"
    },
    "taboo": {
        "hate_behavior": ["出轨", "冷暴力", "欺骗"],
        "hate_habit": ["赌博", "酗酒", "吸烟"]
    }
}
code, data = request("POST", "/api/agent/algo/model-refresh", agent_a)
ok = code == 200 and data.get("data", {}).get("status") == "success"
test("创建智能体A", code, ok, json.dumps(data, ensure_ascii=False, indent=2))

agent_b = {
    "user_id": f"test_user_{suffix}_b",
    "agent_id": f"test_agent_{suffix}_b",
    "speak_style": "温柔体贴",
    "character": "内向文静",
    "love_style": "体贴型",
    "values_view": {
        "marriage_view": "婚姻是爱情的延续和升华",
        "money_view": "合理规划，适度消费",
        "family_view": "家庭至上，愿意为家庭付出"
    },
    "taboo": {
        "hate_behavior": ["背叛", "欺骗", "不尊重"],
        "hate_habit": ["熬夜", "拖延"]
    }
}
code, data = request("POST", "/api/agent/algo/model-refresh", agent_b)
ok = code == 200 and data.get("data", {}).get("status") == "success"
test("创建智能体B", code, ok, json.dumps(data, ensure_ascii=False, indent=2))

agent_c = {
    "user_id": f"test_user_{suffix}_c",
    "agent_id": f"test_agent_{suffix}_c",
    "speak_style": "成熟稳重",
    "character": "理智型",
    "love_style": "陪伴型",
    "values_view": {
        "marriage_view": "婚姻是责任和承诺",
        "money_view": "经济基础决定上层建筑",
        "family_view": "家庭需要共同经营"
    },
    "taboo": {
        "hate_behavior": ["不忠诚", "暴力", "撒谎"],
        "hate_habit": ["沉迷游戏", "不修边幅"]
    }
}
code, data = request("POST", "/api/agent/algo/model-refresh", agent_c)
ok = code == 200 and data.get("data", {}).get("status") == "success"
test("创建智能体C", code, ok, json.dumps(data, ensure_ascii=False, indent=2))

# 重复创建
code, data = request("POST", "/api/agent/algo/model-refresh", agent_a)
ok = data.get("code") == 400
test("重复创建同一智能体应报400", code, ok, json.dumps(data, ensure_ascii=False, indent=2))

# Pydantic 校验：缺少必填字段 → 422
bad_req = {"user_id": "test", "agent_id": "test"}
code, data = request("POST", "/api/agent/algo/model-refresh", bad_req)
ok = code == 422
test("缺少必填字段应返回422", code, ok, json.dumps(data, ensure_ascii=False)[:200])


# ---- 3. 双AI对话 ----
print("[3/6] 双AI对话 POST /api/agent/algo/chat-start")

agent_id_a = agent_a["agent_id"]
agent_id_b = agent_b["agent_id"]
agent_id_c = agent_c["agent_id"]

code, data = request("POST", "/api/agent/algo/chat-start", {
    "match_id": f"match_{suffix}_ab",
    "agent_id_a": agent_id_a,
    "agent_id_b": agent_id_b,
    "round_limit": 3
}, timeout=TIMEOUT_LONG)

session_id_ab = (data.get("data") or {}).get("session_id", "")
ok = code == 200 and data.get("code") == 200 and bool(session_id_ab)
test("启动双AI对话(A-B)", code, ok, json.dumps(data, ensure_ascii=False, indent=2))
if not ok:
    print("  对话A-B启动失败，继续后续测试...")

code, data = request("POST", "/api/agent/algo/chat-start", {
    "match_id": f"match_{suffix}_ac",
    "agent_id_a": agent_id_a,
    "agent_id_b": agent_id_c,
    "round_limit": 3
}, timeout=TIMEOUT_LONG)

session_id_ac = (data.get("data") or {}).get("session_id", "")
ok = code == 200 and data.get("code") == 200 and bool(session_id_ac)
test("启动双AI对话(A-C)", code, ok, json.dumps(data, ensure_ascii=False, indent=2))
if not ok:
    print("  对话A-C启动失败，继续后续测试...")

# 不存在的智能体
code, data = request("POST", "/api/agent/algo/chat-start", {
    "match_id": "match_bad",
    "agent_id_a": "not_exist_agent",
    "agent_id_b": agent_id_b,
    "round_limit": 3
})
ok = data.get("code") == 400
test("不存在的智能体应报400", code, ok, json.dumps(data, ensure_ascii=False, indent=2))


# ---- 4. 聊天记录 ----
print("[4/6] 聊天记录 GET /api/agent/algo/chat-record")

time.sleep(2)

def show_records(sid: str, label: str):
    if not sid:
        test(f"获取聊天记录({label})", 0, False, "无有效的 session_id")
        return
    code, data = request("GET", f"/api/agent/algo/chat-record?session_id={sid}")
    resp_data = data.get("data") if isinstance(data.get("data"), dict) else {}
    records = resp_data.get("records", [])
    ok = code == 200 and data.get("code") == 200
    detail = f"消息数: {len(records)}"
    if resp_data:
        detail += f", 状态: {resp_data.get('chat_status', '')}"
    if ok and records:
        detail += "\n--- 对话内容 ---"
        for m in records:
            speaker_label = "A方" if m.get("speaker") == "agent_a" else "B方"
            content = m.get("content", "")
            detail += f"\n  [{speaker_label}] {content[:80]}{'...' if len(content) > 80 else ''}"
    test(f"获取聊天记录({label})", code, ok, detail)
    return records

records_ab = show_records(session_id_ab, "AB对话")
records_ac = show_records(session_id_ac, "AC对话")

# 不存在的session
code, data = request("GET", "/api/agent/algo/chat-record?session_id=not_exist_session")
ok = data.get("code") == 404
test("不存在的会话应返回404", code, ok, json.dumps(data, ensure_ascii=False, indent=2))

# since_id 增量拉取
if records_ac and len(records_ac) > 1:
    since_id = records_ac[0]["id"]
    code, data = request("GET", f"/api/agent/algo/chat-record?session_id={session_id_ac}&since_id={since_id}")
    resp_data = data.get("data") if isinstance(data.get("data"), dict) else {}
    since_records = resp_data.get("records", [])
    ok = len(since_records) == len(records_ac) - 1
    test("增量拉取(since_id)", code, ok,
         f"since后消息数: {len(since_records)}, 总消息: {len(records_ac)}, 预期since后: {len(records_ac)-1}")


# ---- 5. 生成适配报告 ----
print("[5/6] 生成适配报告 POST /api/agent/algo/generate-report")

time.sleep(1)

def test_report(sid: str, match_id: str, label: str):
    if not sid:
        test(f"生成适配报告({label})", 0, False, "无有效的 session_id")
        return
    code, data = request("POST", "/api/agent/algo/generate-report", {
        "session_id": sid,
        "match_id": match_id
    })
    ok = code == 200 and data.get("code") == 200
    detail = ""
    if ok:
        d = data.get("data", {})
        detail = (f"总分: {d.get('score')}\n"
                  f"维度: {json.dumps(d.get('dimensions'), ensure_ascii=False)}\n"
                  f"优势: {d.get('advantage')}\n"
                  f"风险: {d.get('risk')}\n"
                  f"建议: {d.get('suggest')}")
    else:
        detail = json.dumps(data, ensure_ascii=False, indent=2)
    test(f"生成适配报告({label})", code, ok, detail)
    return data if ok else None

test_report(session_id_ab, f"match_{suffix}_ab", "AB对话")
test_report(session_id_ac, f"match_{suffix}_ac", "AC对话")

# 不存在的会话
code, data = request("POST", "/api/agent/algo/generate-report", {
    "session_id": "not_exist_session",
    "match_id": "match_bad"
})
ok = data.get("code") == 400
test("不存在的会话应报400", code, ok, json.dumps(data, ensure_ascii=False, indent=2))


# ---- 6. 风险检测 ----
print("[6/6] 风险检测 POST /api/agent/algo/risk-detect")

def test_risk_detect(chat_record: list, sid: str, label: str):
    code, data = request("POST", "/api/agent/algo/risk-detect", {
        "session_id": sid,
        "chat_record": chat_record
    })
    ok = code == 200 and data.get("code") == 200
    if ok:
        d = data.get("data", {})
        detail = (f"风险标签: {d.get('risk_tags')}\n"
                  f"风险分: {d.get('risk_score')}\n"
                  f"拦截建议: {d.get('block_suggest')}")
    else:
        detail = json.dumps(data, ensure_ascii=False, indent=2)
    test(f"风险检测({label})", code, ok, detail)

if records_ab:
    test_risk_detect(records_ab, session_id_ab, "AB对话(正常)")

high_risk = [
    {"id": "msg_0001", "speaker": "agent_a", "content": "你懂什么", "timestamp": "2024-01-01 00:00:00"},
    {"id": "msg_0002", "speaker": "agent_b", "content": "烦死了，别烦我", "timestamp": "2024-01-01 00:00:01"},
    {"id": "msg_0003", "speaker": "agent_a", "content": "你必须听我的，你收入多少", "timestamp": "2024-01-01 00:00:02"},
    {"id": "msg_0004", "speaker": "agent_b", "content": "滚，不感兴趣", "timestamp": "2024-01-01 00:00:03"},
    {"id": "msg_0005", "speaker": "agent_a", "content": "呵呵，就你这种人也配", "timestamp": "2024-01-01 00:00:04"},
]
test_risk_detect(high_risk, "risk_session_high", "高风险对话")

normal = [
    {"id": "msg_0001", "speaker": "agent_a", "content": "你好呀，很高兴认识你", "timestamp": "2024-01-01 00:00:00"},
    {"id": "msg_0002", "speaker": "agent_b", "content": "你好，我也很高兴认识你", "timestamp": "2024-01-01 00:00:01"},
    {"id": "msg_0003", "speaker": "agent_a", "content": "你平时有什么爱好吗", "timestamp": "2024-01-01 00:00:02"},
]
test_risk_detect(normal, "risk_session_normal", "正常对话(无风险)")

# 空记录
code, data = request("POST", "/api/agent/algo/risk-detect", {
    "session_id": "risk_empty",
    "chat_record": []
})
ok = data.get("code") == 400
test("空对话记录应报400", code, ok, json.dumps(data, ensure_ascii=False, indent=2))


# ============================================================
print("=" * 60)
total = passed + failed
print(f"  测试完成: 通过 {passed}/{total} 项, 失败 {failed}/{total} 项")
if failed == 0:
    print("  结果: 全部通过!")
else:
    print(f"  结果: {failed} 项失败，请查看上方 FAIL 标记的测试项")
print("=" * 60)
sys.exit(0 if failed == 0 else 1)
