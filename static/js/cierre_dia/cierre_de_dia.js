async function cargarEstadisticasDia() {
    try {
        const response = await fetch('/api/ventas/dia');
        const data = await response.json();

        if (!data || !data.desglose_pagos) {
            document.getElementById('dynamicStats').innerHTML = `
                <div class="stat-card">
                    <div class="stat-label">Sin datos</div>
                    <div class="stat-value">$ 0</div>
                </div>`;
            return;
        }

        let statsHTML = '';
        
        // Generar tarjetas para cada tipo de pago
        Object.entries(data.desglose_pagos).forEach(([metodo, monto]) => {
            statsHTML += `
                <div class="stat-card">
                    <div class="stat-label">${metodo}</div>
                    <div class="stat-value">$ ${new Intl.NumberFormat('es-CL').format(monto)}</div>
                </div>`;
        });

        // Añadir la tarjeta del total
        statsHTML += `
            <div class="stat-card" style="background: var(--success-gradient)">
                <div class="stat-label">Total del Día</div>
                <div class="stat-value">$ ${new Intl.NumberFormat('es-CL').format(data.total_ventas)}</div>
            </div>`;

        document.getElementById('dynamicStats').innerHTML = statsHTML;

    } catch (error) {
        console.error('Error al cargar datos:', error);
        document.getElementById('dynamicStats').innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Error</div>
                <div class="stat-value">No se pudieron cargar los datos</div>
            </div>`;
    }
}
async function cargarVentasDelDia() {
    try {
        const response = await fetch('/api/ventas/cargar');
        const data = await response.json();
        const tbody = document.getElementById('ventasTableBody');

        if (!data || !data.ventas || data.ventas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No hay ventas registradas para hoy</td>
                </tr>`;
            return;
        }

        tbody.innerHTML = data.ventas.map(venta => {
            // Formatear el monto
            const montoFormateado = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
            }).format(venta.total_venta);

            return `
                <tr>
                    <td>${venta.id_venta}</td>
                    <td>${venta.fecha}</td>
                    <td>${montoFormateado}</td>
                    <td>${venta.metodos_pago}</td>
                    
                </tr>`;
        }).join('');

    } catch (error) {
        console.error('Error al cargar ventas:', error);
        document.getElementById('ventasTableBody').innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Error al cargar las ventas</td>
            </tr>`;
    }
}

async function initDashboard() {
    try {
        // Ejecutar ambas funciones en paralelo
        await Promise.all([
            cargarEstadisticasDia(),
            cargarVentasDelDia()
        ]);
    } catch (error) {
        console.error('Error al inicializar el dashboard:', error);
    }
}

// Un único event listener para inicializar todo
document.addEventListener('DOMContentLoaded', initDashboard);
