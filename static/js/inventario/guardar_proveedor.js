// import { cargarProveedores } from './proveedores.js';

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("proveedor-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Evitar el envío por defecto del formulario

        // Capturar los datos del formulario
        const nombre = document.getElementById("nombre-proveedor").value;
        const rut = document.getElementById("rut-proveedor").value;
        const direccion = document.getElementById("direccion-proveedor").value;
        const telefono = document.getElementById("telefono-proveedor").value;
        const email = document.getElementById("email-proveedor").value;

        // Crear un objeto con los datos
        const datosProveedor = {
            nombre: nombre,
            rut: rut,
            direccion: direccion,
            telefono: telefono,
            email: email,
        };

        try {
            // Enviar los datos a la API
            const respuesta = await fetch("/api/crear_proveedor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(datosProveedor),
            });

            // Manejar la respuesta
            if (respuesta.ok) {
                const resultado = await respuesta.json();

                // Mostrar detalles del proveedor guardado
                Swal.fire({
                    title: 'Proveedor Guardado',
                    html: `
                    <div class="text-start">
                        <p><strong>ID Proveedor:</strong> ${resultado.id_proveedor}</p>
                        <p><strong>Nombre:</strong> ${datosProveedor.nombre}</p>
                        <p><strong>RUT:</strong> ${datosProveedor.rut}</p>
                        <p><strong>Dirección:</strong> ${datosProveedor.direccion}</p>
                        <p><strong>Teléfono:</strong> ${datosProveedor.telefono}</p>
                        <p><strong>Email:</strong> ${datosProveedor.email}</p>
                    </div>
                `,
                    icon: 'success'
                });

                // Limpiar el formulario
                form.reset();
                // cargarProveedores()
            } else {
                const error = await respuesta.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `No se pudo guardar el proveedor: ${error.error}`
                });
            }
        } catch (error) {
            console.error("Error al enviar los datos:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al guardar el proveedor. Por favor, intenta nuevamente.'
            });
        }
    });
});
