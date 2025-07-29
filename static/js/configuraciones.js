// 👉 Establece el rol desde Flask o JS

// Ocultar botones según el rol
document.addEventListener("DOMContentLoaded", () => {
    let rol = datos.rol;
    if (rol !== "admin" && rol !== "superAdmin") {
        const personal = document.getElementById("personal");
        const empresa = document.getElementById("empresa");

        if (personal) personal.style.display = "none";
        if (empresa) empresa.style.display = "none";

        // Cambiar el iframe al único disponible (cliente)
        document.getElementById("iframe-ajuste").src = "/cliente";
    }

    // Control de tabs
    const buttons = document.querySelectorAll('.tab-btn');
    const iframe = document.getElementById('iframe-ajuste');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            if (url === iframe.src || iframe.src.endsWith(url)) return;

            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            iframe.classList.add('fade-out');
            setTimeout(() => {
                iframe.src = url;
            }, 300);
        });
    });

    iframe.addEventListener('load', () => {
        iframe.classList.remove('fade-out');
    });
})
