import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ProyeccionGateway } from '../app/proyeccion/data/proyeccion.gateway';
import { ProyeccionEnMemoriaGateway } from '../app/proyeccion/data/en-memoria/proyeccion-en-memoria.gateway';
import { UBICACION } from '../app/proyeccion/platform/ubicacion.token';
import { environment } from './environment';
import { environment as environmentQa } from './environment.qa';

describe('environment (desarrollo) y environment.qa', () => {
  it('resuelven ProyeccionGateway al gateway en memoria y, sin parámetro escenario, el estado es "activa" (AC-04)', async () => {
    const ambientes = [
      { nombre: 'desarrollo', ambiente: environment },
      { nombre: 'qa', ambiente: environmentQa },
    ];

    for (const { nombre, ambiente } of ambientes) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...ambiente.gatewayProviders, { provide: UBICACION, useValue: '' }],
      });
      // Opcional para que un provider faltante se vea como aserción fallida y no como excepción.
      const gateway = TestBed.inject(ProyeccionGateway, null, { optional: true });

      expect(ambiente.production).withContext(nombre).toBeFalse();
      expect(gateway).withContext(nombre).toBeInstanceOf(ProyeccionEnMemoriaGateway);
      if (gateway) {
        expect(await firstValueFrom(gateway.obtenerEstadoMatricula())).withContext(nombre).toBe('activa');
      }
    }
  });
});
