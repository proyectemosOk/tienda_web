// Variables globales
let ventasChart = null;
let serviciosChart = null;
let ventasCategoriaChart = null;
let serviciosTipoChart = null;
let ventasPeriodoChart = null;
let serviciosPeriodoChart = null;
let periodoActual = 'semana';

// Colores para gráficos
const colores = [
    'rgba(59, 130, 246, 0.7)',   // Azul
    'rgba(239, 68, 68, 0.7)',    // Rojo
    'rgba(34, 197, 94, 0.7)',    // Verde
    'rgba(245, 158, 11, 0.7)',   // Amarillo
    'rgba(14, 165, 233, 0.7)',   // Celeste
    'rgba(168, 85, 247, 0.7)',   // Púrpura
    'rgba(236, 72, 153, 0.7)',   // Rosa
    'rgba(249, 115, 22, 0.7)'    // Naranja
];

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas las pestañas
    inicializarPestanaVentas();
    inicializarPestanaServicios();
    inicializarPestanaResumen();
    inicializarPestanaHistorial();
    inicializarPestanaEstadisticas();

    // Manejar cambio de pestañas para actualizar gráficos
    const tabElems = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElems.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            actualizarPestanaActiva(targetId);
        });
    });

    // Manejar cambio de período para estadísticas
    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            periodoActual = this.getAttribute('data-periodo');
            actualizarEstadisticas();
        });
    });
});

// Función para actualizar la pestaña activa
function actualizarPestanaActiva(pestanaId) {
    switch(pestanaId) {
        case 'ventas':
            actualizarDatosVentas();
            break;
        case 'servicios':
            actualizarDatosServicios();
            break;
        case 'resumen':
            actualizarDatosResumen();
            break;
        case 'historial':
            // El historial se actualiza solo cuando se usa el filtro
            break;
        case 'estadisticas':
            actualizarEstadisticas();
            break;
    }
}

// ==================== PESTAÑA VENTAS ====================

function inicializarPestanaVentas() {
    // Crear gráfico de ventas
    const ctxVentas = document.getElementById('graficoVentas').getContext('2d');
    ventasChart = new Chart(ctxVentas, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });

    // Cargar datos iniciales
    actualizarDatosVentas();
}

function actualizarDatosVentas() {
    fetch('/api/informes/ventas')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }

            // Actualizar gráfico de ventas con desglose_pagos
            const pagos = data.desglose_pagos;
            const etiquetas = Object.keys(pagos);
            const valores = Object.values(pagos);

            ventasChart.data.labels = etiquetas;
            ventasChart.data.datasets[0].data = valores;
            ventasChart.update();

            // Actualizar tabla de ventas
            const cuerpoTablaVentas = document.getElementById('cuerpoTablaVentas');
            cuerpoTablaVentas.innerHTML = data.ventas.map(venta => `
                <tr>
                    <td>${venta.id}</td>
                    <td>${venta.fecha}</td>
                    <td>$${parseFloat(venta.total).toFixed(2)}</td>
                    <td>${venta.metodos_pago}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="verDetalle('${venta.id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="imprimirTicket('${venta.id}')">
                            <i class="bi bi-printer"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error al cargar ventas:', error));
}

// ==================== PESTAÑA SERVICIOS ====================

function inicializarPestanaServicios() {
    // Crear gráfico de servicios
    const ctxServicios = document.getElementById('graficoServicios').getContext('2d');
    serviciosChart = new Chart(ctxServicios, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });

    // Cargar datos iniciales
    actualizarDatosServicios();
}

function actualizarDatosServicios() {
    fetch('/api/informes/servicios')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }

            const conteo = data.conteo_estados;
            // Actualizar contadores
            document.getElementById('totalServicios').textContent = conteo.Pendiente + conteo['En Proceso'] + conteo.Listo + conteo.Entregado || 0;
            document.getElementById('enProcesoServicios').textContent = conteo['En Proceso'] || 0;
            document.getElementById('listosServicios').textContent = conteo.Listo || 0;

            // Actualizar gráfico de servicios
            const estados = ['Pendiente', 'En Proceso', 'Listo', 'Entregado'];
            const datos = estados.map(e => conteo[e] || 0);

            serviciosChart.data.labels = estados;
            serviciosChart.data.datasets[0].data = datos;
            serviciosChart.update();

            // Actualizar tabla de servicios
            const cuerpoTablaServicios = document.getElementById('cuerpoTablaServicios');
            cuerpoTablaServicios.innerHTML = data.servicios.map(servicio => {
                const estadoClase = getEstadoClase(servicio.estado);
                return `
                    <tr>
                        <td>${servicio.id}</td>
                        <td>${servicio.cliente}</td>
                        <td>${servicio.descripcion}</td>
                        <td>${servicio.fecha}</td>
                        <td><span class="badge ${estadoClase}">${servicio.estado}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="verDetalleServicio('${servicio.id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="actualizarEstadoServicio('${servicio.id}')">
                                <i class="bi bi-arrow-clockwise"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        })
        .catch(error => console.error('Error al cargar servicios:', error));
}

// ==================== PESTAÑA RESUMEN ====================

function inicializarPestanaResumen() {
    // Crear gráfico de ventas por categoría
    const ctxVentasCategoria = document.getElementById('graficoVentasCategoria').getContext('2d');
    ventasCategoriaChart = new Chart(ctxVentasCategoria, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Ventas por Categoría',
                data: [],
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Crear gráfico de servicios por tipo
    const ctxServiciosTipo = document.getElementById('graficoServiciosTipo').getContext('2d');
    serviciosTipoChart = new Chart(ctxServiciosTipo, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Servicios por Tipo',
                data: [],
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Cargar datos iniciales
    actualizarDatosResumen();
}

function actualizarDatosResumen() {
    fetch('/api/informes/resumen')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }

            // Actualizar contadores de resumen
            document.getElementById('totalVentasResumen').textContent = `$${parseFloat(data.totales.ventas).toFixed(2)}`;
            document.getElementById('totalServiciosResumen').textContent = data.totales.servicios;
            document.getElementById('totalProductosResumen').textContent = data.totales.productos;
            document.getElementById('totalClientesResumen').textContent = data.totales.clientes;

            // Actualizar gráfico de ventas por categoría
            ventasCategoriaChart.data.labels = data.ventas_categoria.categorias;
            ventasCategoriaChart.data.datasets[0].data = data.ventas_categoria.datos;
            ventasCategoriaChart.update();

            // Actualizar gráfico de servicios por tipo
            serviciosTipoChart.data.labels = data.servicios_tipo.tipos;
            serviciosTipoChart.data.datasets[0].data = data.servicios_tipo.datos;
            serviciosTipoChart.update();
        })
        .catch(error => console.error('Error al cargar resumen:', error));
}

// ==================== PESTAÑA HISTORIAL ====================

function inicializarPestanaHistorial() {
    // Configurar fecha actual en los campos de fecha
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('fechaFin');

    fechaInicioInput.valueAsDate = inicioMes;
    fechaFinInput.valueAsDate = hoy;

    // Configurar evento de envío del formulario de filtro
    document.getElementById('filtroHistorialForm').addEventListener('submit', function(e) {
        e.preventDefault();
        buscarHistorial();
    });
}

function buscarHistorial() {
    const tipoRegistro = document.getElementById('tipoRegistro').value;
    const fechaInicioStr = document.getElementById('fechaInicio').value;
    const fechaFinStr = document.getElementById('fechaFin').value;

    if (!fechaInicioStr || !fechaFinStr) {
        alert('Por favor, seleccione ambas fechas de inicio y fin.');
        return;
    }

    const url = `/api/informes/historial?tipo=${encodeURIComponent(tipoRegistro)}&fecha_inicio=${fechaInicioStr}&fecha_fin=${fechaFinStr}`;

    const cuerpoTablaHistorial = document.getElementById('cuerpoTablaHistorial');
    cuerpoTablaHistorial.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Buscando registros...</p>
            </td>
        </tr>
    `;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                cuerpoTablaHistorial.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${data.error}</td></tr>`;
                return;
            }

            if (!data.registros || data.registros.length === 0) {
                cuerpoTablaHistorial.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron registros</td></tr>`;
                return;
            }

            cuerpoTablaHistorial.innerHTML = generarFilasTablaHistorial(data.registros);
        })
        .catch(error => {
            console.error('Error al buscar historial:', error);
            cuerpoTablaHistorial.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar registros</td></tr>`;
        });
}

function generarFilasTablaHistorial(registros) {
    if (!registros || registros.length === 0) {
        return `<tr><td colspan="6" class="text-center">No se encontraron registros</td></tr>`;
    }

    let html = '';
    registros.forEach(registro => {
        const tipoClase = registro.tipo === 'Venta' ? 'text-primary' : 'text-success';
        html += `
            <tr>
                <td>${registro.id}</td>
                <td><span class="${tipoClase}">${registro.tipo}</span></td>
                <td>${registro.fecha}</td>
                <td>${registro.descripcion}</td>
                <td>$${parseFloat(registro.total).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="verDetalleHistorial('${registro.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="imprimirHistorial('${registro.id}')">
                        <i class="bi bi-printer"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    return html;
}

// ==================== PESTAÑA ESTADÍSTICAS ====================

function inicializarPestanaEstadisticas() {
    // Crear gráfico de ventas por período
    const ctxVentasPeriodo = document.getElementById('graficoVentasPeriodo').getContext('2d');
    ventasPeriodoChart = new Chart(ctxVentasPeriodo, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Ventas',
                data: [],
                borderColor: colores[0],
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Crear gráfico de servicios por período
    const ctxServiciosPeriodo = document.getElementById('graficoServiciosPeriodo').getContext('2d');
    serviciosPeriodoChart = new Chart(ctxServiciosPeriodo, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Servicios',
                data: [],
                borderColor: colores[2],
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Cargar datos iniciales
    actualizarEstadisticas();
}

function actualizarEstadisticas() {
    fetch(`/api/informes/estadisticas?periodo=${periodoActual}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }

            ventasPeriodoChart.data.labels = data.etiquetas;
            ventasPeriodoChart.data.datasets[0].data = data.datos;
            ventasPeriodoChart.update();

            // Para servicios, si tienes datos similares, adapta aquí
            // Por ejemplo, si la API devuelve datos de servicios, actualiza serviciosPeriodoChart

            // Actualmente no tenemos datos reales para servicios por período, así que dejamos vacío o simulado
            serviciosPeriodoChart.data.labels = data.etiquetas;
            serviciosPeriodoChart.data.datasets[0].data = data.datos.map(() => 0); // o datos reales si tienes
            serviciosPeriodoChart.update();

            // Actualizar KPIs - si tienes datos reales, cámbialos aquí
            document.getElementById('ticketPromedio').textContent = '$367.86';
            document.getElementById('ventasDiarias').textContent = '42';
            document.getElementById('serviciosCompletados').textContent = '18';
            document.getElementById('tasaConversion').textContent = '68%';
        })
        .catch(error => console.error('Error al cargar estadísticas:', error));
}

// ==================== FUNCIONES AUXILIARES ====================

function getEstadoClase(estado) {
    switch(estado.toLowerCase()) {
        case 'pendiente': return 'bg-warning text-dark';
        case 'en proceso': return 'bg-info text-dark';
        case 'listo': return 'bg-success';
        case 'entregado': return 'bg-secondary';
        default: return 'bg-light text-dark';
    }
}

// Crear modal simple para mostrar detalles
function mostrarModal(titulo, contenido) {
    let modal = document.getElementById('modalDetalle');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalDetalle';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '1050';

        const modalContent = document.createElement('div');
        modalContent.id = 'modalContentDetalle';
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.width = '90%';
        modalContent.style.maxWidth = '500px';
        modalContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        modal.appendChild(modalContent);

        // Botón cerrar
        const btnCerrar = document.createElement('button');
        btnCerrar.textContent = 'Cerrar';
        btnCerrar.style.marginTop = '15px';
        btnCerrar.className = 'btn btn-primary';
        btnCerrar.onclick = () => {
            modal.style.display = 'none';
        };
        modalContent.appendChild(btnCerrar);

        document.body.appendChild(modal);
    }

    const modalContent = document.getElementById('modalContentDetalle');
    modalContent.innerHTML = `<h4>${titulo}</h4><div>${contenido}</div>`;
    // Añadir botón cerrar nuevamente
    const btnCerrar = document.createElement('button');
    btnCerrar.textContent = 'Cerrar';
    btnCerrar.style.marginTop = '15px';
    btnCerrar.className = 'btn btn-primary';
    btnCerrar.onclick = () => {
        modal.style.display = 'none';
    };
    modalContent.appendChild(btnCerrar);

    modal.style.display = 'flex';
}

// Función para ver detalle de venta
function verDetalle(id) {
    fetch(`/api/ventas/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mostrarModal('Error', `<p>${data.error}</p>`);
                return;
            }
            const contenido = `
                <p>Detalles de la venta con ID: <strong>${id}</strong></p>
                <p>Fecha: ${data.fecha || 'N/A'}</p>
                <p>Total: $${parseFloat(data.total_venta || 0).toFixed(2)}</p>
                <p>Método de Pago: ${data.metodo_pago || 'N/A'}</p>
            `;
            mostrarModal('Detalle de Venta', contenido);
        })
        .catch(() => {
            mostrarModal('Error', '<p>No se pudo cargar el detalle de la venta.</p>');
        });
}

// Función para imprimir ticket de venta (abre ventana nueva con contenido para imprimir)
function imprimirTicket(id) {
    // Para mejor integración, puedes hacer fetch para obtener datos reales antes de imprimir
    fetch(`/api/ventas/${id}`)
        .then(response => response.json())
        .then(data => {
            const contenido = `
                <html>
                <head>
                    <title>Ticket Venta ${id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h2 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        td, th { border: 1px solid #000; padding: 8px; }
                    </style>
                </head>
                <body>
                    <h2>Ticket de Venta</h2>
                    <p><strong>ID:</strong> ${id}</p>
                    <p><strong>Fecha:</strong> ${data.fecha || 'N/A'}</p>
                    <p><strong>Total:</strong> $${parseFloat(data.total_venta || 0).toFixed(2)}</p>
                    <p><strong>Método de Pago:</strong> ${data.metodo_pago || 'N/A'}</p>
                    <hr>
                    <p>Gracias por su compra.</p>
                </body>
                </html>
            `;

            const ventanaImpresion = window.open('', '', 'width=600,height=400');
            ventanaImpresion.document.write(contenido);
            ventanaImpresion.document.close();
            ventanaImpresion.focus();
            ventanaImpresion.print();
            ventanaImpresion.close();
        })
        .catch(() => alert('No se pudo generar el ticket para imprimir.'));
}

// Función para ver detalle de servicio
function verDetalleServicio(id) {
    fetch(`/api/servicios/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mostrarModal('Error', `<p>${data.error}</p>`);
                return;
            }
            const contenido = `
                <p>Detalles del servicio con ID: <strong>${id}</strong></p>
                <p>Cliente: ${data.cliente || 'N/A'}</p>
                <p>Descripción: ${data.descripcion || 'N/A'}</p>
                <p>Estado: ${data.estado || 'N/A'}</p>
            `;
            mostrarModal('Detalle de Servicio', contenido);
        })
        .catch(() => {
            mostrarModal('Error', '<p>No se pudo cargar el detalle del servicio.</p>');
        });
}

// Función para actualizar estado de servicio (deberías implementar en backend)
function actualizarEstadoServicio(id) {
    if (confirm(`¿Desea actualizar el estado del servicio ${id}?`)) {
        // Aquí debes hacer una llamada a la API para actualizar el estado
        // Ejemplo:
        fetch(`/api/servicios/${id}/actualizar_estado`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(`Error: ${data.error}`);
                    return;
                }
                alert(`Estado del servicio ${id} actualizado.`);
                actualizarDatosServicios();
            })
            .catch(() => alert('Error al actualizar el estado del servicio.'));
    }
}

// Función para ver detalle de historial
function verDetalleHistorial(id) {
    mostrarModal('Detalle de Historial', `<p>Detalles del registro con ID: <strong>${id}</strong></p><p>Descripción detallada del registro histórico.</p>`);
}

// Función para imprimir historial (similar a imprimirTicket)
function imprimirHistorial(id) {
    const contenido = `
        <html>
        <head>
            <title>Registro Histórico ${id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                td, th { border: 1px solid #000; padding: 8px; }
            </style>
        </head>
        <body>
            <h2>Registro Histórico</h2>
            <p><strong>ID:</strong> ${id}</p>
            <p><strong>Descripción:</strong> Detalle del registro histórico.</p>
            <hr>
            <p>Documento generado para impresión.</p>
        </body>
        </html>
    `;

    const ventanaImpresion = window.open('', '', 'width=600,height=400');
    ventanaImpresion.document.write(contenido);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    ventanaImpresion.print();
    ventanaImpresion.close();
}
