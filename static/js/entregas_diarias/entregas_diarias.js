// Variables globales
let tiposPago = [];
let entregasChart = null;
let periodoActual = 'semana';

document.addEventListener('DOMContentLoaded', function () {
    // Establecer fecha actual en el input de fecha
    document.getElementById('fechaInput').valueAsDate = new Date();

    // Cargar tipos de pago disponibles
    cargarTiposPago();

    // Manejar envío del formulario
    document.getElementById('entregaForm').addEventListener('submit', function (e) {
        e.preventDefault();
        enviarEntrega();
    });

    // Botón cancelar
    document.getElementById('cancelarBtn').addEventListener('click', function () {
        limpiarFormulario();
    });

    // Manejar cambio de período para estadísticas
    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Remover clase activa de todos los botones
            document.querySelectorAll('.periodo-btn').forEach(b => {
                b.classList.remove('active');
            });

            // Agregar clase activa al botón clickeado
            this.classList.add('active');

            // Actualizar gráfico con el período seleccionado
            periodoActual = this.getAttribute('data-periodo');
            cargarEstadisticas(periodoActual);
        });
    });
});

// Modificar la parte del evento change del select en la función generarCamposTiposPago()
document.getElementById('otrosTiposPagoSelect').addEventListener('change', function () {
    const tipoPago = this.value;
    if (!tipoPago) return;

    const tipoSeleccionado = tiposSelect.find(t => t.nombre === tipoPago);
    if (!tipoSeleccionado) return;

    // Verificar si ya existe un campo para este tipo
    const existente = document.querySelector(`[data-tipo="${tipoPago}"]`);
    if (existente) {
        existente.focus();
        return;
    }

    // Crear campo para el tipo seleccionado
    const otrosContainer = document.getElementById('otrosTiposPagoContainer');
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group mb-2';

    // Agregamos una etiqueta clara con el nombre del tipo de pago
    inputGroup.innerHTML = `
        <span class="input-group-text tipo-pago-label" style="min-width: 120px; justify-content: left;">
            <i class="fas fa-${tipoSeleccionado.icono || 'money-bill'} me-2"></i>
            ${tipoPago}
        </span>
        <input type="number" class="form-control tipo-pago-input" 
               data-tipo="${tipoPago}" placeholder="0" min="0" step="1000">
        <button class="btn btn-outline-danger" type="button">
            <i class="fas fa-times"></i>
        </button>
    `;

    otrosContainer.appendChild(inputGroup);

    // Agregar evento al botón de eliminar
    inputGroup.querySelector('button').addEventListener('click', function () {
        inputGroup.remove();
        actualizarTotal();
    });

    // Agregar evento para actualizar total
    inputGroup.querySelector('input').addEventListener('input', actualizarTotal);

    // Enfocar el nuevo campo
    inputGroup.querySelector('input').focus();

    // Resetear el select
    document.getElementById('otrosTiposPagoSelect').value = '';
});


// Función para cargar tipos de pago desde la API
function cargarTiposPago() {
    mostrarCargando(true);

    fetch('/api/tipos_pago')
        .then(response => response.json())
        .then(data => {
            mostrarCargando(false);

            // Asegúrate de que data sea un array
            if (Array.isArray(data)) {
                tiposPago = data;

                // Generar campos de entrada para cada tipo de pago
                generarCamposTiposPago();

                // Generar encabezados de tabla para historial
                generarEncabezadosTabla();

                // Cargar historial de entregas
                cargarHistorialEntregas();

                // Cargar estadísticas
                cargarEstadisticas(periodoActual);
            } else {
                console.error('La respuesta no es un array:', data);
                mostrarAlerta('Error al cargar tipos de pago', 'error');
            }
        })
        .catch(error => {
            mostrarCargando(false);
            console.error('Error al cargar tipos de pago:', error);
            mostrarAlerta('Error de conexión al servidor', 'error');
        });
}

// Función para generar campos de entrada para cada tipo de pago
function generarCamposTiposPago() {
    const container = document.getElementById('tiposPagoContainer');
    container.innerHTML = '';

    // Separar tipos de pago que se muestran directamente y los que van en el select
    const tiposDirectos = tiposPago.filter(tipo => tipo.mostrar_directo);
    const tiposSelect = tiposPago.filter(tipo => !tipo.mostrar_directo);

    // Modificar la parte que genera los campos para tipos directos en generarCamposTiposPago()
    tiposDirectos.forEach(tipo => {
        const inputId = `${tipo.nombre.toLowerCase().replace(/\s+/g, '')}Input`;

        const card = document.createElement('div');
        card.className = 'stat-card';

        let icono = tipo.icono || 'money-bill';

        card.innerHTML = `
        <div class="mb-3">
            <label class="form-label text-white">
                <i class="fas fa-${icono} me-2"></i>${tipo.nombre}
            </label>
            <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" class="form-control tipo-pago-input" id="${inputId}" 
                       data-tipo="${tipo.nombre}" placeholder="0" min="0" step="1000">
            </div>
        </div>
    `;

        container.appendChild(card);
    });


    // Si hay tipos para el select, agregarlo
    if (tiposSelect.length > 0) {
        const selectCard = document.createElement('div');
        selectCard.className = 'stat-card';

        // Crear el select
        let selectHtml = `
            <div class="mb-3">
                <label class="form-label text-white">Otros medios de pago</label>
                <div class="input-group mb-2">
                    <span class="input-group-text">
                        <i class="fas fa-list"></i>
                    </span>
                    <select class="form-select" id="otrosTiposPagoSelect">
                        <option value="" selected disabled>Seleccione un medio de pago</option>
        `;

        // Agregar opciones al select
        tiposSelect.forEach(tipo => {
            selectHtml += `<option value="${tipo.nombre}" data-icono="${tipo.icono || 'money-bill'}">${tipo.nombre}</option>`;
        });

        selectHtml += `
                    </select>
                </div>
                
                <div id="otrosTiposPagoContainer">
                    <!-- Aquí se agregarán dinámicamente los campos para los otros tipos de pago -->
                </div>
            </div>
        `;

        selectCard.innerHTML = selectHtml;
        container.appendChild(selectCard);

        // Agregar evento al select
        setTimeout(() => {
            document.getElementById('otrosTiposPagoSelect').addEventListener('change', function () {
                const tipoPago = this.value;
                if (!tipoPago) return;

                const tipoSeleccionado = tiposSelect.find(t => t.nombre === tipoPago);
                if (!tipoSeleccionado) return;

                // Verificar si ya existe un campo para este tipo
                const existente = document.querySelector(`[data-tipo="${tipoPago}"]`);
                if (existente) {
                    existente.focus();
                    return;
                }

                // Crear campo para el tipo seleccionado
                const otrosContainer = document.getElementById('otrosTiposPagoContainer');
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group mb-2';
                inputGroup.innerHTML = `
                    <span class="input-group-text">
                        <i class="fas fa-${tipoSeleccionado.icono || 'money-bill'}"></i>
                    </span>
                    <input type="number" class="form-control tipo-pago-input" 
                           data-tipo="${tipoPago}" placeholder="0" min="0" step="1000">
                    <button class="btn btn-outline-danger" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                otrosContainer.appendChild(inputGroup);

                // Agregar evento al botón de eliminar
                inputGroup.querySelector('button').addEventListener('click', function () {
                    inputGroup.remove();
                    actualizarTotal();
                });

                // Agregar evento para actualizar total
                inputGroup.querySelector('input').addEventListener('input', actualizarTotal);

                // Enfocar el nuevo campo
                inputGroup.querySelector('input').focus();

                // Resetear el select
                document.getElementById('otrosTiposPagoSelect').value = '';
            });
        }, 100);
    }

    // Agregar evento para actualizar total cuando cambian los valores
    document.querySelectorAll('.tipo-pago-input').forEach(input => {
        input.addEventListener('input', actualizarTotal);
    });
}


// Función para generar encabezados de tabla para historial
function generarEncabezadosTabla() {
    const thead = document.getElementById('historialHeader');
    thead.innerHTML = '<tr><th>Fecha</th><th>Responsable</th>';

    // Agregar una columna para cada tipo de pago
    tiposPago.forEach(tipo => {
        thead.innerHTML += `<th>${tipo.nombre}</th>`;
    });

    thead.innerHTML += '<th>Total</th><th>Acciones</th></tr>';
}

// Función para actualizar el total
function actualizarTotal() {
    let total = 0;
    const desglose = {};

    // Recorrer todos los inputs de tipo de pago
    document.querySelectorAll('.tipo-pago-input').forEach(input => {
        const valor = parseFloat(input.value || 0);
        const tipoPago = input.getAttribute('data-tipo');

        if (valor > 0) {
            total += valor;
            desglose[tipoPago] = valor;
        }
    });

    // Actualizar el total
    document.getElementById('totalValor').textContent = formatearMoneda(total);

    // Actualizar el desglose
    const desgloseContainer = document.getElementById('desgloseTotal');
    desgloseContainer.innerHTML = '';

    // Solo mostrar tipos de pago con valores mayores a cero
    Object.entries(desglose).forEach(([tipo, valor]) => {
        if (valor > 0) {
            const item = document.createElement('div');
            item.className = 'desglose-item';

            // Buscar el icono del tipo de pago
            const tipoPagoObj = tiposPago.find(t => t.nombre === tipo);
            const icono = tipoPagoObj ? tipoPagoObj.icono || 'money-bill' : 'money-bill';

            item.innerHTML = `
                <span><i class="fas fa-${icono} me-2"></i>${tipo}:</span>
                <span>${formatearMoneda(valor)}</span>
            `;

            desgloseContainer.appendChild(item);
        }
    });

    // Si no hay valores, mostrar un mensaje
    if (Object.keys(desglose).length === 0) {
        desgloseContainer.innerHTML = '<div class="text-muted">No hay valores ingresados</div>';
    }
}


// Función para formatear moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

// Función para mostrar/ocultar overlay de carga
function mostrarCargando(mostrar = true) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (mostrar) {
        loadingOverlay.style.display = 'flex';
    } else {
        loadingOverlay.style.display = 'none';
    }
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'success') {
    Swal.fire({
        icon: tipo,
        title: tipo === 'success' ? '¡Éxito!' : 'Error',
        text: mensaje,
        timer: tipo === 'success' ? 2000 : undefined,
        showConfirmButton: tipo !== 'success'
    });
}

// Función para limpiar el formulario
function limpiarFormulario() {
    document.querySelectorAll('.tipo-pago-input').forEach(input => {
        input.value = '';
    });

    document.getElementById('observacionesInput').value = '';
    document.getElementById('responsableInput').value = '';
    document.getElementById('fechaInput').valueAsDate = new Date();
    actualizarTotal();
}

// Función para enviar entrega
function enviarEntrega() {
    // Validar formulario
    const formulario = document.getElementById('entregaForm');
    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    // Mostrar cargando
    mostrarCargando(true);

    // Recopilar datos del formulario
    const datos = {
        fecha: document.getElementById('fechaInput').value,
        responsable: document.getElementById('responsableInput').value,
        observaciones: document.getElementById('observacionesInput').value,
        valores: {}
    };

    // Agregar valores de cada tipo de pago (tanto directos como del select)
    document.querySelectorAll('.tipo-pago-input').forEach(input => {
        const tipoPago = input.getAttribute('data-tipo');
        const valor = parseFloat(input.value || 0);
        if (valor > 0) {
            datos.valores[tipoPago] = valor;
        }
    });

    // Validar que haya al menos un valor
    if (Object.keys(datos.valores).length === 0) {
        mostrarCargando(false);
        mostrarAlerta('Debe ingresar al menos un valor', 'error');
        return;
    }

    // Enviar datos a la API
    fetch('/api/entregas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos)
    })
        .then(response => response.json())
        .then(data => {
            mostrarCargando(false);

            if (data.error) {
                mostrarAlerta(data.mensaje || 'Error al registrar la entrega', 'error');
            } else {
                mostrarAlerta('Entrega registrada correctamente');

                // Limpiar formulario
                limpiarFormulario();

                // Recargar historial y estadísticas
                cargarHistorialEntregas();
                cargarEstadisticas(periodoActual);
            }
        })
        .catch(error => {
            mostrarCargando(false);
            console.error('Error:', error);
            mostrarAlerta('Error de conexión al servidor', 'error');
        });
}


// Función para cargar el historial de entregas
function cargarHistorialEntregas() {
    fetch('/api/entregas?limit=10')
        .then(response => response.json())
        .then(data => {
            const historialContainer = document.getElementById('historialContainer');
            historialContainer.innerHTML = '';
            
            if (!data.entregas || data.entregas.length === 0) {
                historialContainer.innerHTML = '<div class="alert alert-info">No hay entregas registradas</div>';
                return;
            }
            
            data.entregas.forEach(entrega => {
                const card = document.createElement('div');
                card.className = 'historial-card';
                
                // Formatear fecha
                const fecha = new Date(entrega.fecha);
                const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                // Crear contenido de la tarjeta
                let cardContent = `
                    <div class="historial-header">
                        <div class="historial-fecha">${fechaFormateada}</div>
                        <div class="historial-responsable">${entrega.responsable}</div>
                    </div>
                `;
                
                // Agregar valores (solo los que tienen valor)
                let valoresHTML = '<div class="historial-valores">';
                let hayValores = false;
                
                for (const [tipo, valor] of Object.entries(entrega.valores)) {
                    if (valor > 0) {
                        hayValores = true;
                        // Buscar el icono del tipo de pago
                        const tipoPagoObj = tiposPago.find(t => t.nombre === tipo);
                        const icono = tipoPagoObj ? tipoPagoObj.icono || 'money-bill' : 'money-bill';
                        
                        valoresHTML += `
                            <div class="valor-item">
                                <span><i class="fas fa-${icono} me-1"></i> ${tipo}:</span>
                                <span>${formatearMoneda(valor)}</span>
                            </div>
                        `;
                    }
                }
                
                if (!hayValores) {
                    valoresHTML += '<div class="text-muted">No hay valores registrados</div>';
                }
                
                valoresHTML += '</div>';
                cardContent += valoresHTML;
                
                // Agregar observaciones si existen
                if (entrega.observaciones) {
                    cardContent += `
                        <div class="historial-observaciones">
                            <i class="fas fa-comment-alt me-1"></i> ${entrega.observaciones}
                        </div>
                    `;
                }
                
                card.innerHTML = cardContent;
                historialContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('historialContainer').innerHTML = 
                '<div class="alert alert-danger">Error al cargar el historial</div>';
        });
}



// Función para mostrar detalle de una entrega
function mostrarDetalleEntrega(id) {
    mostrarCargando(true);

    fetch(`/api/entregas/${id}`)
        .then(response => response.json())
        .then(entrega => {
            mostrarCargando(false);

            // Formatear fecha
            const fecha = new Date(entrega.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-CO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Construir contenido del modal
            const modalBody = document.getElementById('detalleModalBody');
            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                        <p><strong>Responsable:</strong> ${entrega.responsable || 'No especificado'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>ID de Entrega:</strong> ${entrega.id}</p>
                        <p><strong>Estado:</strong> <span class="badge bg-success">Completada</span></p>
                    </div>
                </div>
                
                <hr>
                
                <div class="row">
            `;

            // Agregar tarjetas para cada tipo de pago
            let total = 0;
            tiposPago.forEach(tipo => {
                const valor = entrega.valores[tipo.nombre] || 0;
                total += valor;

                modalBody.innerHTML += `
                    <div class="col-md-4">
                        <div class="card bg-light mb-3">
                            <div class="card-body text-center">
                                <h6 class="card-title text-muted">${tipo.nombre}</h6>
                                <h4 class="card-text">${formatearMoneda(valor)}</h4>
                            </div>
                        </div>
                    </div>
                `;
            });

            // Agregar total y observaciones
            modalBody.innerHTML += `
                </div>
                
                <div class="total-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <h4 class="mb-0">Total Entrega</h4>
                        <h2 class="mb-0">${formatearMoneda(total)}</h2>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h5>Observaciones:</h5>
                    <p class="border p-3 rounded bg-light">
                        ${entrega.observaciones || 'No hay observaciones registradas.'}
                    </p>
                </div>
            `;

            // Mostrar el modal
            const modal = new bootstrap.Modal(document.getElementById('detalleModal'));
            modal.show();
        })
        .catch(error => {
            mostrarCargando(false);
            console.error('Error al cargar detalle:', error);
            mostrarAlerta('No se pudo cargar el detalle de la entrega', 'error');
        });
}

function cargarEstadisticas(periodo) {
    periodoActual = periodo;
    console.log('Cargando estadísticas para período:', periodo);
    
    fetch(`/api/estadisticas?periodo=${periodo}`)
        .then(response => response.json())
        .then(data => {
            console.log('Datos recibidos:', data);
            
            // Verificar que todos los tipos de pago estén presentes
            const tiposEncontrados = new Set();
            data.forEach(item => {
                Object.keys(item.valores).forEach(tipo => {
                    tiposEncontrados.add(tipo);
                });
            });
            
            console.log('Tipos de pago en datos:', Array.from(tiposEncontrados));
            
            // Asegurar que efectivo y transferencia estén siempre presentes
            if (!tiposEncontrados.has('Efectivo') || !tiposEncontrados.has('Transferencia')) {
                console.warn('Advertencia: Efectivo o Transferencia no están en los datos');
            }
            
            actualizarGraficoEstadistica(data, periodo);
        })
        .catch(error => {
            console.error('Error al cargar estadísticas:', error);
            mostrarMensaje('Error al cargar estadísticas', 'error');
        });
}



// Función para actualizar tarjetas de estadísticas
function actualizarTarjetasEstadisticas(totales) {
    const statsCards = document.getElementById('statsCards');
    statsCards.innerHTML = '';

    // Crear una tarjeta para cada tipo de pago
    tiposPago.forEach(tipo => {
        const valor = totales[tipo.nombre] || 0;

        statsCards.innerHTML += `
            <div class="col-md-4 mb-3">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Total ${tipo.nombre}</h6>
                        <h4>${formatearMoneda(valor)}</h4>
                    </div>
                </div>
            </div>
        `;
    });

    // Calcular total general
    let totalGeneral = 0;
    Object.values(totales).forEach(valor => {
        totalGeneral += valor;
    });

    // Agregar tarjeta de total general
    statsCards.innerHTML += `
        <div class="col-12 mt-3">
            <div class="total-card">
                <div class="d-flex justify-content-between align-items-center">
                    <h4 class="mb-0">Total General</h4>
                    <h2 class="mb-0">${formatearMoneda(totalGeneral)}</h2>
                </div>
            </div>
        </div>
    `;
}

function actualizarGraficoEstadistica(datos, periodo) {
    // Destruir gráfico anterior si existe
    if (entregasChart instanceof Chart) {
        entregasChart.destroy();
    }
    
    // Preparar datos
    const labels = [];
    const tiposConValores = new Set();
    
    // Primero, identificar todos los tipos de pago con valores
    datos.forEach(item => {
        Object.entries(item.valores).forEach(([tipo, valor]) => {
            // Importante: incluir todos los tipos, incluso con valor 0
            // para asegurar que efectivo y transferencia siempre aparezcan
            tiposConValores.add(tipo);
        });
    });
    
    console.log("Tipos de pago encontrados:", Array.from(tiposConValores));
    
    // Crear colores para cada tipo
    const colores = [
        'rgba(75, 192, 192, 0.7)',   // Verde azulado
        'rgba(255, 99, 132, 0.7)',   // Rosa
        'rgba(54, 162, 235, 0.7)',   // Azul
        'rgba(255, 206, 86, 0.7)',   // Amarillo
        'rgba(153, 102, 255, 0.7)',  // Púrpura
        'rgba(255, 159, 64, 0.7)',   // Naranja
        'rgba(201, 203, 207, 0.7)'   // Gris
    ];
    
    // Crear datasets para TODOS los tipos encontrados
    const datasets = [];
    let colorIndex = 0;
    
    // Asegurar que efectivo y transferencia siempre estén primero (si existen)
    const tiposOrdenados = Array.from(tiposConValores);
    tiposOrdenados.sort((a, b) => {
        if (a === 'Efectivo') return -1;
        if (b === 'Efectivo') return 1;
        if (a === 'Transferencia') return -1;
        if (b === 'Transferencia') return 1;
        return a.localeCompare(b);
    });
    
    tiposOrdenados.forEach(tipo => {
        const dataset = {
            label: tipo,
            data: [],
            backgroundColor: colores[colorIndex % colores.length],
            borderColor: colores[colorIndex % colores.length].replace('0.7', '1'),
            borderWidth: 1
        };
        
        datasets.push(dataset);
        colorIndex++;
    });
    
    // Llenar datos para cada período
    datos.forEach(item => {
        let etiqueta = formatearEtiquetaSegunPeriodo(item.periodo, periodo);
        labels.push(etiqueta);
        
        // Llenar valores para cada dataset
        datasets.forEach(dataset => {
            const valor = item.valores[dataset.label] || 0;
            dataset.data.push(valor);
        });
    });
    
    // Crear nuevo gráfico
    const ctx = document.getElementById('estadisticasChart').getContext('2d');
    entregasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-ES');
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    // Asegurar que la leyenda muestre todos los tipos
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatearMoneda(context.raw);
                        }
                    }
                }
            }
        }
    });
    
    console.log("Gráfico actualizado con datasets:", datasets.map(d => d.label));
}


// Función auxiliar para formatear etiquetas según período
function formatearEtiquetaSegunPeriodo(periodoStr, tipoPeriodo) {
    if (tipoPeriodo === 'semana') {
        const [año, semana] = periodoStr.split('-');
        return `Sem ${semana}`;
    } else if (tipoPeriodo === 'mes') {
        const [año, mes] = periodoStr.split('-');
        const nombreMes = new Date(año, mes - 1, 1).toLocaleDateString('es-ES', { month: 'short' });
        return `${nombreMes} ${año}`;
    }
    return periodoStr;
}

// Forzar recarga de recursos para evitar problemas de caché
(function() {
    // Añadir un parámetro de timestamp a las URLs de recursos
    const timestamp = new Date().getTime();
    const scripts = document.querySelectorAll('script[src]');
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    
    scripts.forEach(script => {
        if (!script.src.includes('?')) {
            script.setAttribute('src', script.getAttribute('src') + '?v=' + timestamp);
        }
    });
    
    links.forEach(link => {
        if (!link.href.includes('?')) {
            link.setAttribute('href', link.getAttribute('href') + '?v=' + timestamp);
        }
    });
})();
