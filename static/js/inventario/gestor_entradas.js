// gestor_entradas.js

document.addEventListener("DOMContentLoaded", () => {
    // Obtener los inputs
    const emisionInput = document.getElementById('fecha-emision');
    const vencimientoInput = document.getElementById('fecha-vencimiento-factura');

    // Obtener fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    emisionInput.value = hoyStr;

    // Calcular fecha + 1 mes
    const vencimiento = new Date(hoy);
    vencimiento.setMonth(vencimiento.getMonth() + 1);
    const vencimientoStr = vencimiento.toISOString().split('T')[0];
    vencimientoInput.value = vencimientoStr;
    let pagosAgregados = [];
    let usuarioId = datos.id; // Ajusta o remueve si aún no usas login
    // Variables globales
    const proveedorInput = document.getElementById("proveedor");
    const buscarProveedorBtn = document.getElementById("buscar-proveedor");
    const codigoProductoInput = document.getElementById("codigo-producto");
    const buscarProductoBtn = document.getElementById("buscar-producto");
    const agregarProductoBtn = document.getElementById("agregar-producto");
    const finalizarEntradaBtn = document.getElementById("finalizar-entrada");
    const listaProductos = document.getElementById("lista-productos");
    const totalEntrada = document.getElementById("total-entrada");

    let productosAgregados = [];
    // Referencias
    const agregarPagoBtn = document.getElementById("agregar-pago");
    const listaPagos = document.getElementById("lista-pagos");

    document.getElementById("factura-pagada").addEventListener("change", function () {
        document.getElementById("seccion-pagos").style.display = this.checked ? "block" : "none";
    });

    // 🔎 Buscar proveedor
    buscarProveedorBtn.addEventListener("click", () => {
        const termino = proveedorInput.value.trim();

        if (!termino) {
            Swal.fire({
                icon: 'warning',
                title: 'Dato requerido',
                text: 'Por favor ingresa un código o nombre de proveedor.'
            });
            return;
        }

        fetch(`/api/proveedores/buscar?termino=${encodeURIComponent(termino)}`)
            .then(res => {
                if (!res.ok) throw new Error("No se encontró el proveedor");
                return res.json();
            })
            .then(proveedor => {
                Swal.fire({
                    icon: 'success',
                    title: 'Proveedor encontrado',
                    html: `
                    <b>${proveedor.nombre}</b><br>
                    Documento: ${proveedor.documento}
                `
                });

                // Mostrar en inputs
                document.getElementById("nombre-proveedor").value = proveedor.nombre || "";
                document.getElementById("rut-proveedor").value = proveedor.documento || "";

                // Guardar el ID real si lo necesitas luego
                proveedorInput.dataset.proveedorId = proveedor.id;
            })
            .catch(err => {
                console.error("Error al buscar proveedor:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Proveedor no encontrado',
                    text: 'No se encontró un proveedor con ese término.'
                });

                document.getElementById("nombre-proveedor").value = "";
                document.getElementById("rut-proveedor").value = "";
            });
    });



    // 🔎 Buscar producto en el backend
    buscarProductoBtn.addEventListener("click", () => {
        const terminoBusqueda = codigoProductoInput.value.trim();

        if (!terminoBusqueda) {
            Swal.fire({
                icon: 'warning',
                title: 'Dato requerido',
                text: 'Por favor ingresa un código o nombre de producto.'
            });
            return;
        }

        fetch(`/api/productos/${encodeURIComponent(terminoBusqueda)}`)
            .then(res => res.json())
            .then(producto => {
                if (producto.ok) {
                    cargarDatosProducto(producto.detalles);
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sin resultados',
                        text: 'No se encontró ningún producto con ese código.'
                    });
                }
            })
            .catch(err => {
                console.error("Error buscando producto:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un error al buscar el producto.'
                });
            });
    });

    // ✅ Cargar datos del producto en el formulario
    function cargarDatosProducto(producto) {
        codigoProductoInput.value = producto.codigo;
        document.getElementById("nombre-producto").value = producto.nombre;
        document.getElementById("cantidad").focus();
    }

    // ✅ Agregar producto a la tabla
    agregarProductoBtn.addEventListener("click", () => {
        const codigoProducto = codigoProductoInput.value.trim();
        const nombreProducto = document.getElementById("nombre-producto").value.trim();
        const cantidad = parseInt(document.getElementById("cantidad").value.trim());
        const precioCompra = parseFloat(document.getElementById("precio-compra").value.trim());
        const precioVenta = parseFloat(document.getElementById("precio-venta").value.trim());
        const fechaVencimiento = document.getElementById("fecha-vencimiento").value;

        // ✅ Validaciones
        if (!codigoProducto || !nombreProducto || isNaN(cantidad) || isNaN(precioCompra) || isNaN(precioVenta) || !fechaVencimiento) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa todos los campos del producto, incluyendo la fecha de vencimiento.'
            });
            return;
        }

        if (cantidad <= 0 || precioCompra <= 0 || precioVenta <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Valores inválidos',
                text: 'Cantidad y precios deben ser mayores a 0.'
            });
            return;
        }

        const subtotal = cantidad * precioCompra;

        // ✅ Guardar el producto con todos sus datos, incluyendo fecha de vencimiento
        productosAgregados.push({
            codigo_producto: codigoProducto,
            nombre_producto: nombreProducto,
            cantidad,
            precio_compra: precioCompra,
            precio_venta: precioVenta,
            fecha_vencimiento: fechaVencimiento,
            subtotal
        });

        actualizarTabla();
        limpiarFormularioProducto();
    });


    // ✅ Actualizar tabla de productos
    function actualizarTabla() {
        listaProductos.innerHTML = "";
        let total = 0;

        productosAgregados.forEach((producto, index) => {
            console.log(producto)
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${producto.codigo_producto}</td>
                <td>${producto.nombre_producto}</td>
                <td>${producto.cantidad}</td>
                <td>$${producto.precio_compra.toFixed(2)}</td>
                <td>$${producto.precio_venta.toFixed(2)}</td>
                <td>${producto.fecha_vencimiento}</td>
                <td>$${producto.subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;

            fila.querySelector("button").addEventListener("click", () => {
                productosAgregados.splice(index, 1);
                actualizarTabla();
            });

            listaProductos.appendChild(fila);
            total += producto.subtotal;
        });

        totalEntrada.textContent = `$${total.toFixed(2)}`;
    }

    // ✅ Limpiar formulario producto
    function limpiarFormularioProducto() {
        codigoProductoInput.value = "";
        document.getElementById("nombre-producto").value = "";
        document.getElementById("cantidad").value = "";
        document.getElementById("precio-compra").value = "";
        document.getElementById("precio-venta").value = "";
        document.getElementById("fecha-vencimiento").value = "";
    }

    // ✅ Finalizar entrada
    finalizarEntradaBtn.addEventListener("click", () => {
        if (productosAgregados.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin productos',
                text: 'Agrega al menos un producto antes de finalizar.'
            });
            return;
        }

        // Obtener datos del formulario
        const proveedor = parseInt(proveedorInput.dataset.proveedorId || 0);
        const numeroFactura = document.getElementById("numero-factura").value.trim();
        const fechaEmision = document.getElementById("fecha-emision").value;
        const fechaVencimientoFactura = document.getElementById("fecha-vencimiento-factura")?.value || null;

        if (!proveedor || !numeroFactura || !fechaEmision) {
            Swal.fire({
                icon: 'warning',
                title: 'Datos incompletos',
                text: 'Completa los datos del proveedor, número de factura y fecha de emisión.'
            });
            return;
        }

        // Validar pagos si la factura tiene abonos
        if (pagosAgregados.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Pagos faltantes',
                text: 'Agrega al menos un pago para registrar la forma de pago.'
            });
            return;
        }

        // Calcular monto total de la factura
        const montoTotal = productosAgregados.reduce((sum, item) => sum + item.subtotal, 0);

        // Calcular monto pagado
        const montoPagado = pagosAgregados.reduce((sum, pago) => sum + pago.monto, 0);

        // Simular usuario logueado (o toma de sesión)
        usuarioId = datos.id; // Ajusta o remueve si aún no usas login

        // Construir el objeto para enviar
        const factura = {
            proveedor,
            numero_factura: numeroFactura,
            fecha_emision: fechaEmision,
            fecha_vencimiento: fechaVencimientoFactura,
            usuario_id: usuarioId,
            monto_total: montoTotal,
            monto_pagado: montoPagado,
            productos: productosAgregados,
            pagos: pagosAgregados
        };

        console.log("📦 Factura lista para enviar:", factura);

        // Mostrar alerta de envío
        Swal.fire({
            title: 'Enviando',
            text: 'Registrando la entrada en el sistema...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Enviar al backend
        fetch('/api/entradas_facturas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(factura)
        })
            .then(res => {
                if (!res.ok) throw new Error('Error al guardar la entrada');
                return res.json();
            })
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Registro exitoso',
                    text: 'La entrada se ha guardado correctamente.'
                });
                // Limpiar formulario y variables
                limpiarFormularioProducto();
                listaProductos.innerHTML = "";
                totalEntrada.textContent = "$0.00";
                productosAgregados = [];
                pagosAgregados = [];
                listaPagos.innerHTML = "";
                proveedorInput.value = "";
                document.getElementById("numero-factura").value = "";
                document.getElementById("fecha-emision").value = "";
                document.getElementById("nombre-proveedor").value = "";
                document.getElementById("rut-proveedor").value = "";
                cargar_productos()
                if (document.getElementById("fecha-vencimiento-factura")) {
                    document.getElementById("fecha-vencimiento-factura").value = "";
                }
            })
            .catch(err => {
                console.error("❌ Error guardando entrada:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo registrar la entrada. Intenta nuevamente.'
                });
            });
    });

    // Escuchar el botón de agregar pago
    agregarPagoBtn.addEventListener("click", () => {
        cargarTiposPago().then(tiposPago => {

            if (!tiposPago || Object.keys(tiposPago).length === 0) {
                Swal.fire("Advertencia", "No hay tipos de pago configurados. Por favor crea al menos uno.", "warning");
                return;
            }

            // Adaptar objeto {id: nombre} a opciones
            const opciones = Object.entries(tiposPago).map(
                ([id, nombre]) => `<option value="${id}">${nombre}</option>`
            ).join('');

            Swal.fire({
                title: "Agregar Pago",
                html: `
        <div class="mb-3 text-start">
          <label class="form-label">Tipo de Pago</label>
          <select class="form-select" id="pago-tipo">
            ${opciones}
          </select>
        </div>
        <div class="mb-3 text-start">
          <label class="form-label">Fecha de Pago</label>
          <input type="date" class="form-control" id="pago-fecha" value="${(new Date()).toISOString().split('T')[0]}">
        </div>
        <div class="mb-3 text-start">
          <label class="form-label">Monto</label>
          <input type="number" class="form-control" id="pago-monto" min="1" step="0.01">
        </div>
        <div class="mb-3 text-start">
          <label class="form-label">Observaciones</label>
          <input type="text" class="form-control" id="pago-observaciones" placeholder="Opcional">
        </div>
      `,
                showCancelButton: true,
                confirmButtonText: 'Agregar',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    const tipoPagoId = parseInt(document.getElementById("pago-tipo").value);
                    const fechaPago = document.getElementById("pago-fecha").value;
                    const monto = parseFloat(document.getElementById("pago-monto").value);
                    const observaciones = document.getElementById("pago-observaciones").value.trim();
                    const nombreTipoPago = tiposPago[tipoPagoId] || "";

                    if (!tipoPagoId || isNaN(monto) || monto <= 0 || !fechaPago) {
                        Swal.showValidationMessage("Todos los campos obligatorios deben estar completos y correctos.");
                        return false;
                    }

                    return {
                        tipo_pago_id: tipoPagoId,
                        nombre_tipo_pago: nombreTipoPago,
                        fecha_pago: fechaPago,
                        monto,
                        observaciones
                    };
                }
            }).then(result => {
                if (result.isConfirmed) {
                    pagosAgregados.push(result.value);
                    renderizarTablaPagos();
                }
            });
        });
    });


    // Función para renderizar la tabla de pagos
    function renderizarTablaPagos() {
        listaPagos.innerHTML = "";

        pagosAgregados.forEach((pago, index) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
      <td>${pago.fecha_pago}</td>
      <td>${pago.nombre_tipo_pago}</td>
      <td>${pago.monto.toFixed(2)}</td>
      <td>
        <button class="btn btn-danger btn-sm" data-index="${index}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
            // Botón para eliminar pago
            fila.querySelector("button").addEventListener("click", () => {
                pagosAgregados.splice(index, 1);
                renderizarTablaPagos();
            });
            listaPagos.appendChild(fila);
        });
    }

    // Función para cargar tipos de pago desde tu API
    async function cargarTiposPago() {
        try {
            const res = await fetch('/api/tipos_pago');
            const data = await res.json();

            console.log("Tipos de pago recibidos:", data);

            if (data) {
                return data;
            } else {
                console.warn("No se recibieron tipos de pago válidos:", data);
                return [];
            }
        } catch (err) {
            console.error("Error al cargar tipos de pago:", err);
            return [];
        }
    }


});
