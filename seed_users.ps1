$ErrorActionPreference = "Continue"

Write-Host "=== Seeding test users ===" -ForegroundColor Cyan

function New-TestUser {
    param($phone, $nick, $gender, $age, $speakStyle, $character, $loveStyle, $marriage, $consume, $family, $behaviors, $habits)
    Write-Host "Creating: $nick"
    $init = @{phone=$phone; nick=$nick; gender=$gender; age=$age} | ConvertTo-Json -Compress
    $r = Invoke-RestMethod -Uri "http://localhost:8080/api/agent/init" -Method POST -Body $init -ContentType "application/json" -ErrorAction Stop
    $uid = $r.data.user_id
    $aid = $r.data.agent_id
    Write-Host "  uid=$uid aid=$aid"

    $values = @{marriage=$marriage; consume=$consume; family=$family} | ConvertTo-Json -Compress
    $tabooJ = @{behaviors=$behaviors; habits=$habits} | ConvertTo-Json -Compress

    $distillBody = @{user_id=$uid; speak_style=$speakStyle; character=$character; love_style=$loveStyle; values_view=($values | ConvertFrom-Json); taboo=($tabooJ | ConvertFrom-Json)} | ConvertTo-Json -Compress -Depth 3
    Invoke-RestMethod -Uri "http://localhost:8080/api/user/distill" -Method POST -Body $distillBody -ContentType "application/json" | Out-Null
    Write-Host "  distilled"

    $refreshBody = @{user_id=$uid; agent_id=$aid; speak_style=$speakStyle; character=$character; love_style=$loveStyle; values_view=($values | ConvertFrom-Json); taboo=($tabooJ | ConvertFrom-Json)} | ConvertTo-Json -Compress -Depth 3
    Invoke-RestMethod -Uri "http://localhost:8080/api/agent/algo/model-refresh" -Method POST -Body $refreshBody -ContentType "application/json" | Out-Null
    Write-Host "  refreshed"
    return $uid
}

$u1 = New-TestUser "13800001111" "SunnyMike" 1 28 "humor"    "extrovert" "romantic"   "must"  "balance" "family_first" @("cheat","cold")    @("dirty")
$u2 = New-TestUser "13900002222" "GentleLily" 0 26 "gentle"   "introvert" "companion"  "maybe" "enjoy"   "balance"       @("gamble","drink") @("game")
$u3 = New-TestUser "13700003333" "SolidJohn"  1 30 "direct"   "stable"    "practical"  "must"  "balance" "balance"       @("violence")        @("lazy")
$u4 = New-TestUser "13600004444" "CuteAmy"    0 25 "confident" "lively"   "clingy"     "must"  "enjoy"   "family_first"  @("cheat")           @("dirty","lazy")

Write-Host ""
Write-Host "=== Done! Male: $u1 $u3  Female: $u2 $u4 ===" -ForegroundColor Green
