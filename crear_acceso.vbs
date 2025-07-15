Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Mi Tienda.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "C:\proyectemos\app.exe"
oLink.WorkingDirectory = "C:\proyectemos"
oLink.IconLocation = "C:\proyectemos\icono.ico"
oLink.Save
