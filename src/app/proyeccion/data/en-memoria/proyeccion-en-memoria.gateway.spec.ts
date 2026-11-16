import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { UBICACION } from '../../platform/ubicacion.token';
import { ProyeccionGateway } from '../proyeccion.gateway';
import { ProyeccionEnMemoriaGateway, proveerGatewayEnMemoria } from './proyeccion-en-memoria.gateway';

function gatewayCon(search: string): ProyeccionGateway {
  TestBed.configureTestingModule({
    providers: [...proveerGatewayEnMemoria(), { provide: UBICACION, useValue: search }],
  });
  return TestBed.inject(ProyeccionGateway);
}

describe('ProyeccionEnMemoriaGateway', () => {
  it('con escenario "activo" devuelve "activa" y las fechas 2031-10-14 y 2026-09-01 (AC-01)', async () => {
    const gateway = gatewayCon('?escenario=activo');

    expect(gateway).toBeInstanceOf(ProyeccionEnMemoriaGateway);
    expect(await firstValueFrom(gateway.obtenerEstadoMatricula())).toBe('activa');
    expect(await firstValueFrom(gateway.obtenerFechasMinimas())).toEqual({
      ordinaria: '2031-10-14',
      parcial: '2026-09-01',
    });
  });

  it('con escenario "fallecido" devuelve "fallecido" (AC-03)', async () => {
    const gateway = gatewayCon('?escenario=fallecido');

    expect(await firstValueFrom(gateway.obtenerEstadoMatricula())).toBe('fallecido');
  });
});
