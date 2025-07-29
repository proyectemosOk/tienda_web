const socket = io();

socket.on('connect', () => {
    console.log('Conectado a SocketIO con id', socket.id);
});

socket.on('nuevo_voto', (data) => {
    console.log('Nuevo voto recibido:', data);
    // Actualizar UI, tabla y tarjetas con el nuevo voto
    cargarDatos();

});

function setConteos(votaciones) {
    // Crear diccionario para acceso más fácil
    const conteos = {};
    votaciones.forEach(([calif, cant]) => {
        conteos[calif] = cant;
    });

    document.getElementById('count-malo').textContent = conteos[1] || 0;
    document.getElementById('count-regular').textContent = conteos[2] || 0;
    document.getElementById('count-bueno').textContent = conteos[3] || 0;
    document.getElementById('count-excelente').textContent = conteos[4] || 0;
}

function llenarTabla(registros) {
    const tbody = document.getElementById('tabla-registros');
    tbody.innerHTML = ""; // limpia tabla

    registros.forEach(registro => {
        const tr = document.createElement('tr');
        tr.className = "border-b";

        // Formato fecha y hora
        const fechaTd = document.createElement('td');
        fechaTd.className = "px-4 py-2";
        fechaTd.textContent = registro.fecha;

        // Calificación con texto y color
        const califTd = document.createElement('td');
        califTd.className = "px-4 py-2 font-semibold";

        const { texto, colorClase } = obtenerTextoYColor(registro.calificacion);

        califTd.textContent = texto;
        califTd.classList.add(colorClase);

        tr.appendChild(fechaTd);
        tr.appendChild(califTd);
        tbody.appendChild(tr);
    });
}

function obtenerTextoYColor(calificacion) {
  switch (calificacion) {
    case 1:
      return { texto: "Malo", colorClase: "text-red-600" };
    case 2:
      return { texto: "Regular", colorClase: "text-yellow-500" };
    case 3:
      return { texto: "Bueno", colorClase: "text-green-700" };
    case 4:
      return { texto: "Excelente", colorClase: "text-blue-700" };
    default:
      return { texto: "Desconocido", colorClase: "text-gray-500" };
  }
}


function agregarRegistroNuevo(registro) {
  const tbody = document.getElementById('tabla-registros');

  // Crear nueva fila para el registro
  const tr = document.createElement('tr');
  tr.className = "border-b";

  // Fecha
  const fechaTd = document.createElement('td');
  fechaTd.className = "px-4 py-2";
  fechaTd.textContent = registro.fecha;

  // Calificación con texto y color
  const califTd = document.createElement('td');
  califTd.className = "px-4 py-2 font-semibold";

  const { texto, colorClase } = obtenerTextoYColor(registro.calificacion);

  califTd.textContent = texto;
  califTd.classList.add(colorClase);

  tr.appendChild(fechaTd);
  tr.appendChild(califTd);

  // Insertar la fila al inicio de tbody
  if (tbody.firstChild) {
    tbody.insertBefore(tr, tbody.firstChild);
  } else {
    tbody.appendChild(tr);
  }

  // Si hay más de 30 filas, eliminar la última (más antigua)
  while (tbody.children.length > 30) {
    tbody.removeChild(tbody.lastChild);
  }
}


// Suponiendo que llamas a tu API como fetch, por ahora usarás la simulación:
function cargarDatos() {
    const contenedor = document.getElementById('contenedor-resultados');
    // Opcional: ocultar y limpiar contenido antes
    contenedor.style.opacity = 0;

    fetch('/api/cargarDatosVotacion')
        .then(resp => resp.json())
        .then(data => {
            setConteos(data.votaciones);
            llenarTabla(data.registros);

            // Mostrar suavemente con transición en opacidad
            // Esto funciona porque la clase tailwind tiene la transición definida
            setTimeout(() => {
                contenedor.style.opacity = 1;
            }, 500); // pequeño delay para forzar el cambio
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById('contenedor-resultados');
    contenedor.style.opacity = 0; // oculto inicialmente
    cargarDatos();
});
