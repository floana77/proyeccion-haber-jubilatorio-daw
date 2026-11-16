import { Injectable, Signal, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { ProyeccionGateway } from '../data/proyeccion.gateway';
import { EstadoMatricula, esFallecido } from '../domain/tipos';
import { ResultadoCarga, VistaPantalla, decidirVista } from '../domain/vista-pantalla';

/**
 * Estado de la pantalla inicial del módulo. Obtiene los datos por `ProyeccionGateway` y delega
 * en `decidirVista` qué se muestra. No escribe los datos en la consola (threat-FEAT-001, R-05)
 * ni los persiste en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class ProyeccionStore {
  private readonly gateway = inject(ProyeccionGateway);
  private readonly vistaActual = signal<VistaPantalla | null>(null);

  /** Vista a mostrar; `null` mientras la carga no terminó. */
  readonly vista: Signal<VistaPantalla | null> = this.vistaActual.asReadonly();

  /**
   * Pide el estado de la matrícula (FR-01) y, solo si no es fallecido, las fechas mínimas
   * (FR-02, FR-04). Un error en cualquiera de las dos deja la vista en `solo-titulo`.
   */
  cargar(): void {
    this.gateway
      .obtenerEstadoMatricula()
      .pipe(
        switchMap((estado) => this.cargarFechasSegun(estado)),
        // Error al obtener el estado: no se piden las fechas.
        catchError(() => of<ResultadoCarga>({ estado: null, fechas: null, error: true })),
      )
      .subscribe((carga) => this.vistaActual.set(decidirVista(carga)));
  }

  private cargarFechasSegun(estado: EstadoMatricula): Observable<ResultadoCarga> {
    if (esFallecido(estado)) {
      return of({ estado, fechas: null, error: false });
    }
    return this.gateway.obtenerFechasMinimas().pipe(
      map((fechas): ResultadoCarga => ({ estado, fechas, error: false })),
      catchError(() => of<ResultadoCarga>({ estado, fechas: null, error: true })),
    );
  }
}
