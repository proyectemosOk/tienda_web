document.getElementById('boton-continuar').addEventListener('click', function(e) {
    e.preventDefault(); // Evita el envío de formulario si lo hay
    window.location.href = '/login-sesion'; // Redirige a /inicio
});