import { EstadoMatricula, esFallecido } from './tipos';

describe('esFallecido', () => {
  it('devuelve true solo para "fallecido" y false para "activa", "cancelado" y "suspendido" (AC-01, AC-03)', () => {
    expect(esFallecido('fallecido')).toBeTrue();

    const noFallecidos: EstadoMatricula[] = ['activa', 'cancelado', 'suspendido'];
    for (const estado of noFallecidos) {
      expect(esFallecido(estado)).withContext(estado).toBeFalse();
    }
  });
});
