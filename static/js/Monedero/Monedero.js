async function obtenerDatosJSONBolsillos() {
  try {
    const response = await fetch("/api/tarjetas-resumen");
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.data;  // <-- Corregido
  } catch (error) {
    console.error("Error al obtener datos de ventas:", error);
    return {
      desglose_pagos: {},
      ventas: []
    };
  }
}
// Datos de ejemplo para los bolsillos en el formato especificado
var datosBolsillos;
// const datosBolsillos = [
//   {
//     bolsillo: "Caja",
//     total: 1000000,
//     porcentaje: 15,
//     comportamiento: 1,
//     modulos: {
//       ventas: { porcentaje: 10, sub_comportamiento: 1 },
//       servicios: { porcentaje: 5, sub_comportamiento: 0 }
//     }
//   },

// ];

// Datos de ejemplo para gastos
let gastosIniciales = [
  { id: 1, descripcion: "Compra de materiales", monto: 75000, categoria: "operativos", fecha: "2023-06-01" },
  { id: 2, descripcion: "Pago de servicios", monto: 120000, categoria: "operativos", fecha: "2023-06-05" },
  { id: 3, descripcion: "Publicidad", monto: 50000, categoria: "comerciales", fecha: "2023-06-10" },
  { id: 4, descripcion: "Material de oficina", monto: 45000, categoria: "administrativos", fecha: "2023-06-15" },
  { id: 5, descripcion: "Viáticos", monto: 180000, categoria: "operativos", fecha: "2023-06-20" }
];

// Datos de ejemplo para cuentas por cobrar
const cuentasPorCobrar = [
  { id: 1, cliente: "Juan Pérez", monto: 100000, fecha: "2023-06-15", pagada: false },
  { id: 2, cliente: "María López", monto: 200000, fecha: "2023-06-20", pagada: false },
  { id: 3, cliente: "Empresa XYZ", monto: 350000, fecha: "2023-06-25", pagada: true },
  { id: 4, cliente: "Carlos Rodríguez", monto: 150000, fecha: "2023-06-18", pagada: false },
  { id: 5, cliente: "Tienda ABC", monto: 275000, fecha: "2023-06-22", pagada: true }
];

// Variables globales
let gastoEditando = null;
const modalEditarGasto = document.getElementById('modal-editar-gasto');
const btnCerrarModal = document.querySelectorAll('.cerrar-modal');
const btnGuardarEdicion = document.getElementById('btn-guardar-edicion');

// Función para mostrar los bolsillos con filtros
async function mostrarBolsillos(filtroBolsillo = "todos", filtroFecha = "") {
  const contenedor = document.getElementById('resumenTarjetas');
  contenedor.innerHTML = '<div class="cargando">Cargando resumen...</div>';

  try {
    // Cargar bolsillos desde la API
    const datosBolsillos = await obtenerDatosJSONBolsillos();

    // Cargar gastos desde la API
    const response = await fetch('/api/obtener_gastos');
    const data = await response.json();

    if (!data.success) {
      contenedor.innerHTML = `<div class="error">Error al cargar gastos: ${data.error}</div>`;
      return;
    }

    const gastos = data.gastos;

    // Calcular totales
    const totalGeneral = datosBolsillos.reduce((total, bolsillo) => total + bolsillo.total, 0);
    const totalGastos = gastos.reduce((total, gasto) => total + gasto.monto, 0);
    const utilidadNeta = totalGeneral - totalGastos;

    // Filtrar bolsillos
    const bolsillosFiltrados = datosBolsillos.filter(bolsillo => {
      if (filtroBolsillo === "todos") return true;
      return bolsillo.bolsillo.includes(filtroBolsillo);
    });

    let html = '';

    // Mostrar cada bolsillo filtrado
    bolsillosFiltrados.forEach(bolsillo => {
      const iconoTotal = bolsillo.comportamiento === 1 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
      const colorTotal = bolsillo.comportamiento === 1 ? 'color-verde' : 'color-rojo';

      html += `
        <div class="tarjeta-bolsillo">
          <div class="encabezado">
            <i class="fas fa-wallet"></i>
            <span>${bolsillo.bolsillo}</span>
          </div>
          <div class="total ${colorTotal}">
            <strong>$${bolsillo.total.toLocaleString('es-ES')}</strong>
            <span><i class="${iconoTotal}"></i> ${bolsillo.porcentaje}%</span>
          </div>
          <div class="modulos">
            <div class="modulo">
              <div class="etiqueta">
                <i class="fas fa-shopping-cart"></i>
                <span>Ventas</span>
              </div>
              <div class="valor">${bolsillo.modulos.ventas.porcentaje}%</div>
            </div>
            <div class="modulo">
              <div class="etiqueta">
                <i class="fas fa-tools"></i>
                <span>Servicios</span>
              </div>
              <div class="valor">${bolsillo.modulos.servicios.porcentaje}%</div>
            </div>
          </div>
        </div>
      `;
    });

    // Tarjeta de Resumen Financiero
    html += `
      <div class="tarjeta-bolsillo tarjeta-resumen">
        <div class="encabezado">
          <i class="fas fa-chart-line"></i>
          <span>Resumen</span>
        </div>
        <div class="modulos">
          <div class="modulo">
            <div class="etiqueta">
              <i class="fas fa-money-bill-wave"></i>
              <span>Total General</span>
            </div>
            <div class="valor">$${totalGeneral.toLocaleString('es-ES')}</div>
          </div>
          <div class="modulo">
            <div class="etiqueta">
              <i class="fas fa-money-bill-wave"></i>
              <span>Gastos Totales</span>
            </div>
            <div class="valor color-rojo">$${totalGastos.toLocaleString('es-ES')}</div>
          </div>
          <div class="modulo">
            <div class="etiqueta">
              <i class="fas fa-coins"></i>
              <span>Utilidad Neta</span>
            </div>
            <div class="valor color-verde">$${utilidadNeta.toLocaleString('es-ES')}</div>
          </div>
        </div>
      </div>
    `;

    contenedor.innerHTML = html;
  } catch (error) {
    console.error("❌ Error al mostrar bolsillos:", error);
    contenedor.innerHTML = '<div class="error">Error al cargar el resumen financiero.</div>';
  }
}


// Función para mostrar los gastos con filtros
async function mostrarGastos(filtroCategoria = "todas", filtroFecha = "", filtroMonto = 0) {
  const contenedor = document.getElementById('lista-gastos');
  contenedor.innerHTML = '<div class="cargando">Cargando gastos...</div>';

  try {
    const response = await fetch('/api/obtener_gastos');
    const data = await response.json();

    if (!data.success) {
      contenedor.innerHTML = `<div class="error">Error: ${data.error || "No se pudieron cargar los gastos."}</div>`;
      return;
    }

    const gastosFiltrados = data.gastos.filter(gasto => {
      // Filtrar por categoría
      if (filtroCategoria !== "todas" && gasto.categoria !== filtroCategoria) return false;

      // Filtrar por fecha
      if (filtroFecha && gasto.fecha !== filtroFecha) return false;

      // Filtrar por monto mínimo
      if (filtroMonto > 0 && gasto.monto < filtroMonto) return false;

      return true;
    });

    contenedor.innerHTML = '';

    if (gastosFiltrados.length === 0) {
      contenedor.innerHTML = '<div class="no-resultados">No se encontraron gastos con los filtros seleccionados</div>';
      return;
    }

    gastosFiltrados.forEach(gasto => {
      const div = document.createElement('div');
      div.className = 'gasto-item';
      div.innerHTML = `
        <div class="info">
          <p class="descripcion">${gasto.descripcion}</p>
          <div class="detalles">
            <span><i class="fas fa-money-bill"></i> $${gasto.monto.toLocaleString('es-ES')}</span>
            <span><i class="fas fa-tag"></i> ${gasto.categoria}</span>
            <span><i class="fas fa-calendar"></i> ${gasto.fecha}</span>
          </div>
        </div>
        <div class="monto">$${gasto.monto.toLocaleString('es-ES')}</div>
        <div class="acciones">
          <button class="btn-icono btn-editar" onclick="editarGasto(${gasto.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icono btn-eliminar" onclick="eliminarGasto(${gasto.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      contenedor.appendChild(div);
    });
  } catch (error) {
    console.error("❌ Error al obtener gastos:", error);
    contenedor.innerHTML = '<div class="error">Error al cargar los gastos.</div>';
  }
}

// Función para mostrar las cuentas por cobrar con filtros
function mostrarCuentasPorCobrar(filtroEstado = "todos", filtroCliente = "", filtroFecha = "") {
  const contenedor = document.getElementById('lista-cuentas');
  contenedor.innerHTML = '';

  // Filtrar cuentas
  const cuentasFiltradas = cuentasPorCobrar.filter(cuenta => {
    // Filtrar por estado
    if (filtroEstado !== "todos") {
      if (filtroEstado === "pendiente" && cuenta.pagada) return false;
      if (filtroEstado === "pagada" && !cuenta.pagada) return false;
    }

    // Filtrar por cliente
    if (filtroCliente && !cuenta.cliente.toLowerCase().includes(filtroCliente.toLowerCase())) {
      return false;
    }

    // Filtrar por fecha
    if (filtroFecha && cuenta.fecha !== filtroFecha) {
      return false;
    }

    return true;
  });

  // Mostrar cuentas filtradas
  if (cuentasFiltradas.length === 0) {
    contenedor.innerHTML = '<div class="no-resultados">No se encontraron cuentas con los filtros seleccionados</div>';
    return;
  }

  cuentasFiltradas.forEach(cuenta => {
    const div = document.createElement('div');
    div.className = `cuenta-item ${cuenta.pagada ? 'pagada' : ''}`;

    if (cuenta.pagada) {
      div.innerHTML = `
            <div class="info">
              <p class="cliente">${cuenta.cliente} <span class="color-verde">(Pagada)</span></p>
              <div class="detalles">
                <span><i class="fas fa-money-bill"></i> $${cuenta.monto.toLocaleString('es-ES')}</span>
                <span><i class="fas fa-calendar"></i> Pagada: ${cuenta.fecha}</span>
              </div>
            </div>
            <div class="monto color-verde">$${cuenta.monto.toLocaleString('es-ES')}</div>
          `;
    } else {
      div.innerHTML = `
            <div class="info">
              <p class="cliente">${cuenta.cliente} <span class="color-rojo">(Pendiente)</span></p>
              <div class="detalles">
                <span><i class="fas fa-money-bill"></i> $${cuenta.monto.toLocaleString('es-ES')}</span>
                <span><i class="fas fa-calendar"></i> Vence: ${cuenta.fecha}</span>
              </div>
            </div>
            <div class="monto">$${cuenta.monto.toLocaleString('es-ES')}</div>
            <div class="acciones">
              <button class="btn-pagar" onclick="pagarFactura(${cuenta.id})">
                <i class="fas fa-check"></i> Pagar Factura
              </button>
            </div>
          `;
    }

    contenedor.appendChild(div);
  });
}

// Funciones para aplicar filtros
function filtrarBolsillos() {
  const filtroBolsillo = document.getElementById('filtro-bolsillo').value;
  const filtroFecha = document.getElementById('filtro-fecha').value;
  mostrarBolsillos(filtroBolsillo, filtroFecha);
}

function filtrarGastos() {
  const filtroCategoria = document.getElementById('filtro-categoria').value;
  const filtroFecha = document.getElementById('filtro-fecha-gasto').value;
  const filtroMonto = parseFloat(document.getElementById('filtro-monto').value) || 0;
  mostrarGastos(filtroCategoria, filtroFecha, filtroMonto);
}

function filtrarCuentas() {
  const filtroEstado = document.getElementById('filtro-estado').value;
  const filtroCliente = document.getElementById('filtro-cliente').value;
  const filtroFecha = document.getElementById('filtro-fecha-cxc').value;
  mostrarCuentasPorCobrar(filtroEstado, filtroCliente, filtroFecha);
}

// Función para guardar un nuevo tipo de pago (con llamada a API simulada)
async function guardarTipoPago() {
  const nombre = document.getElementById('nombre').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const select = document.getElementById('tipo-pago');

  if (!nombre) {
    alert("⚠️ El nombre es obligatorio");
    return;
  }

  try {
    const respuesta = await fetch('/api/guardar_tipo_pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion })
    });

    const resultado = await respuesta.json();

    if (respuesta.ok && resultado.success) {
      alert("✅ Tipo de pago guardado con éxito. ID: " + resultado.id);
      document.getElementById('nombre').value = '';
      document.getElementById('descripcion').value = '';

      // Crear nueva opción y agregarla al <select>
      const nuevaOpcion = document.createElement('option');
      nuevaOpcion.value = resultado.id;
      nuevaOpcion.textContent = nombre;

      const totalOpciones = select.options.length;
      const posicion = Math.max(0, totalOpciones - 1);
      select.insertBefore(nuevaOpcion, select.options[posicion]);

      // Seleccionamos automáticamente la nueva opción
      select.value = resultado.id;

    } else if (resultado.error) {
      alert("⚠️ Error: " + resultado.error);
    } else {
      alert("❌ Error desconocido al guardar.");
    }

  } catch (error) {
    alert("❌ Error de red o del servidor.");
    console.error(error);
  }
}


// Función para agregar un gasto
async function agregarGasto() {
  const descripcion = document.getElementById('descripcion-gasto').value.trim();
  const monto = parseFloat(document.getElementById('monto-gasto').value);
  const metodo_pago = document.getElementById('tipo-pago').value;
  const categoria = document.getElementById('categoria-gastos').value;

  if (!descripcion || isNaN(monto) || monto <= 0 || !categoria || !metodo_pago) {
    alert("Todos los campos son obligatorios y deben ser válidos.");
    return;
  }

  const gasto = {
    descripcion,
    monto,
    categoria: parseInt(categoria),
    metodo_pago: parseInt(metodo_pago)
  };

  try {
    const response = await fetch('/api/guardar_gasto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gasto)
    });

    const resultado = await response.json();

    if (resultado.success) {
      alert("Gasto guardado con éxito.");
      document.getElementById('descripcion-gasto').value = '';
      document.getElementById('monto-gasto').value = '';
      // Opcional: recargar lista de gastos desde backend o agregarlo al frontend
      mostrarGastos();  // si tienes función que refresca
      mostrarBolsillos(); // si aplicas resumen
    } else {
      alert("Error al guardar el gasto: " + (resultado.error || "desconocido"));
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    alert("Error al conectar con el servidor.");
  }
}


// Función para editar un gasto
function editarGasto(id) {
  gastoEditando = gastosIniciales.find(g => g.id === id);
  if (!gastoEditando) return;

  document.getElementById('editar-descripcion').value = gastoEditando.descripcion;
  document.getElementById('editar-monto').value = gastoEditando.monto;
  document.getElementById('editar-categoria').value = gastoEditando.categoria;

  modalEditarGasto.style.display = 'block';
}

// Función para guardar los cambios de edición
function guardarCambiosGasto() {
  if (!gastoEditando) return;

  const descripcion = document.getElementById('editar-descripcion').value.trim();
  const monto = parseFloat(document.getElementById('editar-monto').value);
  const categoria = document.getElementById('editar-categoria').value;

  if (!descripcion || isNaN(monto)) {
    alert("Descripción y monto son obligatorios");
    return;
  }

  gastoEditando.descripcion = descripcion;
  gastoEditando.monto = monto;
  gastoEditando.categoria = categoria;

  mostrarGastos();
  mostrarBolsillos(); // Actualizar el resumen financiero
  modalEditarGasto.style.display = 'none';
  alert("Gasto actualizado correctamente");
}

// Función para eliminar un gasto
function eliminarGasto(id) {
  if (!confirm("¿Estás seguro de eliminar este gasto?")) return;

  gastosIniciales = gastosIniciales.filter(gasto => gasto.id !== id);
  mostrarGastos();
  mostrarBolsillos(); // Actualizar el resumen financiero
  alert("Gasto eliminado correctamente");
}

// Función para pagar una factura
function pagarFactura(id) {
  const cuenta = cuentasPorCobrar.find(c => c.id === id);
  if (!cuenta) return;

  cuenta.pagada = true;
  cuenta.fecha = new Date().toISOString().split('T')[0];

  mostrarCuentasPorCobrar();
  mostrarBolsillos(); // Actualizar el resumen financiero
  alert(`Factura de ${cuenta.cliente} pagada correctamente.`);
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  // Ahora sí se pueden mostrar los datos correctamente
  mostrarBolsillos();
  mostrarGastos();
  mostrarCuentasPorCobrar();

  btnCerrarModal.forEach(btn => {
    btn.addEventListener('click', function () {
      this.closest('.modal').style.display = 'none';
    });
  });

  btnGuardarEdicion.addEventListener('click', guardarCambiosGasto);

  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
});

