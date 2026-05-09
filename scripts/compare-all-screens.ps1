param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$BaseUrl = "http://127.0.0.1:5177",
  [string]$BrowserPath = "",
  [switch]$SkipCapture
)

$ErrorActionPreference = "Stop"

$artifactRoot = Join-Path $Root "artifacts\visual-compare\all-screens"
$figmaDir = Join-Path $artifactRoot "figma"
$figmaNormDir = Join-Path $artifactRoot "figma-normalized"
$localDir = Join-Path $artifactRoot "local"
$diffDir = Join-Path $artifactRoot "diff"

New-Item -ItemType Directory -Force $figmaDir, $figmaNormDir, $localDir, $diffDir | Out-Null

$cases = @(
  "onboarding", "checkin", "checkin-success", "home", "planning", "planning-adjust",
  "tasks", "task-new", "task-edit", "calendar-week", "calendar-month",
  "habits", "habit-new", "habit-edit", "habit-templates", "micro-pauses",
  "focus", "focus-session", "focus-break", "journal", "journal-night", "notes",
  "dashboard", "dashboard-history", "dashboard-operational", "export", "export-success",
  "export-ready", "goals", "settings", "reminders", "empty-states",
  "prototype-overview", "checkin-states"
)

if (-not $SkipCapture) {
  $captureScript = Join-Path $PSScriptRoot "capture-local-screens.mjs"
  $nodeArgs = @($captureScript, "--root", $Root, "--base-url", $BaseUrl, "--case-set", "all", "--out-dir", $localDir)
  if ($BrowserPath) { $nodeArgs += @("--browser", $BrowserPath) }
  & node @nodeArgs | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Falha ao capturar todas as telas locais." }
}

Add-Type -AssemblyName System.Drawing

function Normalize-FigmaImage([string]$src, [string]$dest) {
  $source = [System.Drawing.Bitmap]::FromFile($src)
  try {
    $target = New-Object System.Drawing.Bitmap 390, 844
    $graphics = [System.Drawing.Graphics]::FromImage($target)
    try {
      $graphics.Clear([System.Drawing.Color]::FromArgb(247, 250, 248))
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $drawHeight = [Math]::Min(844, [Math]::Round($source.Height * (390 / [double]$source.Width)))
      $graphics.DrawImage($source, 0, 0, 390, $drawHeight)
    } finally {
      $graphics.Dispose()
    }
    $target.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    if ($target) { $target.Dispose() }
    $source.Dispose()
  }
}

function Compare-Images([string]$referencePath, [string]$actualPath, [string]$diffPath) {
  $reference = [System.Drawing.Bitmap]::FromFile($referencePath)
  $actual = [System.Drawing.Bitmap]::FromFile($actualPath)
  try {
    $diff = New-Object System.Drawing.Bitmap 390, 844
    $changed = 0
    [double]$totalDelta = 0
    $threshold = 30

    for ($y = 0; $y -lt 844; $y++) {
      for ($x = 0; $x -lt 390; $x++) {
        $r = $reference.GetPixel($x, $y)
        $a = $actual.GetPixel($x, $y)
        $delta = [Math]::Abs($r.R - $a.R) + [Math]::Abs($r.G - $a.G) + [Math]::Abs($r.B - $a.B)
        $totalDelta += $delta
        if ($delta -gt $threshold) {
          $changed++
          $diff.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 236, 76, 76))
        } else {
          $gray = [int](($a.R + $a.G + $a.B) / 3)
          $diff.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $gray, $gray, $gray))
        }
      }
    }

    $diff.Save($diffPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $pixels = 390 * 844
    return [pscustomobject]@{
      changedPixels = $changed
      mismatchPct = [Math]::Round(($changed / [double]$pixels) * 100, 2)
      avgChannelDelta = [Math]::Round(($totalDelta / ($pixels * 3)), 2)
    }
  } finally {
    if ($diff) { $diff.Dispose() }
    $reference.Dispose()
    $actual.Dispose()
  }
}

$results = @()
foreach ($name in $cases) {
  $local = Join-Path $localDir "$name.png"
  $figma = Join-Path $figmaDir "$name.png"
  $figmaNorm = Join-Path $figmaNormDir "$name.png"
  $diff = Join-Path $diffDir "$name-diff.png"
  $hasLocal = Test-Path $local
  $hasFigma = Test-Path $figma
  $row = [ordered]@{
    name = $name
    local = $local
    hasLocal = $hasLocal
    figma = $figma
    hasFigmaReference = $hasFigma
    status = if ($hasFigma) { "comparado" } elseif ($hasLocal) { "referencia Figma pendente" } else { "captura local ausente" }
    mismatchPct = $null
    diff = $null
  }

  if ($hasLocal -and $hasFigma) {
    Normalize-FigmaImage $figma $figmaNorm
    $metrics = Compare-Images $figmaNorm $local $diff
    $row.mismatchPct = $metrics.mismatchPct
    $row.diff = $diff
  }

  $results += [pscustomobject]$row
}

$reportJson = Join-Path $artifactRoot "visual-report.json"
$reportMd = Join-Path $artifactRoot "visual-report.md"
$summary = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("s")
  viewport = "390x844"
  baseUrl = $BaseUrl
  totalScreens = $results.Count
  capturedScreens = ($results | Where-Object { $_.hasLocal }).Count
  comparedScreens = ($results | Where-Object { $_.hasFigmaReference }).Count
  missingFigmaReferences = ($results | Where-Object { -not $_.hasFigmaReference }).Count
  results = $results
}
$summary | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $reportJson

$lines = @(
  "# Comparacao visual - todas as telas",
  "",
  "- Viewport: 390x844",
  "- Base local: $BaseUrl",
  "- Telas locais capturadas: $($summary.capturedScreens)/$($summary.totalScreens)",
  "- Telas comparadas com referencia Figma: $($summary.comparedScreens)/$($summary.totalScreens)",
  "- Referencias Figma pendentes: $($summary.missingFigmaReferences)",
  "",
  "| Tela | Captura local | Referencia Figma | Diferenca | Status |",
  "| --- | --- | --- | ---: | --- |"
)

foreach ($result in $results) {
  $diffValue = if ($null -eq $result.mismatchPct) { "-" } else { "$($result.mismatchPct)%" }
  $lines += "| $($result.name) | $($result.hasLocal) | $($result.hasFigmaReference) | $diffValue | $($result.status) |"
}

$lines += ""
if ($summary.missingFigmaReferences -eq 0) {
  $lines += "## Maiores diferencas"
  $lines += ""
  $lines += "| Tela | Diferenca |"
  $lines += "| --- | ---: |"
  foreach ($result in ($results | Sort-Object mismatchPct -Descending | Select-Object -First 10)) {
    if ($null -ne $result.mismatchPct) {
      $lines += "| $($result.name) | $($result.mismatchPct)% |"
    }
  }
} else {
  $lines += "Para obter diferenca percentual em uma tela pendente, coloque o PNG exportado do Figma com o mesmo nome em artifacts/visual-compare/all-screens/figma/ e rode este script novamente."
}
$lines | Set-Content -Encoding UTF8 $reportMd

$summary
