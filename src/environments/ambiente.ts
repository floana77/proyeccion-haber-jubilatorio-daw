import { Provider } from '@angular/core';

/** Forma común de los tres environments (desarrollo, QA y producción). */
export interface Ambiente {
  production: boolean;
  /** Providers que eligen la implementación de ProyeccionGateway del ambiente (ADR-001). */
  gatewayProviders: Provider[];
}
