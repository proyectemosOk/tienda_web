async function cargarPaginaNUevaOrden() {
    window.location.href = "/orden/nueva";
};

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-nueva-orden").addEventListener("click", cargarPaginaNUevaOrden);
    
})