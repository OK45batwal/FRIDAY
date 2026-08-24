from fastapi import APIRouter
from fastapi.responses import FileResponse, RedirectResponse
from services.core.app.config import settings

router = APIRouter(prefix="/api/download", tags=["download"])

GITHUB_RELEASES_URL = "https://github.com/OK45batwal/FRIDAY/releases/latest"

def _find_latest_file(pattern: str):
    """Finds the first matching release file in settings.RELEASE_DIR."""
    if not settings.RELEASE_DIR.exists():
        return None
    matches = sorted(list(settings.RELEASE_DIR.glob(pattern)), reverse=True)
    return matches[0] if matches else None

@router.get("/android")
async def download_android():
    """
    1-Click Direct Download for Android (.apk)
    """
    apk_file = _find_latest_file("*.apk")
    if apk_file and apk_file.exists():
        return FileResponse(
            path=str(apk_file),
            filename="FRIDAY-Android-v1.0.0.apk",
            media_type="application/vnd.android.package-archive"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)

@router.get("/mac")
async def download_mac():
    """
    1-Click Direct Download for macOS (.dmg)
    """
    dmg_file = _find_latest_file("*.dmg")
    if dmg_file and dmg_file.exists():
        return FileResponse(
            path=str(dmg_file),
            filename="FRIDAY-macOS-v1.0.0.dmg",
            media_type="application/x-apple-diskimage"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)

@router.get("/windows")
async def download_windows():
    """
    1-Click Direct Download for Windows (.exe / .zip)
    """
    win_exe = _find_latest_file("*.exe")
    win_zip = _find_latest_file("*.zip")
    if win_exe and win_exe.exists():
        return FileResponse(
            path=str(win_exe),
            filename="FRIDAY-Windows-Setup-v1.0.0.exe",
            media_type="application/vnd.microsoft.portable-executable"
        )
    elif win_zip and win_zip.exists():
        return FileResponse(
            path=str(win_zip),
            filename="FRIDAY-Windows-v1.0.0.zip",
            media_type="application/zip"
        )
    return RedirectResponse(url=GITHUB_RELEASES_URL)


