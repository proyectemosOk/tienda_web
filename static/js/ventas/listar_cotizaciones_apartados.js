async function listarDocumentos(tipo) {
    if (tipo !== 'cotizaciones' && tipo !== 'apartados') {
        throw new Error("El parámetro 'tipo' debe ser 'cotizaciones' o 'apartados'");
    }

    const url = `/api/listar_documentos?tipo=${tipo}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error al llamar la API: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();

        if (!data.valido) {
            throw new Error(`API respondió con error: ${data.mensaje || 'Sin mensaje de error'}`);
        }

        // Retorna array de cotizaciones o apartados según tipo
        return data; 
    } catch (error) {
        console.error('Error en listarDocumentos:', error);
        throw error;
    }
}
