class Item {
  constructor(parentElement, id, nombre, precio, stock, actualizarTotalCallback, eliminarItemCallback) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.stock = stock;
    this.cantidad = 1;
    this.actualizarTotalCallback = actualizarTotalCallback;
    this.eliminarItemCallback = eliminarItemCallback;

    // Crear elemento HTML
    this.element = document.createElement('div');
    this.element.className = 'item-card';
    this.element.innerHTML = `
      <div class="item-name">${nombre}
       <a class="btn-delete">❌</a>
       </div>
      <div class="item-price">
        <input type="text" class="item-price-input" value="$${precio}">
        <p class="btn-quantity-minus"><b>-</b></p>
        <input type="text" class="item-quantity-input" value="1">
        <p class="btn-quantity-plus"><b>+</b></p><br>
        <p class="item-total">$${precio}</p>
      </div>
    `;
    console.log("parentElement:", parentElement);
    parentElement.appendChild(this.element);

    // Event listeners
    this.element.querySelector('.btn-quantity-minus').addEventListener('click', () => this.restar());
    this.element.querySelector('.btn-quantity-plus').addEventListener('click', () => this.sumar());
    this.element.querySelector('.btn-delete').addEventListener('click', () => this.eliminar());
    this.element.querySelector('.item-price-input').addEventListener('change', (e) => this.actualizarPrecio(e.target.value));
    this.element.querySelector('.item-quantity-input').addEventListener('change', (e) => this.actualizarCantidad(e.target.value));
  }

  actualizarPrecio(nuevoPrecio) {
    this.precio = parseFloat(nuevoPrecio) || this.precio;
    this.actualizarTotal();
  }

  actualizarCantidad(nuevaCantidad) {
    this.cantidad = parseInt(nuevaCantidad) || 1;
    this.actualizarTotal();
  }

  sumar() {
    this.cantidad++;
    this.element.querySelector('.item-quantity-input').value = this.cantidad;
    this.actualizarTotal();
  }

  restar() {
    if (this.cantidad > 1) {
      this.cantidad--;
      this.element.querySelector('.item-quantity-input').value = this.cantidad;
      this.actualizarTotal();
    } else {
      this.eliminar();
    }
  }

  actualizarTotal() {
    const total = this.precio * this.cantidad;
    this.element.querySelector('.item-total').textContent = `$${total.toFixed(2)}`;
    this.actualizarTotalCallback();
  }

  eliminar() {
    this.element.remove();
    this.eliminarItemCallback(this.id);
  }
}
const puntos = new Intl.NumberFormat('es-CO').format;
class TicketDeVenta {
  constructor() {
    this.items = {};
    this.total = 0;

    // Elementos del DOM
    this.itemsContainer = document.getElementById('itemsContainer');
    this.totalLabel = document.getElementById('totalLabel');
    this.venderBtn = document.getElementById('venderBtn');
    this.cotizarBtn = document.getElementById('cotizarBtn');
    this.apartarBtn = document.getElementById('apartarBtn');
    this.clienteCombo = document.getElementById('clienteSearch');
    this.nuevoClienteBtn = document.getElementById('nuevoClienteBtn');

    // Métodos de pago
    this.paymentInputs = {
      efectivo: document.getElementById('efectivoInput'),
      transferencia: document.getElementById('transferenciaInput'),
      cxc: document.getElementById('cxcInput')
    };

    // Event listeners
    document.querySelectorAll('.btn-payment').forEach(btn => {
      btn.addEventListener('click', (e) => this.seleccionarMetodoPago(e.target.dataset.method));
    });

    this.venderBtn.addEventListener('click', () => this.vender("Vender"));
    this.cotizarBtn.addEventListener('click', () => this.vender("Cotizar"));
    this.apartarBtn.addEventListener('click', () => this.vender("Apartar"));
    this.clienteCombo.addEventListener('keyup', () => this.filtrarClientes());
  }

  agregarItem(id, nombre, precio, stock) {
    if (id in this.items) {
      this.items[id].sumar();
    } else {
      this.items[id] = new Item(
        this.itemsContainer,
        id,
        nombre,
        precio,
        stock,
        () => this.actualizarTotal(),
        (id) => this.eliminarItem(id)
      );
      this.actualizarTotal();
    }
  }

  eliminarItem(id) {
    delete this.items[id];
    this.actualizarTotal();
  }

  actualizarTotal() {
    this.total = Object.values(this.items).reduce((sum, item) => {
      return sum + (item.precio * item.cantidad);
    }, 0);

    this.totalLabel.textContent = `$${this.total.toFixed(2)}`;
  }

  seleccionarMetodoPago(metodo) {
    // Oculta todos los inputs primero
    Object.values(this.paymentInputs).forEach(input => {
      input.style.display = 'none';
    });

    // Muestra el input correspondiente
    if (this.paymentInputs[metodo]) {
      this.paymentInputs[metodo].style.display = 'block';
      this.paymentInputs[metodo].placeholder = `$${this.total.toFixed(2)}`;
    }
  }

  filtrarClientes() {
    // Implementar lógica de filtrado similar a Python
    console.log('Filtrando clientes...');
  }

  vender(accion = "Vender") {
    const clienteId = this.clienteCombo.value;
    alert(clienteId)
    const vendedorId = datos.id;

    if (!clienteId) {
      alert('Selecciona un cliente');
      return;
    }

    // Construir productos
    const productos = Object.values(this.items).map(item => ({
      codigo: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio
    }));
    if (productos.length === 0) {
      alert('Agrega productos');
      return;
    }

    let metodosPago = [];
    // Solo para ventas y apartados tomamos métodos de pago
    if (accion === "Vender" || accion === "Apartar") {
      metodosPago = Array.from(document.querySelectorAll('.payment-input'))
        .filter(input => input.value.trim() !== '')
        .map(input => ({
          metodo: input.dataset.method,
          valor: parseFloat(input.value)
        }));
      if (metodosPago.length === 0 && accion === "Vender") {
        metodosPago = [{
          metodo: 'Efectivo',
          valor: this.total
        }];
      }
    }

    const totalVenta = this.total;

    // Validar pagos solo para venta y apartado
    if (accion === "Vender") {
      // Para venta: pagos deben cubrir exactamente el total
      if (!validarYProcesarPago(metodosPago, totalVenta)) {
        alert('El/los pagos no cubren el total de la venta.');
        return;
      }
    } else if (accion === "Apartar") {
      // Validación para apartado: al menos un pago > 0 y la suma menor al total
      const sumaPagos = metodosPago.reduce((acc, pago) => acc + (parseFloat(pago.valor) || 0), 0);
      const tienePagoMayorCero = metodosPago.some(pago => parseFloat(pago.valor) > 0);

      if (!tienePagoMayorCero) {
        alert('Agrega al menos un pago mayor a $0.');
        return;
      }
      if (sumaPagos >= totalVenta) {
        alert('El total de pagos debe ser menor que el total del apartado.');
        return;
      }
    }


    // Construir objeto para API según acción
    let jsonData = {
      vendedor_id: vendedorId,
      cliente_id: clienteId,
      total_venta: totalVenta,
      productos: productos
    };

    let apiUrl = "";
    if (accion === "Vender") {
      jsonData['metodos_pago'] = metodosPago;
      apiUrl = 'api/crear_venta';
    } else if (accion === "Cotizar") {
      // Aquí no necesitas métodos de pago
      apiUrl = 'api/crear_cotizacion';
    } else if (accion === "Apartar") {
      jsonData['metodos_pago'] = metodosPago;
      apiUrl = 'api/crear_apartado';
    } else {
      alert("Acción inválida");
      return;
    }

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    })
      .then(async res => {
        const responseText = await res.text();

        if (!res.ok) {
          console.error("❌ ERROR:", responseText);
          throw new Error(`Error del servidor: ${res.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log(data)
        if (accion === "Cotizar"){
          alert("hola")
          mostrarPDF(data.pdf)          
        }
        alert('✅ Operación registrada correctamente');

        this.items = {};
        this.total = 0;
        this.totalLabel.textContent = '$0.00';
        this.itemsContainer.innerHTML = '';

        // Limpiar inputs de métodos de pago (solo para apartados y ventas)
        if (accion === "Vender" || accion === "Apartar") {
          document.querySelectorAll('.payment-input').forEach(input => {
            input.value = '';
          });
        }

        // Imprimir ticket si es venta
        if (accion === "Vender") {
          await imprimirTicket(data.id);
        }
      })
      .catch(err => {
        console.error("❌ Fallo al registrar operación:", err.message);
        alert(`Error al registrar operación:\n${err.message}`);
      });
  }


}

async function cargarMetodosPago() {
  try {
    const response = await fetch('/api/metodos_pago');
    const data = await response.json();

    if (!response.ok) {
      console.error('Error:', data.mensaje);
      return;
    }

    const paymentMethodsContainer = document.querySelector('.payment-methods');
    paymentMethodsContainer.innerHTML = ''; // Limpiar contenedor
    // Mostrar todos como botones
    data.metodos.forEach(metodo => {
      const metodoElement = crearElementoMetodoPago(metodo);
      paymentMethodsContainer.appendChild(metodoElement);
    });
  } catch (error) {
    console.error('Error al cargar métodos de pago:', error);
  }
}

function crearElementoMetodoPago(metodo) {
  const div = document.createElement('div');
  div.className = 'payment-option';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'payment-input';
  input.id = `input-${metodo.id}`;
  input.placeholder = `${metodo.nombre}`;
  input.dataset.method = metodo.nombre;

  // Evento opcional: enfocar al hacer clic en el campo
  input.addEventListener('focus', () => {
    input.style.display = 'block'; // opcional, solo si se quiere asegurar
  });

  div.appendChild(input);
  return div;
}



function mostrarInputPago(metodo) {
  const inputId = `input-${metodo.id}`;
  let input = document.getElementById(inputId);

  // Si no existe el input, lo creamos
  if (!input) {
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'payment-input';
    input.id = inputId;
    input.placeholder = '$0';
    input.dataset.method = metodo.nombre;

    // Insertar después del botón
    let parentElement = document.querySelector(`[data-id="${metodo.id}"]`).parentNode;
    parentElement.appendChild(input);
  }

  // Alternar visibilidad solo de este input
  const visible = input.style.display === 'block';

  // Ocultar todos los inputs primero
  document.querySelectorAll('.payment-input').forEach(el => el.style.display = 'none');

  // Si ya estaba visible, lo ocultamos. Si no, lo mostramos.
  input.style.display = visible ? 'none' : 'block';

  if (!visible) {
    input.focus();
  }
}


// Uso:
const ticket = new TicketDeVenta();

// Llamar la función al cargar la página
document.addEventListener('DOMContentLoaded', cargarMetodosPago);


// Modificar el evento change del select
// document.querySelector('.otros-metodos').addEventListener('change', function() {
//     const metodoSeleccionado = this.value;
//     if (metodoSeleccionado) {
//         // Remover selección previa
//         document.querySelectorAll('.otros-metodos option').forEach(opt => {
//             opt.style.fontWeight = 'normal';
//         });

//         // Resaltar opción seleccionada
//         this.querySelector(`option[value="${metodoSeleccionado}"]`).style.fontWeight = 'bold';

//         // Mostrar input para este método
//         mostrarInputPago({ 
//             id: metodoSeleccionado, 
//             nombre: this.options[this.selectedIndex].text 
//         });
//     }
// });
const clienteCombo = document.getElementById('clientes');
const cargarClientes = async () => {

  try {
    const response = await fetch('/api/clientes');
    if (!response.ok) {
      throw new Error('Error al cargar los clientes');
    }
    const clientes = await response.json();

    // Limpiar el combo antes de llenarlo
    clienteCombo.innerHTML = '<option value="">Seleccionar cliente</option>';

    // Llenar el combo con los clientes
    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.documento;
      option.textContent = cliente.nombre;
      clienteCombo.appendChild(option);
    });
  } catch (error) {
    console.error(error);
  }
};
document.addEventListener('DOMContentLoaded', () => {
  console.log(datos)

  // Función para cargar los clientes desde la API


  // Llamar a la función para cargar los clientes al cargar la página
  cargarClientes();
});

// Funciones para imprimir ticket e historial
async function imprimirTicket(id) {
  const venta = await obtenerDatosJSONVentasPorID(id);

  if (!venta || !venta.productos) {
    alert('❌ Venta no encontrada o sin productos');
    return;
  }

  const fecha = venta.fecha;
  const cliente = venta.cliente || 'Consumidor Final';
  const vendedor = venta.vendedor || 'N/D';
  const productos = venta.productos;
  const desglose = venta.desglose_pagos || {};

  let productosTexto = productos.map(p => {
    const total = p.cantidad * p.precio_unitario;
    return `${p.nombre}\n  ${p.cantidad} x $${puntos(p.precio_unitario.toFixed(2))}  =  $${puntos(total.toFixed(2))}`;

  }).join('\n');

  let pagoTexto = Object.entries(desglose).map(
    ([metodo, monto]) => `${metodo}: $${puntos(monto.toFixed(2))}`
  ).join('\n');

  const totalVenta = productos.reduce((sum, p) => sum + p.precio_unitario * p.cantidad, 0);
  const impuestos = venta.impuestos || 0;
  const descuento = venta.descuento || 0;
  const totalFinal = totalVenta + impuestos - descuento;

  const ticket = `
<html>
<head>
  <title>Ticket ${venta.id}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }

      body {
        margin: 0;
        font-family: monospace;
        font-size: 11px;
        white-space: pre;
      }

      pre {
        margin: 0;
        padding: 5px 10px;
      }
    }

    body {
      font-family: monospace;
      font-size: 11px;
      white-space: pre;
    }

    pre {
      margin: 0;
      padding: 5px 10px;
    }
  </style>
</head>
<body>
<pre>
    *** TICKET DE VENTA ***
-------------------------------
Venta ID: ${venta.id}
Fecha: ${fecha}
Cliente: ${cliente}
Vendedor: ${vendedor}
-------------------------------
Productos:
${productosTexto}
-------------------------------
Subtotal:       $${puntos(totalVenta.toFixed(2))}
Descuento:      $${puntos(descuento.toFixed(2))}
IVA:            $${puntos(impuestos.toFixed(2))}
-------------------------------
TOTAL:          $${puntos(totalFinal.toFixed(2))}

Métodos de Pago:
${pagoTexto}
-------------------------------
Gracias por su compra
</pre>
</body>
</html>
`;

  const ventana = window.open('', ''); // ancho aproximado de 80mm en píxeles
  ventana.document.write(ticket);
  ventana.document.close();
  ventana.focus();
  ventana.print();
  ventana.close();
}

async function obtenerDatosJSONVentasPorID(id) {
  try {
    const response = await fetch(`/api/ventas/${id}/detalle`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;  // Usa objeto JS normal
  } catch (error) {
    console.error("Error al obtener datos de ventas:", error);
    return {
      desglose_pagos: {},
      productos: []
    };
  }
}

function validarYProcesarPago(metodos_pago, totalVenta) {
  if (!totalVenta) {
    return
  }
  const sumaPagos = metodos_pago.reduce((sum, item) => sum + item.valor, 0);

  if (sumaPagos !== totalVenta) {
    alert(`❌ Error: suma ${sumaPagos} no coincide con total ${totalVenta}`);
    return false; // ✅ corta el flujo
  }

  // ✅ Si pasa la validación, sigue con el procesamiento
  console.log('✅ Pagos correctos, procesando...');
  // Aquí iría tu llamada a la API, por ejemplo:
  // enviarPagosAPI(metodos_pago);
  return true;
}
