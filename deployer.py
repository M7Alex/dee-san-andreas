import os
import json
import base64
import urllib.request
import urllib.error
import sys

print("=" * 50)
print("   DEE San Andreas - Deploiement GitHub")
print("=" * 50)
print()

TOKEN = input("Ton GitHub Token (ghp_...): ").strip()
OWNER = input("Ton pseudo GitHub (ex: M7Alex): ").strip()
REPO  = input("Nom du repo (ex: dee-san-andreas): ").strip()
print()
print("Glisse le dossier 'final-patch' ici puis appuie sur Entree:")
PATCH_DIR = input("Chemin: ").strip().strip('"').strip("'")

if not os.path.isdir(PATCH_DIR):
    print(f"ERREUR: Dossier introuvable: {PATCH_DIR}")
    input("Appuie sur Entree pour quitter...")
    sys.exit(1)

API = f"https://api.github.com/repos/{OWNER}/{REPO}/contents"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/vnd.github.v3+json",
}

def get_sha(path):
    try:
        req = urllib.request.Request(f"{API}/{path}", headers=HEADERS)
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())["sha"]
    except:
        return ""

def push(local_path, repo_path):
    with open(local_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    sha = get_sha(repo_path)
    body = {
        "message": "v4: patch dee-san-andreas",
        "content": content,
        "branch": "main",
    }
    if sha:
        body["sha"] = sha
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{API}/{repo_path}", data=data, headers=HEADERS, method="PUT")
    try:
        with urllib.request.urlopen(req) as r:
            print(f"  OK  {repo_path}")
    except urllib.error.HTTPError as e:
        msg = json.loads(e.read().decode()).get("message", str(e))
        print(f"  ERR {repo_path}: {msg}")

# Test connexion
print()
print("Test de connexion GitHub...")
try:
    req = urllib.request.Request("https://api.github.com/user", headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        user = json.loads(r.read())
        print(f"Connecte en tant que: {user.get('login', '?')}")
except Exception as e:
    print(f"ERREUR de connexion: {e}")
    input("Appuie sur Entree pour quitter...")
    sys.exit(1)

print()
print(f"Deploiement vers github.com/{OWNER}/{REPO} ...")
print()

count = 0
for root, dirs, files in os.walk(PATCH_DIR):
    dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__pycache__"]
    for fname in files:
        if fname.endswith(".bat") or fname.endswith(".py"):
            continue
        local = os.path.join(root, fname)
        rel = os.path.relpath(local, PATCH_DIR).replace("\\", "/")
        push(local, rel)
        count += 1

print()
print(f"  {count} fichiers envoyes !")
print()
print("Vercel va redeployer dans 1-2 minutes.")
print("Verifie sur: https://vercel.com")
print()
input("Appuie sur Entree pour fermer...")
