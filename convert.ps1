$lines = Get-Content 'fda_data\20_2.csv' -Encoding Default
$validFoods = @()

# skip header line
for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    # Strip leading and trailing quotes if any
    $line = $line -replace '^"|"$', ''
    
    # Split by ","
    $parts = $line -split '","'
    
    if ($parts.Count -ge 14) {
        $category = $parts[0]
        $name = $parts[3]
        $cal = $parts[9]
        $pro = $parts[11]
        $fat = $parts[12]
        $carb = $parts[13]
        
        if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($cal)) { continue }
        
        $validFoods += @{
            category = $category
            name = $name
            cal = $cal
            pro = $pro
            fat = $fat
            carb = $carb
        }
    }
}
$js = "const fdaFoodDB = " + ($validFoods | ConvertTo-Json -Depth 3 -Compress) + ";"
Set-Content -Path 'food_db.js' -Value $js -Encoding UTF8
