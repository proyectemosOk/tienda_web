// Función para cargar categorías de gastos desde la API
async function cargarCategoriasGastos() {
    try {
        const response = await fetch("/api/tipos_gastos_pagos");
        const data = await response.json();

        if (!data.success) {
            console.error("Error en la respuesta de la API");
            return null;
        }

        return data.data.tipos_gastos;
    } catch (error) {
        console.error("Error al obtener categorías de gastos:", error);
        return null;
    }
}

// Función para poblar el selector de categorías
async function poblarCategoriasGastos(selectElement) {
    const categorias = await cargarCategoriasGastos();
    
    if (!categorias) {
        console.error("No se pudieron cargar las categorías de gastos");
        return;
    }

    // Guardar la opción "Otros" si existe
    const otrosOption = selectElement.querySelector('option[value="0"]');
    
    // Limpiar el selector
    selectElement.innerHTML = '';
    
    // Poblar con todas las categorías de la base de datos
    for (const [key, value] of Object.entries(categorias)) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = value;
        selectElement.appendChild(option);
    }
    
    // Agregar la opción "Otros" al final si no existe en la base de datos
    if (!Object.values(categorias).includes("Otros")) {
        const nuevosOtrosOption = document.createElement("option");
        nuevosOtrosOption.value = 0;
        nuevosOtrosOption.textContent = "Otros";
        selectElement.appendChild(nuevosOtrosOption);
    } else if (otrosOption) {
        // Si ya existe, simplemente agregarlo
        selectElement.appendChild(otrosOption);
    }
}

// Función para guardar una nueva categoría
async function guardarNuevaCategoria() {
    const input = document.getElementById("categoria");
    const descripcion = input.value.trim();
    const select = document.getElementById("categoria-gastos");

    if (!descripcion) {
        alert("Por favor, ingresa un nombre para la categoría.");
        input.focus();
        return;
    }

    try {
        const respuesta = await fetch("/api/guardar_categoria_gastos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ descripcion })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.success) {
            alert("✅ Categoría guardada con éxito.");
            input.value = "";

            // Recargar las categorías desde la base de datos
            await poblarCategoriasGastos(select);

            // Seleccionar automáticamente la nueva opción
            select.value = resultado.id;

        } else if (respuesta.status === 409 || (resultado.error && resultado.error.includes("existe"))) {
            alert("⚠️ La categoría ya existe.");
        } else {
            console.error("Error:", resultado);
            alert("❌ Ocurrió un error al guardar la categoría.");
        }

    } catch (error) {
        console.error("Excepción:", error);
        alert("❌ Error de conexión con el servidor.");
    }
}

// Al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
    const tipoPagoSelect = document.getElementById("tipo-pago");
    const categoriaGastosSelect = document.getElementById("categoria-gastos");

    try {
        // Cargar categorías primero
        await poblarCategoriasGastos(categoriaGastosSelect);
        
        // Cargar tipos de pago
        const data = await fetch("/api/tipos_gastos_pagos").then(r => r.json());
        
        if (!data.success) {
            console.error("Error en la respuesta de la API");
            return;
        }

        const tiposPagos = data.data.tipos_pagos;

        // Poblar tipos de pago
        for (const [key, value] of Object.entries(tiposPagos)) {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = value;
            tipoPagoSelect.appendChild(option);
        }

    } catch (error) {
        console.error("Error al obtener datos de la API:", error);
    }

    // Si estamos en una página de edición, cargar los datos del gasto
    if (window.location.pathname.includes("editar-gasto")) {
        await cargarDatosGastoParaEdicion();
    }
});

// Función para cargar datos del gasto en modo edición
async function cargarDatosGastoParaEdicion() {
    try {
        // Obtener ID del gasto de la URL
        const gastoId = obtenerIdGastoDeURL();
        
        if (!gastoId) return;

        // Obtener datos del gasto
        const response = await fetch(`/api/obtener_gasto/${gastoId}`);
        const resultado = await response.json();

        if (!response.ok || !resultado.success) {
            throw new Error('Error al obtener el gasto');
        }

        const gasto = resultado.data;

        // Rellenar el formulario con los datos del gasto
        document.getElementById("monto").value = gasto.monto;
        document.getElementById("descripcion").value = gasto.descripcion;
        document.getElementById("fecha").value = gasto.fecha;
        
        // Seleccionar el tipo de pago
        const tipoPagoSelect = document.getElementById("tipo-pago");
        tipoPagoSelect.value = gasto.tipo_pago_id;
        
        // Seleccionar la categoría
        const categoriaSelect = document.getElementById("categoria-gastos");
        categoriaSelect.value = gasto.categoria_id;

    } catch (error) {
        console.error("Error al cargar datos del gasto:", error);
        alert("Error al cargar los datos del gasto. Por favor, recarga la página.");
    }
}

// Función para obtener ID del gasto de la URL
function obtenerIdGastoDeURL() {
    // Buscar el ID en la URL (ejemplo: /editar-gasto/123)
    const match = window.location.pathname.match(/editar-gasto\/(\d+)/);
    return match ? match[1] : null;
}