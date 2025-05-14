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
        { id: 'V-005', fecha: '12/05/2025 14:05', total: '$150.00', metodos: 'Efectivo', acciones: '' },
        { id: 'V-001', fecha: '12/05/2025 10:15', total: '$450.00', metodos: 'Efectivo', acciones: '' },
        { id: 'V-002', fecha: '12/05/2025 11:30', total: '$1,250.00', metodos: 'Tarjeta', acciones: '' },
        { id: 'V-003', fecha: '12/05/2025 12:45', total: '$320.00', metodos: 'Efectivo', acciones: '' },
        { id: 'V-004', fecha: '12/05/2025 13:20', total: '$780.00', metodos: 'Transferencia', acciones: '' },
        { id: 'V-005', fecha: '12/05/2025 14:05', total: '$150.00', metodos: 'Efectivo', acciones: '' },
        { id: 'V-001', fecha: '12/05/2025 10:15', total: '$450.00', metodos: 'Efectivo', acciones: '' },
        { id: 'V-002', fecha: '12/05/2025 11:30', total: '$1,250.00', metodos: 'Tarjeta', acciones: '' },
        { id: 'V-003', fecha: '12/05/2025 12:45', total: '$320.00', metodos: 'Efectivo', acciones: '' },
        { id: 'V-004', fecha: '12/05/2025 13:20', total: '$780.00', metodos: 'Transferencia', acciones: '' },
        { id: 'V-005', fecha: '12/05/2025 14:05', total: '$150.00', metodos: 'Efectivo', acciones: '' },
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
        { id: 'S-005', cliente: 'Luis Rodríguez', descripcion: 'Recuperación de datos', fecha: '12/05/2025', estado: 'En Proceso', acciones: '' },
        { id: 'S-001', cliente: 'Juan Pérez', descripcion: 'Reparación de pantalla', fecha: '10/05/2025', estado: 'En Proceso', acciones: '' },
        { id: 'S-002', cliente: 'María López', descripcion: 'Cambio de batería', fecha: '11/05/2025', estado: 'Pendiente', acciones: '' },
        { id: 'S-003', cliente: 'Carlos Gómez', descripcion: 'Actualización de software', fecha: '11/05/2025', estado: 'Listo', acciones: '' },
        { id: 'S-004', cliente: 'Ana Martínez', descripcion: 'Limpieza de hardware', fecha: '12/05/2025', estado: 'Pendiente', acciones: '' },
        { id: 'S-005', cliente: 'Luis Rodríguez', descripcion: 'Recuperación de datos', fecha: '12/05/2025', estado: 'En Proceso', acciones: '' },
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
    const fechaInicioStr = document.getElementById('fechaInicio').value;
    const fechaFinStr = document.getElementById('fechaFin').value;

    if (!fechaInicioStr || !fechaFinStr) {
        alert('Por favor, seleccione ambas fechas de inicio y fin.');
        return;
    }

    function crearFechaLocal(fechaStr) {
        const [anio, mes, dia] = fechaStr.split('-');
        return new Date(anio, mes - 1, dia);
    }

    const fechaInicio = crearFechaLocal(fechaInicioStr);
    const fechaFin = crearFechaLocal(fechaFinStr);
    fechaFin.setHours(23, 59, 59, 999); // incluir todo el día

    // Datos de ejemplo para historial
    const registros = [];

    if (tipoRegistro === 'todos' || tipoRegistro === 'ventas') {
        registros.push(
            { id: 'V-001', tipo: 'Venta', fecha: '12/05/2025 10:15', descripcion: 'Venta de productos', total: '$450.00' },
            { id: 'V-002', tipo: 'Venta', fecha: '12/05/2025 11:30', descripcion: 'Venta de productos', total: '$1,250.00' },
            { id: 'V-003', tipo: 'Venta', fecha: '11/05/2025 12:45', descripcion: 'Venta de productos', total: '$320.00' }
        );
    }

    if (tipoRegistro === 'todos' || tipoRegistro === 'servicios') {
        registros.push(
            { id: 'S-001', tipo: 'Servicio', fecha: '10/05/2025 09:30', descripcion: 'Reparación de pantalla', total: '$850.00' },
            { id: 'S-002', tipo: 'Servicio', fecha: '11/05/2025 14:20', descripcion: 'Cambio de batería', total: '$350.00' },
            { id: 'S-003', tipo: 'Servicio', fecha: '11/05/2025 16:15', descripcion: 'Actualización de software', total: '$200.00' }
        );
    }

    function parseFecha(fechaStr) {
        const [fechaPart, horaPart] = fechaStr.split(' ');
        const [dia, mes, anio] = fechaPart.split('/');
        const [hora, minutos] = horaPart.split(':');
        return new Date(anio, mes - 1, dia, hora, minutos);
    }

    const registrosFiltrados = registros.filter(registro => {
        const fechaRegistro = parseFecha(registro.fecha);
        return fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
    });

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
        if (registrosFiltrados.length === 0) {
            cuerpoTablaHistorial.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron registros</td></tr>`;
            return;
        }

        cuerpoTablaHistorial.innerHTML = generarFilasTablaHistorial(registrosFiltrados);
    }, 800);
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

// Crear modal simple para mostrar detalles
function mostrarModal(titulo, contenido) {
    // Verificar si ya existe el modal
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
    // Insertar título y contenido antes del botón cerrar
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
    // Aquí puedes cargar datos reales, por ahora simulo contenido
    const contenido = `<p>Detalles de la venta con ID: <strong>${id}</strong></p>
                       <p>Fecha: 12/05/2025 10:15</p>
                       <p>Total: $450.00</p>
                       <p>Método de Pago: Efectivo</p>`;
    mostrarModal('Detalle de Venta', contenido);
}

// Función para imprimir ticket de venta (abre ventana nueva con contenido para imprimir)
function imprimirTicket(id) {
    // Generar contenido HTML para impresión (simulado)
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
            <p><strong>Fecha:</strong> 12/05/2025 10:15</p>
            <p><strong>Total:</strong> $450.00</p>
            <p><strong>Método de Pago:</strong> Efectivo</p>
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
}

// Función para ver detalle de servicio
function verDetalleServicio(id) {
    const contenido = `<p>Detalles del servicio con ID: <strong>${id}</strong></p>
                       <p>Cliente: Juan Pérez</p>
                       <p>Descripción: Reparación de pantalla</p>
                       <p>Estado: En Proceso</p>`;
    mostrarModal('Detalle de Servicio', contenido);
}

// Función para actualizar estado de servicio
function actualizarEstadoServicio(id) {
    if (confirm(`¿Desea actualizar el estado del servicio ${id}?`)) {
        // Simular actualización del estado en datos (puedes adaptar según tu backend)
        // Para ejemplo, vamos a cambiar el estado en la tabla a "Listo" o "Entregado" de forma cíclica

        // Buscar fila en la tabla
        const filas = document.querySelectorAll('#cuerpoTablaServicios tr');
        filas.forEach(fila => {
            const celdaId = fila.children[0].textContent;
            if (celdaId === id) {
                const celdaEstado = fila.children[4];
                const estadoActual = celdaEstado.textContent.trim().toLowerCase();
                let nuevoEstado = 'pendiente';

                if (estadoActual === 'pendiente') nuevoEstado = 'en proceso';
                else if (estadoActual === 'en proceso') nuevoEstado = 'listo';
                else if (estadoActual === 'listo') nuevoEstado = 'entregado';
                else if (estadoActual === 'entregado') nuevoEstado = 'pendiente';

                // Actualizar badge y texto
                celdaEstado.innerHTML = `<span class="badge ${getEstadoClase(nuevoEstado)}">${nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1)}</span>`;
            }
        });

        alert(`Estado del servicio ${id} actualizado.`);
    }
}

// Función para ver detalle de historial
function verDetalleHistorial(id) {
    const contenido = `<p>Detalles del registro con ID: <strong>${id}</strong></p>
                       <p>Descripción detallada del registro histórico.</p>`;
    mostrarModal('Detalle de Historial', contenido);
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