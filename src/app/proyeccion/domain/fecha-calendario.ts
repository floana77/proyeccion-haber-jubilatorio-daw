import { FechaCalendario } from './tipos';

// Formateo de fechas calendario (ADR-002). No usa `Date` ni zona horaria: una fecha mínima
// corrida un día por la zona del dispositivo sería un error sobre la jubilación del afiliado.

/** Se lanza cuando la fecha recibida no es una fecha calendario `AAAA-MM-DD` válida. */
export class FechaCalendarioInvalidaError extends Error {
  constructor(readonly valor: string) {
    super(`Fecha calendario inválida: '${valor}'`);
    this.name = 'FechaCalendarioInvalidaError';
  }
}

const FORMATO_FECHA_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convierte `AAAA-MM-DD` en `dd/mm/aaaa` (FR-03). Lanza `FechaCalendarioInvalidaError` si no es válida. */
export function formatearFechaCalendario(fecha: FechaCalendario): string {
  const partes = FORMATO_FECHA_CALENDARIO.exec(fecha);
  if (partes === null) {
    throw new FechaCalendarioInvalidaError(fecha);
  }
  const [, anio, mes, dia] = partes;
  const numeroMes = Number(mes);
  const numeroDia = Number(dia);
  if (numeroMes < 1 || numeroMes > 12 || numeroDia < 1 || numeroDia > 31) {
    throw new FechaCalendarioInvalidaError(fecha);
  }
  return `${dia}/${mes}/${anio}`;
}
