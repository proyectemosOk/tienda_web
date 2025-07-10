document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const contMenu = document.getElementById('cont_menu');

    hamburgerBtn.addEventListener('click', () => {
        contMenu.classList.toggle('abierto');
    });

    let currentStage = 1;
    const totalStages = 4;

    const stages = document.querySelectorAll('.form-stage');
    const progressIndicators = document.querySelectorAll('.step-indicator');

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitSection = document.querySelector('.submit-section');

    function showStage(stage) {
        // Ocultar todas
        stages.forEach(s => s.classList.add('hidden'));
        // Mostrar la actual
        document.querySelector(`.form-stage[data-stage="${stage}"]`).classList.remove('hidden');

        // Actualizar progreso visual
        progressIndicators.forEach((indicator, index) => {
            if (index < stage) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });

        // Mostrar u ocultar botones
        prevBtn.style.display = (stage === 1) ? 'none' : 'inline-block';
        nextBtn.textContent = (stage === totalStages) ? 'Finalizar' : 'Siguiente ➡️';

        // Mostrar sección de envío solo en la última etapa
        submitSection.style.display = (stage === totalStages) ? 'block' : 'none';
    }

    prevBtn.addEventListener('click', () => {
        if (currentStage > 1) {
            currentStage--;
            showStage(currentStage);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentStage < totalStages) {
            currentStage++;
            showStage(currentStage);
        } else {
            // Estamos en la última, disparar el submit
            document.querySelector('.orden-form').requestSubmit();
        }
    });

    // Inicializar vista
    showStage(currentStage);
});

