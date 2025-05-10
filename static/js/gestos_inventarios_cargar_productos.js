
function cargar_productos() {
    fetch('/api/productos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        const tabla_productos = document.getElementById('tabla-inventario');
        const tbody = tabla_productos.querySelector('tbody');
        
        // Limpiar tbody antes de agregar nuevos productos
        tbody.innerHTML = '';
        // Iterar sobre los productos y crear filas
        data.forEach(producto => {
          const fila = document.createElement('tr');
          fila.innerHTML = `
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>${producto.categoria || 'Sin categoría'}</td>
            <td>${producto.stock}</td>
            <td>$${producto.precio_compra.toFixed(2)}</td>
            <td>$${producto.precio_venta.toFixed(2)}</td>
            <td>
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-info" onclick="ver_detalle_producto('${producto.codigo}')">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editar_producto('${producto.codigo}')">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminar_producto('${producto.codigo}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          `;
          
          tbody.appendChild(fila);
        });
      })
      .catch(err => {
        console.error("Error cargando productos:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los productos. Intente nuevamente.'
        });
      });
}

// Funciones adicionales para manejar acciones de productos
function ver_detalle_producto(codigo) {
    fetch(`/api/productos/${codigo}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(producto => {
        Swal.fire({
            title: 'Detalles del Producto',
            html: `
                <div class="text-start">
                    <p><strong>Código:</strong> ${producto.codigo}</p>
                    <p><strong>Nombre:</strong> ${producto.nombre}</p>
                    <p><strong>Categoría:</strong> ${producto.categoria || 'Sin categoría'}</p>
                    <p><strong>Stock:</strong> ${producto.stock}</p>
                    <p><strong>Precio Compra:</strong> $${producto.precio_compra.toFixed(2)}</p>
                    <p><strong>Precio Venta:</strong> $${producto.precio_venta.toFixed(2)}</p>
                </div>
            `,
            icon: 'info'
        });
    })
    .catch(err => {
        console.error("Error obteniendo detalles del producto:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los detalles del producto.'
        });
    });
}

function editar_producto(codigo) {
    // Redirigir a página de edición o abrir modal de edición
    window.location.href = `/productos/editar/${codigo}`;
}

function eliminar_producto(codigo) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/productos/${codigo}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Error al eliminar el producto');
                }
                return res.json();
            })
            .then(() => {
                Swal.fire(
                    'Eliminado',
                    'El producto ha sido eliminado.',
                    'success'
                );
                // Recargar la tabla de productos
                cargar_productos();
            })
            .catch(err => {
                console.error("Error eliminando producto:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el producto.'
                });
            });
        }
    });
}

// Cargar productos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargar_productos();
});
