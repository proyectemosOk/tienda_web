document.addEventListener('DOMContentLoaded', function() {
    const botones = {
        'monederos': '/monederos',
        'ventas': '/ventas',
        'inventario': '/inventarios',
        'cuentas': '/cierre_dia',
        'personal': '/personal',
        'configuraciones': 'configuraciones.html',
        'empresa': '/empresa',
        'informes': '/informes',
        'casa': '/home',
    };

    for (const [id, pagina] of Object.entries(botones)) {
        document.getElementById(id).addEventListener('click', function() {
            console.log(`Redirigiendo a: ${pagina}`);
            window.location.href = pagina;
        });
    }
});