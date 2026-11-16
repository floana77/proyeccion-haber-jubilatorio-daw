import { Provider } from '@angular/core';

// Ambiente de desarrollo. TEMPORAL (Block 1 de FEAT-001): mínimo para que compile app.config.ts.
// El Block 5 completa gatewayProviders con el gateway en memoria.
export const environment: { production: boolean; gatewayProviders: Provider[] } = {
  production: false,
  gatewayProviders: [],
};
