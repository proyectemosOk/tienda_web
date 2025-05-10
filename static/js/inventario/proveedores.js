const tablaProveedores = document.querySelector("#tabla-proveedores tbody");
// Función para cargar proveedores
async function cargarProveedores() {
    try {
        const respuesta = await fetch("/api/proveedores");
        if (respuesta.ok) {
            const proveedores = await respuesta.json();
            // Limpiar la tabla
            tablaProveedores.innerHTML = "";
            proveedores.forEach(proveedor => {
                // Generar fila con botones y data-id
                tablaProveedores.innerHTML += `
                    <tr>
                        <td>${proveedor.codigo}</td>
                        <td>${proveedor.nombre}</td>
                        <td>${proveedor.rut}</td>
                        <td>${proveedor.telefono}</td>
                        <td>
                            <button class="btn btn-info btn-sm btn-ver" data-id="${proveedor.id}">
                                <img src="${iconoVer}" alt="Ver" width="16">
                            </button>
                            <button class="btn btn-warning btn-sm btn-editar" data-id="${proveedor.id}">
                                <img src="${iconoEditar}" alt="Editar" width="16">
                            </button>
                            <button class="btn btn-danger btn-sm btn-eliminar" data-id="${proveedor.id}">
                                <img src="${iconoEliminar}" alt="Eliminar" width="16">
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            console.error("Error al cargar proveedores:", await respuesta.json());
        }
    } catch (error) {
        console.error("Error al cargar proveedores:", error);
    }
}
// Funciones en el ámbito global
async function verProveedor(id) {
    try {
        const respuesta = await fetch(`/api/proveedores/${id}`);
        if (respuesta.ok) {
            const proveedor = await respuesta.json();
            Swal.fire({
                title: 'Detalles del Proveedor',
                html: `
                    <div class="text-start">
                        <p><strong>Código</strong> ${proveedor.codigo}</p>
                        <p><strong>Nombre</strong> ${proveedor.nombre}</p>
                        <p><strong>RUT</strong> ${proveedor.rut}</p>
                        <p><strong>Dirección</strong> ${proveedor.direccion}</p>
                        <p><strong>Teléfono</strong> ${proveedor.telefono}</p>
                        <p><strong>Email</strong> ${proveedor.email}</p>
                        <p><strong>Fecha de Registro</strong> ${proveedor.fecha_registro}</p>
                    </div>
                `,
                icon: 'info'
            });
        } else {
            console.error("Error al obtener detalles del proveedor:", await respuesta.json());
        }
    } catch (error) {
        console.error("Error al obtener detalles del proveedor:", error);
    }
}

async function editarProveedor(id) {
    // Obtener los datos actuales del proveedor
    const respuesta = await fetch(`/api/proveedores/${id}`);
    if (!respuesta.ok) {
        console.error("Error al cargar datos del proveedor:", await respuesta.json());
        return;
    }
    const proveedor = await respuesta.json();

    // Crear el contenido HTML con etiquetas en negrita y campos alineados
    const htmlContent = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center;">
                <label style="width: 100px; font-weight: bold;">Nombre:</label>
                <input id="swal-nombre" class="swal2-input" style="flex: 1;" value="${proveedor.nombre}">
            </div>
            <div style="display: flex; align-items: center;">
                <label style="width: 100px; font-weight: bold;">RUT:</label>
                <input id="swal-rut" class="swal2-input" style="flex: 1;" value="${proveedor.rut}">
            </div>
            <div style="display: flex; align-items: center;">
                <label style="width: 100px; font-weight: bold;">Dirección:</label>
                <input id="swal-direccion" class="swal2-input" style="flex: 1;" value="${proveedor.direccion}">
            </div>
            <div style="display: flex; align-items: center;">
                <label style="width: 100px; font-weight: bold;">Teléfono:</label>
                <input id="swal-telefono" class="swal2-input" style="flex: 1;" value="${proveedor.telefono}">
            </div>
            <div style="display: flex; align-items: center;">
                <label style="width: 100px; font-weight: bold;">Email:</label>
                <input id="swal-email" class="swal2-input" style="flex: 1;" value="${proveedor.email}">
            </div>
        </div>
    `;

    const { value: formValues } = await Swal.fire({
        title: `<strong>Editar Proveedor: ${proveedor.nombre}</strong>`,
        html: htmlContent,
        icon: 'edit',
        focusConfirm: false,
        preConfirm: () => {
            return {
                nombre: document.getElementById('swal-nombre').value,
                rut: document.getElementById('swal-rut').value,
                direccion: document.getElementById('swal-direccion').value,
                telefono: document.getElementById('swal-telefono').value,
                email: document.getElementById('swal-email').value
            };
        }
    });

    if (formValues) {
        try {
            const respuesta = await fetch(`/api/proveedores/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formValues)
            });

            if (respuesta.ok) {
                Swal.fire("Proveedor actualizado exitosamente", "", "success");
                cargarProveedores(); // Recargar la lista o tabla
            } else {
                console.error("Error al editar proveedor:", await respuesta.json());
            }
        } catch (error) {
            console.error("Error al editar proveedor:", error);
        }
    }
}



async function eliminarProveedor(id) {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: "El proveedor será desactivado.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        try {
            const respuesta = await fetch(`/api/proveedores/${id}`, {
                method: 'DELETE'
            });

            if (respuesta.ok) {
                Swal.fire("Proveedor eliminado correctamente", "", "success");
                cargarProveedores(); // Recargar la tabla
            } else {
                console.error("Error al eliminar proveedor:", await respuesta.json());
            }
        } catch (error) {
            console.error("Error al eliminar proveedor:", error);
        }
    }
}

// Código dentro del DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    
    const form = document.getElementById("proveedor-form");

    // Cargar proveedores al cargar
    cargarProveedores();

    // Evento para el formulario
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nombre = document.getElementById("nombre-proveedor").value;
        const rut = document.getElementById("rut-proveedor").value;
        const direccion = document.getElementById("direccion-proveedor").value;
        const telefono = document.getElementById("telefono-proveedor").value;
        const email = document.getElementById("email-proveedor").value;

        const datosProveedor = {
            nombre: nombre,
            rut: rut,
            direccion: direccion,
            telefono: telefono,
            email: email,
        };

        try {
            const respuesta = await fetch("/api/crear_proveedor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(datosProveedor),
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();

                Swal.fire({
                    title: 'Proveedor Guardado',
                    html: `
                    <div class="text-start">
                        <p><strong>ID Proveedor:</strong> ${resultado.codigo}</p>
                        <p><strong>Nombre:</strong> ${datosProveedor.nombre}</p>
                        <p><strong>RUT:</strong> ${datosProveedor.rut}</p>
                        <p><strong>Dirección:</strong> ${datosProveedor.direccion}</p>
                        <p><strong>Teléfono:</strong> ${datosProveedor.telefono}</p>
                        <p><strong>Email:</strong> ${datosProveedor.email}</p>
                    </div>
                    `,
                    icon: 'success'
                });

                form.reset();
                cargarProveedores();
            } else {
                const error = await respuesta.json();
                if (error.columna) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: `El valor ya existe en la columna: ${error.columna}.`
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: `No se pudo guardar el proveedor: ${error.error}`
                    });
                }
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

    

    // Delegar eventos en tbody
    document.querySelector("#tabla-proveedores tbody").addEventListener("click", (event) => {
        if (event.target.closest(".btn-ver")) {
            const btn = event.target.closest(".btn-ver");
            const id = btn.dataset.id;
            verProveedor(id);
        } else if (event.target.closest(".btn-editar")) {
            const btn = event.target.closest(".btn-editar");
            const id = btn.dataset.id;
            editarProveedor(id);
        } else if (event.target.closest(".btn-eliminar")) {
            const btn = event.target.closest(".btn-eliminar");
            const id = btn.dataset.id;
            eliminarProveedor(id);
        }
    });
});
