let pagina_actual = 1;
let total_paginas = 1;
let imagenFileSeleccionada = null;


async function cargar_productos() {
    const search = document.getElementById('buscar-producto-inventario').value.trim();
    try {
        const res = await fetch(`/api/productos?pagina=${pagina_actual}&search=${encodeURIComponent(search)}`);
        const data = await res.json();

        const tabla_productos = document.getElementById('tabla-inventario');
        const tbody = tabla_productos.querySelector('tbody');
        tbody.innerHTML = '';

        data.productos.forEach(producto => {
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
                            <img src="${iconoVer}" alt="Ver" width="16">
                        </button>
                        ${['superAdmin', 'admin'].includes(datos.rol) ? `
                            <button class="btn btn-sm btn-warning" onclick="editar_producto('${producto.codigo}')">
                                <img src="${iconoEditar}" alt="Editar" width="16">
                            </button>
                        ` : ''}
                        ${['superAdmin', 'admin'].includes(datos.rol) ? `
                            <button class="btn btn-sm btn-danger" onclick="eliminar_producto('${producto.codigo}')">
                                <img src="${iconoEliminar}" alt="Eliminar" width="16">
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;


            tbody.appendChild(fila);
        });

        // Actualizar variables de paginación
        pagina_actual = data.pagina_actual;
        total_paginas = data.total_paginas;

        // Actualizar texto de paginación
        document.getElementById('info-paginacion').textContent = `Página ${pagina_actual} de ${total_paginas}`;

        // Deshabilitar botones si corresponde
        document.getElementById('btn-pagina-anterior').disabled = pagina_actual <= 1;
        document.getElementById('btn-pagina-siguiente').disabled = pagina_actual >= total_paginas;

    } catch (err) {
        console.error("Error cargando productos:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los productos. Intente nuevamente.'
        });
    }
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
        .then(resProducto => {
            if (resProducto.ok) {
                const producto = resProducto.detalles
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
            }
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
    // Primero, obtener los detalles del producto
    fetch(`/api/productos/${codigo}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(resProducto => {
            if (resProducto.ok) {
                const producto = resProducto.detalles
                // Abrir un modal de edición usando SweetAlert
                Swal.fire({
                    title: 'Editar Producto',
                    html: `
              <div class="container">
                  <div class="row mb-3">
                      <div class="col">
                          <label class="form-label">Código</label>
                          <input type="text" id="edit-codigo" class="form-control" value="${producto.codigo}" readonly>
                      </div>
                  </div>
                  <div class="row mb-3">
                      <div class="col">
                          <label class="form-label">Nombre</label>
                          <input type="text" id="edit-nombre" class="form-control" value="${producto.nombre}">
                      </div>
                  </div>
                  <div class="row mb-3">
                      <div class="col">
                          <label class="form-label">Categoría</label>
                          <input type="text" id="edit-categoria" class="form-control" value="${producto.categoria || ''}">
                      </div>
                  </div>
                  <div class="row mb-3">
                      <div class="col">
                          <label class="form-label">Stock</label>
                          <input type="number" id="edit-stock" class="form-control" value="${producto.stock}">
                      </div>
                  </div>
                  <div class="row mb-3">
                      <div class="col">
                          <label class="form-label">Precio Compra</label>
                          <input type="number" id="edit-precio-compra" class="form-control" value="${producto.precio_compra}" step="0.01">
                      </div>
                  </div>
                  <div class="row mb-3">
                      <div class="col">
                          <label class="form-label">Precio Venta</label>
                          <input type="number" id="edit-precio-venta" class="form-control" value="${producto.precio_venta}" step="0.01">
                      </div>
                  </div>
              </div>
          `,
                    showCancelButton: true,
                    confirmButtonText: 'Guardar Cambios',
                    cancelButtonText: 'Cancelar',
                    preConfirm: () => {
                        // Validar y recoger los datos del formulario
                        const nombre = document.getElementById('edit-nombre').value.trim();
                        const categoria = document.getElementById('edit-categoria').value.trim();
                        const stock = document.getElementById('edit-stock').value;
                        const precioCompra = document.getElementById('edit-precio-compra').value;
                        const precioVenta = document.getElementById('edit-precio-venta').value;

                        // Validaciones básicas
                        if (!nombre) {
                            Swal.showValidationMessage('El nombre es obligatorio');
                            return false;
                        }

                        if (isNaN(stock) || stock < 0) {
                            Swal.showValidationMessage('El stock debe ser un número válido');
                            return false;
                        }

                        if (isNaN(precioCompra) || precioCompra < 0) {
                            Swal.showValidationMessage('El precio de compra debe ser un número válido');
                            return false;
                        }

                        if (isNaN(precioVenta) || precioVenta < 0) {
                            Swal.showValidationMessage('El precio de venta debe ser un número válido');
                            return false;
                        }

                        // Retornar los datos actualizados
                        return {
                            codigo: codigo,
                            nombre: nombre,
                            categoria: categoria,
                            stock: parseFloat(stock),
                            precio_compra: parseFloat(precioCompra),
                            precio_venta: parseFloat(precioVenta)
                        };
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Enviar los datos actualizados al servidor
                        fetch(`/api/productos/${codigo}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(result.value)
                        })
                            .then(res => {
                                if (!res.ok) {
                                    throw new Error('Error al actualizar el producto');
                                }
                                return res.json();
                            })
                            .then(() => {
                                // Mostrar mensaje de éxito
                                Swal.fire(
                                    'Actualizado',
                                    'El producto ha sido actualizado correctamente.',
                                    'success'
                                );
                                // Recargar la tabla de productos
                                cargar_productos();
                            })
                            .catch(err => {
                                console.error("Error actualizando producto:", err);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'No se pudo actualizar el producto.'
                                });
                            });
                    }
                });
            }
        })
        .catch(err => {
            console.error("Error obteniendo detalles del producto:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los detalles del producto para edición.'
            });
        });
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

function nuevo_producto_1() {
    fetch('/api/opciones_producto')
        .then(res => res.json())
        .then(data => {
            if (!data.ok) throw new Error('Error al cargar opciones');

            const categorias = data.categorias;
            const unidades = data.unidades;

            let selectCategorias = `<option value="">-- Selecciona --</option>`;
            for (const id in categorias) {
                selectCategorias += `<option value="${categorias[id]}">${categorias[id]}</option>`;
            }
            selectCategorias += `<option value="nueva">+ Nueva categoría</option>`;

            let selectUnidades = `<option value="">-- Selecciona --</option>`;
            for (const id in unidades) {
                selectUnidades += `<option value="${unidades[id]}">${unidades[id]}</option>`;
            }
            selectUnidades += `<option value="nueva">+ Nueva unidad</option>`;

            Swal.fire({
                title: 'Nuevo Producto',
                html: `<div class="container">
      <div class="row">
        <!-- Columna derecha: Datos del producto -->
        <div class="col-md-8">
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Código <span style="color: #a12727">*</span></label>
              <input type="text" id="new-codigo" class="form-control" placeholder="Código único">
            </div>
            <div class="col-md-6">
              <label class="form-label">Nombre <span style="color: #a12727">*</span></label>
              <input type="text" id="new-nombre" class="form-control" placeholder="Nombre del producto">
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-12">
              <label class="form-label">Descripción</label>
              <input type="text" id="new-descripcion" class="form-control" placeholder="Descripción del producto">
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Categoría <span style="color: #a12727">*</span></label>
              <select id="new-categoria-select" class="form-select">${selectCategorias}</select>
              <input type="text" id="new-categoria-text" class="form-control mt-2" placeholder="Nueva categoría" style="display:none;">
            </div>
            <div class="col-md-6">
              <label class="form-label">Unidad <span style="color: #a12727">*</span></label>
              <select id="new-unidad-select" class="form-select">${selectUnidades}</select>
              <input type="text" id="new-unidad-text" class="form-control mt-2" placeholder="Nueva unidad" style="display:none;">
              <input type="text" id="new-unidad-simbolo" class="form-control mt-2" placeholder="Símbolo de unidad" style="display:none;">
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Stock <span style="color: #a12727">*</span></label>
              <input type="number" id="new-stock" class="form-control" placeholder="Cantidad inicial">
            </div>
            <div class="col-md-6">
              <label class="form-label">Precio Compra <span style="color: #a12727">*</span></label>
              <input type="number" id="new-precio-compra" class="form-control" placeholder="Precio de compra" step="0.01">
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-12">
              <label class="form-label">Precio Venta <span style="color: #a12727">*</span></label>
              <input type="number" id="new-precio-venta" class="form-control" placeholder="Precio de venta" step="0.01">
            </div>
          </div>
        </div>
        <!-- Columna izquierda: Imagen -->
        <div class="col-md-4 text-center">
          <label class="form-label">Imagen del producto</label>
          <div id="imagen-preview" class="mb-2" style="border:1px solid #ccc; padding:5px;">
            <img id="imagen-vista" src="static/img_productos/img.png" alt="Vista previa" style="max-width:100%; max-height:200px; display:none;">
          </div>
          <input type="file" id="new-imagen" accept="image/*" class="form-control mb-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" id="btn-quitar-imagen" style="display:none;">
            Quitar imagen
          </button>
        </div>

      </div>
    </div>
                `,

                showCancelButton: true,
                confirmButtonText: 'Guardar Producto',
                cancelButtonText: 'Cancelar',
                width: '800px',
                didOpen: () => {
                    // Manejo de imagen
                    document.getElementById('new-imagen').addEventListener('change', (e) => {
                        imagenFileSeleccionada = e.target.files[0];
                    });

                    // Mostrar input si seleccionan "nueva unidad"
                    document.getElementById('new-unidad-select').addEventListener('change', (e) => {
                        const esNueva = e.target.value === 'nueva';
                        document.getElementById('new-unidad-text').style.display = esNueva ? 'block' : 'none';
                        document.getElementById('new-unidad-simbolo').style.display = esNueva ? 'block' : 'none';
                    });

                    // Mostrar input si seleccionan "nueva categoría"
                    document.getElementById('new-categoria-select').addEventListener('change', (e) => {
                        const esNueva = e.target.value === 'nueva';
                        document.getElementById('new-categoria-text').style.display = esNueva ? 'block' : 'none';
                    });

                    // Imagen: vista previa y quitar
                    const imagenInput = document.getElementById('new-imagen');
                    const imagenVista = document.getElementById('imagen-vista');
                    const btnQuitarImagen = document.getElementById('btn-quitar-imagen');

                    imagenInput.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                imagenVista.src = e.target.result;
                                imagenVista.style.display = 'block';
                                btnQuitarImagen.style.display = 'inline-block';
                            };
                            reader.readAsDataURL(file);
                        }
                    });

                    btnQuitarImagen.addEventListener('click', () => {
                        imagenInput.value = '';
                        imagenVista.src = '';
                        imagenVista.style.display = 'none';
                        btnQuitarImagen.style.display = 'none';
                        imagenFileSeleccionada = null;
                    });
                },
                preConfirm: () => {
                    const codigo = document.getElementById('new-codigo').value.trim();
                    const nombre = document.getElementById('new-nombre').value.trim();
                    const descripcion = document.getElementById('new-descripcion').value.trim();

                    let categoria = document.getElementById('new-categoria-select').value;
                    const nuevaCategoria = document.getElementById('new-categoria-text').value.trim();

                    let unidad = document.getElementById('new-unidad-select').value;
                    const nuevaUnidad = document.getElementById('new-unidad-text').value.trim();
                    const simboloUnidad = document.getElementById('new-unidad-simbolo').value.trim();

                    const stock = document.getElementById('new-stock').value;
                    const precioCompra = document.getElementById('new-precio-compra').value;
                    const precioVenta = document.getElementById('new-precio-venta').value;

                    const imagenInput = document.getElementById('new-imagen');
                    const imagenFile = imagenInput.files[0] || null;

                    if (!codigo) return Swal.showValidationMessage('El código es obligatorio');
                    if (!nombre) return Swal.showValidationMessage('El nombre es obligatorio');

                    if (categoria === '') return Swal.showValidationMessage('Debes seleccionar o crear una categoría');
                    if (categoria === 'nueva' && !nuevaCategoria) return Swal.showValidationMessage('Debes escribir la nueva categoría');

                    if (unidad === '') return Swal.showValidationMessage('Debes seleccionar o crear una unidad');
                    if (unidad === 'nueva' && (!nuevaUnidad || !simboloUnidad)) return Swal.showValidationMessage('Debes escribir la nueva unidad y su símbolo');

                    if (isNaN(stock) || stock < 0) return Swal.showValidationMessage('El stock debe ser un número válido');
                    if (isNaN(precioCompra) || precioCompra < 0) return Swal.showValidationMessage('El precio de compra debe ser válido');
                    if (isNaN(precioVenta) || precioVenta < 0) return Swal.showValidationMessage('El precio de venta debe ser válido');

                    return {
                        codigo,
                        nombre,
                        descripcion,
                        categoria: categoria === 'nueva' ? nuevaCategoria : categoria,
                        unidad: unidad === 'nueva' ? nuevaUnidad : unidad,
                        simbolo_unidad: unidad === 'nueva' ? simboloUnidad : null,
                        stock: parseInt(stock),
                        precio_compra: parseFloat(precioCompra),
                        precio_venta: parseFloat(precioVenta),
                        imagen_nombre: imagenFile ? imagenFile.name : null
                    };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Guardando...',
                        text: 'Estamos registrando el nuevo producto.',
                        allowOutsideClick: false,
                        didOpen: () => Swal.showLoading()
                    });

                    fetch('/api/productos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(result.value)
                    })
                        .then(res => {
                            if (!res.ok) throw new Error('Error al crear el producto');
                            return res.json();
                        })
                        .then(data => {

                            // Verifica si hay imagen seleccionada
                            console.log(data)
                            if (imagenFileSeleccionada && data.id) {
                                const formData = new FormData();
                                formData.append('imagen', imagenFileSeleccionada);
                                console.log('formData (archivo):', imagenFileSeleccionada);

                                fetch(`/api/productos/${data.id}/imagen`, {
                                    method: 'POST',
                                    body: formData
                                })
                                    .then(async res => {
                                        const respuesta = await res.json();

                                        if (!res.ok || !respuesta.ok) {
                                            throw new Error(respuesta.error || 'Error al guardar la imagen');
                                        }

                                        imagenFileSeleccionada = null;
                                        Swal.fire('¡Creado!', 'El producto y su imagen han sido registrados exitosamente.', 'success');
                                        cargar_productos();
                                    })
                                    .catch(err => {
                                        console.error("Error subiendo imagen:", err);
                                        Swal.fire('Error', 'El producto se creó pero la imagen no pudo subirse.', 'warning');
                                        cargar_productos();
                                    });

                            } else {
                                Swal.fire('¡Creado!', 'El producto ha sido registrado exitosamente.', 'success');

                                cargar_productos();
                            }
                        })
                        .catch(err => {
                            console.error("Error creando producto:", err);
                            Swal.fire('Error', 'No se pudo crear el producto. Intenta de nuevo.', 'error');
                        });
                }
            });

        })
        .catch(err => {
            console.error("Error cargando opciones:", err);
            Swal.fire('Error', 'No se pudieron cargar las opciones de categorías y unidades.', 'error');
        });
}


// Cargar productos al cargar la página
document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('btn-buscar-producto').addEventListener('click', () => {
        pagina_actual = 1; // reiniciar a la primera página
        cargar_productos();
    });

    document.getElementById('btn-pagina-anterior').addEventListener('click', () => {
        if (pagina_actual > 1) {
            pagina_actual--;
            cargar_productos();
        }
    });

    document.getElementById('btn-pagina-siguiente').addEventListener('click', () => {
        if (pagina_actual < total_paginas) {
            pagina_actual++;
            cargar_productos();
        }
    });
    document.getElementById('btn-nuevo-producto').addEventListener('click', nuevo_producto_1);

    cargar_productos();
});
