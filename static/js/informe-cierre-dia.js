
const reporteData = {
    "fecha": "2025-05-25",
    "total_ingresos": 370000,
    "total_egresos": 280000,
    "total_neto": 90000,
    "observaciones": "Cierre sin novedades",
    "creado_por": "admin",
    "tipos_pago": {
        "Efectivo": {
            "descripcion": {
                "ventas": {
                    "id_1": 150000,
                    "id_2": 20000
                },
                "servicios": {
                    "id_2": 130000
                }
            },
            "monto": 300000
        },
        "Tarjeta": {
            "descripcion": {
                "ventas": {
                    "id_1": 50000,
                    "id_2": 20000
                }
            },
            "monto": 70000
        }
    },
    "gastos": {
        "Efectivo": {
            "id_1": 50000,
            "id_2": 20000
        },
        "Transferencia": {
            "id_1": 50000,
            "id_2": 20000
        },
        "monto": 140000
    },
    "facturas": {
        "Efectivo": {
            "id_1": 50000,
            "id_2": 20000
        },
        "Transferencia": {
            "id_1": 50000,
            "id_2": 20000
        },
        "monto": 140000
    }
};
async function loadData() {
    try {
        const response = await fetch('/static');
        if (!response.ok) {
            throw new Error('No se pudo cargar el archivo JSON');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        return null;
    }
}

// Función para formatear números como moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
}

// Función para mostrar los datos generales
function displayGeneralData() {
    document.getElementById('fecha').textContent += reporteData.fecha;
    document.getElementById('total-ingresos').textContent = formatCurrency(reporteData.total_ingresos);
    document.getElementById('total-egresos').textContent = formatCurrency(reporteData.total_egresos);
    document.getElementById('total-neto').textContent = formatCurrency(reporteData.total_neto);
    document.getElementById('observaciones').textContent += reporteData.observaciones;
}

// Función para mostrar los tipos de pago
function displayTiposPago() {
    const container = document.getElementById('tipos-pago-container');
    let html = '<table>';
    
    // Cabecera de la tabla
    html += `
        <thead>
            <tr>
                <th>Tipo de Pago</th>
                <th>ID</th>
                <th>Monto</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    // Recorrer cada tipo de pago
    for (const [tipoPago, datos] of Object.entries(reporteData.tipos_pago)) {
        let firstCategory = true;
        let tipoPagoRowspan = 0;
        
        // Calcular el rowspan total para este tipo de pago
        for (const [categoria, items] of Object.entries(datos.descripcion)) {
            tipoPagoRowspan += Object.keys(items).length + 1; // +1 por la fila de categoría
        }
        
        // Primera fila para el tipo de pago
        html += `
            <tr>
                <td rowspan="${tipoPagoRowspan}" class="tipo-pago-cell">${tipoPago}</td>
        `;
        
        // Recorrer cada categoría
        for (const [categoria, items] of Object.entries(datos.descripcion)) {
            if (!firstCategory) {
                // Fila de categoría (excepto la primera)
                html += `
                    <tr class="categoria-row">
                        <th colspan="2" class="categoria-header">${categoria.toUpperCase()}</th>
                    </tr>
                `;
            }
            
            // Fila de categoría (para la primera categoría)
            if (firstCategory) {
                html += `
                        <th colspan="2" class="categoria-header">${categoria.toUpperCase()}</th>
                    </tr>
                `;
                firstCategory = false;
            }
            
            // Items de la categoría
            for (const [id, monto] of Object.entries(items)) {
                html += `
                    <tr>
                        <td>${id}</td>
                        <td>${formatCurrency(monto)}</td>
                    </tr>
                `;
            }
        }
    }
    
    // Totales
    html += `
        <tr class="total-row">
            <td colspan="2">Total Efectivo</td>
            <td>${formatCurrency(reporteData.tipos_pago.Efectivo.monto)}</td>
        </tr>
        <tr class="total-row">
            <td colspan="2">Total Tarjeta</td>
            <td>${formatCurrency(reporteData.tipos_pago.Tarjeta.monto)}</td>
        </tr>
        <tr class="total-row">
            <td colspan="2">Total Ingresos</td>
            <td>${formatCurrency(reporteData.total_ingresos)}</td>
        </tr>
    `;
    
    html += '</tbody></table>';
    container.innerHTML = html;
}
// Función para mostrar los gastos
function displayGastos() {
    const container = document.getElementById('gastos-container');
    let html = '<table>';
    
    // Cabecera de la tabla
    html += `
        <thead>
            <tr>
                <th>Método de Pago</th>
                <th>ID</th>
                <th>Monto</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    // Recorrer cada método de pago en gastos (excluyendo 'monto')
    for (const [metodo, items] of Object.entries(reporteData.gastos)) {
        if (metodo !== 'monto') {
            let firstRow = true;
            const rowspan = Object.keys(items).length;
            
            // Recorrer cada item
            for (const [id, monto] of Object.entries(items)) {
                html += `
                    <tr>
                        ${firstRow ? `<td rowspan="${rowspan}">${metodo}</td>` : ''}
                        <td>${id}</td>
                        <td>${formatCurrency(monto)}</td>
                    </tr>
                `;
                firstRow = false;
            }
        }
    }
    
    // Total gastos
    html += `
        <tr class="total-row">
            <td colspan="2">Total Gastos</td>
            <td>${formatCurrency(reporteData.gastos.monto)}</td>
        </tr>
    `;
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Función para mostrar las facturas
function displayFacturas() {
    const container = document.getElementById('facturas-container');
    let html = '<table>';
    
    // Cabecera de la tabla
    html += `
        <thead>
            <tr>
                <th>Método de Pago</th>
                <th>ID</th>
                <th>Monto</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    // Recorrer cada método de pago en facturas (excluyendo 'monto')
    for (const [metodo, items] of Object.entries(reporteData.facturas)) {
        if (metodo !== 'monto') {
            let firstRow = true;
            const rowspan = Object.keys(items).length;
            
            // Recorrer cada item
            for (const [id, monto] of Object.entries(items)) {
                html += `
                    <tr>
                        ${firstRow ? `<td rowspan="${rowspan}">${metodo}</td>` : ''}
                        <td>${id}</td>
                        <td>${formatCurrency(monto)}</td>
                    </tr>
                `;
                firstRow = false;
            }
        }
    }
    
    // Total facturas
    html += `
        <tr class="total-row">
            <td colspan="2">Total Facturas</td>
            <td>${formatCurrency(reporteData.facturas.monto)}</td>
        </tr>
    `;
    
    html += '</tbody></table>';
    container.innerHTML = html;
}
// Inicializar la visualización de datos
document.addEventListener('DOMContentLoaded', () => {
    displayGeneralData();
    displayTiposPago();
    displayGastos();
    displayFacturas();
});