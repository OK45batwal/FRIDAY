import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from pathlib import Path

router = APIRouter(prefix="/api/download", tags=["download"])

RELEASE_DIR = Path("/Users/omkar/FRIDAY/release")
GITHUB_RELEASES_URL = "https://github.com/OK45batwal/FRIDAY/releases/latest"

@router.get("/mac")
async def download_mac():
    """
    Directly serves the macOS application package.
    """
    mac_file = RELEASE_DIR / "FRIDAY-macOS-Universal.tar.gz"
    if mac_file.exists():
        return FileResponse(
            path=str(mac_file),
            filename="FRIDAY-macOS-Universal.tar.gz",
            media_type="application/gzip"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)

@router.get("/android")
async def download_android():
    """
    Directly serves the Android APK package.
    """
    apk_file = RELEASE_DIR / "FRIDAY-Android-v0.1.0.apk"
    if apk_file.exists():
        return FileResponse(
            path=str(apk_file),
            filename="FRIDAY-Android-v0.1.0.apk",
            media_type="application/vnd.android.package-archive"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)
