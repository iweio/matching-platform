#!/bin/bash
BASE="http://localhost:8080"
TS=$(date +%H%M%S)
PHONE_A="138${TS:0:5}"
PHONE_B="139${TS:0:5}"

echo "=== Match Pool Test ==="
echo ""

# 1. Register User A
echo "[1] Register User A (male)..."
RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE_A\",\"nick\":\"PoolBoy\",\"gender\":1,\"age\":28,\"password\":\"123456\"}")
# AuthResponse has @JsonProperty so uses camelCase in output
TOKEN_A=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
USR_A=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['userId'])")
echo "  User A: $USR_A"

# 2. Register User B
echo "[2] Register User B (female)..."
RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE_B\",\"nick\":\"PoolGirl\",\"gender\":0,\"age\":26,\"password\":\"123456\"}")
TOKEN_B=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
USR_B=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['userId'])")
echo "  User B: $USR_B"

sleep 2

# 3. Distill User A (request uses snake_case per jackson SNAKE_CASE config)
echo "[3] Distill User A..."
curl -s -X POST "$BASE/api/user/distill" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"user_id\":\"$USR_A\",\"speak_style\":\"humor\",\"character\":\"outgoing\",\"love_style\":\"romantic\",\"values_view\":{\"marriage\":\"must\",\"consume\":\"balance\",\"family\":\"family_first\"},\"taboo\":{\"behaviors\":[\"cheat\"],\"habits\":[\"dirty\"]}}" > /dev/null
echo "  Done"

# 4. Distill User B
echo "[4] Distill User B..."
curl -s -X POST "$BASE/api/user/distill" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "{\"user_id\":\"$USR_B\",\"speak_style\":\"gentle\",\"character\":\"introvert\",\"love_style\":\"companion\",\"values_view\":{\"marriage\":\"maybe\",\"consume\":\"enjoy\",\"family\":\"balance\"},\"taboo\":{\"behaviors\":[\"gamble\"],\"habits\":[\"game\"]}}" > /dev/null
echo "  Done"

sleep 2

# 5. User A starts matching - should go into pool (no other users yet)
echo "[5] User A starts matching..."
RESP=$(curl -s -X POST "$BASE/api/match/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"user_id\":\"$USR_A\"}")
echo "  $RESP"
QUEUED=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['queued'])")
if [ "$QUEUED" = "True" ]; then
  echo "  PASS: User A entered pool"
else
  echo "  FAIL: Expected queued=true"
  exit 1
fi

# 6. User A waiting status
echo "[6] User A waiting-status..."
RESP=$(curl -s "$BASE/api/match/waiting-status?user_id=$USR_A" \
  -H "Authorization: Bearer $TOKEN_A")
echo "  $RESP"
QUEUED=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['queued'])")
if [ "$QUEUED" = "True" ]; then
  echo "  PASS: User A still in pool"
else
  echo "  FAIL: Expected queued=true"
  exit 1
fi

# 7. User B starts matching - should match with A instantly
echo "[7] User B starts matching..."
RESP=$(curl -s -X POST "$BASE/api/match/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "{\"user_id\":\"$USR_B\"}")
echo "  $RESP"
MATCH_ID=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['match_id'])")
QUEUED=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['queued'])")
if [ -n "$MATCH_ID" ] && [ "$MATCH_ID" != "None" ] && [ "$QUEUED" = "False" ]; then
  echo "  PASS: User B matched -> $MATCH_ID"
else
  echo "  FAIL: Expected match_id and queued=false"
  exit 1
fi

# 8. User A waiting status - should now get matchId
echo "[8] User A waiting-status..."
RESP=$(curl -s "$BASE/api/match/waiting-status?user_id=$USR_A" \
  -H "Authorization: Bearer $TOKEN_A")
echo "  $RESP"
GOT_MATCH=$(echo "$RESP" | python -c "import sys,json; print(json.load(sys.stdin)['data']['match_id'])")
if [ "$GOT_MATCH" = "$MATCH_ID" ]; then
  echo "  PASS: User A got match_id=$MATCH_ID"
else
  echo "  FAIL: Expected $MATCH_ID, got $GOT_MATCH"
  exit 1
fi

echo ""
echo "=== ALL TESTS PASSED ==="
echo "Match ID: $MATCH_ID"
