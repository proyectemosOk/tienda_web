class Producto {
  constructor(nombre) {
    this.nombre = nombre;
    this.elemento = document.createElement('div');
    this.elemento.className = 'product';

    // Crear el contenido del producto
    this.titulo = document.createElement('h2');
    this.titulo.textContent = this.nombre.length > 20 ? this.nombre.substring(0, 20) + '...' : this.nombre;

    this.elemento.appendChild(this.titulo);
  }

  mostrar() {
    this.elemento.style.display = '';
  }

  ocultar() {
    this.elemento.style.display = 'none';
  }
}

class Catalogo {
  constructor(contenedor) {
    this.productos = [];
    this.contenedor = contenedor; // DOM donde se muestran los productos
  }

  agregarProducto(producto) {
    this.productos.push(producto);
    this.contenedor.appendChild(producto.elemento);
  }

  mostrarTodos() {
    this.productos.forEach(p => p.mostrar());
  }

  filtrarPorNombre(query) {
    if (!query) {
      this.mostrarTodos(); // Si la búsqueda está vacía, mostrar todos
    } else {
      this.productos.forEach(p => {
        if (p.nombre.toLowerCase().includes(query.toLowerCase())) {
          p.mostrar();
        } else {
          p.ocultar();
        }
      });
    }
  }
}

// Crear instancia del catálogo
const contenedor = document.getElementById('productContainer');
const catalogo = new Catalogo(contenedor);

// Crear algunos productos de ejemplo
const nombresProductos = [
  'Camisa Azul', 'Pantalón Negro', 'Zapatos Deportivos', 'Reloj de Pulsera', 
  'Gafas de Sol', 'Bolso de Mano', 'Camiseta Blanca', 'Chaqueta de Cuero'
];

nombresProductos.forEach(nombre => {
  const producto = new Producto(nombre);
  catalogo.agregarProducto(producto);
});

// Evento de búsqueda
const inputBusqueda = document.getElementById('search-input');

inputBusqueda.addEventListener('input', () => {
  const query = inputBusqueda.value.trim();
  catalogo.filtrarPorNombre(query);
});
</script>
