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

            // Crear nueva opción
            const nuevaOpcion = document.createElement("option");
            nuevaOpcion.value = resultado.id;
            nuevaOpcion.textContent = descripcion;

            // Insertar como penúltima opción
            const totalOpciones = select.options.length;
            const posicion = Math.max(0, totalOpciones - 1); // Penúltima posición o primera si está vacío
            select.insertBefore(nuevaOpcion, select.options[posicion]);

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

document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/tipos_gastos_pagos")
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Error en la respuesta de la API");
                return;
            }

            const tiposPagos = data.data.tipos_pagos;
            const tiposGastos = data.data.tipos_gastos;

            const tipoPagoSelect = document.getElementById("tipo-pago");
            const categoriaGastosSelect = document.getElementById("categoria-gastos");

            // Poblar tipos de pago
            for (const [key, value] of Object.entries(tiposPagos)) {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = value;
                tipoPagoSelect.appendChild(option);
            }

            // Poblar categorías de gastos
            for (const [key, value] of Object.entries(tiposGastos)) {
                if (value !== "Otros") {
                    const option = document.createElement("option");

                    option.value = key;
                    option.textContent = value;
                    categoriaGastosSelect.appendChild(option);
                }
            }
            const option = document.createElement("option");
            option.value = 0;
            option.textContent = "Otros";
            categoriaGastosSelect.appendChild(option);

        })
        .catch(error => {
            console.error("Error al obtener datos de la API:", error);
        });
})