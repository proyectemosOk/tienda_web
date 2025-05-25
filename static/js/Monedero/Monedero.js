// 1. JSON para datos del día actual (simulando respuesta API)
const jsonDiaActual = {
  fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
  registros: [
    { id: 1, tipo: 'venta', valor: 350, metodo: 'efectivo', fecha: new Date().toISOString().split('T')[0], descripcion: 'Venta al contado' },
    { id: 2, tipo: 'servicio', valor: 180, metodo: 'tarjeta', fecha: new Date().toISOString().split('T')[0], descripcion: 'Servicio premium' },
    { id: 3, tipo: 'gasto', valor: 75, metodo: 'transferencia', fecha: new Date().toISOString().split('T')[0], descripcion: 'Compra de materiales' }
  ]
};

// 2. JSON para datos filtrados (simulando respuesta API)
const jsonFiltrado = {
  parametros: {
    tipo: 'venta',
    metodo: 'efectivo',
    fechaInicio: '2025-05-20',
    fechaFin: '2025-05-22'
  },
  registros: [
    { id: 1, tipo: 'venta', valor: 200, metodo: 'efectivo', fecha: '2025-05-20', descripcion: 'Venta producto A' },
    { id: 4, tipo: 'venta', valor: 300, metodo: 'efectivo', fecha: '2025-05-21', descripcion: 'Venta producto B' },
    { id: 7, tipo: 'venta', valor: 250, metodo: 'efectivo', fecha: '2025-05-22', descripcion: 'Venta producto C' }
  ]
};

// 1.1. JSON para datos del día actual (simulando respuesta API)
const data = [
  {
    bolsillo: "Bolsillo A",
    total: 1000000,
    porcentaje: 15,
    comportamiento: 1,
    modulos: {
      ventas: { porcentaje: 10, sub_comportamiento: 1 },
      servicios: { porcentaje: 5, sub_comportamiento: 0 }
    }
  },
  {
    bolsillo: "Bolsillo B",
    total: 800000,
    porcentaje: 8,
    comportamiento: 0,
    modulos: {
      ventas: { porcentaje: 20, sub_comportamiento: 0 },
      servicios: { porcentaje: 25, sub_comportamiento: 1 }
    }
  }
];

// Variables globales
const resumenTarjetas = document.getElementById('resumenTarjetas');
const btnFiltrar = document.getElementById('btnFiltrar');
const ctx = document.getElementById('graficaCaja').getContext('2d');
let grafica;
let datosAnteriores = {
  ventas: 0,
  servicios: 0,
  gastos: 0,
  total: 0
};

// 1. Función para obtener datos del día actual desde JSON
async function obtenerDatosDelDiaActual() {
  try {
    // Simulamos retardo de red
    // await new Promise(resolve => setTimeout(resolve, 500));

    // En producción, aquí iría:
    const response = await fetch('/api/tarjetas-resumen');
    return await response.json();
    // return data
  } catch (error) {
    console.error('Error al obtener datos del día:', error);
    return [];
  }
}
async function cargarTarjetas() {
  try {
    const response = await fetch('/api/tarjetas-resumen');
    const result = await response.json();
    console.log(result)
    if (result.success) {
      mostrarTarjetas_1(result.data);
    } else {
      document.getElementById('contenido').innerHTML =
        `<div class="error">Error: ${result.error}</div>`;
    }
  } catch (error) {
    document.getElementById('resumenTarjetas').innerHTML =
      `<div class="error">Error de conexión: ${error.message}</div>`;
  }
}
// 2. Función para obtener datos filtrados desde JSON
async function obtenerDatosFiltrados(filtros = {}) {
  try {
    // Simulamos retardo de red
    await new Promise(resolve => setTimeout(resolve, 800));

    // En producción, aquí iría:
    // const params = new URLSearchParams();
    // if (filtros.tipo) params.append('tipo', filtros.tipo);
    // if (filtros.metodo) params.append('metodo', filtros.metodo);
    // if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    // if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    // const response = await fetch(`/api/registros?${params.toString()}`);
    // return await response.json();

    // Simulamos filtrado básico para el ejemplo
    const registrosFiltrados = jsonFiltrado.registros.filter(registro => {
      const cumpleTipo = !filtros.tipo || filtros.tipo === 'todos' || registro.tipo === filtros.tipo;
      const cumpleMetodo = !filtros.metodo || filtros.metodo === 'todos' || registro.metodo === filtros.metodo;
      const cumpleFechaInicio = !filtros.fechaInicio || registro.fecha >= filtros.fechaInicio;
      const cumpleFechaFin = !filtros.fechaFin || registro.fecha <= filtros.fechaFin;

      return cumpleTipo && cumpleMetodo && cumpleFechaInicio && cumpleFechaFin;
    });

    return registrosFiltrados;
  } catch (error) {
    console.error('Error al obtener datos filtrados:', error);
    return [];
  }
}

// Función para mostrar tarjetas resumen
function mostrarTarjetas(data) {
  resumenTarjetas.innerHTML = '';

  const totalVentas = data.filter(r => r.tipo === 'venta').reduce((acc, r) => acc + r.valor, 0);
  const totalServicios = data.filter(r => r.tipo === 'servicio').reduce((acc, r) => acc + r.valor, 0);
  const totalGastos = data.filter(r => r.tipo === 'gasto').reduce((acc, r) => acc + r.valor, 0);
  const totalCaja = totalVentas + totalServicios - totalGastos;

  // Calcular variación
  const variacionVentas = calcularVariacion(totalVentas, datosAnteriores.ventas);
  const variacionServicios = calcularVariacion(totalServicios, datosAnteriores.servicios);
  const variacionGastos = calcularVariacion(totalGastos, datosAnteriores.gastos);
  const variacionTotal = calcularVariacion(totalCaja, datosAnteriores.total);

  // Actualizar datos anteriores
  datosAnteriores = {
    ventas: totalVentas,
    servicios: totalServicios,
    gastos: totalGastos,
    total: totalCaja
  };

  // Crear tarjetas
  const tarjetas = [
    { titulo: 'Ventas', valor: totalVentas, variacion: variacionVentas },
    { titulo: 'Servicios', valor: totalServicios, variacion: variacionServicios },
    { titulo: 'Gastos', valor: totalGastos, variacion: variacionGastos },
    { titulo: 'Total en Caja', valor: totalCaja, variacion: variacionTotal }
  ];

  tarjetas.forEach(t => {
    const div = document.createElement('div');
    div.className = 'tarjeta';
    div.innerHTML = `
      <h3>${t.titulo}</h3>
      <p class="valor">$${t.valor.toFixed(2)}</p>
      <div class="variacion ${t.variacion.tipo}">
        ${t.variacion.icono} ${t.variacion.valor}%
      </div>
    `;
    resumenTarjetas.appendChild(div);
  });
}

// Función para mostrar tarjetas resumen
function mostrarTarjetas_1(datos) {
  const contenedor = document.getElementById('resumenTarjetas');

  if (datos.length === 0) {
    contenedor.innerHTML = '<div class="error">No hay datos disponibles</div>';
    return;
  }

  let html = '<div class="tarjetas-container">';

  let gastos = 0;
  let total = 0;
  datos.forEach(bolsillo => {
    total += (bolsillo.bolsillo !== "CXC") ? bolsillo.total : 0;
    gastos += bolsillo.modulos.gastos.valor_hoy;

    const iconoTotal = bolsillo.comportamiento === 1 ? '↗' : '↘';
    const colorTotal = bolsillo.comportamiento === 1 ? 'color-verde' : 'color-rojo';

    const iconoVentas = bolsillo.modulos.ventas.sub_comportamiento === 1 ? '↗' : '↘';
    const colorVentas = bolsillo.modulos.ventas.sub_comportamiento === 1 ? 'color-verde' : 'color-rojo';

    const iconoServicios = bolsillo.modulos.servicios.sub_comportamiento === 1 ? '↗' : '↘';
    const colorServicios = bolsillo.modulos.servicios.sub_comportamiento === 1 ? 'color-verde' : 'color-rojo';

    const iconoGastos = bolsillo.modulos.gastos.sub_comportamiento === 1 ? '↗' : '↘';
    const colorGastos = bolsillo.modulos.gastos.sub_comportamiento === 1 ? 'color-verde' : 'color-rojo';

    html += `
                        <div class="tarjeta-bolsillo">
                            <div class="encabezado">${bolsillo.bolsillo}</div>
                            <div class="total ${colorTotal}">
                                <strong>$${bolsillo.total.toLocaleString('es-ES')}</strong>
                                <span>${iconoTotal}</span>
                            </div>
                            <div class="modulos">
                                <div class="modulo">
                                    <div><strong>Ventas</strong></div>
                                    <div class="${colorVentas}">
                                        ${bolsillo.modulos.ventas.porcentaje}% ${iconoVentas}
                                    </div>
                                </div>
                                <div class="modulo">
                                    <div><strong>Servicios</strong></div>
                                    <div class="${colorServicios}">
                                        ${bolsillo.modulos.servicios.porcentaje}% ${iconoServicios}
                                    </div>
                                </div>
                                <div class="modulo">
                                    <div><strong>Gastos</strong></div>
                                    <div class="${colorGastos}">
                                        ${bolsillo.modulos.gastos.porcentaje}% ${iconoGastos}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
  });
  html +=`
                        <div class="tarjeta-bolsillo">
                            <div class="encabezado">Total</div>
                            <div class="total color-verde">
                                <strong>$${total.toLocaleString('es-ES')}</strong>
                            </div>
                            <div class="modulos">
                              <div class="modulo">
                                  <div><strong>Gastos</strong></div>
                                  <div class= color-rojo>
                                      ${gastos}
                                  </div>
                              </div>
                            </div>
                        </div>
                    `;
  html += '</div>';
  contenedor.innerHTML = html;
}

// Función para calcular variación porcentual
function calcularVariacion(valorActual, valorAnterior) {
  if (valorAnterior === 0) {
    return {
      valor: '100',
      tipo: valorActual >= 0 ? 'incremento' : 'decremento',
      icono: valorActual >= 0 ? '↑' : '↓'
    };
  }

  const variacion = ((valorActual - valorAnterior) / valorAnterior) * 100;

  return {
    valor: Math.abs(variacion).toFixed(2),
    tipo: variacion >= 0 ? 'incremento' : 'decremento',
    icono: variacion >= 0 ? '↑' : '↓'
  };
}

// Función para actualizar gráfica
function actualizarGrafica(data) {
  const ingresos = data.filter(r => r.tipo === 'venta' || r.tipo === 'servicio');
  const egresos = data.filter(r => r.tipo === 'gasto');

  const labels = [...new Set(data.map(r => r.fecha))].sort();

  // Datasets para ingresos por método de pago
  const efectivoIngresos = labels.map(fecha =>
    ingresos.filter(r => r.fecha === fecha && r.metodo === 'efectivo').reduce((sum, r) => sum + r.valor, 0)
  );

  const transferenciaIngresos = labels.map(fecha =>
    ingresos.filter(r => r.fecha === fecha && r.metodo === 'transferencia').reduce((sum, r) => sum + r.valor, 0)
  );

  const tarjetaIngresos = labels.map(fecha =>
    ingresos.filter(r => r.fecha === fecha && r.metodo === 'tarjeta').reduce((sum, r) => sum + r.valor, 0)
  );

  // Datasets para egresos por método de pago
  const efectivoEgresos = labels.map(fecha =>
    egresos.filter(r => r.fecha === fecha && r.metodo === 'efectivo').reduce((sum, r) => sum + r.valor, 0)
  );

  const transferenciaEgresos = labels.map(fecha =>
    egresos.filter(r => r.fecha === fecha && r.metodo === 'transferencia').reduce((sum, r) => sum + r.valor, 0)
  );

  const tarjetaEgresos = labels.map(fecha =>
    egresos.filter(r => r.fecha === fecha && r.metodo === 'tarjeta').reduce((sum, r) => sum + r.valor, 0)
  );

  if (grafica) grafica.destroy();

  grafica = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Ingresos en Efectivo',
          data: efectivoIngresos,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Ingresos por Transferencia',
          data: transferenciaIngresos,
          borderColor: '#17a2b8',
          backgroundColor: 'rgba(23, 162, 184, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Ingresos con Tarjeta',
          data: tarjetaIngresos,
          borderColor: '#6f42c1',
          backgroundColor: 'rgba(111, 66, 193, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Egresos en Efectivo',
          data: efectivoEgresos,
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Egresos por Transferencia',
          data: transferenciaEgresos,
          borderColor: '#fd7e14',
          backgroundColor: 'rgba(253, 126, 20, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Egresos con Tarjeta',
          data: tarjetaEgresos,
          borderColor: '#343a40',
          backgroundColor: 'rgba(52, 58, 64, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  });
}

// Función para aplicar filtros
async function aplicarFiltros() {
  const filtros = {
    tipo: document.getElementById('tipoRegistro').value,
    metodo: document.getElementById('metodoPago').value,
    fechaInicio: document.getElementById('fechaInicio').value,
    fechaFin: document.getElementById('fechaFin').value
  };

  const datosFiltrados = await obtenerDatosFiltrados(filtros);
  mostrarTarjetas(datosFiltrados);
  actualizarGrafica(datosFiltrados);
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar datos del día actual
  cargarTarjetas();
  // const datosIniciales = await obtenerDatosDelDiaActual();
  // mostrarTarjetas(datosIniciales);
  // actualizarGrafica(datosIniciales);



  // Configurar evento del botón filtrar
  btnFiltrar.addEventListener('click', aplicarFiltros);
});