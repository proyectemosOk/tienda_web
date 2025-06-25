document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll(".menu-item")
    const contenedor = document.getElementById("contenido")
  
    const rutas = {
      monederos: "/monederos",
      ventas: "/ventas",
      inventario: "/inventarios",
      cuentas: "/cierre_dia",
      personal: "/personal",
      configuraciones: "configuraciones.html",
      empresa: "/empresa",
      informes: "/informes",
      casa: "/home",
    }
  
    // Limpiar contenido anterior
    function limpiarPaginaAnterior() {
      console.log("🧹 Limpiando contenido anterior...")
      contenedor.innerHTML = ""
    }
  
    // Obtener la página actual basada en la ruta
    function getPaginaFromPath(path) {
      const pagina = Object.keys(rutas).find((key) => rutas[key] === path)
      if (!pagina) return "inventario"
      if (path === "/" || path === "/home") return "inventario"
      return pagina
    }
  
    // Cargar una nueva página
    async function cargarPagina(pagina, push = true) {
      console.log(`🚀 Cargando página: ${pagina}`)
  
      const ruta = rutas[pagina]
  
      if (!ruta) {
        console.error(`❌ No se encontró ruta para la página: ${pagina}`)
        return
      }
  
      try {
        limpiarPaginaAnterior()
  
        console.log(`📄 Cargando HTML desde: ${ruta}`)
        const response = await fetch(ruta)
        const html = await response.text()
        contenedor.innerHTML = html
        ejecutarScriptsDesdeHTML(contenedor)
        console.log(`✅ HTML cargado para: ${pagina}`)
  
        if (push) {
          history.pushState({ pagina }, "", ruta)
        }
  
        items.forEach((item) => {
          item.classList.toggle("active", item.getAttribute("data-page") === pagina)
        })
      } catch (err) {
        console.error(`❌ Error al cargar la página ${pagina}:`, err)
        contenedor.innerHTML = `<div class="error">Error al cargar la página: ${pagina}</div>`
      }
    }
  
    // Manejar clicks en el menú
    items.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault()
        const pagina = item.getAttribute("data-page")
        console.log(`🖱️ Click en menú: ${pagina}`)
        cargarPagina(pagina)
      })
    })
  
    // Cargar la página inicial
    const paginaInicial = getPaginaFromPath(location.pathname)
    console.log(`🏠 Cargando página inicial: ${paginaInicial}`)
    cargarPagina(paginaInicial, false)
  
    // Manejar navegación con botones atrás/adelante
    window.addEventListener("popstate", (event) => {
      const pagina = event.state ? event.state.pagina : getPaginaFromPath(location.pathname)
      console.log(`⬅️ Navegación popstate: ${pagina}`)
      cargarPagina(pagina, false)
    })
    function ejecutarScriptsDesdeHTML(contenedor) {
        const scripts = contenedor.querySelectorAll("script")
        scripts.forEach((oldScript) => {
          const newScript = document.createElement("script")
          if (oldScript.src) {
            newScript.src = oldScript.src
          } else {
            newScript.textContent = oldScript.textContent
          }
          document.body.appendChild(newScript)
          oldScript.remove()
        })
      }
  })
  