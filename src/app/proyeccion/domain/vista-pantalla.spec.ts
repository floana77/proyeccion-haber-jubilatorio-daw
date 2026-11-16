import { FechasMinimas } from './tipos';
import { decidirVista } from './vista-pantalla';

const FECHAS: FechasMinimas = { ordinaria: '2031-10-14', parcial: '2026-09-01' };

describe('decidirVista', () => {
  it('con estado "activa" y fechas devuelve beneficios con esas fechas (AC-01)', () => {
    expect(decidirVista({ estado: 'activa', fechas: FECHAS, error: false })).toEqual({
      tipo: 'beneficios',
      fechas: FECHAS,
    });
  });

  it('con estado "fallecido" devuelve solo-titulo (AC-03)', () => {
    expect(decidirVista({ estado: 'fallecido', fechas: null, error: false })).toEqual({ tipo: 'solo-titulo' });
    // Aunque llegaran fechas, un fallecido nunca ve los beneficios.
    expect(decidirVista({ estado: 'fallecido', fechas: FECHAS, error: false })).toEqual({ tipo: 'solo-titulo' });
  });

  it('con error, o con estado no fallecido sin fechas, devuelve solo-titulo', () => {
    expect(decidirVista({ estado: null, fechas: null, error: true }))
      .withContext('error al obtener el estado')
      .toEqual({ tipo: 'solo-titulo' });
    expect(decidirVista({ estado: 'activa', fechas: null, error: true }))
      .withContext('error al obtener las fechas')
      .toEqual({ tipo: 'solo-titulo' });
    expect(decidirVista({ estado: 'activa', fechas: FECHAS, error: true }))
      .withContext('error aun con estado y fechas')
      .toEqual({ tipo: 'solo-titulo' });
    expect(decidirVista({ estado: 'activa', fechas: null, error: false }))
      .withContext('estado no fallecido sin fechas')
      .toEqual({ tipo: 'solo-titulo' });
    expect(decidirVista({ estado: null, fechas: FECHAS, error: false }))
      .withContext('fechas sin estado')
      .toEqual({ tipo: 'solo-titulo' });
  });
});
