document.addEventListener("DOMContentLoaded", () => {
    // ========== Cargar TIPOS ==========
    fetch("/api/tipos")
        .then(res => res.json())
        .then(tipos => {
            const select = document.getElementById("tipo-select");
            tipos.forEach(t => {
                const option = document.createElement("option");
                option.value = t.nombre;
                option.textContent = t.nombre;
                select.appendChild(option);
            });

            // Agregar opción "Otro..."
            const otro = document.createElement("option");
            otro.value = "__nuevo__";
            otro.textContent = "Otro...";
            select.appendChild(otro);

            select.addEventListener("change", () => {
                const inputNuevo = document.getElementById("nuevo-tipo-container");
                inputNuevo.style.display = select.value === "__nuevo__" ? "block" : "none";
            });
        });

    // ========== Cargar TIPOS DE PAGO ==========
    fetch("/api/tipos_pago")
        .then(res => res.json())
        .then(pagos => {
            const select = document.getElementById("tipo_pago_select");
            pagos.forEach(p => {
                const option = document.createElement("option");
                option.value = p.nombre;
                option.textContent = p.nombre;
                select.appendChild(option);
            });

            // Agregar opción "Otro..."
            const otro = document.createElement("option");
            otro.value = "__nuevo__";
            otro.textContent = "Otro...";
            select.appendChild(otro);

            select.addEventListener("change", () => {
                const inputNuevo = document.getElementById("nuevo-tipo_pago-container");
                inputNuevo.style.display = select.value === "__nuevo__" ? "block" : "none";
            });
        });

    // ========== Cargar SERVICIOS (checkboxes) ==========
    fetch("/api/servicios")
        .then(res => res.json())
        .then(servicios => {
            const contenedor = document.getElementById("servicios-checkboxes");
            servicios.forEach(s => {
                const label = document.createElement("label");
                label.innerHTML = `
                    <input type="checkbox" name="servicios" value="${s.nombre}"> ${s.nombre}
                `;
                contenedor.appendChild(label);
            });

            // Agregar opción "Otro..."
            const otroLabel = document.createElement("label");
            otroLabel.innerHTML = `
                <input type="checkbox" id="servicio_otro_checkbox" value="__nuevo__"  name="servicios"> Otro...
            `;
            contenedor.appendChild(otroLabel);

            // Mostrar campo nuevo servicio si se marca
            document.getElementById("servicio_otro_checkbox").addEventListener("change", function () {
                const nuevoServicio = document.getElementById("servicio-nuevo-container");
                nuevoServicio.style.display = this.checked ? "block" : "none";
            });
        });
});
