import { EstadoMatricula, FechasMinimas, esFallecido } from './tipos';

// Decisión de qué muestra la pantalla inicial. Función pura, sin Angular.

/** Lo que muestra la pantalla: solo el título, o el título con las tarjetas de los beneficios. */
export type VistaPantalla = { tipo: 'solo-titulo' } | { tipo: 'beneficios'; fechas: FechasMinimas };

/** Resultado completo de la carga inicial: lo que se obtuvo y si alguna operación falló. */
export interface ResultadoCarga {
  /** Estado de la matrícula, o `null` si no se obtuvo. */
  estado: EstadoMatricula | null;
  /** Fechas mínimas, o `null` si no se pidieron o no se obtuvieron. */
  fechas: FechasMinimas | null;
  /** `true` si falló alguna de las operaciones de la carga. */
  error: boolean;
}

/**
 * Única decisión de qué se muestra (FR-03, FR-04): `beneficios` solo sin error, con un estado
 * no fallecido y con fechas; cualquier otro resultado da `solo-titulo`, sin mensaje (ADR-001).
 */
export function decidirVista(carga: ResultadoCarga): VistaPantalla {
  if (carga.error || carga.estado === null || esFallecido(carga.estado) || carga.fechas === null) {
    return { tipo: 'solo-titulo' };
  }
  return { tipo: 'beneficios', fechas: carga.fechas };
}
