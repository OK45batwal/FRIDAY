from fastapi import APIRouter
from fastapi.responses import FileResponse, RedirectResponse
from services.core.app.config import settings

router = APIRouter(prefix="/api/download", tags=["download"])

GITHUB_RELEASES_URL = "https://github.com/OK45batwal/FRIDAY/releases/latest"

@router.get("/android")
async def download_android():
    """
    1-Click Direct Download for Android (.apk)
    """
    apk_file = settings.RELEASE_DIR / "FRIDAY-Android-v0.1.0.apk"
    if apk_file.exists():
        return FileResponse(
            path=str(apk_file),
            filename="FRIDAY-Android.apk",
            media_type="application/vnd.android.package-archive"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)

@router.get("/mac")
async def download_mac():
    """
    1-Click Direct Download for macOS (.dmg)
    """
    dmg_file = settings.RELEASE_DIR / "FRIDAY-0.1.0-arm64.dmg"
    if dmg_file.exists():
        return FileResponse(
            path=str(dmg_file),
            filename="FRIDAY-macOS.dmg",
            media_type="application/x-apple-diskimage"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)

@router.get("/windows")
async def download_windows():
    """
    1-Click Direct Download for Windows (.exe / .zip)
    """
    win_exe = settings.RELEASE_DIR / "FRIDAY-Setup.exe"
    win_zip = settings.RELEASE_DIR / "FRIDAY-Windows.zip"
    if win_exe.exists():
        return FileResponse(
            path=str(win_exe),
            filename="FRIDAY-Windows-Setup.exe",
            media_type="application/vnd.microsoft.portable-executable"
        )
    elif win_zip.exists():
        return FileResponse(
            path=str(win_zip),
            filename="FRIDAY-Windows.zip",
            media_type="application/zip"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)

