$source = "C:\Users\MY PC\Desktop\edata-mobile\assets\icons\eData.png"

Write-Host "Source logo:" $source "Exists:" (Test-Path $source)

# Web & App static assets
$webTargets = @(
    "src/assets/edata_logo.png",
    "src/assets/edata_web_logo.png",
    "public/favicon.ico",
    "public/favicon.png",
    "public/apple-touch-icon.png",
    "public/icon-192.png",
    "public/icon-512.png",
    "assets/icons/splash-icon.png",
    "assets/icons/android-icon-foreground.png"
)

foreach ($target in $webTargets) {
    Copy-Item -Path $source -Destination $target -Force
    Write-Host "Updated static asset:" $target
}

# Android drawable splash screens
$splashFiles = Get-ChildItem -Path "android/app/src/main/res" -Recurse -Filter "splash.png"
foreach ($file in $splashFiles) {
    Copy-Item -Path $source -Destination $file.FullName -Force
    Write-Host "Updated Android Splash:" $file.FullName
}

# Android mipmap launcher icons
$launcherFiles = Get-ChildItem -Path "android/app/src/main/res" -Recurse -Filter "ic_launcher*.png"
foreach ($file in $launcherFiles) {
    Copy-Item -Path $source -Destination $file.FullName -Force
    Write-Host "Updated Android Launcher Icon:" $file.FullName
}

Write-Host "All logo & launcher icon assets successfully synchronized with official eData.png!"
