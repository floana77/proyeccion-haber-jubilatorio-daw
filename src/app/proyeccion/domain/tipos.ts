// Tipos del dominio de la proyección. Funciones puras, sin Angular.

/** Estado de la matrícula profesional del afiliado. */
export type EstadoMatricula = 'activa' | 'cancelado' | 'suspendido' | 'fallecido';

/** Fecha calendario `AAAA-MM-DD`: un día, sin hora ni zona horaria (ADR-002). */
export type FechaCalendario = string;

/** Fecha mínima de jubilación de cada tipo de beneficio. */
export interface FechasMinimas {
  ordinaria: FechaCalendario;
  parcial: FechaCalendario;
}

/**
 * Regla de fallecido: con la matrícula en "fallecido" no se puede proyectar (RF-05).
 * Es la única definición de esta regla en el código; el resto la reutiliza.
 */
export function esFallecido(estado: EstadoMatricula): boolean {
  return estado === 'fallecido';
}
