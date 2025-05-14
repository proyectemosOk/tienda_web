document.addEventListener('DOMContentLoaded', function() {
    const botones = {
        'casa': '/home',
        'monederos': 'monederos.html',
        'ventas': '/ventas',
        'inventario': '/inventarios',
        'cuentas': '/cierre_dia',
        'personal': 'personal.html',
        'configuraciones': 'configuraciones.html',
        'empresa': 'empresa.html',
        'informes': '/informes'
    };

    for (const [id, pagina] of Object.entries(botones)) {
        document.getElementById(id).addEventListener('click', function() {
            console.log(`Redirigiendo a: ${pagina}`);
            window.location.href = pagina;
        });
    }
});