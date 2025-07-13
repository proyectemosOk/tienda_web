function redireccionInicio(){
    const usuario = obtenerDesdeLocalStorage("usuario");
    if(usuario=="0" || usuario === null){
        return window.location.href = '/';
    }
    return usuario
}

function obtenerDesdeLocalStorage(clave) {
    const valor = localStorage.getItem(clave);
    if (valor) {
        try {
            return JSON.parse(valor); // Si es un objeto/array, lo convierte desde string
        } catch (e) {
            return valor; // Si no es JSON, devuelve el valor tal cual
        }
    }
    return null; // Si no existe la clave
}
var datos;

document.addEventListener("DOMContentLoaded", ()=>{
    datos = redireccionInicio();
})
