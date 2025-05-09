document.addEventListener('DOMContentLoaded', function() {
    // Mapeo de botones a sus respectivas páginas
    const botones = {
        'monederos': 'monederos.html',
        'ventas': 'ventas.html',
        'inventario': 'gestor_inventario.html',
        'cuentas': 'cuentas.html',
        'personal': 'personal.html',
        'configuraciones': 'configuraciones.html',
        'empresa': 'empresa.html',
        'informes': 'informes.html'
    };

    // Asignar eventos a cada botón
    for (const [id, pagina] of Object.entries(botones)) {
        document.getElementById(id).addEventListener('click', function() {
            redirigirAPagina(pagina);
        });
    }

    // Función para redirigir a la página correspondiente
    function redirigirAPagina(pagina) {
        // Aquí puedes añadir lógica adicional si es necesario antes de redirigir
        window.location.href = pagina;
    }

    // Opcional: Mostrar en consola qué botón se presionó (para debugging)
    for (const id of Object.keys(botones)) {
        document.getElementById(id).addEventListener('click', function() {
            console.log(`Redirigiendo a: ${botones[id]}`);
        });
    }
});