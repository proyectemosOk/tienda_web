document.addEventListener("DOMContentLoaded", () => {
    const tablaProveedores = document.querySelector("#tabla-proveedores tbody");

    // Función para cargar proveedores
    async function cargarProveedores() {
        try {
            const respuesta = await fetch("/api/proveedores");
            if (respuesta.ok) {
                const proveedores = await respuesta.json();
                tablaProveedores.innerHTML = ""; // Limpiar la tabla
                proveedores.forEach(proveedor => {
                    tablaProveedores.innerHTML += `
                        <tr>
                            <td>${proveedor.codigo}</td>
                            <td>${proveedor.nombre}</td>
                            <td>${proveedor.rut}</td>
                            <td>${proveedor.telefono}</td>
                            <td>
                                <button class="btn btn-info btn-sm" onclick="verProveedor(${proveedor.id})">
                                    <img src="${iconoVer}" alt="Ver" width="16">
                                </button>
                                <button class="btn btn-warning btn-sm" onclick="editarProveedor(${proveedor.id})">
                                    <img src="${iconoEditar}" alt="Editar" width="16">
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="eliminarProveedor(${proveedor.id})">
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

    // Función para ver detalles de un proveedor
    async function verProveedor(id) {
        try {
            const respuesta = await fetch(`/api/proveedores/${id}`);
            if (respuesta.ok) {
                const proveedor = await respuesta.json();
                Swal.fire({
                    title: 'Detalles del Proveedor',
                    html: `
                        <div class="text-start">
                            <p><strong>Código:</strong> ${proveedor.codigo}</p>
                            <p><strong>Nombre:</strong> ${proveedor.nombre}</p>
                            <p><strong>RUT:</strong> ${proveedor.rut}</p>
                            <p><strong>Dirección:</strong> ${proveedor.direccion}</p>
                            <p><strong>Teléfono:</strong> ${proveedor.telefono}</p>
                            <p><strong>Email:</strong> ${proveedor.email}</p>
                            <p><strong>Fecha de Registro:</strong> ${proveedor.fecha_registro}</p>
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

    // Función para editar un proveedor
    async function editarProveedor(id) {
        const { value: formValues } = await Swal.fire({
            title: 'Editar Proveedor',
            html: `
                <input id="swal-nombre" class="swal2-input" placeholder="Nombre">
                <input id="swal-rut" class="swal2-input" placeholder="RUT">
                <input id="swal-direccion" class="swal2-input" placeholder="Dirección">
                <input id="swal-telefono" class="swal2-input" placeholder="Teléfono">
                <input id="swal-email" class="swal2-input" placeholder="Email">
            `,
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
                    cargarProveedores(); // Recargar la tabla
                } else {
                    console.error("Error al editar proveedor:", await respuesta.json());
                }
            } catch (error) {
                console.error("Error al editar proveedor:", error);
            }
        }
    }

    // Función para eliminar un proveedor
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

    // Cargar los proveedores al cargar la página
    cargarProveedores();
});
