import { proveerGatewayEnMemoria } from '../app/proyeccion/data/en-memoria/proyeccion-en-memoria.gateway';
import { Ambiente } from './ambiente';

// Ambiente de desarrollo: datos simulados por escenario (FR-05). En el código de la aplicación,
// solo environment.ts y environment.qa.ts importan el gateway en memoria (ADR-001). Los specs
// también pueden importarlo porque no entran al bundle.
export const environment: Ambiente = {
  production: false,
  gatewayProviders: proveerGatewayEnMemoria(),
};
