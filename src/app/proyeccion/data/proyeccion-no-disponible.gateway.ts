import { Injectable, Provider } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { EstadoMatricula, FechasMinimas } from '../domain/tipos';
import { ProyeccionGateway } from './proyeccion.gateway';

/** Error de los servicios de proyección no disponibles en este ambiente. */
export class ProyeccionNoDisponibleError extends Error {
  constructor() {
    super('Los servicios de proyección no están disponibles.');
    this.name = 'ProyeccionNoDisponibleError';
  }
}

/**
 * Gateway de producción. TEMPORAL (ADR-001): hasta el ticket de RF-13 y la conexión con los
 * servicios reales, sus dos operaciones terminan en error y la pantalla queda solo con el título.
 * Ignora UBICACION y el parámetro `escenario` (FR-06): nunca devuelve datos simulados.
 */
@Injectable()
export class ProyeccionNoDisponibleGateway extends ProyeccionGateway {
  override obtenerEstadoMatricula(): Observable<EstadoMatricula> {
    return throwError(() => new ProyeccionNoDisponibleError());
  }

  override obtenerFechasMinimas(): Observable<FechasMinimas> {
    return throwError(() => new ProyeccionNoDisponibleError());
  }
}

/** Providers que resuelven `ProyeccionGateway` al gateway no disponible. */
export function proveerGatewayNoDisponible(): Provider[] {
  return [{ provide: ProyeccionGateway, useClass: ProyeccionNoDisponibleGateway }];
}
