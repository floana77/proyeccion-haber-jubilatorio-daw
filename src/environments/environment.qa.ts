import { proveerGatewayEnMemoria } from '../app/proyeccion/data/en-memoria/proyeccion-en-memoria.gateway';
import { Ambiente } from './ambiente';

// Ambiente de QA: igual que desarrollo, con datos simulados por escenario (FR-05). Reemplaza a
// environment.ts por fileReplacements en la configuración qa de angular.json (ADR-001).
export const environment: Ambiente = {
  production: false,
  gatewayProviders: proveerGatewayEnMemoria(),
};
