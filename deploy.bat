@echo off
chcp 65001 > nul
title DEE — Deploiement GitHub

echo.
echo ============================================
echo    DEE San Andreas - Mise a jour GitHub
echo ============================================
echo.

set /p TOKEN=Ton GitHub Token (ghp_...): 
set /p OWNER=Ton pseudo GitHub (ex: M7Alex): 
set /p REPO=Nom du repo (ex: dee-san-andreas): 

echo.
echo Glisse le dossier "final-patch" dans cette fenetre puis appuie sur Entree:
set /p PATCHDIR=Chemin du dossier: 
set PATCHDIR=%PATCHDIR:"=%

echo.
echo Verification de Python...
python --version > nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python n est pas installe.
    pause
    exit /b 1
)

echo Creation du script de deploiement...

echo import sys, os, json, base64, urllib.request, urllib.error > "%TEMP%\dep.py"
echo TOKEN = sys.argv[1] >> "%TEMP%\dep.py"
echo OWNER = sys.argv[2] >> "%TEMP%\dep.py"
echo REPO = sys.argv[3] >> "%TEMP%\dep.py"
echo PATCH_DIR = sys.argv[4] >> "%TEMP%\dep.py"
echo API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents' >> "%TEMP%\dep.py"
echo HEADERS = {'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json'} >> "%TEMP%\dep.py"
echo def get_sha(path): >> "%TEMP%\dep.py"
echo     try: >> "%TEMP%\dep.py"
echo         req = urllib.request.Request(API + '/' + path, headers=HEADERS) >> "%TEMP%\dep.py"
echo         with urllib.request.urlopen(req) as r: return json.loads(r.read())['sha'] >> "%TEMP%\dep.py"
echo     except: return '' >> "%TEMP%\dep.py"
echo def push(local, repo_path): >> "%TEMP%\dep.py"
echo     with open(local, 'rb') as f: content = base64.b64encode(f.read()).decode() >> "%TEMP%\dep.py"
echo     sha = get_sha(repo_path) >> "%TEMP%\dep.py"
echo     body = {'message': 'v4: patch dee-san-andreas', 'content': content, 'branch': 'main'} >> "%TEMP%\dep.py"
echo     if sha: body['sha'] = sha >> "%TEMP%\dep.py"
echo     req = urllib.request.Request(API + '/' + repo_path, data=json.dumps(body).encode(), headers=HEADERS, method='PUT') >> "%TEMP%\dep.py"
echo     try: >> "%TEMP%\dep.py"
echo         with urllib.request.urlopen(req) as r: print('  OK  ' + repo_path) >> "%TEMP%\dep.py"
echo     except urllib.error.HTTPError as e: print('  ERR ' + repo_path + ': ' + json.loads(e.read().decode()).get('message','?')) >> "%TEMP%\dep.py"
echo for root, dirs, files in os.walk(PATCH_DIR): >> "%TEMP%\dep.py"
echo     dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__'] >> "%TEMP%\dep.py"
echo     for fname in files: >> "%TEMP%\dep.py"
echo         if fname.endswith('.bat') or fname.endswith('.py'): continue >> "%TEMP%\dep.py"
echo         local = os.path.join(root, fname) >> "%TEMP%\dep.py"
echo         rel = os.path.relpath(local, PATCH_DIR).replace('\\', '/') >> "%TEMP%\dep.py"
echo         push(local, rel) >> "%TEMP%\dep.py"

echo.
echo Deploiement en cours sur github.com/%OWNER%/%REPO% ...
echo.

python "%TEMP%\dep.py" "%TOKEN%" "%OWNER%" "%REPO%" "%PATCHDIR%"

echo.
echo ============================================
echo  Fini ! Vercel redeploie dans 1-2 minutes.
echo  Verifie : https://vercel.com
echo ============================================
echo.
pause
