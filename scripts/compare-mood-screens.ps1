param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$BaseUrl = "http://127.0.0.1:5177",
  [string]$BrowserPath = "",
  [switch]$SkipCapture,
  [switch]$CaptureOnly,
  [switch]$StrictReferences
)

$ErrorActionPreference = "Stop"

$artifactRoot = Join-Path $Root "artifacts\visual-compare\mood-states"
$figmaDir = Join-Path $artifactRoot "figma"
$figmaNormDir = Join-Path $artifactRoot "figma-normalized"
$localDir = Join-Path $artifactRoot "local"
$diffDir = Join-Path $artifactRoot "diff"

New-Item -ItemType Directory -Force $figmaNormDir, $localDir, $diffDir | Out-Null

$cases = @(
  @{ Name = "home-high"; Page = "home"; Demo = "alta"; Frame = "2393:15"; Label = "Home - humor bom + energia alta" },
  @{ Name = "home-neutral"; Page = "home"; Demo = "media"; Frame = "2393:176"; Label = "Home - humor neutro + energia media" },
  @{ Name = "home-low"; Page = "home"; Demo = "baixa"; Frame = "2393:337"; Label = "Home - humor ruim + energia baixa" },
  @{ Name = "home-protect"; Page = "home"; Demo = "protetivo"; Frame = "2393:498"; Label = "Home - humor baixo por varios dias" },
  @{ Name = "focus-high"; Page = "focus"; Demo = "alta"; Frame = "2393:124"; Label = "Foco - humor bom + energia alta" },
  @{ Name = "focus-neutral"; Page = "focus"; Demo = "media"; Frame = "2393:285"; Label = "Foco - humor neutro + energia media" },
  @{ Name = "focus-low"; Page = "focus"; Demo = "baixa"; Frame = "2393:446"; Label = "Foco - humor ruim + energia baixa" },
  @{ Name = "focus-protect"; Page = "focus"; Demo = "protetivo"; Frame = "2393:607"; Label = "Foco - humor baixo por varios dias" }
)

function Find-Browser {
  if ($BrowserPath -and (Test-Path $BrowserPath)) { return (Resolve-Path $BrowserPath).Path }

  $candidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path $candidate)) { return $candidate }
  }

  $commands = @("msedge", "chrome", "chromium")
  foreach ($command in $commands) {
    $found = Get-Command $command -ErrorAction SilentlyContinue
    if ($found) { return $found.Source }
  }

  throw "Nenhum browser Chromium encontrado para captura headless."
}

function Capture-LocalScreen([hashtable]$case, [string]$browser) {
  $outFile = Join-Path $localDir "$($case.Name).png"
  $url = "$BaseUrl/pages/$($case.Page).html?demo=$($case.Demo)&v=visual-compare"
  $profileDir = Join-Path $env:TEMP "plenna-visual-compare-edge"
  $args = @(
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--disable-dev-shm-usage",
    "--user-data-dir=$profileDir",
    "--force-device-scale-factor=1",
    "--window-size=390,844",
    "--screenshot=$outFile",
    $url
  )
  & $browser @args | Out-Null
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $outFile)) {
    throw "Falha ao capturar $($case.Name) em $url"
  }
  return $outFile
}

Add-Type -AssemblyName System.Drawing

function Normalize-FigmaImage([string]$src, [string]$dest) {
  if (-not (Test-Path $src)) { throw "Referencia Figma ausente: $src" }

  $source = [System.Drawing.Bitmap]::FromFile($src)
  try {
    $target = New-Object System.Drawing.Bitmap 390, 844
    $graphics = [System.Drawing.Graphics]::FromImage($target)
    try {
      $graphics.Clear([System.Drawing.Color]::FromArgb(247, 250, 248))
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

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
  if (-not (Test-Path $actualPath)) { throw "Screenshot local ausente: $actualPath" }

  $reference = [System.Drawing.Bitmap]::FromFile($referencePath)
  $actual = [System.Drawing.Bitmap]::FromFile($actualPath)
  try {
    if ($reference.Width -ne 390 -or $reference.Height -ne 844) {
      throw "Referencia normalizada precisa ser 390x844: $referencePath"
    }
    if ($actual.Width -ne 390 -or $actual.Height -ne 844) {
      throw "Screenshot local precisa ser 390x844: $actualPath ($($actual.Width)x$($actual.Height))"
    }

    $diff = New-Object System.Drawing.Bitmap 390, 844
    $changed = 0
    [double]$totalDelta = 0
    $maxDelta = 0
    $threshold = 30

    for ($y = 0; $y -lt 844; $y++) {
      for ($x = 0; $x -lt 390; $x++) {
        $r = $reference.GetPixel($x, $y)
        $a = $actual.GetPixel($x, $y)
        $delta = [Math]::Abs($r.R - $a.R) + [Math]::Abs($r.G - $a.G) + [Math]::Abs($r.B - $a.B)
        $totalDelta += $delta
        if ($delta -gt $maxDelta) { $maxDelta = $delta }

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
      maxPixelDelta = $maxDelta
    }
  } finally {
    if ($diff) { $diff.Dispose() }
    $reference.Dispose()
    $actual.Dispose()
  }
}

if (-not $SkipCapture) {
  $captureScript = Join-Path $PSScriptRoot "capture-local-screens.mjs"
  $nodeArgs = @($captureScript, "--root", $Root, "--base-url", $BaseUrl)
  if ($BrowserPath) {
    $nodeArgs += @("--browser", $BrowserPath)
  }
  & node @nodeArgs | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao capturar telas locais via Chrome DevTools Protocol."
  }
}

if ($CaptureOnly) {
  [pscustomobject]@{
    generatedAt = (Get-Date).ToString("s")
    viewport = "390x844"
    localDir = $localDir
    captured = ($cases | ForEach-Object { Join-Path $localDir "$($_.Name).png" })
  }
  return
}

$results = @()
$referenceWarnings = @()
foreach ($case in $cases) {
  $figma = Join-Path $figmaDir "$($case.Name).png"
  $figmaNorm = Join-Path $figmaNormDir "$($case.Name).png"
  $local = Join-Path $localDir "$($case.Name).png"
  $diff = Join-Path $diffDir "$($case.Name)-diff.png"

  if (-not (Test-Path $figma)) { throw "Referencia Figma ausente: $figma" }
  if (-not (Test-Path $local)) { throw "Screenshot local ausente: $local" }

  $figmaHash = (Get-FileHash $figma -Algorithm SHA256).Hash
  $localHash = (Get-FileHash $local -Algorithm SHA256).Hash
  $sourceFilesIdentical = $figmaHash -eq $localHash

  if ($sourceFilesIdentical) {
    $referenceWarnings += [pscustomobject]@{
      name = $case.Name
      warning = "Referencia Figma e screenshot local sao byte a byte identicos; substitua figma/$($case.Name).png por export real do Figma."
      hash = $figmaHash
    }
  }

  Normalize-FigmaImage $figma $figmaNorm
  $metrics = Compare-Images $figmaNorm $local $diff

  $results += [pscustomobject]@{
    name = $case.Name
    label = $case.Label
    frame = $case.Frame
    figma = $figma
    figmaNormalized = $figmaNorm
    local = $local
    diff = $diff
    figmaHash = $figmaHash
    localHash = $localHash
    sourceFilesIdentical = $sourceFilesIdentical
    changedPixels = $metrics.changedPixels
    mismatchPct = $metrics.mismatchPct
    avgChannelDelta = $metrics.avgChannelDelta
    maxPixelDelta = $metrics.maxPixelDelta
  }
}

if ($StrictReferences -and $referenceWarnings.Count -gt 0) {
  $names = ($referenceWarnings | ForEach-Object { $_.name }) -join ", "
  throw "Comparacao abortada: referencias Figma identicas aos screenshots locais ($names)."
}

$reportJson = Join-Path $artifactRoot "visual-report.json"
$reportMd = Join-Path $artifactRoot "visual-report.md"

$summary = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("s")
  viewport = "390x844"
  baseUrl = $BaseUrl
  totalScreens = $results.Count
  isValidComparison = $referenceWarnings.Count -eq 0
  referenceWarnings = $referenceWarnings
  averageMismatchPct = [Math]::Round((($results | Measure-Object -Property mismatchPct -Average).Average), 2)
  worst = ($results | Sort-Object mismatchPct -Descending | Select-Object -First 1)
  results = $results
}

$summary | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $reportJson

$lines = @()
$lines += "# Comparacao visual automatizada"
$lines += ""
$lines += "- Viewport: 390x844"
$lines += "- Base local: $BaseUrl"
$lines += "- Comparacao valida: $($summary.isValidComparison)"
$lines += "- Media de diferenca: $($summary.averageMismatchPct)%"
$lines += "- Pior tela: $($summary.worst.name) ($($summary.worst.mismatchPct)%)"
$lines += ""
if ($referenceWarnings.Count -gt 0) {
  $lines += "## Aviso de referencias"
  $lines += ""
  $lines += 'Os arquivos abaixo em `figma/` sao byte a byte identicos aos screenshots locais. O resultado numerico nao deve ser tratado como comparacao contra o Figma ate que esses arquivos sejam substituidos por exports reais do Figma.'
  $lines += ""
  foreach ($warning in $referenceWarnings) {
    $lines += "- $($warning.name): $($warning.warning)"
  }
  $lines += ""
}
$lines += "| Tela | Frame | Pixels diferentes | Diferenca | Delta medio | Diff |"
$lines += "| --- | --- | ---: | ---: | ---: | --- |"
foreach ($result in $results) {
  $relativeDiff = Resolve-Path -Relative $result.diff
  $lines += "| $($result.name) | $($result.frame) | $($result.changedPixels) | $($result.mismatchPct)% | $($result.avgChannelDelta) | $relativeDiff |"
}
$lines += ""
$lines += "Observacao: frames Figma menores que 844px sao preservados em largura 390px e preenchidos embaixo com #f7faf8 para permitir comparacao no viewport solicitado."
$lines | Set-Content -Encoding UTF8 $reportMd

$summary
