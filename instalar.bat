@echo off
cd /d %~dp0

echo Instalando entorno virtual...
python -m venv venv

echo Activando entorno...
call venv\Scripts\activate.bat

echo Instalando dependencias...
venv\Scripts\pip install --upgrade pip
venv\Scripts\pip install -r requirements.txt

echo Configurando sistema...
powershell -ExecutionPolicy Bypass -File configurar.ps1

echo Agregando autoarranque...
cscript //nologo auto_start.vbs

echo Creando acceso directo...
cscript //nologo crear_acceso.vbs

echo Instalación completa.

