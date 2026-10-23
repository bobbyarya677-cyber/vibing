"""
Direct GitHub Uploader for VibeShift AI
Uploads all project files directly to https://github.com/bobbyarya677-cyber/vibethon
using the official GitHub REST API (No local Git binary required).
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error

REPO = "bobbyarya677-cyber/vibethon"
BRANCH = "main"

# Files and directories to ignore
IGNORE_PATTERNS = [
    ".env",
    ".git",
    "__pycache__",
    ".DS_Store",
    "Thumbs.db",
    "push_to_github.py"
]

def should_ignore(path):
    for pattern in IGNORE_PATTERNS:
        if pattern in path.split(os.sep):
            return True
        if path.endswith(".pyc"):
            return True
    return False

def upload_file(token, rel_path, full_path):
    url = f"https://api.github.com/repos/{REPO}/contents/{rel_path.replace(os.sep, '/')}"
    
    with open(full_path, "rb") as f:
        content_bytes = f.read()
    content_b64 = base64.b64encode(content_bytes).decode("utf-8")

    # Check if file already exists to get its SHA
    sha = None
    req_get = urllib.request.Request(
        url + f"?ref={BRANCH}",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "VibeShift-Uploader"
        }
    )
    try:
        with urllib.request.urlopen(req_get) as res:
            data = json.loads(res.read().decode("utf-8"))
            sha = data.get("sha")
    except urllib.error.HTTPError:
        pass

    payload = {
        "message": f"Upload {rel_path.replace(os.sep, '/')}",
        "content": content_b64,
        "branch": BRANCH
    }
    if sha:
        payload["sha"] = sha

    req_put = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "VibeShift-Uploader"
        },
        method="PUT"
    )

    try:
        with urllib.request.urlopen(req_put) as res:
            print(f"  [OK] Uploaded: {rel_path}")
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"  [FAILED] {rel_path}: {e.code} - {err_body}")
        return False

def main():
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token and len(sys.argv) > 1:
        token = sys.argv[1].strip()

    if not token:
        print("\n=======================================================")
        print("  GitHub Authentication Required")
        print("=======================================================")
        print(f"To push to https://github.com/{REPO}, you need a GitHub Personal Access Token.")
        print("\nHow to get your free token in 30 seconds:")
        print("1. Go to: https://github.com/settings/tokens/new")
        print("2. Set Note: 'vibethon-push'")
        print("3. Check the checkbox: [x] repo (Full control of private repositories)")
        print("4. Click 'Generate token' at the bottom and copy it.")
        print("\nThen run:")
        print(f"  python push_to_github.py YOUR_COPIED_TOKEN")
        print("=======================================================\n")
        token = input("Paste your GitHub Token here (or press Enter to cancel): ").strip()
        if not token:
            print("Cancelled.")
            return

    root_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"\nUploading VibeShift AI project files to {REPO} ({BRANCH})...\n")

    files_to_upload = []
    for dirpath, _, filenames in os.walk(root_dir):
        for f in filenames:
            full_path = os.path.join(dirpath, f)
            rel_path = os.path.relpath(full_path, root_dir)
            if not should_ignore(rel_path):
                files_to_upload.append((rel_path, full_path))

    success_count = 0
    for rel_path, full_path in files_to_upload:
        if upload_file(token, rel_path, full_path):
            success_count += 1

    print(f"\n=======================================================")
    print(f"  Finished: {success_count}/{len(files_to_upload)} files uploaded successfully!")
    print(f"  Check your repository: https://github.com/{REPO}")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
