document.addEventListener('DOMContentLoaded', () => {
  const acciones = document.querySelectorAll('.accion-rapida');
  const secciones = ['nuevo-tipo-pago', 'gastos', 'cuentas-por-cobrar'];

  // Ocultar todas menos la primera al inicio
  secciones.forEach((id, index) => {
    const seccion = document.getElementById(id);
    if (seccion) seccion.style.display = index === 0 ? 'block' : 'none';
  });

  acciones.forEach(btn => {
    // Extraer el destino desde el texto del h3 si no tiene atributo
    const h3 = btn.querySelector('h3');
    let targetId = btn.getAttribute('data-target');
    if (!targetId && h3) {
      const texto = h3.textContent.trim().toLowerCase();
      if (texto.includes('pago')) targetId = 'nuevo-tipo-pago';
      else if (texto.includes('gasto')) targetId = 'gastos';
      else if (texto.includes('cobrar')) targetId = 'cuentas-por-cobrar';
    }

    btn.addEventListener('click', () => {
      // Ocultar/mostrar secciones
      secciones.forEach(id => {
        const seccion = document.getElementById(id);
        if (seccion) seccion.style.display = id === targetId ? 'block' : 'none';
      });

      // Estilo activo
      acciones.forEach(b => b.classList.remove('activa'));
      btn.classList.add('activa');
    });
  });
});
