import { proveerGatewayNoDisponible } from '../app/proyeccion/data/proyeccion-no-disponible.gateway';
import { Ambiente } from './ambiente';

// Ambiente de producción: NUNCA datos simulados (FR-06, ADR-001). Este archivo no importa el
// gateway simulado, así ese código no entra al bundle. Reemplaza a environment.ts por fileReplacements.
export const environment: Ambiente = {
  production: true,
  gatewayProviders: proveerGatewayNoDisponible(),
};
