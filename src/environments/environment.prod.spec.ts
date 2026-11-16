import { TestBed } from '@angular/core/testing';
import { ProyeccionGateway } from '../app/proyeccion/data/proyeccion.gateway';
import { ProyeccionNoDisponibleGateway } from '../app/proyeccion/data/proyeccion-no-disponible.gateway';
import { UBICACION } from '../app/proyeccion/platform/ubicacion.token';
// Se importa directo: los tests no usan fileReplacements.
import { environment } from './environment.prod';

describe('environment.prod', () => {
  it('resuelve ProyeccionGateway al gateway no disponible y production es true (AC-06)', () => {
    TestBed.configureTestingModule({
      providers: [...environment.gatewayProviders, { provide: UBICACION, useValue: '?escenario=activo' }],
    });
    // Opcional para que un provider faltante se vea como aserción fallida y no como excepción.
    const gateway = TestBed.inject(ProyeccionGateway, null, { optional: true });

    expect(environment.production).toBeTrue();
    expect(gateway).toBeInstanceOf(ProyeccionNoDisponibleGateway);
  });
});
