async function loadData() {
    try {
        const response = await fetch('/api/cierre_dia/pending');
        if (!response.ok) throw new Error('No se pudo cargar el reporte de cierre');
        return await response.json();
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        return null;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
}
function displayBolsillos(data) {
    const container = document.getElementById("bolsillos-resumen");
    container.innerHTML = ''; // Limpiar antes de renderizar

    for (const [tipo, monto] of Object.entries(data.bolsillos_actuales)) {
        const card = document.createElement("div");
        card.className = "card-ingresos"; // Puedes alternar colores si prefieres
        card.innerHTML = `
            <h3>${tipo}</h3>
            <p>${formatCurrency(monto)}</p>
        `;
        container.appendChild(card);
    }
}

function displayGeneralData(data) {
    document.getElementById('fecha').textContent = data.fecha;
    document.getElementById('total-ingresos').textContent = formatCurrency(data.total_ingresos);
    document.getElementById('total-egresos').textContent = formatCurrency(data.total_egresos);
    document.getElementById('total-neto').textContent = formatCurrency(data.total_neto);
}

function displayTiposPago(data) {
    const container = document.getElementById('tipos-pago-container');
    let html = '<table><thead><tr><th>Tipo de Pago</th><th>Módulo</th><th>REF</th><th>Monto</th><th>Usuario</th></tr></thead><tbody>';

    let totales = {};
    for (const [tipoPago, modulos] of Object.entries(data.tipos_pago)) {


        for (const [modulo, items] of Object.entries(modulos)) {
            for (const [id, info] of Object.entries(items)) {
                if (modulo == "Gastos" || modulo == "Facturas") continue;
                html += `
                    <tr>
                        <td>${tipoPago}</td>
                        <td>${modulo}</td>
                        <td>${id}</td>
                        <td>${info.usuario || '-'}</td>
                        <td>${formatCurrency(info.monto)}</td>
                    </tr>
                `;
                if (totales[modulo]) {
                    totales[modulo] += info.monto;
                } else {
                    totales[modulo] = info.monto;
                }
            }
        }

    }
    for (const [modulo, total] of Object.entries(totales))
        html += `
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td>Total ${modulo}</td>
        <td>${formatCurrency(total)}</td>
    </tr>
`;
    html += '</tbody></table>';
    container.innerHTML = html;
}

function displayGastos(data) {
    const container = document.getElementById('gastos-container');
    let html = '<table><thead><tr><th>Método</th><th>REF</th><th>Monto</th><th>Usuario</th><th>Descripción</th></tr></thead><tbody>';

    for (const [metodo, modulos] of Object.entries(data.tipos_pago)) {
        if (!modulos.Gastos) continue;

        for (const [id, gasto] of Object.entries(modulos.Gastos)) {
            html += `
                <tr>
                    <td>${metodo}</td>
                    <td>${id}</td>
                    <td>${formatCurrency(gasto.monto)}</td>
                    <td>${gasto.usuario}</td>
                    <td>${gasto.descripcion}</td>
                </tr>
            `;
        }
    }

    html += '</tbody></table>';
    container.innerHTML = html;
}

function displayFacturas(data) {
    const container = document.getElementById('facturas-container');
    let html = '<table><thead><tr><th>Método</th><th>REF</th><th>Monto</th><th>Usuario</th><th>Proveedor</th></tr></thead><tbody>';

    for (const [metodo, modulos] of Object.entries(data.tipos_pago)) {
        if (!modulos.Facturas) continue;

        for (const [id, factura] of Object.entries(modulos.Facturas)) {
            html += `
                <tr>
                    <td>${metodo}</td>
                    <td>${id}</td>
                    <td>${formatCurrency(factura.monto)}</td>
                    <td>${factura.usuario}</td>
                    <td>${factura.proveedor}</td>
                </tr>
            `;
        }
    }

    html += '</tbody></table>';
    container.innerHTML = html;
}

async function cerrarDiaTurno(data) {
    try {
        // Mostrar alerta de carga
        Swal.fire({
            title: 'Cerrando el día...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const respuesta = await fetch('/api/turno/cerrar_dia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const resultado = await respuesta.json();
        console.log('Respuesta del servidor:', resultado);

        if (!respuesta.ok || resultado?.error) {
            throw new Error(resultado?.error || `Error HTTP ${respuesta.status}`);
        }

        // Mostrar éxito
        Swal.fire({
            icon: 'success',
            title: 'Día cerrado correctamente',
            showConfirmButton: true,
        });

    } catch (error) {
        console.error('Hubo un problema al cerrar el día:', error);

        Swal.fire({
            icon: 'error',
            title: 'Error al cerrar el día',
            text: error.message || 'Ocurrió un error inesperado.',
        });
    }
}

function mostrarPDFenModal(url) {
    const modal = document.getElementById('modal-pdf');
    const iframe = document.getElementById('iframe-pdf');
    iframe.src = url;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function cerrarModalPDF() {
    const modal = document.getElementById('modal-pdf');
    const iframe = document.getElementById('iframe-pdf');
    iframe.src = '';
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    window.location.reload(); // Recarga todo al cerrar el modal
}

// Cargar datos desde API y visualizarlos
document.addEventListener('DOMContentLoaded', async () => {
    let reporteData = await loadData();
    if (!reporteData) return;

    displayGeneralData(reporteData);
    displayBolsillos(reporteData);
    displayTiposPago(reporteData);
    displayGastos(reporteData);
    displayFacturas(reporteData);
    reporteData.creado_por = datos.id;

    // Observaciones
    document.getElementById("observaciones").addEventListener("input", function (e) {
        reporteData.observaciones = e.target.value;
    });
    // Asignar botón con confirmación
    document.getElementById('cierre-dia-btn').addEventListener('click', () => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción cerrará el día y no se podrá revertir.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar día',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            focusCancel: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Procesando...',
                    text: 'Cerrando el turno...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const resultado = await cerrarDiaTurno(reporteData);

                if (resultado && !resultado.error) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cierre exitoso',
                        text: 'El turno se cerró correctamente.',
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        if (res.isConfirmed && resultado.pdf_url) {
                            mostrarPDFenModal(resultado.pdf_url);
                        } else {
                            window.location.reload();
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al cerrar el día',
                        text: resultado?.error || 'Ocurrió un error inesperado. Intenta nuevamente.'
                    });
                }
            }
        });
    });


});
