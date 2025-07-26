const puntos = new Intl.NumberFormat('es-CO').format;

async function obtenerDatosJSON(url, procesador = (data) => data) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.ok === false) {
            console.error("Respuesta con error:", data);
            return null;
        }

        return procesador(data);
    } catch (error) {
        console.error("Error al obtener datos desde:", url, error);
        return null;
    }
}

function obtenerRangoFechas() {
    const select = document.getElementById("selectRangoVentas");
    const inputFechaInicio = document.getElementById("inputFechaPersonalizada");
    const inputFechaFin = document.getElementById("inputFechaFinPersonalizada");

    const hoy = new Date();
    const formatoFecha = (d) => {
        const fechaColombia = new Date(d.toLocaleString("en-US", { timeZone: "America/Bogota" }));
        const año = fechaColombia.getFullYear();
        const mes = String(fechaColombia.getMonth() + 1).padStart(2, "0");
        const dia = String(fechaColombia.getDate()).padStart(2, "0");
        return `${año}-${mes}-${dia}`;
    };


    let inicio = "";
    let fin = "";

    if (select.value === "personalizada") {
        if (!inputFechaInicio.value || !inputFechaFin.value) return null;
        inicio = inputFechaInicio.value;
        fin = inputFechaFin.value;
    } else if (select.value === "última_semana") {
        const hace7dias = new Date();
        hace7dias.setDate(hoy.getDate() - 6);
        inicio = formatoFecha(hace7dias);
        fin = formatoFecha(hoy);
    } else if (select.value === "mes_actual") {
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio = formatoFecha(primerDia);
        fin = formatoFecha(hoy);
    } else {
        // Hoy
        const fecha = formatoFecha(hoy);
        inicio = fecha;
        fin = fecha;
    }
    // alert(inicio + "\n" + fin)
    return { inicio, fin };
}

async function obtenerDatosJSONVentas() {
    const rango = obtenerRangoFechas();
    if (!rango) return null;

    const url = `/api/ventas/rango?inicio=${rango.inicio}&fin=${rango.fin}`;
    return await obtenerDatosJSON(url, (data) => data); // sin procesamiento
}

async function obtenerDatosJSONVentasPorID(id) {
    try {
        const response = await fetch(`/api/ventas/${id}/detalle`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        return data;  // Usa objeto JS normal
    } catch (error) {
        console.error("Error al obtener datos de ventas:", error);
        return {
            desglose_pagos: {},
            productos: []
        };
    }
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
const datosSimuladosApai = {
    totales: {
        ventas: 5700.00,
        servicios: 5,
        productos: 35
    },
    ventas_categoria: {
        categorias: ['Electrónica', 'Hogar', 'Ropa', 'Accesorios'],
        datos: [2500, 1500, 1200, 500]
    },
    productos: {
        tipos: ['Instalación', 'Reparación', 'Mantenimiento', 'Diagnóstico'],
        datos: [1, 2, 1, 1]
    }
};
async function obtenerDatosJSONResumen() {
    const rango = obtenerRangoFechas();
    if (!rango) return null;

    const url = `/api/resumen_informe?inicio=${rango.inicio}&fin=${rango.fin}`;

    return await obtenerDatosJSON(url, (data) => {
        const resumen = data.datos;

        return resumen;
    });
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

function obtenerDatosSemana() {
    return {
        etiquetas: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        ventas: [200, 300, 250, 280, 300, 350, 400],
        servicios: [50, 60, 70, 80, 90, 100, 110]
    };
}

function obtenerDatosMes() {
    return {
        etiquetas: Array.from({ length: 30 }, (_, i) => `Día ${i + 1}`),
        ventas: Array.from({ length: 30 }, () => Math.floor(Math.random() * 400) + 100),
        servicios: Array.from({ length: 30 }, () => Math.floor(Math.random() * 200) + 50)
    };
}

function obtenerDatosTrimestre() {
    return {
        etiquetas: ['Ene', 'Feb', 'Mar'],
        ventas: [5000, 5500, 6000],
        servicios: [2600, 2700, 2900]
    };
}

function obtenerDatosAño() {
    return {
        etiquetas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        ventas: [16000, 16500, 17000, 18000, 17500, 18500, 19000, 20000, 21000, 21500, 22000, 23000],
        servicios: [7200, 7300, 7500, 7800, 7700, 8000, 8100, 8300, 8500, 8700, 8900, 9100]
    };
}

function obtenerDatosEstadisticas(periodo) {
    switch (periodo) {
        case 'semana':
            return obtenerDatosSemana();
        case 'mes':
            return obtenerDatosMes();
        case 'trimestre':
            return obtenerDatosTrimestre();
        case 'año':
            return obtenerDatosAño();
        default:
            return obtenerDatosAño();
    }
}

function verDetalleHistorial(id) {
    const registro = obtenerDatosJSONHistorial().registros.find(r => r.id === id);
    if (!registro) return mostrarModal('Error', '<p>Registro histórico no encontrado</p>');

    let detallesAdicionales = '';
    if (registro.tipo === 'Venta') {
        const venta = obtenerDatosJSONVentas().ventas.find(v => v.id === registro.descripcion.split(' ')[2]);
        if (venta) {
            const detallesExtras = obtenerDetallesExtrasVenta(venta.id);
            let productosHTML = '<ul>';
            detallesExtras.productos.forEach(p => {
                productosHTML += `<li>${p.nombre} - Cantidad: ${p.cantidad} - Precio unitario: $${puntos(p.precio_unitario)}</li>`;
            });
            productosHTML += '</ul>';

            detallesAdicionales = `
                <h5>Detalles de la Venta</h5>
                <p><strong>ID:</strong> ${venta.id}</p>
                <p><strong>Fecha:</strong> ${venta.fecha}</p>
                <p><strong>Total:</strong> $${puntos(venta.total)}</p>
                <p><strong>Método de Pago:</strong> ${venta.metodos_pago}</p>
                <hr>
                <p><strong>Productos:</strong> ${productosHTML}</p>
                <p><strong>Impuestos:</strong> $${puntos(detallesExtras.impuestos)}</p>
                <p><strong>Descuento:</strong> $${puntos(detallesExtras.descuento)}</p>
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
        <p><strong>Total:</strong> $${puntos(parseFloat(registro.total))}</p>
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
function generarColores(cantidad) {
    // Colores base predefinidos
    const coloresBase = [
        'rgba(252, 211, 77, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(34, 197, 94, 0.7)',
        'rgba(108, 117, 125, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(168, 85, 247, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(20, 184, 166, 0.7)',
        'rgba(236, 72, 153, 0.7)',
        'rgba(99, 102, 241, 0.7)',
    ];

    // Si necesitamos menos colores que los predefinidos, devolver solo los necesarios
    if (cantidad <= coloresBase.length) {
        return coloresBase.slice(0, cantidad);
    }

    // Si necesitamos más colores, generar adicionales
    const colores = [...coloresBase];

    // Generar colores adicionales usando HSL para mejor distribución
    for (let i = coloresBase.length; i < cantidad; i++) {
        const hue = (i * 137.508) % 360; // Usar proporción áurea para distribución uniforme
        const saturation = 60 + (i % 3) * 15; // Variar saturación (60%, 75%, 90%)
        const lightness = 45 + (i % 4) * 10;  // Variar luminosidad (45%, 55%, 65%, 75%)

        colores.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`);
    }

    return colores;
};

const colores = generarColores();

// Estado visual para servicios actualizado en memoria
let serviciosEstadoMap = {};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    cargarFiltrosVentas();
    // inicializarEstadoServicios();
    inicializarPestanaVentas();
    // inicializarPestanaServicios();
    inicializarPestanaResumen();
    // inicializarPestanaHistorial();
    // inicializarPestanaEstadisticas();


    if (datos.rol !== "admin" || datos.rol === "superAdmin") {
        document.getElementById("resumen").style = "display:none";
        document.getElementById("resumen-tab").style = "display:none";
    }


    const tabElems = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElems.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            actualizarPestanaActiva(targetId);
        });
    });

    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.addEventListener('click', function () {
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
    switch (pestanaId) {
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

async function actualizarDatosVentas() {
    const data = await obtenerDatosJSONVentas();
    const pagos = data.desglose_pagos;
    const etiquetas = Object.keys(pagos);
    const valores = Object.values(pagos);

    ventasChart.data.labels = etiquetas;
    ventasChart.data.datasets[0].data = valores;
    ventasChart.update();

    const cuerpoTablaVentas = document.getElementById('cuerpoTablaVentas');

    cuerpoTablaVentas.innerHTML = data.ventas
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))  // 🧠 Ordena por fecha descendente
        .map(venta => `
        <tr>
            <td>${venta.id}</td>
            <td>${venta.fecha}</td>
            <td>${venta.cliente}</td>
            <td>$${puntos(parseFloat(venta.total))}</td>
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
            },
            plugins: {
                legend: {
                    display: false
                }
            }

        }
    });

    const ctxServiciosTipo = document.getElementById('graficoServiciosTipo').getContext('2d');
    serviciosTipoChart = new Chart(ctxServiciosTipo, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                // label: 'Productos',
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

    actualizarDatosResumen();
}

async function actualizarDatosResumen() {
    const data = await obtenerDatosJSONResumen();
    console.log(data)

    // Mostrar u ocultar columna según valor
    const toggleColResumen = (id, visible) => {
        document.getElementById(id).style.display = visible ? 'block' : 'none';
    };

    // Actualizar datos y controlar visibilidad
    document.getElementById('totalVentasResumen').textContent = `$${puntos(parseFloat(data.totales.ventas))}`;
    toggleColResumen('colVentasResumen', data.totales.ventas > 0);

    document.getElementById('totalServiciosResumen').textContent = data.totales.servicios;
    toggleColResumen('colServiciosResumen', data.totales.servicios > 0);

    document.getElementById('totalProductosResumen').textContent = data.totales.productos;
    toggleColResumen('colProductosResumen', data.totales.productos > 0);


    // alert(data.ventas_categoria.categorias)
    ventasCategoriaChart.data.labels = data.ventas_categoria.categorias;
    ventasCategoriaChart.data.datasets[0].data = data.ventas_categoria.datos;
    ventasCategoriaChart.update();
    // alert(data.productos.tipos)
    serviciosTipoChart.data.labels = data.productos.tipos;
    serviciosTipoChart.data.datasets[0].data = data.productos.datos;
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

    document.getElementById('filtroHistorialForm').addEventListener('submit', function (e) {
        e.preventDefault();
        buscarHistorial();
    });
}

function buscarHistorial() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const tipoFiltro = document.getElementById('tipoRegistro').value; // ventas, servicios, todos

    if (!fechaInicio || !fechaFin || new Date(fechaInicio) > new Date(fechaFin)) {
        return alert('Fechas inválidas. Por favor verifica.');
    }

    // Mapeo: valor del <select> => valor en el JSON
    const tipoMap = {
        'ventas': 'Venta',
        'servicios': 'Servicio',
        'todos': 'todos'
    };

    const registros = obtenerDatosJSONHistorial().registros.filter(r => {
        const fecha = new Date(r.fecha);
        const enRango = fecha >= new Date(fechaInicio) && fecha <= new Date(fechaFin);
        const coincideTipo = tipoMap[tipoFiltro] === 'todos' || r.tipo === tipoMap[tipoFiltro];
        return enRango && coincideTipo;
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
                <td>$${puntos(parseFloat(registro.total))}</td>
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
    document.getElementById('ticketPromedio').textContent = `$${puntos(promedio.toFixed(2))}`;
    document.getElementById('ventasDiarias').textContent = `${Math.round(promedio / 10)}`;
    document.getElementById('serviciosCompletados').textContent = `${datosServicios.filter(d => d > 100).length}`;
    document.getElementById('tasaConversion').textContent = `${Math.round((promedio / 500) * 100)}%`;
}


// ==================== FUNCIONES AUXILIARES ====================

function getEstadoClase(estado) {
    switch (estado.toLowerCase()) {
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
async function verDetalle(id) {
    try {
        const venta = await obtenerDatosJSONVentasPorID(id);
        if (!venta) return mostrarModal('Error', '<p class="text-danger">❌ Venta no encontrada</p>');

        // 👉 Productos en tabla con mejor formato
        const productosHTML = venta.productos.map(p => {
            const total = p.cantidad * p.precio_unitario;
            return `
            <tr class="align-middle">
                <td class="text-center fw-bold text-primary">#${p.id_producto}</td>
                <td class="fw-semibold">${p.nombre}</td>
                <td class="text-center">
                    <span class="badge bg-secondary rounded-pill">${p.cantidad}</span>
                </td>
                <td class="text-end text-success fw-semibold">$${puntos(p.precio_unitario.toFixed(2))}</td>
                <td class="text-end fw-bold text-dark">$${puntos(total.toFixed(2))}</td>
            </tr>
            `;
        }).join('');

        // Métodos de pago con iconos y colores
        const iconosPago = {
            'Efectivo': '💵',
            'Tarjeta': '💳',
            'Transferencia': '🏦',
            'Cheque': '📄',
            'Débito': '💳',
            'Crédito': '💎'
        };

        const desgloseHTML = Object.entries(venta.desglose_pagos).map(([metodo, valor]) => `
            <li class="d-flex justify-content-between align-items-center py-1">
                <span>
                    ${iconosPago[metodo] || '💰'} 
                    <strong>${metodo}</strong>
                </span>
                <span class="badge bg-success rounded-pill fs-6">$${puntos(valor.toFixed(2))}</span>
            </li>
        `).join('');

        const contenido = `
            <div class="container-fluid modal-scrollable-content">
                <!-- Encabezado con información principal -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card border-0 bg-light">
                            <div class="card-body">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="d-flex align-items-center mb-2">
                                            <i class="bi bi-receipt me-2 text-primary"></i>
                                            <span class="text-muted">ID de Venta:</span>
                                            <span class="ms-2 fw-bold text-primary fs-5">#${venta.id}</span>
                                        </div>
                                        <div class="d-flex align-items-center mb-2">
                                            <i class="bi bi-calendar3 me-2 text-info"></i>
                                            <span class="text-muted">Fecha:</span>
                                            <span class="ms-2 fw-semibold">${venta.fecha}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="d-flex align-items-center mb-2">
                                            <i class="bi bi-person-fill me-2 text-warning"></i>
                                            <span class="text-muted">Cliente:</span>
                                            <span class="ms-2 fw-semibold">${venta.cliente}</span>
                                        </div>
                                        <div class="d-flex align-items-center mb-2">
                                            <i class="bi bi-person-badge me-2 text-success"></i>
                                            <span class="text-muted">Vendedor:</span>
                                            <span class="ms-2 fw-semibold">${venta.vendedor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Total destacado -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="alert alert-success d-flex justify-content-between align-items-center mb-0">
                            <span class="fs-4 fw-bold">💰 Total de la Venta</span>
                            <span class="fs-3 fw-bold text-success">$${puntos(venta.total.toFixed(2))}</span>
                        </div>
                    </div>
                </div>

                <!-- Métodos de pago -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0">💳 Métodos de Pago Utilizados</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-unstyled mb-0">
                                    ${desgloseHTML}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabla de productos -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">🛍️ Productos Vendidos</h6>
                                <span class="badge bg-light text-dark">${venta.productos.length} productos</span>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover table-striped mb-0">
                                        <thead class="table-dark text-dark">
                                            <tr>
                                                <th class="text-center">ID</th>
                                                <th>Producto</th>
                                                <th class="text-center">Cantidad</th>
                                                <th class="text-end">Precio Unit.</th>
                                                <th class="text-end">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${productosHTML}
                                        </tbody>
                                        <tfoot class="table-light">
                                            <tr>
                                                <td colspan="4" class="text-end fw-bold">Total Final:</td>
                                                <td class="text-end fw-bold fs-5 text-success">$${puntos(venta.total.toFixed(2))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .modal-dialog { max-width: 900px; }
                .modal-scrollable-content {
                    max-height: 80vh;
                    overflow-y: scroll;
                    overflow-x: hidden;
                    padding-right: 10px;
                }
                                .card { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .table th { font-weight: 600; }
                .badge { font-size: 0.85em; }
                .alert-success { border-left: 4px solid #28a745; }
            </style>
        `;

        mostrarModal('📋 Detalle de Venta', contenido);

    } catch (error) {
        console.error("Error mostrando detalle de venta:", error);
        mostrarModal('❌ Error', `
            <div class="alert alert-danger">
                <h6>⚠️ Error al cargar la información</h6>
                <p class="mb-0">No se pudo cargar la información de la venta. Por favor, intenta nuevamente.</p>
            </div>
        `);
    }
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
async function imprimirTicket(id) {
    const venta = await obtenerDatosJSONVentasPorID(id);
    console.log(venta)
    if (!venta || !venta.productos) {
        alert('❌ Venta no encontrada o sin productos');
        return;
    }

    const fecha = venta.fecha;
    const cliente = venta.cliente || 'Consumidor Final';
    const vendedor = venta.vendedor || 'N/D';
    const productos = venta.productos;
    const desglose = venta.desglose_pagos || {};

    let productosTexto = productos.map(p => {
        const total = p.cantidad * p.precio_unitario;
        return `${p.nombre}\n  ${p.cantidad} x $${puntos(p.precio_unitario.toFixed(2))}  =  $${puntos(total.toFixed(2))}`;
    }).join('\n');

    let pagoTexto = Object.entries(desglose).map(
        ([metodo, monto]) => `${metodo}: $${puntos(monto.toFixed(2))}`
    ).join('\n');

    const totalVenta = productos.reduce((sum, p) => sum + p.precio_unitario * p.cantidad, 0);
    const impuestos = venta.impuestos || 0;
    const descuento = venta.descuento || 0;
    const totalFinal = totalVenta + impuestos - descuento;

    const ticket = `
<html>
<head>
  <title>Ticket ${venta.id}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }

      body {
        margin: 0;
        font-family: monospace;
        font-size: 11px;
        white-space: pre;
      }

      pre {
        margin: 0;
        padding: 5px 10px;
      }
    }

    body {
      font-family: monospace;
      font-size: 11px;
      white-space: pre;
    }

    pre {
      margin: 0;
      padding: 5px 10px;
    }
  </style>
</head>
<body>
<pre>
    *** TICKET DE VENTA ***
-------------------------------
Venta ID: ${venta.id}
Fecha: ${fecha}
Cliente: ${cliente}
Vendedor: ${vendedor}
-------------------------------
Productos:
${productosTexto}
-------------------------------
Subtotal:       $${puntos(totalVenta.toFixed(2))}
Descuento:      $${puntos(descuento.toFixed(2))}
IVA:            $${puntos(impuestos.toFixed(2))}
-------------------------------
TOTAL:          $${puntos(totalFinal.toFixed(2))}

Métodos de Pago:
${pagoTexto}
-------------------------------
Gracias por su compra
</pre>
</body>
</html>
`;

    const ventana = window.open('', ''); // ancho aproximado de 80mm en píxeles
    ventana.document.write(ticket);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
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
            <p><strong>Total:</strong> $${puntos(parseFloat(registro.total))}</p>
            <hr>
            <p>Documento generado para impresión.</p>
        </body>
        </html>
    `;

    const ventanaImpresion = window.open('', '');
    ventanaImpresion.document.write(contenido);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
    ventanaImpresion.close();
}


async function cargarFiltrosVentas() {
    const rol = datos.rol;  // Asegúrate de tener `datos` disponible
    const contenedorFiltro = document.getElementById("filtroFechaVentas");

    // Crear select
    const selectRango = document.createElement("select");
    selectRango.className = "form-select form-select-sm";
    selectRango.id = "selectRangoVentas";

    // Crear inputs de fecha (inicio y fin)
    const inputInicio = document.createElement("input");
    inputInicio.type = "date";
    inputInicio.className = "form-control form-control-sm d-none";
    inputInicio.id = "inputFechaPersonalizada";

    const inputFin = document.createElement("input");
    inputFin.type = "date";
    inputFin.className = "form-control form-control-sm d-none";
    inputFin.id = "inputFechaFinPersonalizada";

    // Escuchar cambios en fechas personalizadas
    [inputInicio, inputFin].forEach(input => {
        input.addEventListener("change", async () => {
            if (selectRango.value === "personalizada" && inputInicio.value && inputFin.value) {
                const fechaInicio = new Date(inputInicio.value);
                const fechaFin = new Date(inputFin.value);

                if (fechaInicio > fechaFin) {
                    alert("La fecha de inicio no puede ser mayor que la fecha de fin.");
                    return;
                }

                await actualizarDatosVentas();  // Solo se llama si la validación es correcta
                await actualizarDatosResumen();
            }
        });
    });

    // Definir opciones según rol
    let opciones = [];
    if (rol === "ventas") {
        opciones = ["Hoy", "Última semana"];
    } else {
        opciones = ["Hoy", "Última semana", "Mes actual", "Personalizada"];
    }

    opciones.forEach(opcion => {
        const opt = document.createElement("option");
        opt.value = opcion.toLowerCase().replace(/\s+/g, "_");
        opt.textContent = opcion;
        selectRango.appendChild(opt);
    });

    // Manejar cambio en el select
    selectRango.addEventListener("change", async () => {
        const esPersonalizada = selectRango.value === "personalizada";

        inputInicio.classList.toggle("d-none", !esPersonalizada);
        inputFin.classList.toggle("d-none", !esPersonalizada);

        if (!esPersonalizada) {
            inputInicio.value = "";
            inputFin.value = "";

        }

        await actualizarDatosVentas();  // Solo se llama si la validación es correcta
        await actualizarDatosResumen();
    });

    // Agregar al DOM
    contenedorFiltro.innerHTML = ""; // Limpia contenido anterior si se recarga
    contenedorFiltro.appendChild(selectRango);
    contenedorFiltro.appendChild(inputInicio);
    contenedorFiltro.appendChild(inputFin);
}
