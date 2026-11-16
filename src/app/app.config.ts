import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { environment } from '../environments/environment';

// Cada environment.*.ts elige la implementación de ProyeccionGateway (ADR-001).
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    ...environment.gatewayProviders,
  ],
};
