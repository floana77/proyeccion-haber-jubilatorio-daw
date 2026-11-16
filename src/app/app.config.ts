import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';

// Cada environment.*.ts elige la implementación de ProyeccionGateway (ADR-001).
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    ...environment.gatewayProviders,
  ],
};
