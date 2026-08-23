import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse, FileResponse
from pathlib import Path

router = APIRouter(prefix="/api/download", tags=["download"])

GITHUB_RELEASES_URL = "https://github.com/OK45batwal/FRIDAY/releases/latest"

@router.get("/mac")
async def download_mac():
    """
    Redirects to latest macOS release (.dmg / .zip).
    """
    return RedirectResponse(url=GITHUB_RELEASES_URL)

@router.get("/android")
async def download_android():
    """
    Downloads local Android APK if built or redirects to GitHub Releases.
    """
    local_apk_path = Path("/Users/omkar/FRIDAY/apps/desktop/android/app/build/outputs/apk/debug/app-debug.apk")
    if local_apk_path.exists():
        return FileResponse(
            path=str(local_apk_path),
            filename="FRIDAY-Android-debug.apk",
            media_type="application/vnd.android.package-archive"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)
