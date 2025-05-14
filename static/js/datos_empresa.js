function previewLogo(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const logoPreview = document.getElementById('logoPreview');
        logoPreview.src = e.target.result; // Cambia la fuente de la imagen al logo seleccionado
    }

    if (file) {
        reader.readAsDataURL(file); // Lee el archivo como URL de datos
    }
}
// Validación en tiempo real de inputs
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formDatosEmpresa");
    const inputs = form.querySelectorAll("input, select");

    inputs.forEach((input) => {
        input.addEventListener("input", () => validarCampo(input));
        input.addEventListener("blur", () => validarCampo(input));
    });

    function validarCampo(input) {
        const errorMsg = input.nextElementSibling;
        const esValido = input.checkValidity();

        if (!esValido) {
            input.classList.add("input-error");
            input.classList.remove("input-ok");

            if (!errorMsg || !errorMsg.classList.contains("error-text")) {
                const mensaje = document.createElement("small");
                mensaje.classList.add("error-text");
                mensaje.textContent = obtenerMensajeError(input);
                input.insertAdjacentElement("afterend", mensaje);
            } else {
                errorMsg.textContent = obtenerMensajeError(input);
            }
        } else {
            input.classList.remove("input-error");
            input.classList.add("input-ok");

            if (errorMsg && errorMsg.classList.contains("error-text")) {
                errorMsg.remove();
            }
        }
    }

    function obtenerMensajeError(input) {
        if (input.validity.valueMissing) return "Este campo es obligatorio.";
        if (input.validity.patternMismatch) return "Formato inválido.";
        if (input.validity.typeMismatch) return "Tipo de dato incorrecto.";
        return "Campo inválido.";
    }
});
const citiesByRegion = {
    "caribe": [
        "Barranquilla", "Cartagena", "Santa Marta", "Ciénaga", "Valledupar", "Sincelejo", "Montería", "Riohacha", "Santa Cruz de Lorica",
        "Maicao", "Soledad", "Turbaco", "Puerto Colombia", "Santo Tomás", "Fundación", "Chiriguaná", "El Banco", "Aguachica", "La Paz",
        "Bosconia", "Aracataca", "Gamarra", "La Jagua de Ibirico", "Barrancas", "San Juan del Cesar", "La Gloria", "Dibulla",
        "Tolu", "San Onofre", "Sabanalarga", "Arjona", "Montelíbano", "Carmen de Bolívar", "San Estanislao de Kostka", "El Retén",
        "Magangué", "Margarita", "Tiquisio", "Morales", "Zapatoca", "Simití", "San Zenón", "San Andrés", "Providencia"
    ],
    "andina": [
        "Bogotá", "Medellín", "Cali", "Bucaramanga", "Pereira", "Manizales", "Cúcuta", "Armenia", "Tunja", "Popayán", "Neiva", "Ibagué",
        "Pasto", "Villavicencio", "Bello", "Envigado", "Rionegro", "Chinchiná", "Palmira", "Tuluá", "Calarcá", "Sogamoso",
        "La Dorada", "Pitalito", "Yumbo", "El Tambo", "Fusagasugá", "Tocaima", "Quibdó", "Montelíbano", "Yacuanquer",
        "Cajamarca", "La Vega", "Sibaté", "Cajicá", "Girardot", "Alto de los Andes", "Ubaté", "Chía", "Cota", "Tocaima"
    ]
    ,
    "pacifico": [
        "Buenaventura", "Quibdó", "Tumaco", "Pasto", "Cali", "Tumaco", "Bojayá", "Guapi", "Cértegui", "Lloró", "Rio Sucio",
        "Vaupés", "Puerto Tejada", "Valle del Cauca", "San Juan de Pasto", "Pueblo Nuevo", "Guapi", "Pijao", "Tuluá", "Calima",
        "Buenaventura", "Bahía Solano", "Magüí Payán", "Guapi", "Tumaco", "Nariño", "La Tola"
    ]
    ,
    "llanos": [
        "Villavicencio", "Casanare", "Yopal", "Aguazul", "Hato Corozal", "Tauramena", "Villanueva", "La Macarena", "San José del Guaviare",
        "San Martín", "Cumaral", "Acacías", "Puerto López", "Puerto Gaitán", "Granada", "La Primavera", "Restrepo", "Cabuyaro", "Bajo Uribe",
        "Inírida", "Puerto Inírida", "San José de Guaviare", "Vaupés"
    ]
    ,
    "amazonas": [
        "Leticia", "Mocoa", "Puerto Nariño", "La Chorrera", "Tarapacá", "San José del Guaviare", "El Encanto", "Papuya",
        "Santa Rosalía", "La Libertad", "Puerto Caicedo", "Puerto Arica", "Bajo Guaviare", "Yaguará", "Los Reyes", "Garzón", "Neiva",
        "Villagarzón", "La Guainía", "Solano"
    ]
    ,
    "orinoquia": [
        "San José del Guaviare", "Arauca", "Saravena", "Tame", "Puerto Rondón", "Fortul", "Hato Corozal", "Arauquita",
        "Cumaribo", "La Primavera", "Tame", "Arauquita", "San Martín", "Boca de Guaviare"
    ]

};


function updateCities() {
    const regionSelect = document.getElementById("region");
    const citySelect = document.getElementById("ciudad");
    const selectedRegion = regionSelect.value;

    // Limpiar las ciudades
    citySelect.innerHTML = '<option value="">Seleccione una ciudad</option>';

    if (selectedRegion) {
        const cities = citiesByRegion[selectedRegion];
        cities.forEach(city => {
            const option = document.createElement("option");
            option.value = city.toLowerCase().replace(/\s+/g, '_'); // Reemplazar espacios por guiones bajos
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
}
document.getElementById("formDatosEmpresa").addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const jsonData = {};

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    fetch("/api/empresa", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
    })
        .then((res) => res.json())
        .then((data) => {
            alert(data.mensaje || "Datos guardados");
        })
        .catch((err) => console.error("Error guardando datos de empresa:", err));
});

// function previewLogo(event) {
//     const fileInput = event.target;
//     const logo = fileInput.files[0];
//     if (!logo) return;

//     const formData = new FormData();
//     formData.append("logo", logo);

//     fetch("/api/empresa/logo", {
//         method: "POST",
//         body: formData,
//     })
//     .then((res) => res.json())
//     .then((data) => {
//         if (data.logo_url) {
//             document.getElementById("logoPreview").src = data.logo_url;
//         } else {
//             console.error("Error en la subida:", data.error);
//         }
//     })
//     .catch((err) => console.error("Error subiendo logo:", err));
// }

window.addEventListener("DOMContentLoaded", () => {
    fetch('/api/empresa')
        .then(res => res.json())
        .then(data => {
            if (data.logo_url) {
                document.getElementById("logoPreview").src = data.logo_url;
            }
        })
        .catch(err => console.error("Error al cargar logo:", err));
});
document.getElementById('formDatosEmpresa').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const datos = {};
    formData.forEach((value, key) => {
        datos[key] = value;
    });

    fetch('/api/empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
    })
    .catch(err => {
        alert('Error al guardar datos');
        console.error(err);
    });
});

window.addEventListener('DOMContentLoaded', () => {
    fetch('/api/empresa')
        .then(res => res.json())
        .then(datos => {
            for (const key in datos) {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) input.value = datos[key];
            }
        });
});
