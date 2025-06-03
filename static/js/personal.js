async function cargarDatosApi() {
  try {
    const response = await fetch(`api/cargar/usuarios`)
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error al obtener datos de ventas:", error)
    return {
    };
  }
}

async function insertarUserTabla() {
  const usuarios = await cargarDatosApi();
  usuarios.forEach(usuario => {
    agregarFila(usuario);
  });
  
}

function agregarFila(usuario) {
  const tabla = document.getElementById('tablaUsuarios');
  const fila = document.createElement('tr');

  fila.innerHTML = `
    <td>${usuario.id}</td>
    <td>${usuario.nombre}</td>
    <td>${usuario.rol}</td>
    <td>
      <button class="editar-btn">✏️</button>
      <button class="eliminar-btn">🗑️</button>
    </td>
  `;

  // Botón Eliminar
  fila.querySelector('.eliminar-btn').addEventListener('click', async () => {
    const res = await fetch(`/api/usuarios/${usuario.id}`, { method: "DELETE" });
    if (res.ok) {
      tabla.removeChild(fila);
      Swal.fire("✅ Usuario eliminado");
    }
  });

  // Botón Editar (abre el modal)
  fila.querySelector('.editar-btn').addEventListener('click', () => {
    document.getElementById('edit-id').value = usuario.id;
    document.getElementById('edit-nombre').value = usuario.nombre;
    document.getElementById('edit-email').value = usuario.email;
    document.getElementById('edit-telefono').value = usuario.telefono;
    document.getElementById('edit-rol').value = usuario.rol;
    document.getElementById('edit-pass').value = "";

    document.getElementById('modalEditarUsuario').style.display = 'flex';
  });

  tabla.appendChild(fila);
}

// const usuarios = [
//   {
//     "id": 1,
//     "nombre": "Jesús",
//     "rol": "Empleado"
//   },
//   {
//     "id": 2,
//     "nombre": "Ana",
//     "rol": "Supervisor"
//   }
// ];
// return usuarios;



document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formUsuario');
  const tabla = document.getElementById('tablaUsuarios');
  let contador = 1;
  let modoEdicion = false;
  let filaEditando = null;
  insertarUserTabla();

  document.getElementById('cerrarModal').addEventListener('click', () => {
    document.getElementById('modalEditarUsuario').style.display = 'none';
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const rol = document.getElementById('rol').value;

    if (!nombre || (!modoEdicion && !pass) || !email || !telefono || !rol) {
      Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: 'Faltan datos obligatorios.'
      });
      return;
    }

    const usuario = { nombre, email, telefono, rol };

    if (!modoEdicion) {
      usuario.contrasena = pass;  // solo en nuevo
    }

    try {
      const url = modoEdicion
        ? `/api/usuarios/${filaEditando.id}`
        : "/api/new_usuario";
      const method = modoEdicion ? "PUT" : "POST";

      const respuesta = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Usuario actualizado' : 'Usuario guardado',
        });

        form.reset();
        modoEdicion = false;
        filaEditando = null;
        form.querySelector('button[type="submit"]').textContent = "Guardar Usuario";
        tabla.innerHTML = "";
        insertarUserTabla();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: resultado.error || 'No se pudo guardar el usuario'
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
  });
});

// Mostrar modal con datos del usuario
fila.querySelector('.editar-btn').addEventListener('click', () => {
  document.getElementById('edit-id').value = usuario.id;
  document.getElementById('edit-nombre').value = usuario.nombre;
  document.getElementById('edit-email').value = usuario.email;
  document.getElementById('edit-telefono').value = usuario.telefono;
  document.getElementById('edit-rol').value = usuario.rol;
  document.getElementById('edit-pass').value = "";

  document.getElementById('modalEditarUsuario').style.display = 'block';
});

// Cerrar modal
document.getElementById('cerrarModal').addEventListener('click', () => {
  document.getElementById('modalEditarUsuario').style.display = 'none';
});

// Guardar cambios desde el modal
document.getElementById('formEditarUsuario').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('edit-id').value;
  const nombre = document.getElementById('edit-nombre').value;
  const email = document.getElementById('edit-email').value;
  const telefono = document.getElementById('edit-telefono').value;
  const rol = document.getElementById('edit-rol').value;
  const contrasena = document.getElementById('edit-pass').value;

  const datos = { nombre, email, telefono, rol };
  if (contrasena.trim() !== "") datos.contrasena = contrasena;

  try {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const result = await res.json();

    if (res.ok) {
      Swal.fire("✅ Usuario actualizado correctamente");
      document.getElementById('modalEditarUsuario').style.display = 'none';
      tabla.innerHTML = "";
      insertarUserTabla();
    } else {
      Swal.fire("❌ Error: " + (result.error || "No se pudo actualizar"));
    }
  } catch (err) {
    console.error(err);
    Swal.fire("❌ Error al enviar los datos");
  }
});
