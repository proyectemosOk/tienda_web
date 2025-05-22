function obtenerDatosJSONVentas() {
    return {
        desglose_pagos: {
            Efectivo: 2000,
            Tarjeta: 3000,
            Transferencia: 1000
        },
        ventas: [
            { id: 'V001', fecha: '2025-05-20', total: 300.00, metodos_pago: 'Efectivo' },
            { id: 'V002', fecha: '2025-05-19', total: 800.00, metodos_pago: 'Tarjeta' },
            { id: 'V003', fecha: '2025-05-18', total: 1200.00, metodos_pago: 'Transferencia' },
            { id: 'V004', fecha: '2025-05-17', total: 1500.00, metodos_pago: 'Tarjeta' },
            { id: 'V005', fecha: '2025-05-16', total: 200.00, metodos_pago: 'Efectivo' }
        ]
    };
}

function obtenerDatosJSONServicios() {
    return {
        conteo_estados: {
            'Pendiente': 1,
            'En Proceso': 2,
            'Listo': 1,
            'Entregado': 1
        },
        servicios: [
            { id: 'S001', descripcion: 'Reparación de pantalla', fecha: '2025-05-18', estado: 'Listo' },
            { id: 'S002', descripcion: 'Mantenimiento preventivo', fecha: '2025-05-19', estado: 'En Proceso' },
            { id: 'S003', descripcion: 'Instalación de sistema', fecha: '2025-05-20', estado: 'Pendiente' },
            { id: 'S004', descripcion: 'Cambio de batería', fecha: '2025-05-17', estado: 'Entregado' },
            { id: 'S005', descripcion: 'Revisión general', fecha: '2025-05-16', estado: 'En Proceso' }
        ]
    };
}

function obtenerDatosJSONResumen() {
    return {
        totales: {
            ventas: 5700.00,
            servicios: 5,
            productos: 35
        },
        ventas_categoria: {
            categorias: ['Electrónica', 'Hogar', 'Ropa', 'Accesorios'],
            datos: [2500, 1500, 1200, 500]
        },
        servicios_tipo: {
            tipos: ['Instalación', 'Reparación', 'Mantenimiento', 'Diagnóstico'],
            datos: [1, 2, 1, 1]
        }
    };
}

function obtenerDatosJSONHistorial() {
    return {
        registros: [
            { id: 'H001', tipo: 'Venta', fecha: '2025-05-20', descripcion: 'Venta ID V001', total: 300 },
            { id: 'H002', tipo: 'Venta', fecha: '2025-05-19', descripcion: 'Venta ID V002', total: 800 },
            { id: 'H003', tipo: 'Venta', fecha: '2025-05-18', descripcion: 'Venta ID V003', total: 1200 },
            { id: 'H004', tipo: 'Venta', fecha: '2025-05-17', descripcion: 'Venta ID V004', total: 1500 },
            { id: 'H005', tipo: 'Venta', fecha: '2025-05-16', descripcion: 'Venta ID V005', total: 200 },
            { id: 'H006', tipo: 'Servicio', fecha: '2025-05-18', descripcion: 'Servicio ID S001 - Reparación de pantalla', total: 400 },
            { id: 'H007', tipo: 'Servicio', fecha: '2025-05-19', descripcion: 'Servicio ID S002 - Mantenimiento preventivo', total: 350 },
            { id: 'H008', tipo: 'Servicio', fecha: '2025-05-20', descripcion: 'Servicio ID S003 - Instalación de sistema', total: 500 },
            { id: 'H009', tipo: 'Servicio', fecha: '2025-05-17', descripcion: 'Servicio ID S004 - Cambio de batería', total: 250 },
            { id: 'H010', tipo: 'Servicio', fecha: '2025-05-16', descripcion: 'Servicio ID S005 - Revisión general', total: 300 }
        ]
    };
}

function obtenerDetallesExtrasVenta(id) {
    return {
        productos: [
            { nombre: 'Producto 1', cantidad: 1, precio_unitario: 100 },
            { nombre: 'Producto 2', cantidad: 2, precio_unitario: 100 }
        ],
        impuestos: 60,
        descuento: 50,
        vendedor: 'María Fernández',
        notas: 'Entrega programada a domicilio.'
    };
}

function obtenerDetallesExtrasServicio(id) {
    const servicio = obtenerDatosJSONServicios().servicios.find(s => s.id === id);
    return {
        contacto: 'soporte@empresa.com',
        telefono: '555-0000',
        direccion: 'Zona Industrial 456',
        comentarios: 'Revisión técnica detallada requerida.',
        tecnico: 'Técnico asignado',
        historialEstados: [
            { fecha: '2025-05-15', estado: 'Pendiente' },
            { fecha: '2025-05-16', estado: 'En Proceso' },
            { fecha: '2025-05-18', estado: servicio.estado }
        ]
    };
}

function obtenerDatosEstadisticas(periodo) {
    const datosPeriodos = {
        semana: {
            etiquetas: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
            ventas: [200, 300, 250, 280, 300, 350, 400],
            servicios: [50, 60, 70, 80, 90, 100, 110]
        },
        mes: {
            etiquetas: Array.from({ length: 30 }, (_, i) => `Día ${i + 1}`),
            ventas: Array.from({ length: 30 }, () => Math.floor(Math.random() * 400) + 100),
            servicios: Array.from({ length: 30 }, () => Math.floor(Math.random() * 200) + 50)
        },
        trimestre: {
            etiquetas: ['Ene', 'Feb', 'Mar'],
            ventas: [5000, 5500, 6000],
            servicios: [2600, 2700, 2900]
        },
        año: {
            etiquetas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            ventas: [16000, 16500, 17000, 18000, 17500, 18500, 19000, 20000, 21000, 21500, 22000, 23000],
            servicios: [7200, 7300, 7500, 7800, 7700, 8000, 8100, 8300, 8500, 8700, 8900, 9100]
        }
    };

    return datosPeriodos[periodo] || datosPeriodos['año'];
}

function verDetalleHistorial(id) {
    const registro = obtenerDatosJSONHistorial().registros.find(r => r.id === id);
    if (!registro) return mostrarModal('Error', '<p>Registro histórico no encontrado</p>');

    // Obtener detalles adicionales si es una venta o un servicio
    let detallesAdicionales = '';
    if (registro.tipo === 'Venta') {
        const venta = obtenerDatosJSONVentas().ventas.find(v => v.id === registro.descripcion.split(' ')[2]);
        if (venta) {
            const detallesExtras = obtenerDetallesExtrasVenta(venta.id);
            let productosHTML = '<ul>';
            detallesExtras.productos.forEach(p => {
                productosHTML += `<li>${p.nombre} - Cantidad: ${p.cantidad} - Precio unitario: $${p.precio_unitario.toFixed(2)}</li>`;
            });
            productosHTML += '</ul>';

            detallesAdicionales = `
                <h5>Detalles de la Venta</h5>
                <p><strong>ID:</strong> ${venta.id}</p>
                <p><strong>Fecha:</strong> ${venta.fecha}</p>
                <p><strong>Total:</strong> $${venta.total.toFixed(2)}</p>
                <p><strong>Método de Pago:</strong> ${venta.metodos_pago}</p>
                <hr>
                <p><strong>Productos:</strong> ${productosHTML}</p>
                <p><strong>Impuestos:</strong> $${detallesExtras.impuestos.toFixed(2)}</p>
                <p><strong>Descuento:</strong> $${detallesExtras.descuento.toFixed(2)}</p>
                <p><strong>Vendedor:</strong> ${detallesExtras.vendedor}</p>
                <p><strong>Notas:</strong> ${detallesExtras.notas}</p>
            `;
        }
    } else if (registro.tipo === 'Servicio') {
        const servicio = obtenerDatosJSONServicios().servicios.find(s => s.id === registro.descripcion.split(' ')[2]);
        if (servicio) {
            const detallesExtras = obtenerDetallesExtrasServicio(servicio.id);
            let historialHTML = '<ul>';
            detallesExtras.historialEstados.forEach(h => {
                historialHTML += `<li>${h.fecha}: ${h.estado}</li>`;
            });
            historialHTML += '</ul>';

            detallesAdicionales = `
                <h5>Detalles del Servicio</h5>
                <p><strong>ID:</strong> ${servicio.id}</p>
                <p><strong>Descripción:</strong> ${servicio.descripcion}</p>
                <p><strong>Fecha:</strong> ${servicio.fecha}</p>
                <p><strong>Estado actual:</strong> ${servicio.estado}</p>
                <hr>
                <p><strong>Contacto:</strong> ${detallesExtras.contacto}</p>
                <p><strong>Teléfono:</strong> ${detallesExtras.telefono}</p>
                <p><strong>Dirección:</strong> ${detallesExtras.direccion}</p>
                <p><strong>Comentarios:</strong> ${detallesExtras.comentarios}</p>
                <p><strong>Técnico asignado:</strong> ${detallesExtras.tecnico}</p>
                <p><strong>Historial de estados:</strong> ${historialHTML}</p>
            `;
        }
    }

    const contenido = `
        <p><strong>ID Registro:</strong> ${registro.id}</p>
        <p><strong>Tipo:</strong> ${registro.tipo}</p>
        <p><strong>Fecha:</strong> ${registro.fecha}</p>
        <p><strong>Descripción:</strong> ${registro.descripcion}</p>
        <p><strong>Total:</strong> $${parseFloat(registro.total).toFixed(2)}</p>
        <hr>
        ${detallesAdicionales}
    `;
    
    mostrarModal('Detalle Ampliado del Registro Histórico', contenido);
}


// Variables globales
let ventasChart = null;
let serviciosChart = null;
let ventasCategoriaChart = null;
let serviciosTipoChart = null;
let ventasPeriodoChart = null;
let serviciosPeriodoChart = null;
let periodoActual = 'semana';

// Colores para gráficos y estados
const colores = [
    'rgba(252, 211, 77, 0.7)',   // Pendiente - Amarillo (bg-warning)
    'rgba(59, 130, 246, 0.7)',   // En Proceso - Azul (bg-info)
    'rgba(34, 197, 94, 0.7)',    // Listo - Verde (bg-success)
    'rgba(108, 117, 125, 0.7)'   // Entregado - Gris oscuro (bg-secondary)
];

// Estado visual para servicios actualizado en memoria
let serviciosEstadoMap = {};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarEstadoServicios();
    inicializarPestanaVentas();
    inicializarPestanaServicios();
    inicializarPestanaResumen();
    inicializarPestanaHistorial();
    inicializarPestanaEstadisticas();

    const tabElems = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElems.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            actualizarPestanaActiva(targetId);
        });
    });

    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            periodoActual = this.getAttribute('data-periodo');
            actualizarEstadisticas();
        });
    });
});

// Inicializa el estado visual de servicios en memoria
function inicializarEstadoServicios() {
    const servicios = obtenerDatosJSONServicios().servicios;
    servicios.forEach(s => {
        serviciosEstadoMap[s.id] = s.estado;
    });
}

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

    actualizarDatosVentas();
}

function actualizarDatosVentas() {
    const data = obtenerDatosJSONVentas();

    const pagos = data.desglose_pagos;
    const etiquetas = Object.keys(pagos);
    const valores = Object.values(pagos);

    ventasChart.data.labels = etiquetas;
    ventasChart.data.datasets[0].data = valores;
    ventasChart.update();

    const cuerpoTablaVentas = document.getElementById('cuerpoTablaVentas');
    cuerpoTablaVentas.innerHTML = data.ventas.map(venta => `
        <tr>
            <td>${venta.id}</td>
            <td>${venta.fecha}</td>
            <td>$${parseFloat(venta.total).toFixed(2)}</td>
            <td>${venta.metodos_pago}</td>
            <td>
                <button onclick="verDetalle('${venta.id}')" class="btn btn-sm btn-outline-primary" title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
                <button onclick="imprimirTicket('${venta.id}')" class="btn btn-sm btn-outline-secondary" title="Imprimir ticket">
                    <i class="bi bi-printer"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ==================== PESTAÑA SERVICIOS ====================

function inicializarPestanaServicios() {
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

    actualizarDatosServicios();
}

function actualizarDatosServicios() {
    const data = obtenerDatosJSONServicios();

    const conteo = { Pendiente: 0, 'En Proceso': 0, Listo: 0, Entregado: 0 };
    data.servicios.forEach(s => {
        const estadoActual = serviciosEstadoMap[s.id] || s.estado;
        serviciosEstadoMap[s.id] = estadoActual;
        conteo[estadoActual]++;
    });

    const totalServicios = conteo.Pendiente + conteo['En Proceso'] + conteo.Listo + conteo.Entregado;

    if (totalServicios > 0) {
        document.getElementById('totalServiciosCard').style.display = 'block';
        document.getElementById('pendientesCard').style.display = conteo.Pendiente > 0 ? 'block' : 'none';
        document.getElementById('enProcesoCard').style.display = conteo['En Proceso'] > 0 ? 'block' : 'none';
        document.getElementById('listosCard').style.display = conteo.Listo > 0 ? 'block' : 'none';
        document.getElementById('entregadosCard').style.display = conteo.Entregado > 0 ? 'block' : 'none';

        document.getElementById('totalServicios').textContent = totalServicios;
        document.getElementById('pendientesServicios').textContent = conteo.Pendiente;
        document.getElementById('enProcesoServicios').textContent = conteo['En Proceso'];
        document.getElementById('listosServicios').textContent = conteo.Listo;
        document.getElementById('entregadosServicios').textContent = conteo.Entregado;
    } else {
        document.getElementById('totalServiciosCard').style.display = 'none';
        document.getElementById('pendientesCard').style.display = 'none';
        document.getElementById('enProcesoCard').style.display = 'none';
        document.getElementById('listosCard').style.display = 'none';
        document.getElementById('entregadosCard').style.display = 'none';
    }

    const estados = ['Pendiente', 'En Proceso', 'Listo', 'Entregado'];
    const datos = estados.map(e => conteo[e] || 0);

    serviciosChart.data.labels = estados;
    serviciosChart.data.datasets[0].data = datos;
    serviciosChart.update();

    const cuerpoTablaServicios = document.getElementById('cuerpoTablaServicios');
    cuerpoTablaServicios.innerHTML = data.servicios.map(servicio => {
        const estadoActual = serviciosEstadoMap[servicio.id] || servicio.estado;
        const estadoClase = getEstadoClase(estadoActual);
        return `
            <tr>
                <td>${servicio.id}</td>
                <td>${servicio.descripcion}</td>
                <td>${servicio.fecha}</td>
                <td><span class="badge ${estadoClase}">${estadoActual}</span></td>
                <td>
                    <button onclick="verDetalleServicio('${servicio.id}')" class="btn btn-sm btn-outline-primary" title="Ver detalle">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button onclick="actualizarEstadoServicio('${servicio.id}')" class="btn btn-sm btn-outline-success" title="Actualizar estado">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Función para actualizar estado de servicio (local) con cambio visual inmediato y límite en 'Entregado'
function actualizarEstadoServicio(id) {
    const estados = ['Pendiente', 'En Proceso', 'Listo', 'Entregado'];
    const estadoActual = serviciosEstadoMap[id] || 'Pendiente';
    const indexActual = estados.indexOf(estadoActual);

    if (indexActual === estados.length - 1) {
        alert('El estado ya está en "Entregado" y no puede actualizarse más.');
        return;
    }

    const siguienteEstado = estados[indexActual + 1];
    serviciosEstadoMap[id] = siguienteEstado;

    // Actualizar tabla y gráfico para reflejar cambio visual
    actualizarDatosServicios();
}

// ==================== PESTAÑA RESUMEN ====================

function inicializarPestanaResumen() {
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

    actualizarDatosResumen();
}

function actualizarDatosResumen() {
    const data = obtenerDatosJSONResumen();

    document.getElementById('totalVentasResumen').textContent = `$${parseFloat(data.totales.ventas).toFixed(2)}`;
    document.getElementById('totalServiciosResumen').textContent = data.totales.servicios;
    document.getElementById('totalProductosResumen').textContent = data.totales.productos;

    ventasCategoriaChart.data.labels = data.ventas_categoria.categorias;
    ventasCategoriaChart.data.datasets[0].data = data.ventas_categoria.datos;
    ventasCategoriaChart.update();

    serviciosTipoChart.data.labels = data.servicios_tipo.tipos;
    serviciosTipoChart.data.datasets[0].data = data.servicios_tipo.datos;
    serviciosTipoChart.update();
}

// ==================== PESTAÑA HISTORIAL ====================

function inicializarPestanaHistorial() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('fechaFin');

        fechaInicioInput.valueAsDate = inicioMes;
    fechaFinInput.valueAsDate = hoy;

    document.getElementById('filtroHistorialForm').addEventListener('submit', function(e) {
        e.preventDefault();
        buscarHistorial();
    });
}

function buscarHistorial() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    if (!fechaInicio || !fechaFin || new Date(fechaInicio) > new Date(fechaFin)) {
        return alert('Fechas inválidas. Por favor verifica.');
    }

    const registros = obtenerDatosJSONHistorial().registros.filter(r => {
        const fecha = new Date(r.fecha);
        return fecha >= new Date(fechaInicio) && fecha <= new Date(fechaFin);
    });

    const cuerpoTablaHistorial = document.getElementById('cuerpoTablaHistorial');
    if (!registros.length) {
        cuerpoTablaHistorial.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron registros</td></tr>';
    } else {
        cuerpoTablaHistorial.innerHTML = generarFilasTablaHistorial(registros);
    }
}

function generarFilasTablaHistorial(registros) {
    if (!registros || registros.length === 0) {
        return `<tr><td colspan="6" class="text-center">No se encontraron registros</td></tr>`;
    }

    return registros.map(registro => {
        const tipoClase = registro.tipo === 'Venta' ? 'text-primary' : 'text-success';
        return `
            <tr>
                <td>${registro.id}</td>
                <td><span class="${tipoClase}">${registro.tipo}</span></td>
                <td>${registro.fecha}</td>
                <td>${registro.descripcion}</td>
                <td>$${parseFloat(registro.total).toFixed(2)}</td>
                <td>
                    <button onclick="verDetalleHistorial('${registro.id}')" class="btn btn-sm btn-outline-primary" title="Ver detalle">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button onclick="imprimirHistorial('${registro.id}')" class="btn btn-sm btn-outline-secondary" title="Imprimir">
                        <i class="bi bi-printer"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== PESTAÑA ESTADÍSTICAS ====================

function inicializarPestanaEstadisticas() {
    const ctxVentasPeriodo = document.getElementById('graficoVentasPeriodo').getContext('2d');
    ventasPeriodoChart = new Chart(ctxVentasPeriodo, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Ventas',
                data: [],
                borderColor: colores[1],
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

    actualizarEstadisticas();
}

function actualizarEstadisticas() {
    const data = obtenerDatosEstadisticas(periodoActual);
    const etiquetas = data.etiquetas;
    const datosVentas = data.ventas;
    const datosServicios = data.servicios;

    const totalVentas = datosVentas.reduce((acc, val) => acc + val, 0);
    const promedio = totalVentas / datosVentas.length;

    ventasPeriodoChart.data.labels = etiquetas;
    ventasPeriodoChart.data.datasets[0].data = datosVentas;
    ventasPeriodoChart.update();

    serviciosPeriodoChart.data.labels = etiquetas;
    serviciosPeriodoChart.data.datasets[0].data = datosServicios;
    serviciosPeriodoChart.update();

    // Mostrar solo valores actuales sin indicar aumento o disminución
    document.getElementById('ticketPromedio').textContent = `$${promedio.toFixed(2)}`;
    document.getElementById('ventasDiarias').textContent = `${Math.round(promedio / 10)}`;
    document.getElementById('serviciosCompletados').textContent = `${datosServicios.filter(d => d > 100).length}`;
    document.getElementById('tasaConversion').textContent = `${Math.round((promedio / 500) * 100)}%`;
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
        modalContent.style.maxWidth = '600px';
        modalContent.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        modal.appendChild(modalContent);

        document.body.appendChild(modal);
    }

    const modalContent = document.getElementById('modalContentDetalle');
    modalContent.innerHTML = `<h4>${titulo}</h4><div>${contenido}</div>`;

    // Botón cerrar (solo uno)
    if (!modalContent.querySelector('button')) {
        const btnCerrar = document.createElement('button');
        btnCerrar.textContent = 'Cerrar';
        btnCerrar.style.marginTop = '15px';
        btnCerrar.className = 'btn btn-primary';
        btnCerrar.onclick = () => { modal.style.display = 'none'; };
        modalContent.appendChild(btnCerrar);
    }

    modal.style.display = 'flex';
}

// Funciones para ver detalle extendido de venta y servicio
function verDetalle(id) {
    const venta = obtenerDatosJSONVentas().ventas.find(v => v.id === id);
    if (!venta) return mostrarModal('Error', '<p>Venta no encontrada</p>');

    const detallesExtras = obtenerDetallesExtrasVenta(id);
    let productosHTML = '<ul>';
    detallesExtras.productos.forEach(p => {
        productosHTML += `<li>${p.nombre} - Cantidad: ${p.cantidad} - Precio unitario: $${p.precio_unitario.toFixed(2)}</li>`;
    });
    productosHTML += '</ul>';

    const contenido = `
        <p><strong>ID:</strong> ${venta.id}</p>
        <p><strong>Fecha:</strong> ${venta.fecha}</p>
        <p><strong>Total:</strong> $${venta.total.toFixed(2)}</p>
        <p><strong>Método de Pago:</strong> ${venta.metodos_pago}</p>
        <hr>
        <p><strong>Productos:</strong> ${productosHTML}</p>
        <p><strong>Impuestos:</strong> $${detallesExtras.impuestos.toFixed(2)}</p>
        <p><strong>Descuento:</strong> $${detallesExtras.descuento.toFixed(2)}</p>
        <p><strong>Vendedor:</strong> ${detallesExtras.vendedor}</p>
        <p><strong>Notas:</strong> ${detallesExtras.notas}</p>
    `;
    mostrarModal('Detalle Extendido de Venta', contenido);
}

function verDetalleServicio(id) {
    const servicio = obtenerDatosJSONServicios().servicios.find(s => s.id === id);
    if (!servicio) return mostrarModal('Error', '<p>Servicio no encontrado</p>');

    const detallesExtras = obtenerDetallesExtrasServicio(id);
    let historialHTML = '<ul>';
    detallesExtras.historialEstados.forEach(h => {
        historialHTML += `<li>${h.fecha}: ${h.estado}</li>`;
    });
    historialHTML += '</ul>';

    const contenido = `
        <p><strong>ID:</strong> ${servicio.id}</p>
        <p><strong>Descripción:</strong> ${servicio.descripcion}</p>
        <p><strong>Fecha:</strong> ${servicio.fecha}</p>
        <p><strong>Estado actual:</strong> ${servicio.estado}</p>
        <hr>
        <p><strong>Contacto:</strong> ${detallesExtras.contacto}</p>
        <p><strong>Teléfono:</strong> ${detallesExtras.telefono}</p>
        <p><strong>Dirección:</strong> ${detallesExtras.direccion}</p>
        <p><strong>Comentarios:</strong> ${detallesExtras.comentarios}</p>
        <p><strong>Técnico asignado:</strong> ${detallesExtras.tecnico}</p>
        <p><strong>Historial de estados:</strong> ${historialHTML}</p>
    `;
    mostrarModal('Detalle Extendido de Servicio', contenido);
}

// Funciones para imprimir ticket e historial
function imprimirTicket(id) {
    const venta = obtenerDatosJSONVentas().ventas.find(v => v.id === id);
    if (!venta) return alert('Venta no encontrada');

    const contenido = `
        <html><head><title>Ticket Venta ${id}</title></head>
        <body>
            <h2>Ticket de Venta</h2>
            <p>ID: ${venta.id}</p>
            <p>Fecha: ${venta.fecha}</p>
            <p>Total: $${venta.total.toFixed(2)}</p>
            <p>Método de Pago: ${venta.metodos_pago}</p>
            <hr><p>Gracias por su compra.</p>
        </body></html>
    `;

    const win = window.open('', '', 'width=600,height=400');
    win.document.write(contenido);
    win.document.close();
    win.print();
    win.close();
}

function imprimirHistorial(id) {
    const registro = obtenerDatosJSONHistorial().registros.find(r => r.id === id);
    if (!registro) return alert('Registro histórico no encontrado');

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
            <p><strong>ID:</strong> ${registro.id}</p>
            <p><strong>Descripción:</strong> ${registro.descripcion}</p>
            <p><strong>Tipo:</strong> ${registro.tipo}</p>
            <p><strong>Fecha:</strong> ${registro.fecha}</p>
            <p><strong>Total:</strong> $${parseFloat(registro.total).toFixed(2)}</p>
            <hr>
            <p>Documento generado para impresión.</p>
        </body>
        </html>
    `;

    const ventanaImpresion = window.open('', '', 'width=600,height=400');
    ventanaImpresion.document.write(contenido);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
    ventanaImpresion.close();
}

