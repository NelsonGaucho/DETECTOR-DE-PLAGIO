
// Este archivo ahora actúa como punto de entrada y re-exporta las funciones principales
// para mantener la compatibilidad con el código existente

import { searchInternet } from "./internetSearch";

// Re-exportamos la función principal para mantener la API pública igual
export { searchInternet };
