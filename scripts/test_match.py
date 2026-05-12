import requests
import time

BASE = "http://localhost:8080"

def register(phone, nick, gender, age):
    r = requests.post(f"{BASE}/api/auth/register", json={
        "phone": phone, "nick": nick, "password": "123456",
        "gender": gender, "age": age
    })
    d = r.json()
    if d["code"] != 200:
        r2 = requests.post(f"{BASE}/api/auth/login", json={"phone": phone})
        d2 = r2.json()
        if d2["code"] != 200:
            raise Exception(f"Register/Login failed: {d}")
        return d2["data"]["token"], d2["data"]["userId"]
    return d["data"]["token"], d["data"]["userId"]

def distill(token, uid, style, char, love):
    r = requests.post(f"{BASE}/api/user/distill", json={
        "user_id": uid,
        "speak_style": style,
        "character": char,
        "love_style": love,
        "values_view": {"marriage": "must", "consume": "balance", "family": "family_first"},
        "taboo": {"behaviors": ["cheat"], "habits": ["dirty"]}
    }, headers={"Authorization": f"Bearer {token}"})
    d = r.json()
    if d["code"] not in (200, 409):
        raise Exception(f"Distill failed: {d}")
    return d

def start_match(token, uid):
    r = requests.post(f"{BASE}/api/match/start", json={
        "user_id": uid
    }, headers={"Authorization": f"Bearer {token}"})
    return r.json()

def waiting_status(token, uid):
    r = requests.get(f"{BASE}/api/match/waiting-status",
        params={"user_id": uid},
        headers={"Authorization": f"Bearer {token}"})
    return r.json()

# Main test
ts = str(int(time.time() * 1000))[-6:]
phoneA = f"1380000{ts}"
phoneB = f"1390000{ts}"

print("=== Match Pool Test ===")
print()

print(f"[1] Register User A (male) phone={phoneA}")
tokenA, uidA = register(phoneA, "TesterA", 1, 28)
print(f"    userId={uidA}")

print(f"[2] Register User B (female) phone={phoneB}")
tokenB, uidB = register(phoneB, "TesterB", 0, 26)
print(f"    userId={uidB}")

print("[3] Distill User A")
distill(tokenA, uidA, "humor", "outgoing", "romantic")
print("    Done")

print("[4] Distill User B")
distill(tokenB, uidB, "gentle", "introvert", "companion")
print("    Done")

print("[5] User A start match (should enter pool)...")
r = start_match(tokenA, uidA)
print(f"    queued={r['data'].get('queued')} msg={r['data'].get('message')}")
assert r['data'].get('queued'), f"Expected queued=true, got {r}"
print("    [PASS] User A entered pool")

print("[6] User A waiting-status...")
r = waiting_status(tokenA, uidA)
print(f"    queued={r['data'].get('queued')}")
assert r['data'].get('queued'), f"Expected queued=true"
print("    [PASS] Confirmed in pool")

print("[7] User B start match (should match instantly)...")
r = start_match(tokenB, uidB)
match_id = r['data'].get('match_id')
print(f"    match_id={match_id} queued={r['data'].get('queued')}")
assert match_id and not r['data'].get('queued'), f"Expected matchId, got {r}"
print("    [PASS] User B matched instantly!")

print("[8] User A retry (should get match_id)...")
r = start_match(tokenA, uidA)
print(f"    match_id={r['data'].get('match_id')} queued={r['data'].get('queued')}")
assert r['data'].get('match_id') == match_id, f"Expected {match_id}, got {r}"
assert not r['data'].get('queued')
print("    [PASS] User A got match_id!")

print()
print("=== ALL TESTS PASSED! ===")
print(f"match_id: {match_id}")
print(f"User A: {uidA} | User B: {uidB}")
