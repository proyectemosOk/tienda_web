@echo off
REM 🔄 Limpiar compilaciones anteriores
rmdir /s /q build
rmdir /s /q dist
del app.spec

REM 🚀 Compilar el ejecutable
pyinstaller ^
  --noconfirm ^
  --onefile ^
  --windowed ^
  --icon=logo.ico ^
  --version-file=version.txt ^
  --add-data "templates;templates" ^
  --add-data "static/css;static/css" ^
  --add-data "static/Iconos;static/Iconos" ^
  --add-data "static/js;static/js" ^
  --add-data "static/img;static/img" ^
  --add-data "static/svg;static/svg" ^
  --add-data "uploads;uploads" ^
  --hidden-import=engineio.async_drivers.threading ^
  --hidden-import=threading ^
  --hidden-import=queue ^
  --hidden-import=time ^
  app.py


