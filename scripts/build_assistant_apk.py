import os
import subprocess
import shutil
import zipfile
from pathlib import Path

ROOT = Path("/Users/omkar/FRIDAY")
ANDROID_DIR = ROOT / "apps" / "android" / "app" / "src" / "main"
BUILD_DIR = ROOT / "apps" / "android" / "build_temp"
RELEASE_DIR = ROOT / "release"
KEYSTORE = ROOT / "release" / "friday_release.keystore"


SDK_BUILD_TOOLS = Path("/Users/omkar/Library/Android/sdk/build-tools/34.0.0")
ANDROID_JAR = Path("/Users/omkar/Library/Android/sdk/platforms/android-34/android.jar")

AAPT2 = SDK_BUILD_TOOLS / "aapt2"
D8 = SDK_BUILD_TOOLS / "d8"
ZIPALIGN = SDK_BUILD_TOOLS / "zipalign"
APKSIGNER = SDK_BUILD_TOOLS / "apksigner"

def build():
    print("=" * 60)
    print("🤖 COMPILING FRIDAY NATIVE ANDROID ASSISTANT APK")
    print("=" * 60)
    
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    BUILD_DIR.mkdir(parents=True)
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    
    res_dir = ANDROID_DIR / "res"
    manifest = ANDROID_DIR / "AndroidManifest.xml"
    java_dir = ANDROID_DIR / "java"
    
    # 1. Compile Resources with aapt2
    compiled_res = BUILD_DIR / "compiled_res.zip"
    print("📦 Step 1: Compiling resources with aapt2...")
    cmd_compile = [
        str(AAPT2), "compile", "--dir", str(res_dir), "-o", str(compiled_res)
    ]
    subprocess.run(cmd_compile, check=True)
    
    # 2. Link resources with aapt2 to produce R.java and initial APK
    gen_dir = BUILD_DIR / "gen"
    gen_dir.mkdir()
    res_apk = BUILD_DIR / "res.apk"
    print("🔗 Step 2: Linking resources and generating R.java...")
    cmd_link = [
        str(AAPT2), "link",
        "-I", str(ANDROID_JAR),
        "--manifest", str(manifest),
        "--java", str(gen_dir),
        "-o", str(res_apk),
        "--auto-add-overlay",
        str(compiled_res)
    ]
    subprocess.run(cmd_link, check=True)
    
    # 3. Find all Java source files
    java_files = list(java_dir.rglob("*.java")) + list(gen_dir.rglob("*.java"))
    print(f"☕ Step 3: Compiling {len(java_files)} Java files with javac...")
    classes_dir = BUILD_DIR / "classes"
    classes_dir.mkdir()
    
    javac_bin = "/opt/homebrew/Cellar/openjdk@17/17.0.20/bin/javac"
    env = os.environ.copy()
    env["JAVA_HOME"] = "/opt/homebrew/Cellar/openjdk@17/17.0.20/libexec/openjdk.jdk/Contents/Home"
    env["PATH"] = f"/opt/homebrew/Cellar/openjdk@17/17.0.20/bin:{env.get('PATH', '')}"

    
    cmd_javac = [
        javac_bin,
        "-source", "1.8",
        "-target", "1.8",
        "-cp", str(ANDROID_JAR),
        "-d", str(classes_dir)
    ] + [str(f) for f in java_files]
    subprocess.run(cmd_javac, env=env, check=True)

    
    # 4. Dex classes with D8
    print("⚡ Step 4: Converting bytecode to DEX with D8...")
    class_files = list(classes_dir.rglob("*.class"))
    cmd_d8 = [
        str(D8),
        "--lib", str(ANDROID_JAR),
        "--output", str(BUILD_DIR)
    ] + [str(f) for f in class_files]
    subprocess.run(cmd_d8, env=env, check=True)
    
    # 5. Package unaligned APK
    print("📦 Step 5: Packaging APK with classes.dex...")
    unaligned_apk = BUILD_DIR / "unaligned.apk"
    shutil.copy(res_apk, unaligned_apk)
    
    dex_file = BUILD_DIR / "classes.dex"
    with zipfile.ZipFile(unaligned_apk, "a", compression=zipfile.ZIP_DEFLATED) as z:
        z.write(dex_file, "classes.dex")
        
    # 6. Zipalign APK
    aligned_apk = BUILD_DIR / "aligned.apk"
    print("📐 Step 6: Aligning APK with zipalign...")
    cmd_zipalign = [
        str(ZIPALIGN), "-f", "4",
        str(unaligned_apk),
        str(aligned_apk)
    ]
    subprocess.run(cmd_zipalign, env=env, check=True)
    
    # 7. Sign APK with jarsigner (v1) and apksigner (v2 + v3) for 100% Android security compliance
    final_apk = RELEASE_DIR / "FRIDAY-Assistant-v1.0.0.apk"
    print(f"✍️ Step 7: Cryptographically signing APK with jarsigner and apksigner -> {final_apk}...")
    
    # 7a. v1 signing via jarsigner
    jarsigner_bin = "/opt/homebrew/Cellar/openjdk@17/17.0.20/bin/jarsigner"
    cmd_jarsigner = [
        jarsigner_bin,
        "-keystore", str(KEYSTORE),
        "-storepass", "friday_release_secure_key",
        "-keypass", "friday_release_secure_key",
        "-sigalg", "SHA256withRSA",
        "-digestalg", "SHA-256",
        str(aligned_apk),
        "friday_release"
    ]
    subprocess.run(cmd_jarsigner, env=env, check=True)

    # 7b. v2 + v3 signing via apksigner
    cmd_sign = [
        str(APKSIGNER), "sign",
        "--ks", str(KEYSTORE),
        "--ks-pass", "pass:friday_release_secure_key",
        "--ks-key-alias", "friday_release",
        "--key-pass", "pass:friday_release_secure_key",
        "--v1-signing-enabled", "true",
        "--v2-signing-enabled", "true",
        "--v3-signing-enabled", "true",
        "--out", str(final_apk),
        str(aligned_apk)
    ]
    subprocess.run(cmd_sign, env=env, check=True)


    
    # Verify signature
    cmd_verify = [str(APKSIGNER), "verify", str(final_apk)]
    subprocess.run(cmd_verify, env=env, check=True)

    
    print("=" * 60)
    print(f"🎉 SUCCESS! Clean Signed Android Assistant APK Created:")
    print(f"   Path: {final_apk}")
    print(f"   Size: {os.path.getsize(final_apk)} bytes")
    print("=" * 60)

if __name__ == "__main__":
    build()
