# Agregar a hosts
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$entrada = "127.0.0.1`twww.mitienda.com"

if ((Get-Content $hostsPath) -notcontains $entrada) {
    Add-Content -Path $hostsPath -Value $entrada
}

# Redirigir puerto 80 a 5000
netsh interface portproxy add v4tov4 listenport=80 listenaddress=127.0.0.1 connectport=5000 connectaddress=127.0.0.1
