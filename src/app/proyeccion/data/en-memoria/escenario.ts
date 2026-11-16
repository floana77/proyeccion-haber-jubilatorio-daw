// Escenarios de datos simulados (solo desarrollo y QA, FR-05).

export type Escenario = 'activo' | 'fallecido';

const ESCENARIO_POR_DEFECTO: Escenario = 'activo';

/**
 * Lee el parámetro `escenario` de la query string. Compara por igualdad exacta contra los
 * valores permitidos; ausente, vacío o cualquier otro valor da `activo` (AC-04, AC-05).
 * El valor recibido nunca se devuelve tal cual ni se usa como HTML, ruta o URL (threat-FEAT-001, R-01).
 */
export function resolverEscenario(search: string): Escenario {
  const valor = new URLSearchParams(search).get('escenario');
  if (valor === 'fallecido') {
    return 'fallecido';
  }
  if (valor === 'activo') {
    return 'activo';
  }
  return ESCENARIO_POR_DEFECTO;
}
