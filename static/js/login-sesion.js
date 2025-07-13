function guardarEnLocalStorage(clave, valor) {
    try {
        valor = JSON.stringify(valor);
        localStorage.setItem(clave, valor);
    } catch (e) {
        console.error("Error al guardar en localStorage:", e);
    }
}

document.getElementById('Login-sesion').addEventListener('click', async function(e) {
    e.preventDefault();
    
    // 1. Obtener credenciales
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 2. Validación básica
    if (!username || !password) {
        mostrarError('Por favor complete todos los campos');
        return;
    }

    try {
        // 3. Configurar la solicitud
        const response = await fetch('/api/login-segunda', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: username,
                contrasena: password
            })
        });

        // 4. Procesar respuesta
        const data = await response.json();
        
        if (data.valido) {
            // 5. Almacenar datos de sesión
            sessionStorage.setItem('authToken', data.id_usuario);
            sessionStorage.setItem('userRole', data.rol);
            
            // 6. Redirección segura
            guardarEnLocalStorage("usuario", {rol: data.rol, id:data.id_usuario})
            window.location.href = '/principal';
        } else {
            mostrarError(data.mensaje || 'Error de autenticación');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        mostrarError('Error de conexión con el servidor');
    }
});

document.addEventListener("DOMContentLoaded", ()=>{
    guardarEnLocalStorage("usuario","0")
})

function mostrarError(mensaje) {
    const errorDiv = document.getElementById('error-login');
    errorDiv.textContent = mensaje;
    errorDiv.style.display = 'block';
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}
