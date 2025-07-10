Set oWS = CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Startup") & "\Mi Tienda Auto.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "C:\proyectemos\venv\Scripts\pythonw.exe"
oLink.Arguments = "app.py"
oLink.WorkingDirectory = "C:\proyectemos"
oLink.IconLocation = "C:\proyectemos\icono.ico"
oLink.Save
