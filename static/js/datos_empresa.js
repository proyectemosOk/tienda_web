document.addEventListener("DOMContentLoaded", () => {
    cargarDatosEmpresa();

    const form = document.getElementById("formDatosEmpresa");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        guardarDatosEmpresa();
    });

    const btnCancelar = document.getElementById("btnCancelar");
    btnCancelar.addEventListener("click", () => {
        if (confirm("¿Seguro que quieres cancelar los cambios?")) {
            location.reload();
        }
    });
});

async function cargarDatosEmpresa() {
    try {
        const response = await fetch("/api/empresa");
        if (!response.ok) throw new Error("Error al cargar datos");

        const datos = await response.json();
        cargarEnFormulario(datos);
    } catch (error) {
        console.error(error);
        alert("No se pudieron cargar los datos de la empresa.");
    }
}

function cargarEnFormulario(datos) {
    if (!datos) return;

    // Cargar texto de campos
    const campos = [
        "nombreEmpresa",
        "nit",
        "direccion",
        "region",
        "ciudad",
        "telefono",
        "email",
        "sitioWeb"
    ];

    campos.forEach(campo => {
        // Mostrar el valor correspondiente en la consola

        // (opcional) Rellenar un input cuyo id coincida con el campo
        const input = document.querySelector(`#${campo}`);
        if (input) {
            input.value = datos.datos[campo];  // o datos[campo]
        }
    });


}

function previewLogo(event) {
    const reader = new FileReader();
    reader.onload = function () {
        const img = document.getElementById("logoPreview");
        img.onload = function () {
            const maxAlto = 150;

            // Si la imagen es más alta que 150px, se escala
            if (img.naturalHeight > maxAlto) {
                const escala = maxAlto / img.naturalHeight;
                img.style.height = maxAlto + "px";
                img.style.width = (img.naturalWidth * escala) + "px";
            } else {
                // Si es más pequeña, se muestra con su tamaño real
                img.style.height = img.naturalHeight + "px";
                img.style.width = img.naturalWidth + "px";
            }
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}


async function guardarDatosEmpresa() {
    const form = document.getElementById("formDatosEmpresa");
    const formData = new FormData(form);
    const boton = document.querySelector("#btnGuardarEmpresa");

    boton.disabled = true;
    boton.textContent = "Guardando...";

    try {
        const response = await fetch("/api/empresa", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Error al guardar");

        alert("Datos guardados correctamente.");

        // Actualizar logo si fue subido
        const archivoLogo = formData.get("logoInput");
        if (archivoLogo && archivoLogo.name) {
            const reader = new FileReader();
            reader.onload = function () {
                const img = document.getElementById("logoPreview");
                img.onload = function () {
                    const maxAlto = 150;
                    if (img.naturalHeight > maxAlto) {
                        const escala = maxAlto / img.naturalHeight;
                        img.style.height = maxAlto + "px";
                        img.style.width = (img.naturalWidth * escala) + "px";
                    } else {
                        img.style.height = img.naturalHeight + "px";
                        img.style.width = img.naturalWidth + "px";
                    }
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(archivoLogo);
        }

        // form.reset();
    } catch (error) {
        console.error(error);
        alert("No se pudieron guardar los datos de la empresa.");
    } finally {
        boton.disabled = false;
        boton.textContent = "Guardar";
    }
}

