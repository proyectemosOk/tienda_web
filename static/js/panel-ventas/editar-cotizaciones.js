// === Modal Ver ===
function mostrarModalCotizacionVer(data) {
    const cotizacion = data.cotizacion.cotizacion;
    const detalles = data.cotizacion.detalles;

    const modal = document.getElementById("modalCotizacion");
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span class="close" onclick="cerrarModal()">&times;</span>
                <h2>Cotización <span class="cotization-id">#${cotizacion.id}</span> </h2>
                
            </div>
            <div class="modal-body">
                ${generarInfoCotizacion(cotizacion)}
                ${generarTablaProductos(detalles, false)} 
                <div class="total-section">
                    <div class="total-label">Total de la Venta</div>
                    <div class="total-amount">$${cotizacion.total_venta.toFixed(2)}</div>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// === Modal Editar ===
function mostrarModalCotizacionEditar(data) {
    const cotizacion = data.cotizacion.cotizacion;
    let detalles = [...data.cotizacion.detalles];

    const modal = document.getElementById("modalCotizacion");

    function render() {
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="close" onclick="cerrarModal()">&times;</span>
                    <h2>Editar Cotización</h2>
                    <div class="cotization-id">#${cotizacion.id}</div>
                </div>
                <div class="modal-body">
                    ${generarInfoCotizacion(cotizacion)}

                    <div class="product-search">
                        <input type="text" id="codigoProducto" placeholder="Código de producto">
                        <button onclick="buscarProductoCodigo()">Buscar</button>
                    </div>

                    <div class="product-add">
                        <input type="number" id="cantidadProducto" min="1" value="1" placeholder="Cantidad">
                        <input type="number" id="precioProducto" step="0.01" placeholder="Precio de venta">
                        <button onclick="agregarProductoManual()">Agregar</button>
                    </div>


                    ${generarTablaProductos(detalles, true)}

                    <div class="total-section">
                        <div class="total-label">Total de la Venta</div>
                        <div class="total-amount">$${calcularTotal(detalles).toFixed(2)}</div>
                    </div>

                    <div class="actions">
                        <button onclick="guardarCotizacion(${cotizacion.id})">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        `;
    }

    render();

    // 👇 Mostrar modal
    modal.style.display = 'flex';
    modal.classList.add('show');
}


// === Helpers ===
function generarInfoCotizacion(cotizacion) {
    return `
        <div class="info-grid">
            <div class="info-card"><div class="info-label">Cliente</div><div class="info-value">${cotizacion.cliente_nombre}</div></div>
            <div class="info-card"><div class="info-label">Vendedor</div><div class="info-value">${cotizacion.vendedor_nombre}</div></div>
            <div class="info-card"><div class="info-label">Fecha</div><div class="info-value">${cotizacion.fecha}</div></div>
            <div class="info-card"><div class="info-label">Estado</div><div class="info-value">
                <span class="status-badge ${estadoTextoCotizacion(cotizacion.estado)}">
                    ${estadoTextoCotizacion(cotizacion.estado)}
                </span>
            </div></div>
        </div>
    `;
}

function generarTablaProductos(detalles, editable = false) {
    return `
        <div class="products-section">
            <h3 class="section-title">Productos</h3>
            <div class="products-table">
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                            ${editable ? "<th>Acciones</th>" : ""}
                        </tr>
                    </thead>
                    <tbody>
                        ${detalles.map((d, i) => `
                            <tr>
                                <td>${d.producto_nombre}</td>
                                <td>${d.cantidad}</td>
                                <td>$${d.precio_unitario.toFixed(2)}</td>
                                <td class="price">$${(d.precio_unitario * d.cantidad).toFixed(2)}</td>
                                ${editable
                                    ? `<td>
                                            <button class="btn-delete" onclick="eliminarProducto(${i})">
                                                <img src="/static/svg/trash.svg" alt="Eliminar" width="20" height="20">
                                            </button>
                                       </td>`
                                    : ""}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


function calcularTotal(detalles) {
    return detalles.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0);
}

// === Actualizar valores en edición ===
window.actualizarCantidad = function (index, value) {
    detalles[index].cantidad = parseInt(value) || 1;
    mostrarModalCotizacionEditar({ cotizacion: { cotizacion: {}, detalles } }); // re-render
};

window.actualizarPrecio = function (index, value) {
    detalles[index].precio_unitario = parseFloat(value) || 0;
    mostrarModalCotizacionEditar({ cotizacion: { cotizacion: {}, detalles } }); // re-render
};

window.agregarProductoManual = function () {
    const cantidad = parseInt(document.getElementById("cantidadProducto").value) || 1;
    const precio = parseFloat(document.getElementById("precioProducto").value) || 0;

    if (!precio) return alert("Ingrese un precio válido");

    detalles.push({
        producto_id: "manual", // puedes ajustar este campo
        producto_nombre: "Producto agregado manualmente",
        cantidad: cantidad,
        precio_unitario: precio
    });

    render();
};