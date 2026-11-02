# Generate offline WAV narration with installed Windows voices. No API or downloads.
[CmdletBinding()]
param(
    [switch]$Force,
    [ValidateRange(1, 10000)][int]$Limit = 10000
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$clipDir = Join-Path $PSScriptRoot 'clips'
[IO.Directory]::CreateDirectory($clipDir) | Out-Null
$lines = @(Get-Content -LiteralPath (Join-Path $PSScriptRoot 'lines.json') -Raw -Encoding UTF8 | ConvertFrom-Json)
$profiles = @{
    hammy = @{ voice = 'Microsoft Zira Desktop'; pitch = '+10%'; rate = '-5%' }
    mom = @{ voice = 'Microsoft Zira Desktop'; pitch = '-2%'; rate = '-10%' }
    dad = @{ voice = 'Microsoft David Desktop'; pitch = '-3%'; rate = '-7%' }
    friend = @{ voice = 'Microsoft Mark'; pitch = '+16%'; rate = '-2%' }
}
$synth = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$format = [System.Speech.AudioFormat.SpeechAudioFormatInfo]::new(
    22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
    [System.Speech.AudioFormat.AudioChannel]::Mono)
$failed = [Collections.Generic.List[string]]::new()
$recorded = 0
$skipped = 0
$attempted = 0
try {
    $installed = @($synth.GetInstalledVoices() | Where-Object Enabled | ForEach-Object { $_.VoiceInfo.Name })
    foreach ($profile in $profiles.Values) {
        if ($profile.voice -notin $installed) { throw "Required installed voice missing: $($profile.voice)" }
        $synth.SelectVoice($profile.voice)
    }
    foreach ($line in $lines) {
        if ($line.id -notmatch '^(hammy|mom|dad|friend)-\d+$' -or -not $profiles.ContainsKey($line.speaker)) {
            throw 'Invalid line id or speaker in lines.json'
        }
        $path = Join-Path $clipDir ($line.id + '.wav')
        if (-not $Force -and (Test-Path -LiteralPath $path) -and (Get-Item -LiteralPath $path).Length -gt 44) {
            $skipped++
            continue
        }
        if ($attempted -ge $Limit) { break }
        $attempted++
        $temp = $path + '.part'
        try {
            $profile = $profiles[$line.speaker]
            $synth.SelectVoice($profile.voice)
            $text = [Security.SecurityElement]::Escape($line.text)
            # Letter lessons should say letter names rather than phonetic sounds.
            if ($line.group -eq 'letters') {
                $text = [regex]::Replace($text, '\b[A-Z]\b|(?<=little )[a-z]\b', '<say-as interpret-as="characters">$0</say-as>')
            }
            $rate = if ($line.group -eq 'book page') { '-12%' } else { $profile.rate }
            $ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><prosody pitch="' +
                $profile.pitch + '" rate="' + $rate + '" volume="85">' + $text + '</prosody></speak>'
            $synth.SetOutputToWaveFile($temp, $format)
            $synth.SpeakSsml($ssml)
            $synth.SetOutputToNull()
            if ((Get-Item -LiteralPath $temp).Length -le 44) { throw 'Empty audio output' }
            Move-Item -LiteralPath $temp -Destination $path -Force
            $recorded++
            if ($recorded % 25 -eq 0 -or $recorded -eq 1) { Write-Output "$recorded recorded / $($lines.Count) total: $($line.id)" }
        } catch {
            $failed.Add($line.id)
            Write-Warning "Failed $($line.id): $($_.Exception.Message)"
        } finally {
            $synth.SetOutputToNull()
            if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp }
        }
    }
} finally {
    $synth.Dispose()
    # JavaScript text keys are case-sensitive; ordinary PowerShell hashtables
    # would merge lines such as "Playground" and "playground".
    $manifest = [ordered]@{}
    foreach ($speaker in @('hammy', 'mom', 'dad', 'friend')) {
        $manifest[$speaker] = [Collections.Generic.Dictionary[string,string]]::new([StringComparer]::Ordinal)
    }
    foreach ($line in $lines) {
        # Prefer optional premium MP3 recordings if both versions exist.
        foreach ($extension in @('mp3', 'wav')) {
            $file = $line.id + '.' + $extension
            $candidate = Join-Path $clipDir $file
            if ((Test-Path -LiteralPath $candidate) -and (Get-Item -LiteralPath $candidate).Length -gt 44) {
                $manifest[$line.speaker][$line.text] = $file
                break
            }
        }
    }
    $json = ConvertTo-Json -InputObject $manifest -Depth 5
    $manifestTemp = Join-Path $clipDir 'manifest.js.tmp'
    [IO.File]::WriteAllText($manifestTemp, "window.VOICE_CLIPS = $json;`n", [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $manifestTemp -Destination (Join-Path $clipDir 'manifest.js') -Force
}
Write-Output "Finished: $recorded recorded, $skipped existing, $($failed.Count) failed."
if ($failed.Count) { throw "Failed ids: $($failed -join ', ')" }
