class Producto {
    constructor(id, nombre, precio, descripcion, imagen) {
        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
        this.descripcion = descripcion;
        this.imagen = imagen;
    }

    crearElemento() {
        const productoDiv = document.createElement('div');
        productoDiv.classList.add('product');
        productoDiv.innerHTML = `
            <img src="${this.imagen}" alt="${this.nombre}">
            <h2>${this.nombre}</h2>
            <p>Precio: $${this.precio}</p>
        `;
        productoDiv.addEventListener('click', () => {
            this.mostrarModal();
        });
        return productoDiv;
    }

    mostrarModal() {
        document.getElementById('modal-image').src = this.imagen; 
        document.getElementById('modal-name').innerText = this.nombre;
        document.getElementById('modal-id').innerText = this.id;
        document.getElementById('modal-price').innerText = `$${this.precio}`;
        document.getElementById('modal-description').innerText = this.descripcion;
        document.getElementById('product-modal').style.display = 'block';
    }
}

// Datos de productos en formato JSON 
const productosData = [
    {
        "id": 1,
        "nombre": "Manzanas",
        "precio": 100,
        "descripcion": "Manzanas frescas y crujientes, perfectas para comer o cocinar",
        "imagen": "/static/img/imagen de ejemplo.webp" 
    },
    {
        "id": 2,
        "nombre": " Arroz Blanco",
        "precio": 200,
        "descripcion": "Arroz blanco de grano largo, ideal para acompañar tus platos.",
        "imagen": "/static/img/imagen de ejemplo.webp" 
    },
    {
        "id": 3,
        "nombre": "Pollo Fresco",
        "precio": 300,
        "descripcion": "Pollo fresco y jugoso, perfecto para asar o guisar.",
        "imagen": "/static/img/imagen de ejemplo.webp"
    }
];

function cargarProductos() {
    const productList = document.getElementById('product-list');
    productosData.forEach(data => {
        const producto = new Producto(data.id, data.nombre, data.precio, data.descripcion, data.imagen);
        productList.appendChild(producto.crearElemento());
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
});
