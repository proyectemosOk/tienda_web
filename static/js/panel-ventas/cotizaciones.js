const list_estados = { 1: "cant-Cotizaciones", 2: "cant-Aprobadas", 3: "cant-Pendientes", 4: "cant-Rechazadas", 5: "cant-Convertidas" };
const list_estados_letras = { 1: "recibida", 2: "aprobada", 3: "pendiente", 4: "rechazada" };
document.addEventListener("DOMContentLoaded", () => {


    document.getElementById("cambiar-lista-bloque").addEventListener("click", () => {
        const contenedor = document.getElementById("contenedor-metricas");
        const icono = document.querySelector("#cambiar-lista-bloque img");
        const panel = document.querySelector(".panel");

        if (contenedor.classList.contains("metricas")) {
            contenedor.classList.remove("metricas");
            contenedor.classList.add("metricas-lista");
            icono.src = "/static/Iconos/lista.svg";  // 🔄 cambia a icono de bloque
            icono.alt = "bloque";
            panel.classList.add("expandido");
        } else {
            contenedor.classList.remove("metricas-lista");
            contenedor.classList.add("metricas");
            icono.src = "/static/Iconos/bloques.svg";   // 🔄 vuelve al icono de lista
            icono.alt = "lista";
            panel.classList.remove("expandido");
        }


    });

    cargarCotizaciones();
});

const cotizacionesSimuladas = [
    {
        id: 1,
        cliente: "Juan Pérez",
        producto: "Producto A",
        monto: "$1200",
        fecha: "2025-08-15",
        detalles: "Cotización para 10 unidades"
    },
    {
        id: 2,
        cliente: "María López",
        producto: "Producto B",
        monto: "$850",
        fecha: "2025-08-18",
        detalles: "Cotización urgente"
    },
    {
        id: 3,
        cliente: "Luis Martínez",
        producto: "Servicio",
        monto: "$3000",
        fecha: "2025-08-19",
        detalles: "Servicio mensual"
    }
];


function cargarCotizaciones() {
    listarDocumentos('cotizaciones')
        .then(resultados => {
            console.log('Cotizaciones:', resultados);

            // Actualizar métricas de estados
            resultados.Estados.forEach(est => {
                const idElemento = list_estados[est.estado];
                if (idElemento) {
                    document.getElementById(idElemento).textContent = est.Cantidad;
                }
            });

            // Renderizar tabla
            const tbody = document.querySelector("#tabla-cotizaciones tbody");
            tbody.innerHTML = "";

            resultados.cotizaciones.forEach(cot => {
                const estadoTexto = list_estados_letras[cot.estado] || "desconocido"; // nombre en letras
                const estadoClase = estadoTexto.toLowerCase(); // para la clase css

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${cot.id}</td>
                    <td>${cot.cliente_nombre}</td>
                    <td>${cot.fecha}</td>
                    <td>${cot.vendedor_nombre}</td>
                    <td>${cot.total_venta}</td>
                    <td class="${estadoClase}">${estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1)}</td>
                    <td>
                        <button class="updtate" onclick="UpdateCotizacion(${cot.id})"><img src="/static/svg/update.svg"></button>
                        <button class="ver" onclick="verCotizacion(${cot.id})"><img src="/static/svg/eye-solid.svg"></button>
                        <button class="edit" onclick="editCotizacion(${cot.id})"><img src="/static/svg/edit.svg"></button>
                        <button class="vender" onclick="venderCotizacion(${cot.id})"><img src="/static/svg/vender.svg"></button>
                        <button class="imprimir" onclick="imprimirCotizacion(${cot.id})"><img src="/static/svg/imprimir.svg"></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            alert('Error al obtener cotizaciones: ' + err.message);
        });
}

function imprimirCotizacion(id) {
    const cot = cotizacionesSimuladas.find(c => c.id === id);
    alert(`Ver cotización\n\nID: ${cot.id}\nCliente: ${cot.cliente}\nProducto: ${cot.producto}\nMonto: ${cot.monto}\nFecha: ${cot.fecha}\nDetalles: ${cot.detalles}`);
    // Aquí iría la lógica para cargar la info en un modal o sección
}

function UpdateCotizacion(id) {
    // 1. Buscar el estado actual en la tabla renderizada (en memoria)
    // OJO: Alternativamente puedes pedir a la API este dato
    const cotRows = document.querySelectorAll("#tabla-cotizaciones tbody tr");
    let estadoActual = null;
    cotRows.forEach(tr => {
        if (parseInt(tr.children[0].textContent) === id) {
            // 6ta columna (índice 5) es estado, texto con primera letra mayúscula
            const estadoTextoTabla = tr.children[5].textContent;
            const estadoClase = estadoTextoTabla.toLowerCase();  // convertimos a minúsculas para comparar

            // Busca en list_estados_letras convirtiendo también a minúsculas
            const entry = Object.entries(list_estados_letras)
                .find(([numero, texto]) => texto.toLowerCase() === estadoClase);
            if (entry) {
                estadoActual = Number(entry[0]);
            }
        }
    });

    if (!estadoActual) {
        alert('No se encontró el estado actual');
        return;
    }

    // 2. Determinar siguiente estado
    document.getElementById(list_estados[estadoActual]).textContent-=1;
    estadoActual = parseInt(estadoActual);
    let nuevoEstado = estadoActual < 4 ? estadoActual + 1 : 1;

    // 3. Llamar API para actualizar el estado
    fetch(`api/actualizar_estado_cotizacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, estado: nuevoEstado })
    })
        .then(res => res.json())
        .then(data => {
            if (data.valido) {
                // 4. Recargar cotizaciones y métricas
                cargarCotizaciones();
            } else {
                alert("No se pudo actualizar el estado: " + (data.mensaje || "Error desconocido"));
            }
        })
        .catch(err => {
            alert('Error al actualizar estado: ' + err.message);
        });
}

function verCotizacion(id) {
    fetch(`/api/ver_cotizacion?id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (!data.valido) {
                alert("Error: " + data.mensaje);
                return;
            }
            mostrarModalCotizacion(data);
        })
        .catch(err => {
            alert("Error al cargar cotización: " + err.message);
        });
}

function mostrarModalCotizacion(data) {
    const cotizacion = data.cotizacion.cotizacion; // Datos generales
    const detalles = data.cotizacion.detalles;     // Array de detalles
    // Crear contenido HTML del modal
    const modal = document.getElementById("modalCotizacion");
    modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <span class="close" onclick="cerrarModal()">&times;</span>
                        <h2>Cotización</h2>
                        <div class="cotization-id">#${cotizacion.id}</div>
                    </div>
                    <div class="modal-body">
                        <div class="info-grid">
                            <div class="info-card">
                                <div class="info-label">Cliente</div>
                                <div class="info-value">${cotizacion.cliente_nombre}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-label">Vendedor</div>
                                <div class="info-value">${cotizacion.vendedor_nombre}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-label">Fecha</div>
                                <div class="info-value">${cotizacion.fecha}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-label">Estado</div>
                                <div class="info-value">
                                    <span class="status-badge ${estadoTextoCotizacion(cotizacion.estado)}">
                                        ${estadoTextoCotizacion(cotizacion.estado)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="products-section">
                            <h3 class="section-title">Productos</h3>
                            <div class="products-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unitario</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${detalles.map(d => `
                                            <tr>
                                                <td>${d.producto_nombre}</td>
                                                <td>${d.cantidad}</td>
                                                <td class="price">$${d.precio_unitario.toFixed(2)}</td>
                                                <td class="price">$${(d.precio_unitario * d.cantidad).toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="total-section">
                            <div class="total-label">Total de la Venta</div>
                            <div class="total-amount">$${cotizacion.total_venta.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
    modal.style.display = 'flex';
    modal.classList.add('show');
}
function cerrarModal() {
    const modal = document.getElementById('modalCotizacion');
    
    // Cambiar opacidad para animación suave
    modal.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.opacity = '1'; // Resetear para la próxima apertura
        modal.classList.remove('show');
    }, 500);
}
// Función para mostrar el texto del estado según su número
function estadoTextoCotizacion(estado) {
    const estadosTexto = {
        1: "Recibida",
        2: "Aprobada",
        3: "Pendiente",
        4: "Rechazada"
    };
    return estadosTexto[estado] || "Desconocido";
}


function editCotizacion(id) {
    const cot = cotizacionesSimuladas.find(c => c.id === id);
    alert(`Editar cotización ID ${id} - Cliente: ${cot.cliente}`);
    // Aquí la lógica para abrir formulario con datos para editar
}

function venderCotizacion(id) {
    alert(`Cotización ID ${id} pasada a venta.`);
    // Aquí podrías llamar API para mover estado u otro procesamiento
}

function eliminarCotizacion(id) {
    const confirmado = confirm(`¿Seguro que deseas eliminar la cotización ID ${id}?`);
    if (confirmado) {
        alert(`Cotización ID ${id} eliminada.`);
        // Aquí podrías llamar API para eliminar y luego recargar la tabla
    }
}
window.onclick = function (event) {
    const modal = document.getElementById('modalCotizacion');
    if (event.target === modal) {
        cerrarModal();
    }
}
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        cerrarModal();
    }
});