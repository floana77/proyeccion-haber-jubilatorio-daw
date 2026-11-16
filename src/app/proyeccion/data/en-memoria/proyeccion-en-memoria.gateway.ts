import { Injectable, Provider, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { EstadoMatricula, FechasMinimas } from '../../domain/tipos';
import { UBICACION } from '../../platform/ubicacion.token';
import { ProyeccionGateway } from '../proyeccion.gateway';
import { Escenario, resolverEscenario } from './escenario';

// Gateway con datos simulados, SOLO para desarrollo y QA (FR-05). Solo lo importan
// environment.ts y environment.qa.ts; producción nunca (ADR-001).

interface DatosEscenario {
  estado: EstadoMatricula;
  fechas: FechasMinimas;
}

const FECHAS_SIMULADAS: FechasMinimas = { ordinaria: '2031-10-14', parcial: '2026-09-01' };

const DATOS_POR_ESCENARIO: Record<Escenario, DatosEscenario> = {
  activo: { estado: 'activa', fechas: FECHAS_SIMULADAS },
  fallecido: { estado: 'fallecido', fechas: FECHAS_SIMULADAS },
};

@Injectable()
export class ProyeccionEnMemoriaGateway extends ProyeccionGateway {
  private readonly datos = DATOS_POR_ESCENARIO[resolverEscenario(inject(UBICACION))];

  override obtenerEstadoMatricula(): Observable<EstadoMatricula> {
    return of(this.datos.estado);
  }

  override obtenerFechasMinimas(): Observable<FechasMinimas> {
    return of({ ...this.datos.fechas });
  }
}

/** Providers que resuelven `ProyeccionGateway` al gateway en memoria. */
export function proveerGatewayEnMemoria(): Provider[] {
  return [{ provide: ProyeccionGateway, useClass: ProyeccionEnMemoriaGateway }];
}
