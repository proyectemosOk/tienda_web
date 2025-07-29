function cargarSelectConOpciones({ url, selectId, inputNuevoId }) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById(selectId);
            cargarOpcionesDesdeObjeto(data, select);
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
}
function cargarCheckboxesConOtroMultiples({ url, contenedorId, inputNuevoId, name = "opciones" }) {
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const contenedor = document.getElementById(contenedorId);
            cargarServicios(data, name, contenedor)
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
    let usuarioId = datos.id; // Ajusta o remueve si aún no usas login
    alert(usuarioId)
    const form = e.target;
    let formData = new FormData(form);
    formData.usuario = datos.id;
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
    // Evento al dar clic en el botón para registrar un nuevo cliente
    // 1. Agrega el listener al botón:
    document.getElementById("btn-nuevo-cliente").addEventListener("click", crear_formulario_new_cliente);


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
