import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProyeccionGateway } from '../data/proyeccion.gateway';
import { EstadoMatricula, FechasMinimas } from '../domain/tipos';
import { ProyeccionStore } from './proyeccion.store';

const FECHAS: FechasMinimas = { ordinaria: '2031-10-14', parcial: '2026-09-01' };

type GatewayFalso = jasmine.SpyObj<ProyeccionGateway>;

function crearStore(configurar: (gateway: GatewayFalso) => void): { store: ProyeccionStore; gateway: GatewayFalso } {
  const gateway = jasmine.createSpyObj<ProyeccionGateway>('ProyeccionGateway', [
    'obtenerEstadoMatricula',
    'obtenerFechasMinimas',
  ]);
  configurar(gateway);
  TestBed.configureTestingModule({
    providers: [ProyeccionStore, { provide: ProyeccionGateway, useValue: gateway }],
  });
  return { store: TestBed.inject(ProyeccionStore), gateway };
}

function conEstado(estado: EstadoMatricula): (gateway: GatewayFalso) => void {
  return (gateway) => {
    gateway.obtenerEstadoMatricula.and.returnValue(of(estado));
    gateway.obtenerFechasMinimas.and.returnValue(of(FECHAS));
  };
}

describe('ProyeccionStore', () => {
  it('con estado "activa" pide las fechas y expone la vista beneficios (AC-01)', () => {
    const { store, gateway } = crearStore(conEstado('activa'));
    expect(store.vista()).withContext('antes de cargar').toBeNull();

    store.cargar();

    expect(gateway.obtenerEstadoMatricula).toHaveBeenCalledTimes(1);
    expect(gateway.obtenerFechasMinimas).toHaveBeenCalledTimes(1);
    expect(store.vista()).toEqual({ tipo: 'beneficios', fechas: FECHAS });
  });

  it('con estado "fallecido" no llama a obtenerFechasMinimas() y expone solo-titulo (AC-03)', () => {
    const { store, gateway } = crearStore(conEstado('fallecido'));

    store.cargar();

    expect(gateway.obtenerEstadoMatricula).toHaveBeenCalledTimes(1);
    expect(gateway.obtenerFechasMinimas).toHaveBeenCalledTimes(0);
    expect(store.vista()).toEqual({ tipo: 'solo-titulo' });
  });

  it('con error al obtener el estado expone solo-titulo y no pide las fechas', () => {
    const { store, gateway } = crearStore((g) => {
      g.obtenerEstadoMatricula.and.returnValue(throwError(() => new Error('estado no disponible')));
      g.obtenerFechasMinimas.and.returnValue(of(FECHAS));
    });

    store.cargar();

    expect(gateway.obtenerFechasMinimas).toHaveBeenCalledTimes(0);
    expect(store.vista()).toEqual({ tipo: 'solo-titulo' });
  });

  it('con error al obtener las fechas expone solo-titulo', () => {
    const { store, gateway } = crearStore((g) => {
      g.obtenerEstadoMatricula.and.returnValue(of<EstadoMatricula>('activa'));
      g.obtenerFechasMinimas.and.returnValue(throwError(() => new Error('fechas no disponibles')));
    });

    store.cargar();

    expect(gateway.obtenerFechasMinimas).toHaveBeenCalledTimes(1);
    expect(store.vista()).toEqual({ tipo: 'solo-titulo' });
  });
});
