// Función para enviar datos al servidor, recibe un objeto cliente
async function enviar_datos(cliente) {
  try {
    const respuesta = await fetch("/api/new_cliente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente)
    });

    const resultado = await respuesta.json();
    console.log(resultado)

    if (respuesta.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Cliente guardado correctamente',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      // Aquí podrías limpiar formularios si existiesen fuera del Swal
      // Actualiza listado de clientes después de agregar uno nuevo:
      cargarClientes();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: resultado.error || 'No se pudo guardar el cliente'
      });
    }
  } catch (error) {
    console.error("Error al enviar datos:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al enviar los datos'
    });
  }
}

// Función para crear y mostrar el formulario en Swal
function crear_formulario_new_cliente() {
  Swal.fire({
    title: 'Nuevo Cliente',
    html: `
      <form id="swalFormCliente" onsubmit="return false;" style="display:flex; flex-direction: column; gap: 1rem;">
        <input type="text" id="nombre" placeholder="Nombre completo" class="swal2-input" required>
        <select id="tipo_document" class="swal2-select" required>
          <option value="" disabled selected>Tipo de documento</option>
          <option value="CC">Cédula de ciudadanía</option>
          <option value="NIT">NIT</option>
          <option value="CE">Cédula de extranjería</option>
        </select>
        <input type="text" id="numero" placeholder="Número de documento" class="swal2-input" required>
        <input type="tel" id="telefono" placeholder="Teléfono" class="swal2-input">
        <input type="email" id="email" placeholder="Correo electrónico" class="swal2-input">
      </form>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar Cliente',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    customClass: {
      popup: 'custom-swal-popup',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
      input: 'swal2-input',
      select: 'swal2-select'
    },
    didOpen: () => {
      // Puedes agregar focos adicionales o inicializaciones si quieres
      document.getElementById('nombre').focus();
    },
    preConfirm: () => {
      const nombre = document.getElementById('nombre').value.trim();
      const tipo_document = document.getElementById('tipo_document').value;
      const numero = document.getElementById('numero').value.trim();
      const telefono = document.getElementById('telefono').value.trim();
      const email = document.getElementById('email').value.trim();

      if (!nombre || !tipo_document || !numero) {
        Swal.showValidationMessage('Nombre, tipo y número de documento son obligatorios.');
        return false;
      }

      return { nombre, tipo_document, numero, telefono, email };
    }
  }).then(result => {
    if (result.isConfirmed) {
      // Aquí llamamos la función enviar_datos con los datos result.value
      enviar_datos(result.value);
    }
  });
}

