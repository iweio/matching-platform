$ErrorActionPreference = "Stop"
$base = "http://localhost:8080"
$ts = Get-Date -Format "HHmmss"
$phoneA = "1380000" + $ts.Substring(0,5)
$phoneB = "1390000" + $ts.Substring(0,5)

Write-Host "=== 匹配池测试 ===" -ForegroundColor Cyan
Write-Host ""

function Post-Json($url, $body) {
    $json = $body | ConvertTo-Json -Compress
    Write-Host "  POST $url" -ForegroundColor DarkGray
    return Invoke-RestMethod -Uri $url -Method POST -Body $json -ContentType "application/json"
}
function Post-JsonAuth($url, $body, $token) {
    $json = $body | ConvertTo-Json -Compress
    Write-Host "  POST $url" -ForegroundColor DarkGray
    return Invoke-RestMethod -Uri $url -Method POST -Body $json -ContentType "application/json" -Headers @{ Authorization="Bearer $token" }
}
function Get-Json($url) {
    Write-Host "  GET $url" -ForegroundColor DarkGray
    return Invoke-RestMethod -Uri $url -Method GET
}
function Get-JsonAuth($url, $token) {
    Write-Host "  GET $url" -ForegroundColor DarkGray
    return Invoke-RestMethod -Uri $url -Method GET -Headers @{ Authorization="Bearer $token" }
}

# 1. Register User A (male)
Write-Host "[1] 注册用户 A (男)..." -ForegroundColor Yellow
$r = Post-Json "$base/api/auth/register" @{ phone=$phoneA; nick="测试A"; password="123456"; gender=1; age=28 }
$uidA = $r.data.userId
$tokenA = $r.data.token
Write-Host "    userId=$uidA" -ForegroundColor Green

# 2. Register User B (female)
Write-Host "[2] 注册用户 B (女)..." -ForegroundColor Yellow
$r = Post-Json "$base/api/auth/register" @{ phone=$phoneB; nick="测试B"; password="123456"; gender=0; age=26 }
$uidB = $r.data.userId
$tokenB = $r.data.token
Write-Host "    userId=$uidB" -ForegroundColor Green

# 3. Distill User A
Write-Host "[3] 蒸馏用户 A..." -ForegroundColor Yellow
$body = @{ userId=$uidA; speakStyle="humor"; character="outgoing"; loveStyle="romantic"; valuesView=@{ marriage="must"; consume="balance"; family="family_first" }; taboo=@{ behaviors=@("cheat"); habits=@("dirty") } }
Post-JsonAuth "$base/api/user/distill" $body $tokenA | Out-Null
Write-Host "    完成" -ForegroundColor Green

# 4. Distill User B
Write-Host "[4] 蒸馏用户 B..." -ForegroundColor Yellow
$body = @{ userId=$uidB; speakStyle="gentle"; character="introvert"; loveStyle="companion"; valuesView=@{ marriage="maybe"; consume="enjoy"; family="balance" }; taboo=@{ behaviors=@("gamble"); habits=@("game") } }
Post-JsonAuth "$base/api/user/distill" $body $tokenB | Out-Null
Write-Host "    完成" -ForegroundColor Green

# 5. User A starts match -> should enter pool
Write-Host "[5] 用户 A 发起匹配 (应进入匹配池)..." -ForegroundColor Yellow
$r = Post-JsonAuth "$base/api/match/start" @{ userId=$uidA } $tokenA
Write-Host "    queued=$($r.data.queued) msg=$($r.data.message)" -ForegroundColor White
if ($r.data.queued) {
    Write-Host "    ✓ 用户 A 进入匹配池" -ForegroundColor Green
} else {
    Write-Host "    ✗ 失败: $(($r | ConvertTo-Json -Depth 5))" -ForegroundColor Red
    exit 1
}

# 6. User A check waiting-status -> should be in pool
Write-Host "[6] 用户 A 查询等待状态..." -ForegroundColor Yellow
$r = Get-JsonAuth "$base/api/match/waiting-status?user_id=$uidA" $tokenA
Write-Host "    queued=$($r.data.queued)" -ForegroundColor White
if ($r.data.queued) {
    Write-Host "    ✓ 确认在匹配池中" -ForegroundColor Green
} else {
    Write-Host "    ✗ 失败" -ForegroundColor Red
    exit 1
}

# 7. User B starts match -> should instantly match with A
Write-Host "[7] 用户 B 发起匹配 (应立即匹配到 A)..." -ForegroundColor Yellow
$r = Post-JsonAuth "$base/api/match/start" @{ userId=$uidB } $tokenB
$matchId = $r.data.match_id
Write-Host "    matchId=$matchId queued=$($r.data.queued)" -ForegroundColor White
if ($matchId -and -not $r.data.queued) {
    Write-Host "    ✓ 用户 B 秒配成功!" -ForegroundColor Green
} else {
    Write-Host "    ✗ 失败: $(($r | ConvertTo-Json -Depth 5))" -ForegroundColor Red
    exit 1
}

# 8. User A retries startMatch -> should get matchId
Write-Host "[8] 用户 A 重试匹配 (应拿到 matchId)..." -ForegroundColor Yellow
$r = Post-JsonAuth "$base/api/match/start" @{ userId=$uidA } $tokenA
Write-Host "    matchId=$($r.data.match_id) queued=$($r.data.queued)" -ForegroundColor White
if ($r.data.match_id -eq $matchId -and -not $r.data.queued) {
    Write-Host "    ✓ 用户 A 拿到 matchId! 前后端完整流程通过!" -ForegroundColor Green
} else {
    Write-Host "    ✗ 失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== 全部通过! 匹配池工作正常 ===" -ForegroundColor Green
Write-Host "matchId: $matchId" -ForegroundColor White
Write-Host "用户 A: $uidA | 用户 B: $uidB" -ForegroundColor White
