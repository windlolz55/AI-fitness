$csvPath = "fda_data\20_2.csv"
$csv = Import-Csv -Path $csvPath -Encoding Default

$foods = @()

foreach ($row in $csv) {
    # Skip items with empty names or empty calories
    if ([string]::IsNullOrWhiteSpace($row.'樣品名稱') -or [string]::IsNullOrWhiteSpace($row.'熱量')) {
        continue
    }

    # Extract relevant fields
    $category = $row.'食品分類'
    $name = $row.'樣品名稱'
    
    # parse numbers, default to 0
    $cal = 0
    $pro = 0
    $fat = 0
    $carb = 0

    [double]::TryParse($row.'熱量', [ref]$cal) | Out-Null
    [double]::TryParse($row.'粗蛋白', [ref]$pro) | Out-Null
    [double]::TryParse($row.'粗脂肪', [ref]$fat) | Out-Null
    [double]::TryParse($row.'總碳水化合物', [ref]$carb) | Out-Null

    $foods += @{
        category = $category
        name = $name
        cal = $cal
        pro = $pro
        fat = $fat
        carb = $carb
    }
}

$json = $foods | ConvertTo-Json -Depth 5 -Compress
$jsContent = "const fdaFoodDB = $json;"
Set-Content -Path "food_db.js" -Value $jsContent -Encoding UTF8
Write-Host "Generated food_db.js with $($foods.Count) items."
