document.addEventListener('DOMContentLoaded', () => {  
    let currentStage = 1;
    const totalStages = 5;

    const stages = document.querySelectorAll('.form-stage');
    const progressIndicators = document.querySelectorAll('.step-indicator');

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitSection = document.querySelector('.submit-section');

    function showStage(stage) {
        stages.forEach(s => s.classList.add('hidden'));
        const current = document.querySelector(`.form-stage[data-stage="${stage}"]`);
        if (current) current.classList.remove('hidden');

        progressIndicators.forEach((indicator, index) => {
            if (index < stage) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });

        prevBtn.style.display = (stage === 1) ? 'none' : 'inline-block';
        nextBtn.textContent = (stage === totalStages) ? 'Finalizar' : 'Siguiente ➡️';
        submitSection.style.display = (stage === totalStages) ? 'block' : 'none';
    }

    prevBtn.addEventListener('click', () => {
        if (currentStage > 1) {
            currentStage--;
            showStage(currentStage);
        }
    });

    nextBtn.addEventListener('click', () => {
        // Validación específica para la etapa 4 (PAGOS)
        if (currentStage === 4) {
            const valorServicio = document.getElementById('valor_servicio');
            if (!valorServicio || valorServicio.value.trim() === '' || parseFloat(valorServicio.value) <= 0) {
                Swal.fire('Campo obligatorio', 'Debes ingresar el valor total del servicio antes de finalizar.', 'warning');
                return;
            }
        }

        if (currentStage < totalStages) {
            currentStage++;
            showStage(currentStage);
        } else {
            // Enviar formulario si todo está correcto
            document.querySelector('.orden-form').requestSubmit();
        }
    });

    // Inicializar
    showStage(currentStage);
});
