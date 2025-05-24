// Datos de ejemplo (simulando respuesta JSON)
const registros = [
  { id: 1, tipo: 'venta', valor: 20000, metodo: 'efectivo', fecha: '2025-05-20' },
  { id: 2, tipo: 'servicio', valor: 15000, metodo: 'transferencia', fecha: '2025-05-21' },
  { id: 3, tipo: 'gasto', valor: 8000, metodo: 'efectivo', fecha: '2025-05-21' },
  { id: 4, tipo: 'venta', valor: 30000, metodo: 'tarjeta', fecha: '2025-05-22' },
  { id: 5, tipo: 'servicio', valor: 120000, metodo: 'efectivo', fecha: '2025-05-22' },
  { id: 6, tipo: 'gasto', valor: 50000, metodo: 'transferencia', fecha: '2025-05-22' },
  { id: 7, tipo: 'venta', valor: 250000, metodo: 'efectivo', fecha: '2025-05-23' },
  { id: 8, tipo: 'servicio', valor: 20000000, metodo: 'tarjeta', fecha: '2025-05-23' },
  { id: 9, tipo: 'gasto', valor: 60000, metodo: 'tarjeta', fecha: '2025-05-23' }
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

// Evento para filtrar
btnFiltrar.addEventListener('click', () => {
  const tipo = document.getElementById('tipoRegistro').value;
  const metodo = document.getElementById('metodoPago').value;
  const desde = document.getElementById('fechaInicio').value;
  const hasta = document.getElementById('fechaFin').value;

  // Filtrar registros
  const filtrados = registros.filter(r => {
    const fechaValida = (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta);
    const tipoValido = tipo === 'todos' || r.tipo === tipo;
    const metodoValido = metodo === 'todos' || r.metodo === metodo;
    return fechaValida && tipoValido && metodoValido;
  });

  mostrarTarjetas(filtrados);
  actualizarGrafica(filtrados);
});

// Mostrar tarjetas con comparativa
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

// Calcular variación porcentual
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

// Actualizar gráfica con métodos de pago
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

// Inicializar con todos los datos
mostrarTarjetas(registros);
actualizarGrafica(registros);