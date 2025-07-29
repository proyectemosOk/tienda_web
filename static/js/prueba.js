function simularVoto() {
  fetch('/api/guardar_datos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calificacion: 3 })
  })
    .then(res => res.json())
    .then(data => alert(JSON.stringify(data)));
}