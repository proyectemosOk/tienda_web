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
                        <button class="ver" onclick="cargarCotizacion(${cot.id}, 'ver')">
                            <img src="/static/svg/eye-solid.svg">
                        </button>
                        <button class='edit' onclick="cargarCotizacion(${cot.id}, 'editar')">
                            <img src="/static/svg/edit.svg">
                        </button>
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

function cargarCotizacion(id, modo) {
    fetch(`/api/ver_cotizacion?id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (!data.valido) {
                alert("Error: " + data.mensaje);
                return;
            }

            if (modo === "editar") {                
                mostrarModalCotizacionEditar(data);
            } else {
                mostrarModalCotizacionVer(data);
            }
        })
        .catch(err => {
            alert("Error al cargar cotización: " + err.message);
        });
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