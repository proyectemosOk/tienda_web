function cargarSelectConOpciones({ url, selectId, inputNuevoId }) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById(selectId);
            cargarOpcionesDesdeObjeto(data, select);

            // Agregar opción "Otro..."
            const otro = document.createElement("option");
            otro.value = "__nuevo__";
            otro.textContent = "Otro...";
            select.appendChild(otro);
            
            // Mostrar/ocultar campo adicional si elige "Otro..."
            select.addEventListener("change", () => {
                
                const inputNuevo = document.getElementById(inputNuevoId);
                if (inputNuevo) {
                    console.log("hola 56")
                    // if(select.value === "__nuevo__"){
                    //     inputNuevo.classList.remove("hidden")
                    // }
                    select.value === "__nuevo__" ? inputNuevo.classList.remove("hidden"): "";
                }
            });
        });
}
function cargarServicios(data, name, contenedor) {
    // Suponiendo que 'data' es un objeto { valor: etiqueta }
    Object.entries(data).forEach(([key, valor]) => {
        // Crear contenedor div
        const div = document.createElement("div");
        div.classList.add("checkbox-item");

        // Crear input
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `${name}_${key}`;
        input.name = `${name}[]`;
        input.value = key;

        // Crear label
        const label = document.createElement("label");
        label.textContent = valor;
        label.htmlFor = `${name}_${key}`;

        div.appendChild(input);
        div.appendChild(label);
        
        
        // Agregar al contenedor principal
        contenedor.appendChild(div);
    });

    // Checkbox "Otro..."
    const otroId = `${name}_otro_checkbox`;
    const otroDiv = document.createElement("div");
    otroDiv.classList.add("checkbox-item");

    const otroInput = document.createElement("input");
    otroInput.type = "checkbox";
    otroInput.id = otroId;
    otroInput.value = "__nuevo__";
    otroInput.name = name;

    // Crear label
    const otroLabel = document.createElement("label");
    otroLabel.textContent = "Otro...";
    otroLabel.htmlFor = otroId;

    otroDiv.appendChild(otroInput);
    otroDiv.appendChild(otroLabel);
    contenedor.appendChild(otroDiv);
    return otroId

}
function cargarCheckboxesConOtroMultiples({ url, contenedorId, inputNuevoId, name = "opciones" }) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const contenedor = document.getElementById(contenedorId);

           const otroId = cargarServicios(data, name, contenedor)

            // Contenedor de campos nuevos dinámicos
            const nuevoContainer = document.getElementById(inputNuevoId);
            nuevoContainer.innerHTML = ''; // Asegura que esté limpio

            const camposContainer = document.createElement("div");
            camposContainer.id = `${inputNuevoId}-campos`;

            const botonAgregar = document.createElement("button");
            botonAgregar.type = "button";
            botonAgregar.textContent = "+ Agregar otro";
            botonAgregar.classList.add("agregar-otro-btn");

            botonAgregar.addEventListener("click", () => {
                const input = document.createElement("input");
                input.type = "text";
                input.name = `${name}_nuevo[]`;
                input.placeholder = "Nuevo valor...";
                input.classList.add("nuevo-campo");
                camposContainer.appendChild(input);
            });

            // Mostrar/ocultar inputs dinámicos
            document.getElementById(otroId).addEventListener("change", function () {
                if (this.checked) {
                    nuevoContainer.style.display = "block";
                    camposContainer.innerHTML = ''; // Limpiar y agregar el primero
                    botonAgregar.click(); // Agrega el primer campo automáticamente
                } else {
                    nuevoContainer.style.display = "none";
                    camposContainer.innerHTML = '';
                }
            });

            nuevoContainer.appendChild(camposContainer);
            nuevoContainer.appendChild(botonAgregar);
            nuevoContainer.style.display = "none"; // Oculto por defecto
        });
}

function cargarOpcionesDesdeObjeto(objeto, select) {
    Object.entries(objeto).forEach(([key, nombre]) => {
        const option = document.createElement("option");
        option.value = key; // o nombre
        option.textContent = nombre;
        select.appendChild(option);
    });
}

function cargarClientes() {
    fetch("/api/clientes")
        .then(res => res.json())
        .then(clientes => {
            const datalist = document.getElementById("clientes");
            datalist.innerHTML = "";  // limpiar opciones previas

            clientes.forEach(cliente => {
                const option = document.createElement("option");
                option.value = cliente.documento; // valor que se usará como identificador
                option.textContent = `${cliente.nombre} (${cliente.documento})`;
                datalist.appendChild(option);
            });
        });
}

function guardarClientes() {
    const nombre = document.getElementById("nuevo_nombre").value.trim();
    const tipo_documento = document.getElementById("nuevo_tipo_documento").value;
    const numero = document.getElementById("nuevo_numero").value.trim();
    const telefono = document.getElementById("nuevo_telefono").value.trim();
    const email = document.getElementById("nuevo_email").value.trim();

    if (!nombre || !numero) {
        alert("Nombre y número de documento son obligatorios.");
        return;
    }

    fetch("/api/clientes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre,
            tipo_document: tipo_documento,
            numero,
            telefono,
            email
        })
    })
        .then(res => {
            if (!res.ok) throw new Error("No se pudo guardar el cliente");
            return res.json();
        })
        .then(cliente => {
            cargarClientes(); // recargar lista
            document.getElementById("form-nuevo-cliente").style.display = "none";
            document.getElementById("cliente-select").value = cliente.numero; // seleccionar nuevo
        })
        .catch(err => {
            console.error(err);
            alert("Error al guardar el cliente.");
        });
}

function mostrarToast(mensaje, tipo = "info") {
    const toast = document.createElement("div");
    toast.innerHTML = mensaje;
    toast.className = `toast toast-${tipo}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);
}


async function enviarOrden(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    console.log(formData)
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    // Agregar todos los nuevos servicios ingresados (puede haber múltiples)
    const nuevoServicioInput = document.getElementById("nuevo_servicio_input");
    const nuevoServicio = nuevoServicioInput?.value.trim();
    if (nuevoServicio) {
        formData.append("servicios_nuevo", nuevoServicio);
    }

    try {
        const response = await fetch("/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast(`✅ ${data.mensaje}<br>ID de orden: ${data.orden_id}`, "success");
            form.reset();
        } else {
            mostrarToast(`⚠️ Error: ${data.error || "Error desconocido al enviar la orden."}`, "error");
        }
    } catch (error) {
        console.error("❌ Error en la solicitud:", error);
        mostrarToast("❌ Error de red al enviar la orden. Verifica tu conexión.", "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Orden";
    }
}


document.addEventListener("DOMContentLoaded", () => {
    // ========== Cargar Clientes =========
    cargarClientes();

    // mostrar formulario nuevo cliente
    document.getElementById("btn-nuevo-cliente").addEventListener("click", () => {
        document.getElementById("form-nuevo-cliente").style.display = "block";
    });

    // guardar nuevo cliente
    document.getElementById("guardar-cliente").addEventListener("click", guardarClientes);

    // Cargar TIPOS
    cargarSelectConOpciones({
        url: "/api/tipos",
        selectId: "tipo-select",
        inputNuevoId: "nuevo-tipo-container"
    });

    // Cargar TIPOS DE PAGO
    cargarSelectConOpciones({
        url: "/api/tipos_pago",
        selectId: "tipo_pago_select",
        inputNuevoId: "nuevo-tipo_pago-container"
    });

    // ========== Cargar SERVICIOS (checkboxes) ==========
    cargarCheckboxesConOtroMultiples({
        url: "/api/servicios",
        contenedorId: "servicios-checkboxes",
        inputNuevoId: "servicio-nuevo-container",
        name: "servicios"
    });

    document.querySelector("form").addEventListener("submit", enviarOrden);

});
