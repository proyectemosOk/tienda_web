let tablaClientes;

async function cargarClientesApi() {
  try {
    const response = await fetch(`/api/cargar/clientes`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }
}

async function insertarClientesEnTabla() {
  const clientes = await cargarClientesApi();
  tablaClientes.innerHTML = "";

  clientes.forEach(cliente => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${cliente.id}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.tipo_document}</td>
      <td>${cliente.numero}</td>
      <td>${cliente.telefono}</td>
      <td>${cliente.email}</td>
      <td>
        <button class="editar-btn">✏️</button>
      </td>
    `;

    fila.querySelector('.editar-btn').addEventListener('click', () => abrirModalEdicion(cliente));
    fila.querySelector('.eliminar-btn').addEventListener('click', () => eliminarCliente(cliente, fila));
    tablaClientes.appendChild(fila);
  });
}

function abrirModalEdicion(cliente) {
  document.getElementById('edit-id').value = cliente.id;
  document.getElementById('edit-nombre').value = cliente.nombre;
  document.getElementById('edit-tipo_document').value = cliente.tipo_document;
  document.getElementById('edit-numero').value = cliente.numero;
  document.getElementById('edit-telefono').value = cliente.telefono;
  document.getElementById('edit-email').value = cliente.email;
  document.getElementById('modalEditarCliente').style.display = 'flex';
}

async function eliminarCliente(cliente, fila) {
  const confirm = await Swal.fire({
    title: `¿Eliminar a ${cliente.nombre}?`,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    icon: 'warning'
  });

  if (confirm.isConfirmed) {
    const res = await fetch(`/api/clientes/${cliente.id}`, { method: "DELETE" });
    if (res.ok) {
      fila.remove();
      Swal.fire("✅ Cliente eliminado");
    } else {
      Swal.fire("❌ No se pudo eliminar el cliente");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const formCrear = document.getElementById('formCliente');
  const formEditar = document.getElementById('formEditarCliente');
  tablaClientes = document.getElementById('tablaClientes');

  insertarClientesEnTabla();

  document.getElementById('cerrarModal').addEventListener('click', () => {
    document.getElementById('modalEditarCliente').style.display = 'none';
  });

  formCrear.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const tipo_document = document.getElementById('tipo_document').value;
    const numero = document.getElementById('numero').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!nombre || !tipo_document || !numero) {
      Swal.fire({ icon: 'error', title: '❌ Error', text: 'Faltan datos obligatorios.' });
      return;
    }

    const cliente = { nombre, tipo_document, numero, telefono, email };

    try {
      const respuesta = await fetch("/api/new_cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente),
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        Swal.fire({ icon: 'success', title: 'Cliente guardado correctamente' });
        formCrear.reset();
        insertarClientesEnTabla();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: resultado.error || 'No se pudo guardar el cliente' });
      }
    } catch (error) {
      console.error("Error al enviar datos:", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al enviar los datos' });
    }
  });

  formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const nombre = document.getElementById('edit-nombre').value;
    const tipo_document = document.getElementById('edit-tipo_document').value;
    const numero = document.getElementById('edit-numero').value;
    const telefono = document.getElementById('edit-telefono').value;
    const email = document.getElementById('edit-email').value;

    const datos = { nombre, tipo_document, numero, telefono, email };

    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire("✅ Cliente actualizado correctamente");
        document.getElementById('modalEditarCliente').style.display = 'none';
        insertarClientesEnTabla();
      } else {
        Swal.fire("❌ Error: " + (result.error || "No se pudo actualizar"));
      }
    } catch (err) {
      console.error(err);
      Swal.fire("❌ Error al enviar los datos");
    }
  });
});
