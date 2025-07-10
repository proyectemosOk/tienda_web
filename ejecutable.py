import os
import shutil
import subprocess
import sys
from pathlib import Path

DESTINO = Path("C:/proyectemos")

print("[COPIA] Copiando archivos del proyecto...")

def ignorar_git(dir, archivos):
    return [".git"] if ".git" in archivos else []

if DESTINO.exists():
    try:
        shutil.rmtree(DESTINO)
    except Exception as e:
        print(f"[ERROR] No se pudo eliminar C:/proyectemos: {e}")
        sys.exit(1)

try:
    shutil.copytree(Path(__file__).parent, DESTINO, ignore=ignorar_git)
except Exception as e:
    print(f"[ERROR] Al copiar archivos: {e}")
    sys.exit(1)

print("[VENV] Creando entorno virtual...")
subprocess.run(["python", "-m", "venv", str(DESTINO / "venv")], check=True)

print("[PIP] Instalando dependencias desde requirements.txt...")
pip_path = DESTINO / "venv" / "Scripts" / "pip.exe"
subprocess.run([str(pip_path), "install", "--upgrade", "pip"], check=True)
subprocess.run([str(pip_path), "install", "-r", str(DESTINO / "requirements.txt")], check=True)

print("[HOSTS] Agregando www.mitienda.com al archivo hosts...")
hosts_path = Path("C:/Windows/System32/drivers/etc/hosts")
entrada = "127.0.0.1\twww.mitienda.com\n"

try:
    with open(hosts_path, "r+", encoding="utf-8") as f:
        contenido = f.read()
        if "www.mitienda.com" not in contenido:
            f.write(entrada)
except PermissionError:
    print("[ERROR] No tienes permisos para editar el archivo hosts. Ejecuta como administrador.")
    sys.exit(1)

print("[REDIRECCIÓN] Puerto 80 → 5000...")
subprocess.run([
    "netsh", "interface", "portproxy", "add", "v4tov4",
    "listenport=80", "listenaddress=127.0.0.1",
    "connectport=5000", "connectaddress=127.0.0.1"
], shell=True)

print("[ACCESSO DIRECTO] Creando en escritorio...")
vbscript = f'''
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\\Mi Tienda.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "{DESTINO}\\venv\\Scripts\\python.exe"
oLink.Arguments = "app.py"
oLink.WorkingDirectory = "{DESTINO}"
oLink.Save
'''
vbs_path = DESTINO / "crear_acceso.vbs"
with open(vbs_path, "w", encoding="utf-8") as f:
    f.write(vbscript)
subprocess.run(["cscript", "//nologo", str(vbs_path)], shell=True)

print("[REQ] Generando requirements.txt actualizado...")
freeze_output = subprocess.check_output([str(pip_path), "freeze"])
with open(DESTINO / "requirements.txt", "wb") as f:
    f.write(freeze_output)

print("[OK] Instalación completada.")

