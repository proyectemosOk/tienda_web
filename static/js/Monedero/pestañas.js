        document.addEventListener('DOMContentLoaded', () => {
            const acciones = document.querySelectorAll('.accion-rapida');
            // Secciones actualizadas para incluir "cuentas-por-pagar"
            const secciones = [
                'nuevo-tipo-pago', 
                'gastos', 
                'cuentas-por-cobrar',
                'cuentas-por-pagar'  // Sección añadida
            ];

            // Ocultar todas menos la primera al inicio
            secciones.forEach((id, index) => {
                const seccion = document.getElementById(id);
                if (seccion) seccion.style.display = index === 0 ? 'block' : 'none';
            });

            acciones.forEach(btn => {
                // Extraer el destino desde el atributo data-target
                let targetId = btn.getAttribute('data-target');
                
                // Si no tiene atributo, extraer desde el texto del h3
                if (!targetId) {
                    const h3 = btn.querySelector('h3');
                    if (h3) {
                        const texto = h3.textContent.trim().toLowerCase();
                        if (texto.includes('pago')) targetId = 'nuevo-tipo-pago';
                        else if (texto.includes('gasto')) targetId = 'gastos';
                        else if (texto.includes('cobrar')) targetId = 'cuentas-por-cobrar';
                        else if (texto.includes('pagar')) targetId = 'cuentas-por-pagar'; // Condición añadida
                    }
                }

                btn.addEventListener('click', () => {
                    // Ocultar/mostrar secciones
                    secciones.forEach(id => {
                        const seccion = document.getElementById(id);
                        if (seccion) {
                            seccion.style.display = id === targetId ? 'block' : 'none';
                            // Actualizar clases para animación
                            if (id === targetId) {
                                seccion.classList.add('seccion-activa');
                            } else {
                                seccion.classList.remove('seccion-activa');
                            }
                        }
                    });

                    // Estilo activo
                    acciones.forEach(b => b.classList.remove('activa'));
                    btn.classList.add('activa');
                });
            });
        })