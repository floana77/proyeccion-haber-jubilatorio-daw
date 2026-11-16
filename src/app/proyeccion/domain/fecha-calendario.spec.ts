import { FechaCalendarioInvalidaError, formatearFechaCalendario } from './fecha-calendario';

describe('formatearFechaCalendario', () => {
  it('formatea AAAA-MM-DD como dd/mm/aaaa (AC-01)', () => {
    expect(formatearFechaCalendario('2031-10-14')).toBe('14/10/2031');
    expect(formatearFechaCalendario('2026-09-01')).toBe('01/09/2026');
  });

  it('lanza FechaCalendarioInvalidaError con una fecha inválida', () => {
    for (const invalida of ['2031-13-01', '14/10/2031', '']) {
      expect(() => formatearFechaCalendario(invalida))
        .withContext(`'${invalida}'`)
        .toThrowError(FechaCalendarioInvalidaError);
    }
  });
});
