// gestor_entradas.js

document.addEventListener("DOMContentLoaded", () => {
    // Variables globales
    const proveedorInput = document.getElementById("proveedor");
    const buscarProveedorBtn = document.getElementById("buscar-proveedor");
    const codigoProductoInput = document.getElementById("codigo-producto");
    const buscarProductoBtn = document.getElementById("buscar-producto");
    const agregarProductoBtn = document.getElementById("agregar-producto");
    const finalizarEntradaBtn = document.getElementById("finalizar-entrada");
    const listaProductos = document.getElementById("lista-productos");
    const totalEntrada = document.getElementById("total-entrada");

    // Array para almacenar productos agregados
    let productosAgregados = [];

    // Función para buscar proveedor (simulación)
    buscarProveedorBtn.addEventListener("click", () => {
        const proveedor = proveedorInput.value.trim();
        if (!proveedor) {
            alert("Por favor, ingresa un código o nombre de proveedor.");
            return;
        }
        // Aquí puedes implementar la lógica para buscar un proveedor en el backend
        console.log(`Buscando proveedor: ${proveedor}`);
        // Simulación de búsqueda exitosa
        alert(`Proveedor encontrado: ${proveedor}`);
    });

    // Función para buscar producto (simulación)
    buscarProductoBtn.addEventListener("click", () => {
        const codigoProducto = codigoProductoInput.value.trim();
        if (!codigoProducto) {
            alert("Por favor, ingresa un código de producto.");
            return;
        }
        // Aquí puedes implementar la lógica para buscar un producto en el backend
        console.log(`Buscando producto: ${codigoProducto}`);
        // Simulación de búsqueda exitosa
        document.getElementById("nombre-producto").value = "Producto de ejemplo";
    });

    // Función para agregar un producto a la tabla
    agregarProductoBtn.addEventListener("click", () => {
        const codigoProducto = codigoProductoInput.value.trim();
        const nombreProducto = document.getElementById("nombre-producto").value.trim();
        const cantidad = parseInt(document.getElementById("cantidad").value.trim());
        const precioCompra = parseFloat(document.getElementById("precio-compra").value.trim());
        const precioVenta = parseFloat(document.getElementById("precio-venta").value.trim());
        const fechaVencimiento = document.getElementById("fecha-vencimiento").value;

        // Validaciones
        if (!codigoProducto || !nombreProducto || isNaN(cantidad) || isNaN(precioCompra) || isNaN(precioVenta) || !fechaVencimiento) {
            alert("Por favor, completa todos los campos del producto.");
            return;
        }
        if (cantidad <= 0 || precioCompra <= 0 || precioVenta <= 0) {
            alert("Cantidad, precio de compra y precio de venta deben ser mayores a 0.");
            return;
        }

        // Calcular subtotal
        const subtotal = cantidad * precioCompra;

        // Agregar producto al array
        productosAgregados.push({
            codigoProducto,
            nombreProducto,
            cantidad,
            precioCompra,
            precioVenta,
            fechaVencimiento,
            subtotal
        });

        // Actualizar la tabla
        actualizarTabla();

        // Limpiar los campos del formulario de producto
        limpiarFormularioProducto();
    });

    // Función para actualizar la tabla de productos
    function actualizarTabla() {
        // Limpiar la tabla
        listaProductos.innerHTML = "";

        // Variables para calcular el total
        let total = 0;

        // Recorrer los productos agregados y agregarlos a la tabla
        productosAgregados.forEach((producto, index) => {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${producto.codigoProducto}</td>
                <td>${producto.nombreProducto}</td>
                <td>${producto.cantidad}</td>
                <td>${producto.precioCompra.toFixed(2)}</td>
                <td>${producto.precioVenta.toFixed(2)}</td>
                <td>${producto.fechaVencimiento}</td>
                <td>${producto.subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;

            // Agregar evento para eliminar producto
            fila.querySelector("button").addEventListener("click", (e) => {
                const index = e.target.closest("button").dataset.index;
                productosAgregados.splice(index, 1);
                actualizarTabla();
            });

            listaProductos.appendChild(fila);

            // Sumar al total
            total += producto.subtotal;
        });

        // Actualizar el total
        totalEntrada.textContent = total.toFixed(2);
    }

    // Función para limpiar el formulario de producto
    function limpiarFormularioProducto() {
        codigoProductoInput.value = "";
        document.getElementById("nombre-producto").value = "";
        document.getElementById("cantidad").value = "";
        document.getElementById("precio-compra").value = "";
        document.getElementById("precio-venta").value = "";
        document.getElementById("fecha-vencimiento").value = "";
    }

    // Función para finalizar la entrada
    finalizarEntradaBtn.addEventListener("click", () => {
        if (productosAgregados.length === 0) {
            alert("No hay productos agregados a la entrada.");
            return;
        }

        // Aquí puedes enviar los datos al backend
        const proveedor = proveedorInput.value.trim();
        const numeroFactura = document.getElementById("numero-factura").value.trim();
        const fechaEmision = document.getElementById("fecha-emision").value;

        if (!proveedor || !numeroFactura || !fechaEmision) {
            alert("Por favor, completa los datos del proveedor y la factura.");
            return;
        }

        const entrada = {
            proveedor,
            numeroFactura,
            fechaEmision,
            productos: productosAgregados
        };

        console.log("Enviando entrada al backend:", entrada);

        // Aquí puedes usar fetch o axios para enviar los datos al servidor
        alert("Entrada registrada exitosamente.");
        // Limpiar todo después de finalizar
        limpiarFormularioProducto();
        listaProductos.innerHTML = "";
        totalEntrada.textContent = "0.00";
        productosAgregados = [];
    });
});
