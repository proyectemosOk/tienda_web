function mostrarPDF(pdfBase64) {
  // Convertir base64 a Blob
  const byteCharacters = atob(pdfBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });

  // Crear URL del blob
  const blobUrl = URL.createObjectURL(blob);

  // Mostrar en iframe dentro del modal
  document.getElementById("pdfFrame").src = blobUrl;
  document.getElementById("modalPDF").style.display = "block";
}

// Cerrar modal
function cerrarModalPDF() {
  document.getElementById("modalPDF").style.display = "none";
  document.getElementById("pdfFrame").src = ""; // Limpia el src para liberar el blob
}
