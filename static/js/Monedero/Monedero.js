
let gastosData = [];
let tiposPagos = {};
let tiposGastos = {};
let pagosTemporales = [];

let htmlBolsillos = '';
let htmlResumen = '';

const modalEditar = document.getElementById('modal-editar');
const gastosContainer = document.getElementById('gastos-container');
const selectCategoria = document.getElementById('categoria-gastos-editar');
const selectTipoPago = document.getElementById('tipo-pago-editar');
const alertMessage = document.getElementById('alert-message');
const filtroCategoria = document.getElementById('filtro-categoria');
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

async function obtenerFacturasPorCobrar() {
  try {
    const respuesta = await fetch('/api/facturas/por_cobrar');

    if (!respuesta.ok) {
      throw new Error(`Error en la petición: ${respuesta.status}`);
    }

    const data = await respuesta.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Error desconocido en la API');
    }
  } catch (error) {
    console.error('Error al obtener facturas por cobrar:', error);
    return [];
  }
}

// Variables globales
let gastoEditando = null;
const modalEditarGasto = document.getElementById('modal-editar-gasto');
const btnCerrarModal = document.querySelectorAll('.cerrar-modal');
const btnGuardarEdicion = document.getElementById('btn-guardar-edicion');

// Función para mostrar los bolsillos con filtros
async function mostrarBolsillos(filtroBolsillo = "todos", filtroFecha = "") {
  // Mostrar mensaje de carga
  const contenedorBolsillos = document.getElementById('contenedor-bolsillos');
  const contenedorResumen = document.getElementById('contenedor-resumen');

  contenedorBolsillos.innerHTML = '<div class="cargando">Cargando datos...</div>';
  contenedorResumen.innerHTML = '';

  try {
    // 🔹 1️⃣ Obtener bolsillos desde tu API o función
    const datosBolsillos = await obtenerDatosJSONBolsillos();

    // 🔹 2️⃣ Obtener gastos (y facturas) desde la API
    const response = await fetch('/api/obtener_gastos');
    const data = await response.json();

    if (!data.success) {
      contenedorBolsillos.innerHTML = `<div class="error">Error al cargar gastos: ${data.error}</div>`;
      return;
    }

    const gastos = data.gastos;
    const totalFacturas = data.facturas ?? 0;

    // 🔹 3️⃣ Calcular totales
    const totalGeneral = datosBolsillos.reduce((total, b) => total + b.total, 0);

    const totalGastos = gastos.reduce((total, g) => total + g.monto, 0);
    const utilidadNeta = totalGeneral - totalGastos - totalFacturas;

    // 🔹 4️⃣ Filtrar bolsillos
    const bolsillosFiltrados = datosBolsillos.filter(b => {
      if (filtroBolsillo === "todos") return true;
      return b.bolsillo.toLowerCase().includes(filtroBolsillo.toLowerCase());
    });

    // 🔹 5️⃣ Construir HTML de tarjetas de bolsillos
    let htmlBolsillos = '';

    bolsillosFiltrados.forEach(bolsillo => {
      const modulosOrden = ['ventas', 'servicios', 'facturas', 'gastos'];
      let contenidoModulos = '';
      let totalBolsillo = 0;

      // Calcular total visible y construir bloques de módulo
      modulosOrden.forEach(modulo => {
        const datos = bolsillo.modulos[modulo];
        if (!datos) return;

        const valor = datos.total;

        if (valor !== 0) {
          const esNegativo = valor < 0 || modulo === 'gastos' || modulo === 'facturas';
          const color = esNegativo ? 'color-rojo' : 'color-verde';
          const icono = esNegativo ? 'fas fa-arrow-down' : 'fas fa-arrow-up';



          contenidoModulos += `
        <div class="linea-modulo ${color}">
          <i class="${icono}"></i>
          <span>${modulo.charAt(0).toUpperCase() + modulo.slice(1)}:</span>
          <strong>$${valor.toLocaleString('es-ES')}</strong>
        </div>
      `;
        }
      });

      // Solo mostrar si hay módulos que mostrar
      if (contenidoModulos.trim() !== '') {
        const colorTotal = bolsillo.total <= 0 ? 'color-rojo' : 'color-verde';

        htmlBolsillos += `
        
      <div class="tarjeta-bolsillo">
      <div class="encabezado">
          <i class="fas fa-wallet"></i>
          <span>${bolsillo.bolsillo}</span>
        </div>
        <div class="total ${colorTotal}">
          <strong>$ ${bolsillo.total.toLocaleString('es-ES')}</strong>
        </div>
        
        <div class="modulos">
          ${contenidoModulos}
        </div>
      </div>
    `;
      }
    });



    // 🔹 6️⃣ Construir HTML de tarjeta resumen (siempre abajo)
    let htmlResumen = `
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
              <i class="fas fa-money-bill-wave"></i>
              <span>Facturas</span>
            </div>
            <div class="valor color-rojo">$${totalFacturas.toLocaleString('es-ES')}</div>
          </div>
          <div class="modulo">
            <div class="etiqueta">
              <i class="fas fa-coins"></i>
              <span>Utilidad Neta</span>
            </div>
            <div class="valor color-verde">$${utilidadNeta.toLocaleString('es-ES')}</div>
          </div>
        </div>
      </div>`;

    // 🔹 7️⃣ Renderizar por separado para que el resumen quede siempre abajo
    contenedorBolsillos.innerHTML = htmlBolsillos;
    contenedorResumen.innerHTML = htmlResumen;

  } catch (error) {
    console.error("❌ Error al mostrar bolsillos:", error);
    contenedorBolsillos.innerHTML = '<div class="error">Error al cargar el resumen financiero.</div>';
    contenedorResumen.innerHTML = '';
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

      let accionesHTML = '';
      if (rol === "admin") {
        accionesHTML = `
      <div class="acciones">
        <button class="btn-icono btn-editar" onclick="editarGasto(${gasto.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icono btn-eliminar" onclick="eliminarGasto(${gasto.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
      }

      div.innerHTML = `
    <div class="info">
      <p class="descripcion">${gasto.descripcion}</p>
      <div class="detalles">
        <span><i class="fas fa-money-bill"></i> $${gasto.monto.toLocaleString('es-ES')}</span>
        <span><i class="fas fa-tag"></i> ${gasto.categoria}</span>
        <span><i class="fas fa-calendar"></i> ${gasto.fecha}</span>
      </div>
    </div>
    ${accionesHTML}
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
              <button class="btn-pagar" onclick="pagarCuentasCXC(${cuenta.id})">
                <i class="fas fa-check"></i> Pagar Factura
              </button>
            </div>
          `;
    }

    contenedor.appendChild(div);
  });
}

// Función para mostrar cuentas por pagar Facturas
async function mostrarFacturasPorCobrar(filtroEstado = "todos", filtroProveedor = "", filtroFecha = "") {
  const contenedor = document.getElementById('lista-cuentas-cxp');

  try {
    // 1️⃣ Llamar a tu API Flask
    const respuesta = await fetch('/api/facturas/por_cobrar');
    if (!respuesta.ok) {
      throw new Error('Error al consultar la API');
    }

    const resultado = await respuesta.json();
    if (!resultado.success) {
      throw new Error(resultado.error || 'Error desconocido en la API');
    }

    let facturas = resultado.data;

    // 2️⃣ Filtrado por estado_pago
    if (filtroEstado !== "todos") {
      facturas = facturas.filter(f => {
        if (filtroEstado === "pendiente") return f.estado_pago_id === 1;
        if (filtroEstado === "parcial") return f.estado_pago_id === 2;
        return true;
      });
    }

    // 3️⃣ Filtrado por proveedor
    if (filtroProveedor) {
      facturas = facturas.filter(f =>
        f.proveedor_nombre.toLowerCase().includes(filtroProveedor.toLowerCase())
      );
    }

    // 4️⃣ Filtrado por fecha de emisión exacta
    if (filtroFecha) {
      facturas = facturas.filter(f => f.fecha_emision === filtroFecha);
    }

    // 5️⃣ Mostrar resultados
    if (facturas.length === 0) {
      contenedor.innerHTML = '<div class="no-resultados">No se encontraron facturas con los filtros seleccionados</div>';
      return;
    }

    contenedor.innerHTML = '';
    facturas.forEach(factura => {
      const div = document.createElement('div');
      div.className = `cuenta-item estado-${factura.estado_pago.toLowerCase()}`;

      // Calcular saldo pendiente (si tu API no lo manda)
      const saldoPendiente = factura.saldo_pendiente ?? (
        (factura.estado_pago_id === 1 || factura.estado_pago_id === 2) ? factura.monto_total : 0
      );

      // Serializar factura para usar en data-attribute
      const facturaJson = JSON.stringify(factura).replace(/"/g, '&quot;');

      div.innerHTML = `
        <div class="info">
          <p class="proveedor">
            <strong>${factura.proveedor_nombre}</strong> 
            <span class="estado-label estado-${factura.estado_pago.toLowerCase()}">
              (${factura.estado_pago})
            </span>
          </p>
          <p class="usuario">
            <i class="fas fa-user"></i> Registrada por: <strong>${factura.usuario_nombre}</strong>
          </p>
          <div class="detalles">
            <span><strong>Número:</strong> ${factura.numero_factura}</span>
            <span><i class="fas fa-calendar"></i> Emisión: ${factura.fecha_emision}</span>
            <span><i class="fas fa-calendar-alt"></i> Vence: ${factura.fecha_vencimiento || 'N/A'}</span>
          </div>
        </div>
        <div class="monto">
          <i class="fas fa-money-bill"></i> Total: $${factura.monto_total.toLocaleString('es-ES')}
        </div>
        ${(factura.estado_pago_id === 1 || factura.estado_pago_id === 2) ? `
          <div class="saldo-pendiente">
            <i class="fas fa-exclamation-circle"></i> Pendiente: $${saldoPendiente.toLocaleString('es-ES')}
          </div>
          <div class="acciones">
            <button class="btn-pagar" data-factura="${facturaJson}">
              <i class="fas fa-check"></i> Pagar Factura
            </button>
          </div>
        ` : ''}
      `;

      contenedor.appendChild(div);
    });

  } catch (error) {
    console.error(error);
    contenedor.innerHTML = '<div class="error">Ocurrió un error al cargar las facturas. Intenta de nuevo más tarde.</div>';
  }
}


// Funcion pagar
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
    id_usuario: usuario,
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
      alert("✅ Gasto guardado con éxito.");
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

async function abrirModalEditar(gastoId) {
  // Mostrar el modal
  modalEditar.style.display = 'flex';
  gastoEditando = gastoId;

  // Poblar selectores
  poblarTiposPagos();
  poblarCategoriasGastos();

  try {
    // Obtener datos del gasto desde la API
    const response = await fetch(`/api/obtener_gasto/${gastoId}`);
    const resultado = await response.json();

    if (!resultado.success) {
      throw new Error("Error al obtener el gasto");
    }

    const gasto = resultado.data;

    // Rellenar el formulario con los datos del gasto
    document.getElementById('gasto-id').value = gastoId;
    document.getElementById('monto-editar').value = gasto.monto;

    // Formatear fecha para input date (YYYY-MM-DD)
    const fechaObj = new Date(gasto.fecha);
    const fechaFormateada = fechaObj.toISOString().split('T')[0];
    document.getElementById('fecha-editar').value = fechaFormateada;

    document.getElementById('descripcion-editar').value = gasto.descripcion;
    selectTipoPago.value = gasto.tipo_pago_id;
    selectCategoria.value = gasto.categoria_id;

  } catch (error) {
    console.error('Error al cargar gasto:', error);
    mostrarAlerta('Error al cargar los datos del gasto', 'danger');
  }
}

// Función para cerrar el modal
function cerrarModal() {
  modalEditar.style.display = 'none';
  gastoEditando = null;
}

// Función para guardar los cambios del gasto
async function guardarCambiosGasto() {
  if (!gastoEditando) return;

  const gastoId = document.getElementById('gasto-id').value;
  const monto = document.getElementById('monto-editar').value;
  const fecha = document.getElementById('fecha-editar').value;
  const descripcion = document.getElementById('descripcion-editar').value;
  const tipoPago = selectTipoPago.value;
  const categoria = selectCategoria.value;

  // Validación básica
  if (!monto || !fecha || !descripcion || !tipoPago || !categoria) {
    mostrarAlerta('Por favor, completa todos los campos.', 'danger');
    return;
  }

  try {
    // Mostrar indicador de carga
    const guardarBtn = document.querySelector('#form-editar-gasto .btn-primary');
    const originalText = guardarBtn.innerHTML;
    guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    guardarBtn.disabled = true;

    const response = await fetch(`/api/actualizar_gasto/${gastoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        monto: parseFloat(monto),
        fecha,
        descripcion,
        tipo_pago_id: tipoPago,
        categoria_id: categoria
      })
    });

    const resultado = await response.json();

    if (response.ok && resultado.success) {
      mostrarAlerta('✅ Gasto actualizado con éxito!');


    } else {
      console.error("Error al actualizar:", resultado);
      mostrarAlerta('❌ Error al actualizar el gasto: ' + (resultado.error || ''), 'danger');
    }

  } catch (error) {
    console.error('Error al guardar gasto:', error);
    mostrarAlerta('❌ Error de conexión con el servidor. No se guardaron los cambios.', 'danger');
  } finally {
    // Restaurar botón
    const guardarBtn = document.querySelector('#form-editar-gasto .btn-primary');
    if (guardarBtn) {
      guardarBtn.innerHTML = 'Guardar Cambios';
      guardarBtn.disabled = false;
    }
  }
}

// Función para eliminar un gasto
async function eliminarGasto(gastoId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
    return;
  }

  try {

    const response = await fetch(`/api/eliminar_gasto/${gastoId}`, {
      method: "DELETE"
    });

    const resultado = await response.json();

    if (response.ok && resultado.success) {
      alert('✅ Gasto eliminado con éxito!', 'success');
      mostrarBolsillos()
      mostrarGastos()

    } else {
      console.error("Error al eliminar:", resultado);
      alert('❌ Error al eliminar el gasto: ' + (resultado.error || ''), 'danger');
    }

  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    alert('❌ Error de conexión con el servidor. No se eliminó el gasto.', 'danger');
  } finally {
    // Restaurar botones
    const botones = document.querySelectorAll(`.btn-eliminar[data-id="${gastoId}"]`);
    botones.forEach(btn => {
      btn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
      btn.disabled = false;
    });
  }
}
// Cerrar modal al hacer clic fuera del contenido
modalEditar.addEventListener('click', (e) => {
  if (e.target === modalEditar) {
    cerrarModal();
  }
});

// ✅ Función para iniciar el flujo de pago
async function pagarFactura(factura) {
  try {
    const tiposPago = await fetch("/api/tipos_gastos_pagos").then(r => r.json());
    if (!tiposPago || !tiposPago.data || !tiposPago.data.tipos_pagos || Object.keys(tiposPago.data.tipos_pagos).length === 0) {
      Swal.fire("Advertencia", "No hay tipos de pago configurados.", "warning");
      return;
    }

    pagosTemporales = [];

    await abrirSwalPagos(factura, tiposPago.data.tipos_pagos);

  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo cargar el formulario de pago.", "error");
  }
}

// ✅ Abrir el Swal con formulario y tabla
async function abrirSwalPagos(factura, tiposPago) {
  await Swal.fire({
    title: `Agregar Pagos - Factura #${factura.numero_factura}`,
    html: generarHTMLSwalPagos(factura, tiposPago),
    showDenyButton: true,
    confirmButtonText: 'Confirmar Pago',
    denyButtonText: 'Cancelar',
    width: '1000px',
    didOpen: () => {
      document.getElementById('btn-agregar-pago-interno').addEventListener('click', () => {
        agregarPagoInterno(tiposPago, factura);
      });
    },
    preConfirm: async () => {
      if (pagosTemporales.length === 0) {
        Swal.showValidationMessage('Debes agregar al menos un pago antes de confirmar.');
        return false;
      }

      try {
        const response = await fetch('/api/agregar_pagos_factura', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            factura_id: factura.id,
            pagos: pagosTemporales,
            usuario_id: datos.id
          })
        });
        if (!response.ok) throw new Error('Error al enviar los pagos');
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Error al registrar pagos');
        return data;
      } catch (err) {
        Swal.showValidationMessage(`Error: ${err.message}`);
        return false;
      }
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      Swal.fire('Éxito', 'Pagos registrados correctamente.', 'success');
      mostrarFacturasPorCobrar();
      mostrarBolsillos();
    } else if (result.isDenied) {
      Swal.fire('Cancelado', 'No se registraron pagos.', 'info');
    }
  });
}

// ✅ Generar el contenido HTML del modal
function generarHTMLSwalPagos(factura, tiposPago) {
  const opciones = Object.entries(tiposPago).map(
    ([id, nombre]) => `<option value="${id}">${nombre}</option>`
  ).join('');

  return `
    <style>
      .swal-grid-2col {
        display: grid;
        grid-template-columns: 0.4fr 0.6fr;
        gap: 1rem;
        align-items: start;
      }
      .swal-form-horizontal .form-group {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .swal-form-horizontal .form-group label {
        flex: 0 0 100px;
        margin-right: 0.5rem;
        font-weight: 500;
        font-size: 0.95rem;
      }
      .swal-form-horizontal .form-group input,
      .swal-form-horizontal .form-group select {
        flex: 1;
      }
      .swal-datos-factura {
        padding: 0.5em;
        background-color: #f8f9fa;
        border-radius: 6px;
        margin-bottom: 0.8rem;
        font-size: 0.9rem;
      }
    </style>

    <div class="swal-datos-factura text-start">
      <div><strong>Proveedor:</strong> ${factura.proveedor_nombre}</div>
      <div><strong>Total:</strong> $${factura.monto_total.toLocaleString('es-ES')}</div>
      <div><strong>Saldo pendiente:</strong> $${(factura.saldo_pendiente ?? factura.monto_total).toLocaleString('es-ES')}</div>
    </div>

    <div class="swal-grid-2col">
      <div class="swal-form-horizontal">
        <div class="form-group">
          <label for="pago-tipo-interno">Tipo Pago</label>
          <select class="form-select form-select-sm" id="pago-tipo-interno">${opciones}</select>
        </div>
        <div class="form-group">
          <label for="pago-fecha-interno">Fecha</label>
          <input type="date" class="form-control form-control-sm" id="pago-fecha-interno"
       value="${new Date().toLocaleDateString('en-CA')}">
        </div>
        <div class="form-group">
          <label for="pago-monto-interno">Monto</label>
          <input type="number" class="form-control form-control-sm" id="pago-monto-interno" min="1" step="0.01" placeholder="Ej: 50000">
        </div>
        <div class="form-group">
          <label for="pago-observaciones-interno">Obs.</label>
          <input type="text" class="form-control form-control-sm" id="pago-observaciones-interno" placeholder="Opcional">
        </div>
        <button type="button" class="btn btn-success btn-sm w-100 mt-2" id="btn-agregar-pago-interno">
          <i class="fas fa-plus"></i> Agregar este pago
        </button>
      </div>

      <div id="tabla-pagos-internos">
        ${renderizarTablaPagosInternos(factura)}
      </div>
    </div>
  `;
}

// ✅ Agregar pago con validación
function agregarPagoInterno(tiposPago, factura) {
  const tipoPagoId = parseInt(document.getElementById('pago-tipo-interno').value);
  const fechaPago = document.getElementById('pago-fecha-interno').value;
  const monto = parseFloat(document.getElementById('pago-monto-interno').value);
  const observaciones = document.getElementById('pago-observaciones-interno').value.trim();

  if (!tipoPagoId || isNaN(monto) || monto <= 0 || !fechaPago) {
    Swal.showValidationMessage('Todos los campos obligatorios deben estar completos y correctos.');
    return;
  }

  const saldoPendiente = factura.saldo_pendiente ?? factura.monto_total;
  const totalAgregado = pagosTemporales.reduce((sum, p) => sum + p.monto, 0);

  if ((totalAgregado + monto) > saldoPendiente) {
    Swal.showValidationMessage(`El total de pagos supera el saldo pendiente ($${saldoPendiente.toLocaleString('es-ES')}).`);
    return;
  }

  const nombreTipoPago = tiposPago[tipoPagoId] || '';

  pagosTemporales.push({
    tipo_pago_id: tipoPagoId,
    nombre_tipo_pago: nombreTipoPago,
    fecha_pago: fechaPago,
    monto,
    observaciones
  });

  document.getElementById('tabla-pagos-internos').innerHTML = renderizarTablaPagosInternos(factura);
}

// ✅ Renderizar tabla con total acumulado
function renderizarTablaPagosInternos(factura) {
  if (pagosTemporales.length === 0) {
    return '<div class="text-muted fst-italic">No has agregado pagos aún.</div>';
  }

  const total = pagosTemporales.reduce((sum, p) => sum + p.monto, 0);
  const saldoPendiente = factura.saldo_pendiente ?? factura.monto_total;
  const saldoRestante = saldoPendiente - total;

  const rows = pagosTemporales.map((pago, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td>${pago.nombre_tipo_pago}</td>
      <td>${pago.fecha_pago}</td>
      <td class="text-end">$${pago.monto.toLocaleString('es-ES')}</td>
      <td>${pago.observaciones || '-'}</td>
      <td class="text-center">
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="eliminarPagoInterno(${index}, ${saldoPendiente})">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');

  return `
    <style>
      .tabla-pagos-scroll {
        max-height: 180px;
        overflow-y: auto;
      }
      .tabla-pagos-scroll table {
        margin-bottom: 0;
      }
      .tabla-pagos-scroll thead th {
        position: sticky;
        top: 0;
        background-color: #f8f9fa;
        z-index: 1;
      }
      .resumen-pagos {
        margin-top: 0.5rem;
        padding: 0.4rem 0.6rem;
        background-color: #f8f9fa;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        font-size: 0.95rem;
        font-weight: 500;
      }
    </style>

    <div class="table-responsive tabla-pagos-scroll">
      <table class="table table-sm table-bordered">
        <thead class="table-light">
          <tr>
            <th class="text-center">#</th>
            <th>Tipo Pago</th>
            <th>Fecha</th>
            <th class="text-end">Monto</th>
            <th>Observaciones</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="resumen-pagos">
      <div>Pagado: <span class="text-success">$${total.toLocaleString('es-ES')}</span></div>
      <div>Saldo Restante: <span class="${saldoRestante < 0 ? 'text-danger' : 'text-success'}">$${saldoRestante.toLocaleString('es-ES')}</span></div>
    </div>
  `;
}


// ✅ Eliminar pago
function eliminarPagoInterno(index, saldoPendiente) {
  pagosTemporales.splice(index, 1);
  document.getElementById('tabla-pagos-internos').innerHTML = renderizarTablaPagosInternos({ saldo_pendiente: saldoPendiente });
}




// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('lista-cuentas-cxp').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-pagar');
    if (btn) {
      const factura = JSON.parse(btn.dataset.factura);
      pagarFactura(factura);
    }
  });

  usuario = datos.id;
  rol = datos.rol;
  // Ahora sí se pueden mostrar los datos correctamente

  mostrarBolsillos();
  mostrarGastos();
  // mostrarCuentasPorCobrar();
  mostrarFacturasPorCobrar();

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

