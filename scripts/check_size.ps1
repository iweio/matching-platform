$root = "c:\Users\22703\Desktop\Total"
Write-Host "Checking sizes under $root`n"

Get-ChildItem $root -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $files = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host ("{0,-20} {1,8:N2} MB  {2,8} files" -f $_.Name, ($size/1MB), $files)
}
