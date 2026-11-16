import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { UBICACION } from '../platform/ubicacion.token';
import { ProyeccionGateway } from './proyeccion.gateway';
import {
  ProyeccionNoDisponibleError,
  ProyeccionNoDisponibleGateway,
  proveerGatewayNoDisponible,
} from './proyeccion-no-disponible.gateway';

async function errorDe(observable: Observable<unknown>): Promise<unknown> {
  try {
    await firstValueFrom(observable);
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('ProyeccionNoDisponibleGateway', () => {
  it('emite ProyeccionNoDisponibleError en las dos operaciones, aun con escenario=activo (AC-06)', async () => {
    TestBed.configureTestingModule({
      providers: [...proveerGatewayNoDisponible(), { provide: UBICACION, useValue: '?escenario=activo' }],
    });
    const gateway = TestBed.inject(ProyeccionGateway);

    expect(gateway).toBeInstanceOf(ProyeccionNoDisponibleGateway);
    expect(await errorDe(gateway.obtenerEstadoMatricula())).toBeInstanceOf(ProyeccionNoDisponibleError);
    expect(await errorDe(gateway.obtenerFechasMinimas())).toBeInstanceOf(ProyeccionNoDisponibleError);
  });
});
