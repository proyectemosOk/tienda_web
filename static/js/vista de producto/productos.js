const products = [
    {
        "id": 1,
        "nombre": "Producto A",
        "precio": 29.99,
        "descripcion": "Descripción del Producto A",
        "imagen": "https://via.placeholder.com/150" // URL de la imagen
    },
    {
        "id": 2,
        "nombre": "Producto B",
        "precio": 19.99,
        "descripcion": "Descripción del Producto B",
        "imagen": "https://via.placeholder.com/150" // URL de la imagen
    },
    {
        "id": 3,
        "nombre": "Producto C",
        "precio": 39.99,
        "descripcion": "Descripción del Producto C",
        "imagen": "https://via.placeholder.com/150" // URL de la imagen
    }
];

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.innerHTML = `
            <img src="${product.imagen}" alt="${product.nombre}">
            <h2>${product.nombre}</h2>
            <p>ID: ${product.id}</p>
            <p>Precio: $${product.precio.toFixed(2)}</p>
            <p>Descripción: ${product.descripcion}</p>
        `;
        productList.appendChild(productDiv);
    });
}

displayProducts(products);
