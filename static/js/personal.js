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
    console.log(usuario)
  });
  
}

function agregarFila(usuario) {
  const form = document.getElementById('formUsuario');
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

  fila.querySelector('.eliminar-btn').addEventListener('click', () => {
    tabla.removeChild(fila);
    Swal.fire({
      icon: 'success',
      title: '✅ Usuario eliminado correctamente'
    });
  });

  fila.querySelector('.editar-btn').addEventListener('click', () => {
    document.getElementById('nombre').value = fila.cells[1].textContent;
    document.getElementById('rol').value = fila.cells[4].textContent;

    filaEditando = fila;
    modoEdicion = true;
    form.querySelector('button[type="submit"]').textContent = "Actualizar Usuario";
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

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const rol = document.getElementById('rol').value;

    if (!nombre || !pass || !email || !telefono || !rol) {
      Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: 'No se pudo guardar el usuario. Verifica los datos.'
      });
      return;
    }

    const usuario = {usuario:nombre,contrasena:pass, email:email, celular:telefono, rol:rol };
    try {
            const respuesta = await fetch("/api/new_usuario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(usuario),
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();

                Swal.fire({
                    title: 'Usuario Guardado',
                    html: `
                    <div class="text-start">
                        <p><strong>ID:</strong> ${resultado.id}</p>
                        <p><strong>Nombre:</strong> ${usuario.nombre}</p>
                        <p><strong>Rol:</strong> ${usuario.rol}</p>
                        <p><strong>Teléfono:</strong> ${usuario.telefono}</p>
                        <p><strong>Email:</strong> ${usuario.email}</p>
                    </div>
                    `,
                    icon: 'success'
                });
                
                form.reset();
                agregarFila(resultado);
            } else {
                const error = await respuesta.json();
                if (error.columna) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: `El valor ya existe en la columna: ${error.columna}.`
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: `No se pudo guardar el proveedor: ${error.error}`
                    });
                }
            }
        } catch (error) {
            console.error("Error al enviar los datos:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al guardar el proveedor. Por favor, intenta nuevamente.'
            });
        }
  });


});
