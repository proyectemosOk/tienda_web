class Producto {
    constructor(id, nombre, precio, categoria, descripcion, codigo, stock, imagen) {

        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
        this.categoria = categoria
        this.descripcion = descripcion;
        this.codigo = codigo;
        this.stock = stock;
        this.imagen = imagen;
        this.elemento = null; // Agregamos una propiedad para guardar el elemento DOM
    }

    crearElemento() {
        this.elemento = document.createElement('div');
        this.elemento.classList.add('product');
        this.elemento.innerHTML = `
            <img src="${this.imagen}" alt="${this.nombre}" onerror="this.onerror=null; this.src='/static/img_productos/img.png'">
            <h2>${this.nombre.length > 20 ? this.nombre.substring(0, 20) + '...' : this.nombre}</h2>
            <p>Precio: $${this.precio}</p>
            <button class = "btn-agregar">Agregar</button>
        `;
        // this.elemento.addEventListener('click', () => {
        //     this.mostrarModal();
        // });

        // Agrega el evento de clic
        this.elemento.addEventListener('click', () => {
            this.agregar_item(); // Llama a la función cuando se hace clic
        });

        return this.elemento;
    }

    mostrarModal() {
        const modalImage = document.getElementById('modal-image');
        modalImage.src = this.imagen;
        modalImage.onerror = function () {
            this.onerror = null; // evitar bucles infinitos
            this.src = '/static/img_productos/img.png'; // imagen predeterminada
        };
        // document.getElementById('modal-image').src = this.imagen; 
        document.getElementById('modal-name').innerText = this.nombre;
        document.getElementById('modal-id').innerText = this.id;
        document.getElementById('modal-price').innerText = `$${this.precio}`;
        document.getElementById('modal-description').innerText = this.descripcion;
        document.getElementById('product-modal').style.display = 'block';
    }
    agregar_item() {
        ticket.agregarItem(this.id, this.nombre, this.precio, this.codigo, this.stock);
    }
}

class CatalogoProductos {
    constructor() {
        this.productos = [];
        this.contenedor = document.getElementById('product-list'); // Asumo que tienes un div con id 'product-list'
    }

    agregarProducto(producto) {
        this.productos.push(producto);
        this.contenedor.appendChild(producto.crearElemento());
        this.mostrarTodos()
    }

    mostrarTodos() {
        // Ocultar todos los productos primero
        this.productos.forEach(p => p.elemento.style.display = 'none');

        // Mostrar solo los primeros 12 productos
        this.productos.slice(0, 12).forEach(p => p.elemento.style.display = '');
    }

    filtrarPorNombre(query) {
        if (!query) {
            this.mostrarTodos();
        } else {
            console.log(this.productos)
            this.productos.forEach(p => {
                if (
                    p.codigo.toLowerCase().includes(query.toLowerCase()) ||
                    p.nombre.toLowerCase().includes(query.toLowerCase()) ||
                    p.categoria.toLowerCase().includes(query.toLowerCase())
                ) {
                    p.elemento.style.display = '';
                } else {
                    p.elemento.style.display = 'none';
                }
            });
        }
    }
}

// Instancia del catálogo
const catalogo = new CatalogoProductos();

function cargarProductos() {
    fetch('/api/productos/ventas')  // URL de tu API
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const producto = new Producto(
                    item.id,
                    item.nombre,
                    item.precio,
                    item.categoria,
                    item.descripcion,
                    item.codigo,
                    item.stock,
                    item.imagen
                );
                catalogo.agregarProducto(producto);
            });
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();

    // Cerrar el modal al hacer clic en la X
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('product-modal').style.display = 'none';
    });

    // Cerrar el modal al hacer clic fuera del contenido
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('product-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Evento para buscar
    const inputBusqueda = document.getElementById('search-input'); // Asegúrate de tener este input en tu HTML
    inputBusqueda.addEventListener('input', () => {
        const query = inputBusqueda.value.trim();
        catalogo.filtrarPorNombre(query);
    });
});
