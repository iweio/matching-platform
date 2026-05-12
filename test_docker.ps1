# UTF-8 encoded test script
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Matching Platform - Docker Integration Test" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$BASE_BACKEND = "http://localhost:8080"
$BASE_AGENT = "http://localhost:8001"
$BASE_FRONTEND = "http://localhost:3000"
$PASS = 0
$FAIL = 0

function Test-Endpoint {
    param($Name, $Method, $Url, $Body, $ExpectedCode = 200)
    try {
        if ($Method -eq "GET") {
            $r = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
        } else {
            $r = Invoke-WebRequest -Uri $Url -Method POST -Body $Body -ContentType "application/json" -TimeoutSec 30 -UseBasicParsing
        }
        if ($r.StatusCode -eq $ExpectedCode) {
            Write-Host "  [PASS] $Name (HTTP $($r.StatusCode))" -ForegroundColor Green
            $script:PASS++
            return $r.Content
        } else {
            Write-Host "  [FAIL] $Name - Expected $ExpectedCode, got $($r.StatusCode)" -ForegroundColor Red
            $script:FAIL++
            return $null
        }
    } catch {
        $err = $_.Exception.Message
        if ($_.Exception.Response) {
            $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $sr.ReadToEnd()
            $sr.Close()
            $code = [int]$_.Exception.Response.StatusCode
            if ($code -eq $ExpectedCode) {
                Write-Host "  [PASS] $Name (HTTP $code, expected)" -ForegroundColor Green
                $script:PASS++
                return $errBody
            }
            Write-Host "  [FAIL] $Name - HTTP $code, expected $ExpectedCode" -ForegroundColor Red
            $shortBody = if ($errBody.Length -gt 100) { $errBody.Substring(0, 100) } else { $errBody }
            Write-Host "          Body: $shortBody" -ForegroundColor DarkGray
        } else {
            Write-Host "  [FAIL] $Name - $err" -ForegroundColor Red
        }
        $script:FAIL++
        return $null
    }
}

# ===== 1. Agent Service Health =====
Write-Host "--- 1. Agent Service Health ---" -ForegroundColor Yellow
Test-Endpoint "Agent Health" "GET" "$BASE_AGENT/health"

# ===== 2. Create User A =====
Write-Host "--- 2. Create User A ---" -ForegroundColor Yellow
$ts = (Get-Date -Format "HHmmss")
$userPhoneA = "1380000" + $ts.Substring(0,5)
$userPhoneB = "1390000" + $ts.Substring(0,5)

$bodyA = '{"phone":"' + $userPhoneA + '","nick":"TestUserA","gender":1,"age":28}'
$respA = Test-Endpoint "Create User A" "POST" "$BASE_BACKEND/api/agent/init" $bodyA

# ===== 3. Create User B =====
Write-Host "--- 3. Create User B ---" -ForegroundColor Yellow
$bodyB = '{"phone":"' + $userPhoneB + '","nick":"TestUserB","gender":0,"age":26}'
$respB = Test-Endpoint "Create User B" "POST" "$BASE_BACKEND/api/agent/init" $bodyB

Start-Sleep -Seconds 1

$userIdA = ""
$userIdB = ""
if ($respA) {
    $jsonA = $respA | ConvertFrom-Json
    $userIdA = $jsonA.data.user_id
    Write-Host "         user_id A: $userIdA" -ForegroundColor DarkGray
}
if ($respB) {
    $jsonB = $respB | ConvertFrom-Json
    $userIdB = $jsonB.data.user_id
    Write-Host "         user_id B: $userIdB" -ForegroundColor DarkGray
}

# ===== 4. Get User A Info =====
Write-Host "--- 4. Get User A Info ---" -ForegroundColor Yellow
Test-Endpoint "User A Info" "GET" "$BASE_BACKEND/api/user/me?user_id=$userIdA"

# ===== 5. Get User B Info =====
Write-Host "--- 5. Get User B Info ---" -ForegroundColor Yellow
Test-Endpoint "User B Info" "GET" "$BASE_BACKEND/api/user/me?user_id=$userIdB"

# ===== 6. Distill User A =====
Write-Host "--- 6. Distill User A ---" -ForegroundColor Yellow
$distillA = '{"user_id":"' + $userIdA + '","speak_style":"humor","character":"outgoing","love_style":"romantic","values_view":{"marriage":"must","consume":"balance","family":"family_first"},"taboo":{"behaviors":["cheat","cold"],"habits":["dirty"]}}'
Test-Endpoint "Distill User A" "POST" "$BASE_BACKEND/api/user/distill" $distillA

# ===== 7. Distill User B =====
Write-Host "--- 7. Distill User B ---" -ForegroundColor Yellow
$distillB = '{"user_id":"' + $userIdB + '","speak_style":"gentle","character":"introvert","love_style":"companion","values_view":{"marriage":"maybe","consume":"enjoy","family":"balance"},"taboo":{"behaviors":["gamble","drink"],"habits":["game"]}}'
Test-Endpoint "Distill User B" "POST" "$BASE_BACKEND/api/user/distill" $distillB

# ===== 8. Model Refresh User A =====
Write-Host "--- 8. Model Refresh User A ---" -ForegroundColor Yellow
$refreshA = '{"user_id":"' + $userIdA + '"}'
Test-Endpoint "Model Refresh A" "POST" "$BASE_BACKEND/api/agent/algo/model-refresh" $refreshA

# ===== 9. Model Refresh User B =====
Write-Host "--- 9. Model Refresh User B ---" -ForegroundColor Yellow
$refreshB = '{"user_id":"' + $userIdB + '"}'
Test-Endpoint "Model Refresh B" "POST" "$BASE_BACKEND/api/agent/algo/model-refresh" $refreshB

# ===== 10. Start Match =====
Write-Host "--- 10. Start Match ---" -ForegroundColor Yellow
$startA = '{"user_id":"' + $userIdA + '"}'
$matchResp = Test-Endpoint "Start Match" "POST" "$BASE_BACKEND/api/match/start" $startA

$matchId = ""
if ($matchResp) {
    $matchJson = $matchResp | ConvertFrom-Json
    $matchId = $matchJson.data.match_id
    Write-Host "         match_id: $matchId" -ForegroundColor DarkGray
}

# ===== 11. Match Progress =====
Write-Host "--- 11. Match Progress ---" -ForegroundColor Yellow
if ($matchId) {
    $progressResp = Test-Endpoint "Match Progress" "GET" "$BASE_BACKEND/api/match/progress?match_id=$matchId&user_id=$userIdA"
    if ($progressResp) {
        $pj = $progressResp | ConvertFrom-Json
        Write-Host "         status: $($pj.data.status)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [SKIP] No match_id" -ForegroundColor DarkGray
}

# ===== 12. Chat Record =====
Write-Host "--- 12. Chat Record ---" -ForegroundColor Yellow
if ($matchId) {
    Test-Endpoint "Chat Record" "GET" "$BASE_BACKEND/api/match/chat-record?match_id=$matchId"
} else {
    Write-Host "  [SKIP] No match_id" -ForegroundColor DarkGray
}

# ===== 13. Match Report =====
Write-Host "--- 13. Match Report ---" -ForegroundColor Yellow
if ($matchId) {
    Test-Endpoint "Match Report" "GET" "$BASE_BACKEND/api/match/report?match_id=$matchId&user_id=$userIdA"
} else {
    Write-Host "  [SKIP] No match_id" -ForegroundColor DarkGray
}

# ===== 14. Unlock =====
Write-Host "--- 14. Unlock ---" -ForegroundColor Yellow
if ($matchId) {
    $unlockBody = '{"match_id":"' + $matchId + '","user_id":"' + $userIdA + '","operation":"agree"}'
    Test-Endpoint "Unlock" "POST" "$BASE_BACKEND/api/match/unlock" $unlockBody
} else {
    Write-Host "  [SKIP] No match_id" -ForegroundColor DarkGray
}

# ===== 15. Chat Send =====
Write-Host "--- 15. Chat Send ---" -ForegroundColor Yellow
if ($matchId) {
    $chatBody = '{"match_id":"' + $matchId + '","sender_id":"' + $userIdA + '","content":"Hello!"}'
    Test-Endpoint "Chat Send" "POST" "$BASE_BACKEND/api/chat/send" $chatBody
} else {
    Write-Host "  [SKIP] No match_id" -ForegroundColor DarkGray
}

# ===== 16. Chat List =====
Write-Host "--- 16. Chat List ---" -ForegroundColor Yellow
if ($matchId) {
    Test-Endpoint "Chat List" "GET" "$BASE_BACKEND/api/chat/list?match_id=$matchId&user_id=$userIdA"
} else {
    Write-Host "  [SKIP] No match_id" -ForegroundColor DarkGray
}

# ===== 17. Risk Detect =====
Write-Host "--- 17. Risk Detect ---" -ForegroundColor Yellow
if ($matchId) {
    $riskBody = '{"match_id":"' + $matchId + '"}'
    Test-Endpoint "Risk Detect" "POST" "$BASE_BACKEND/api/agent/algo/risk-detect" $riskBody
} else {
    Write-Host "  [SKIP] No match_id" -ForegroundColor DarkGray
}

# ===== 18. Frontend =====
Write-Host "--- 18. Frontend ---" -ForegroundColor Yellow
Test-Endpoint "Frontend Index" "GET" "$BASE_FRONTEND/"

# ===== 19. Frontend Routes =====
Write-Host "--- 19. Frontend Routes ---" -ForegroundColor Yellow
$routes = @("/login", "/register", "/distill", "/match", "/matching", "/profile", "/settings")
foreach ($route in $routes) {
    Test-Endpoint "Frontend $route" "GET" "$BASE_FRONTEND$route"
}

# ===== Summary =====
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
$color = if ($FAIL -eq 0) { "Green" } else { "Red" }
Write-Host "  PASS: $PASS | FAIL: $FAIL" -ForegroundColor $color

if ($FAIL -eq 0) {
    Write-Host ""
    Write-Host "  ALL TESTS PASSED! Docker environment OK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  URLs:" -ForegroundColor White
    Write-Host "    Frontend:   http://localhost:3000" -ForegroundColor DarkGray
    Write-Host "    Backend:    http://localhost:8080" -ForegroundColor DarkGray
    Write-Host "    Agent API:  http://localhost:8001" -ForegroundColor DarkGray
    Write-Host "    MySQL:      localhost:3307" -ForegroundColor DarkGray
    exit 0
} else {
    Write-Host ""
    Write-Host "  $FAIL test(s) FAILED! Check logs above." -ForegroundColor Red
    exit 1
}
