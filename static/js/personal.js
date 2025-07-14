// gestion_usuarios.js

let tabla;

function obtenerRolActual() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  return usuario.rol || "";
}

async function cargarDatosApi() {
  try {
    const response = await fetch(`/api/cargar/usuarios`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
}

async function insertarUserTabla() {
  const usuarios = await cargarDatosApi();
  tabla.innerHTML = "";

  usuarios.forEach(usuario => {
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

    fila.querySelector('.editar-btn').addEventListener('click', () => abrirModalEdicion(usuario));
    fila.querySelector('.eliminar-btn').addEventListener('click', () => eliminarUsuario(usuario, fila));
    tabla.appendChild(fila);
  });
}

function abrirModalEdicion(usuario) {
  document.getElementById('edit-id').value = usuario.id;
  document.getElementById('edit-nombre').value = usuario.nombre;
  document.getElementById('edit-email').value = usuario.email;
  document.getElementById('edit-telefono').value = usuario.telefono;
  document.getElementById('edit-rol').value = usuario.rol;
  document.getElementById('edit-pass').value = "";
  document.getElementById('modalEditarUsuario').style.display = 'flex';
}

async function eliminarUsuario(usuario, fila) {
  const rolActual = obtenerRolActual();
  if (rolActual !== "superAdmin") {
    Swal.fire("🚫 Solo el superAdmin puede eliminar usuarios.");
    return;
  }

  const confirm = await Swal.fire({
    title: `¿Eliminar a ${usuario.nombre}?`,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    icon: 'warning'
  });

  if (confirm.isConfirmed) {
    const res = await fetch(`/api/usuarios/${usuario.id}`, { method: "DELETE" });
    if (res.ok) {
      fila.remove();
      Swal.fire("✅ Usuario eliminado");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formUsuario');
  tabla = document.getElementById('tablaUsuarios');
  insertarUserTabla();

  document.getElementById('cerrarModal').addEventListener('click', () => {
    document.getElementById('modalEditarUsuario').style.display = 'none';
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const rolActual = obtenerRolActual();
    if (rolActual !== "superAdmin") {
      Swal.fire("🚫 Solo el superAdmin puede crear o editar usuarios.");
      return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const rol = document.getElementById('rol').value;

    if (!nombre || !email || !telefono || !rol || (!modoEdicion && !pass)) {
      Swal.fire({ icon: 'error', title: '❌ Error', text: 'Faltan datos obligatorios.' });
      return;
    }

    const usuario = { nombre, email, telefono, rol };
    if (!modoEdicion) usuario.contrasena = pass;

    try {
      const url = modoEdicion ? `/api/usuarios/${filaEditando.id}` : "/api/new_usuario";
      const method = modoEdicion ? "PUT" : "POST";

      const respuesta = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        Swal.fire({ icon: 'success', title: modoEdicion ? 'Usuario actualizado' : 'Usuario guardado' });
        form.reset();
        modoEdicion = false;
        filaEditando = null;
        form.querySelector('button[type="submit"]').textContent = "Guardar Usuario";
        insertarUserTabla();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: resultado.error || 'No se pudo guardar el usuario' });
      }
    } catch (error) {
      console.error("Error al enviar datos:", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al enviar los datos' });
    }
  });

  document.getElementById('formEditarUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rolActual = obtenerRolActual();
    if (rolActual !== "superAdmin") {
      Swal.fire("🚫 Solo el superAdmin puede editar usuarios.");
      return;
    }

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
        insertarUserTabla();
      } else {
        Swal.fire("❌ Error: " + (result.error || "No se pudo actualizar"));
      }
    } catch (err) {
      console.error(err);
      Swal.fire("❌ Error al enviar los datos");
    }
  });
});
