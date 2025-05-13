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
            labels: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otros'],
            datasets: [{
                data: [0, 0, 0, 0],
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
    // Simular carga de datos desde API
    setTimeout(() => {
        // Actualizar resumen de ventas
        const resumenVentas = document.getElementById('resumenVentas');
        resumenVentas.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <div class="stat-card">
                    <h3>Total Ventas</h3>
                    <p>$15,450.00</p>
                </div>
                <div class="stat-card">
                    <h3>Transacciones</h3>
                    <p>42</p>
                </div>
                <div class="stat-card">
                    <h3>Ticket Promedio</h3>
                    <p>$367.86</p>
                </div>
            </div>
        `;
        
        // Actualizar gráfico de ventas
        ventasChart.data.datasets[0].data = [8500, 4200, 2300, 450];
        ventasChart.update();
        
        // Actualizar tabla de ventas
        const cuerpoTablaVentas = document.getElementById('cuerpoTablaVentas');
        cuerpoTablaVentas.innerHTML = generarFilasTablaVentas();
    }, 500);
}

function generarFilasTablaVentas() {
    // Datos de ejemplo para ventas
    const ventas = [
        { id: 'V-001', fecha: '12/05/2025 10:15', total: '$450.00', metodos: 'Efectivo', acciones: '' },
        { id: 'V-002', fecha: '12/05/2025 11:30', total: '$1,250.00', metodos: 'Tarjeta', acciones: '' },
        { id: 'V-003', fecha: '12/05/2025 12:45', total: '$320.00', metodos: 'Efectivo', acciones: '' },
        { id: 'V-004', fecha: '12/05/2025 13:20', total: '$780.00', metodos: 'Transferencia', acciones: '' },
        { id: 'V-005', fecha: '12/05/2025 14:05', total: '$150.00', metodos: 'Efectivo', acciones: '' }
    ];
    
    let html = '';
    ventas.forEach(venta => {
        html += `
            <tr>
                <td>${venta.id}</td>
                <td>${venta.fecha}</td>
                <td>${venta.total}</td>
                <td>${venta.metodos}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="verDetalle('${venta.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="imprimirTicket('${venta.id}')">
                        <i class="bi bi-printer"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    return html;
}

// ==================== PESTAÑA SERVICIOS ====================

function inicializarPestanaServicios() {
    // Crear gráfico de servicios
    const ctxServicios = document.getElementById('graficoServicios').getContext('2d');
    serviciosChart = new Chart(ctxServicios, {
        type: 'pie',
        data: {
            labels: ['Pendientes', 'En Proceso', 'Listos para Entrega', 'Entregados'],
            datasets: [{
                data: [0, 0, 0, 0],
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
    // Simular carga de datos desde API
    setTimeout(() => {
        // Actualizar contadores
        document.getElementById('totalServicios').textContent = '18';
        document.getElementById('enProcesoServicios').textContent = '12';
        document.getElementById('listosServicios').textContent = '6';
        
        // Actualizar gráfico de servicios
        serviciosChart.data.datasets[0].data = [5, 7, 6, 8];
        serviciosChart.update();
        
        // Actualizar tabla de servicios
        const cuerpoTablaServicios = document.getElementById('cuerpoTablaServicios');
        cuerpoTablaServicios.innerHTML = generarFilasTablaServicios();
    }, 500);
}

function generarFilasTablaServicios() {
    // Datos de ejemplo para servicios
    const servicios = [
        { id: 'S-001', cliente: 'Juan Pérez', descripcion: 'Reparación de pantalla', fecha: '10/05/2025', estado: 'En Proceso', acciones: '' },
        { id: 'S-002', cliente: 'María López', descripcion: 'Cambio de batería', fecha: '11/05/2025', estado: 'Pendiente', acciones: '' },
        { id: 'S-003', cliente: 'Carlos Gómez', descripcion: 'Actualización de software', fecha: '11/05/2025', estado: 'Listo', acciones: '' },
        { id: 'S-004', cliente: 'Ana Martínez', descripcion: 'Limpieza de hardware', fecha: '12/05/2025', estado: 'Pendiente', acciones: '' },
        { id: 'S-005', cliente: 'Luis Rodríguez', descripcion: 'Recuperación de datos', fecha: '12/05/2025', estado: 'En Proceso', acciones: '' }
    ];
    
    let html = '';
    servicios.forEach(servicio => {
        const estadoClase = getEstadoClase(servicio.estado);
        html += `
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
    });
    
    return html;
}

function getEstadoClase(estado) {
    switch(estado.toLowerCase()) {
        case 'pendiente': return 'bg-warning text-dark';
        case 'en proceso': return 'bg-info text-dark';
        case 'listo': return 'bg-success';
        case 'entregado': return 'bg-secondary';
        default: return 'bg-light text-dark';
    }
}

// ==================== PESTAÑA RESUMEN ====================

function inicializarPestanaResumen() {
    // Crear gráfico de ventas por categoría
    const ctxVentasCategoria = document.getElementById('graficoVentasCategoria').getContext('2d');
    ventasCategoriaChart = new Chart(ctxVentasCategoria, {
        type: 'bar',
        data: {
            labels: ['Electrónicos', 'Accesorios', 'Servicios', 'Otros'],
            datasets: [{
                label: 'Ventas por Categoría',
                data: [0, 0, 0, 0],
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Crear gráfico de servicios por tipo
    const ctxServiciosTipo = document.getElementById('graficoServiciosTipo').getContext('2d');
    serviciosTipoChart = new Chart(ctxServiciosTipo, {
        type: 'bar',
        data: {
            labels: ['Reparación', 'Mantenimiento', 'Instalación', 'Asesoría'],
            datasets: [{
                label: 'Servicios por Tipo',
                data: [0, 0, 0, 0],
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Cargar datos iniciales
    actualizarDatosResumen();
}

function actualizarDatosResumen() {
    // Simular carga de datos desde API
    setTimeout(() => {
        // Actualizar contadores de resumen
        document.getElementById('totalVentasResumen').textContent = '$15,450.00';
        document.getElementById('totalServiciosResumen').textContent = '18';
        document.getElementById('totalProductosResumen').textContent = '156';
        document.getElementById('totalClientesResumen').textContent = '45';
        
        // Actualizar gráfico de ventas por categoría
        ventasCategoriaChart.data.datasets[0].data = [6500, 4200, 3800, 950];
        ventasCategoriaChart.update();
        
        // Actualizar gráfico de servicios por tipo
        serviciosTipoChart.data.datasets[0].data = [8, 5, 3, 2];
        serviciosTipoChart.update();
    }, 500);
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
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    // Simular carga de datos desde API
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
    
    setTimeout(() => {
        cuerpoTablaHistorial.innerHTML = generarFilasTablaHistorial(tipoRegistro);
    }, 800);
}

function generarFilasTablaHistorial(tipo) {
    // Datos de ejemplo para historial
    const registros = [];
    
    if (tipo === 'todos' || tipo === 'ventas') {
        registros.push(
            { id: 'V-001', tipo: 'Venta', fecha: '12/05/2025 10:15', descripcion: 'Venta de productos', total: '$450.00', acciones: '' },
            { id: 'V-002', tipo: 'Venta', fecha: '12/05/2025 11:30', descripcion: 'Venta de productos', total: '$1,250.00', acciones: '' },
            { id: 'V-003', tipo: 'Venta', fecha: '11/05/2025 12:45', descripcion: 'Venta de productos', total: '$320.00', acciones: '' }
        );
    }
    
    if (tipo === 'todos' || tipo === 'servicios') {
        registros.push(
            { id: 'S-001', tipo: 'Servicio', fecha: '10/05/2025 09:30', descripcion: 'Reparación de pantalla', total: '$850.00', acciones: '' },
            { id: 'S-002', tipo: 'Servicio', fecha: '11/05/2025 14:20', descripcion: 'Cambio de batería', total: '$350.00', acciones: '' },
            { id: 'S-003', tipo: 'Servicio', fecha: '11/05/2025 16:15', descripcion: 'Actualización de software', total: '$200.00', acciones: '' }
        );
    }
    
    if (registros.length === 0) {
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
                <td>${registro.total}</td>
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
                y: {
                    beginAtZero: true
                }
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
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Cargar datos iniciales
    actualizarEstadisticas();
}

function actualizarEstadisticas() {
    // Simular carga de datos desde API según el período seleccionado
    let etiquetas, datosVentas, datosServicios;
    
    switch(periodoActual) {
        case 'semana':
            etiquetas = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            datosVentas = [1200, 1800, 1500, 2200, 1900, 2500, 1600];
            datosServicios = [3, 5, 2, 4, 3, 6, 2];
            break;
        case 'mes':
            etiquetas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
            datosVentas = [8500, 9200, 10500, 11800];
            datosServicios = [12, 15, 18, 20];
            break;
        case 'trimestre':
            etiquetas = ['Enero', 'Febrero', 'Marzo'];
            datosVentas = [28500, 32200, 35500];
            datosServicios = [45, 52, 58];
            break;
        case 'anio':
            etiquetas = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            datosVentas = [28500, 32200, 35500, 30800, 33500, 36200, 34500, 38000, 42500, 40000, 45000, 48000];
            datosServicios = [45, 52, 58, 48, 55, 60, 57, 63, 70, 68, 75, 80];
            break;
    }
    
    // Actualizar gráfico de ventas por período
    ventasPeriodoChart.data.labels = etiquetas;
    ventasPeriodoChart.data.datasets[0].data = datosVentas;
    ventasPeriodoChart.update();
    
    // Actualizar gráfico de servicios por período
    serviciosPeriodoChart.data.labels = etiquetas;
    serviciosPeriodoChart.data.datasets[0].data = datosServicios;
    serviciosPeriodoChart.update();
    
    // Actualizar KPIs
    document.getElementById('ticketPromedio').textContent = '$367.86';
    document.getElementById('ventasDiarias').textContent = '42';
    document.getElementById('serviciosCompletados').textContent = '18';
    document.getElementById('tasaConversion').textContent = '68%';
}

// ==================== FUNCIONES AUXILIARES ====================

// Función para ver detalle de ventas
function verDetalle(id) {
    alert(`Ver detalle de venta ${id}`);
}

// Función para imprimir ticket
function imprimirTicket(id) {
    alert(`Imprimir ticket de venta ${id}`);
}

// Función para ver detalle de servicio
function verDetalleServicio(id) {
    alert(`Ver detalle de servicio ${id}`);
}

// Función para actualizar estado de servicio
function actualizarEstadoServicio(id) {
    alert(`Actualizar estado de servicio ${id}`);
}

// Función para ver detalle de historial
function verDetalleHistorial(id) {
    alert(`Ver detalle de registro ${id}`);
}

// Función para imprimir historial
function imprimirHistorial(id) {
    alert(`Imprimir registro ${id}`);
}
