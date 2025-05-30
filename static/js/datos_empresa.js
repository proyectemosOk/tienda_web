// Función para obtener datos predeterminados
function obtenerDatosJSONEmpresa() {
    return {
        logo_url: "/uploads/logo_empresa.png",
        nombreEmpresa: "Constructora Andina S.A.",
        razonSocial: "Constructora Andina Sociedad Anónima",
        nombreFantasia: "Andina Proyectos",
        giro: "Construcción de edificios",
        direccion: "Av. Providencia 1234",
        comuna: "Providencia",
        region: "andina",
        ciudad: "Bogotá",
        telefono: "+57 300 123 4567",
        telefonoSecundario: "+57 301 234 5678",
        email: "contacto@andina.co",
        sitioWeb: "https://www.andina.co",
        facebook: "https://www.facebook.com/andina",
        instagram: "https://www.instagram.com/andina",
        linkedin: "https://www.linkedin.com/company/andina",
        twitter: "https://www.twitter.com/andina",
        nit: "900.123.456-1",
        añoFundacion: "2005",
        tamañoEmpresa: "mediana",
    };
}

// Función para previsualizar el logo
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

    // Cargar datos predeterminados al cargar la página
    const datos = obtenerDatosJSONEmpresa();
    for (const key in datos) {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = datos[key];
    }
});

// Datos de las ciudades por región
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
    ],
    "pacifico": [
        "Buenaventura", "Quibdó", "Tumaco", "Pasto", "Cali", "Bojayá", "Guapi", "Cértegui", "Lloró", "Rio Sucio",
        "Vaupés", "Puerto Tejada", "Valle del Cauca", "San Juan de Pasto", "Pueblo Nuevo", "Guapi", "Pijao", "Tuluá", "Calima",
        "Bahía Solano", "Magüí Payán", "Nariño", "La Tola"
    ],
    "llanos": [
        "Villavicencio", "Casanare", "Yopal", "Aguazul", "Hato Corozal", "Tauramena", "Villanueva", "La Macarena", "San José del Guaviare",
        "San Martín", "Cumaral", "Acacías", "Puerto López", "Puerto Gaitán", "Granada", "La Primavera", "Restrepo", "Cabuyaro", "Bajo Uribe",
        "Inírida", "Puerto Inírida", "San José de Guaviare", "Vaupés"
    ],
    "amazonas": [
        "Leticia", "Mocoa", "Puerto Nariño", "La Chorrera", "Tarapacá", "San José del Guaviare", "El Encanto", "Papuya",
        "Santa Rosalía", "La Libertad", "Puerto Caicedo", "Puerto Arica", "Bajo Guaviare", "Yaguará", "Los Reyes", "Garzón", "Neiva",
        "Villagarzón", "La Guainía", "Solano"
    ],
    "orinoquia": [
        "San José del Guaviare", "Arauca", "Saravena", "Tame", "Puerto Rondón", "Fortul", "Hato Corozal", "Arauquita",
        "Cumaribo", "La Primavera", "Tame", "Arauquita", "San Martín", "Boca de Guaviare"
    ]
};

// Actualiza las ciudades según la región seleccionada
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

// Manejo del envío del formulario
document.getElementById("formDatosEmpresa").addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const jsonData = {};

    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    // Aquí podrías manejar los datos como desees, por ejemplo, imprimir en consola
    console.log("Datos enviados:", jsonData);
    alert("Datos guardados (simulación).");
});

// Cargar los datos iniciales y actualizar las ciudades al cargar la página
window.addEventListener("DOMContentLoaded", () => {
    const datos = obtenerDatosJSONEmpresa();
    for (const key in datos) {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = datos[key];
    }
    
    // Actualizar las ciudades según la región predeterminada
    updateCities();
});
