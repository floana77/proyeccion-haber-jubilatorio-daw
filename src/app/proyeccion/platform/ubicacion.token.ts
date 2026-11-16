import { InjectionToken } from '@angular/core';

/**
 * Query string de la URL actual (`window.location.search`), detrás de un token inyectable
 * para poder testear sin depender del navegador. La usa el gateway en memoria para elegir el escenario.
 */
export const UBICACION = new InjectionToken<string>('UBICACION', {
  providedIn: 'root',
  factory: () => window.location.search,
});
