function cargarPagina(ruta) {
  if (ruta === "bienvenida") return;
  if(ruta === "salir") return window.location.href = '/';
  document.getElementById("iframe-contenido").src = ruta;
  document.getElementById("iframe-contenido").classList.add("alto")

}

document.addEventListener("DOMContentLoaded", () => {
  const rol = datos.rol;

    if (rol !== "admin" && rol !== "superAdmin") {
        const personal = document.getElementById("personal");
        const empresa = document.getElementById("empresa");

        if (personal) personal.style.display = "none";
        if (empresa) empresa.style.display = "none";
    }
  const contMenu = document.getElementById("cont_menu");
  const iframe = document.getElementById("iframe-contenido");

  // Mapas de rutas
  const rutas = {
    monederos: "/monederos",
    ventas: "/ventas",
    servicios: "/ordenes",
    inventario: "/inventarios",
    cuentas: "/cierre_dia",
    personal: "/personal",
    configuraciones: "/configuraciones",
    empresa: "/empresa",
    informes: "/informes",
    casa: "bienvenida",
    salir:"salir"
  };

  // Hover expandido SOLO en modo-menu
  contMenu.addEventListener("mouseenter", () => {
    if (document.body.classList.contains("modo-menu")) {
      contMenu.classList.add("expandido");
    }
  });

  contMenu.addEventListener("mouseleave", () => {
    contMenu.classList.remove("expandido");
  });

  // Listeners para cada item
  Object.keys(rutas).forEach(id => {
    const item = document.getElementById(id);
    if (item) {
      item.addEventListener("click", () => {
        const ruta = rutas[id];

        // Si estamos en modo-inicial, cambiamos a modo-menu
        if (document.body.classList.contains("modo-inicial")) {
          document.body.classList.remove("modo-inicial");
          document.body.classList.add("modo-menu");

          // Mostrar iframe
          iframe.classList.remove("oculto")
        }

        // Cargar en iframe
        cargarPagina(ruta);
      });
    }
  });
});
