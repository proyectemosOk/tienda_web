document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formUsuario');
  const tabla = document.getElementById('tablaUsuarios');
  let contador = 1;
  let modoEdicion = false;
  let filaEditando = null;

  function cargarDatos() {
    const usuarios = [
      {
        "id": 1,
        "nombre": "Jesús",
        "email": "jesus@gmail.com",
        "telefono": "1234567890",
        "rol": "Empleado"
      },
      {
        "id": 2,
        "nombre": "Ana",
        "email": "ana@example.com",
        "telefono": "0987654321",
        "rol": "Supervisor"
      }
    ];
    return usuarios;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const rol = document.getElementById('rol').value;

    if (!nombre || !email || !telefono || !rol) {
      Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: 'No se pudo guardar el usuario. Verifica los datos.'
      });
      return;
    }

    const usuario = { nombre, email, telefono, rol };

    if (modoEdicion && filaEditando) {
      filaEditando.cells[1].textContent = nombre;
      filaEditando.cells[2].textContent = email;
      filaEditando.cells[3].textContent = telefono;
      filaEditando.cells[4].textContent = rol;

      modoEdicion = false;
      filaEditando = null;
      form.querySelector('button[type="submit"]').textContent = "Guardar Usuario";

      Swal.fire({
        icon: 'success',
        title: '✅ Usuario actualizado correctamente'
      });

    } else {
      agregarFila(usuario);
      Swal.fire({
        icon: 'success',
        title: '✅ Usuario guardado correctamente'
      });
    }

    form.reset();
  });

  function agregarFila(usuario) {
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${contador++}</td>
      <td>${usuario.nombre}</td>
      <td>${usuario.email}</td>
      <td>${usuario.telefono}</td>
      <td>${usuario.rol}</td>
      <td>
        <button class="editar-btn">✏️</button>
        <button class="eliminar-btn">🗑️</button>
      </td>
    `;

    fila.querySelector('.eliminar-btn').addEventListener('click', () => {
      tabla.removeChild(fila);
      Swal.fire({
        icon: 'success',
        title: '✅ Usuario eliminado correctamente'
      });
    });

    fila.querySelector('.editar-btn').addEventListener('click', () => {
      document.getElementById('nombre').value = fila.cells[1].textContent;
      document.getElementById('email').value = fila.cells[2].textContent;
      document.getElementById('telefono').value = fila.cells[3].textContent;
      document.getElementById('rol').value = fila.cells[4].textContent;

      filaEditando = fila;
      modoEdicion = true;
      form.querySelector('button[type="submit"]').textContent = "Actualizar Usuario";
    });

    tabla.appendChild(fila);
  }
});
