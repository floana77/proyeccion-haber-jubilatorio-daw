import { Observable } from 'rxjs';
import { EstadoMatricula, FechasMinimas } from '../domain/tipos';

/**
 * Puerto de acceso a los servicios de proyección. Es una clase abstracta para usarla
 * directamente como token de inyección; cada environment.*.ts elige la implementación (ADR-001).
 */
export abstract class ProyeccionGateway {
  /** Estado de la matrícula del afiliado de la sesión (FR-01). */
  abstract obtenerEstadoMatricula(): Observable<EstadoMatricula>;

  /** Fechas mínimas de jubilación por tipo de beneficio, como fecha calendario AAAA-MM-DD (FR-02, ADR-002). */
  abstract obtenerFechasMinimas(): Observable<FechasMinimas>;
}
