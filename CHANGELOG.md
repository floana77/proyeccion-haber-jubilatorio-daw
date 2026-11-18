# Changelog

Todos los cambios notables de este proyecto se registran en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Unreleased]

### Added
- FEAT-001 Pantalla de proyección que obtiene el estado de la matrícula y muestra las fechas mínimas de Jubilación Ordinaria y Parcial (datos simulados por escenario en desarrollo y QA).
- FEAT-002 Workflow de CI en cada pull request (`.github/workflows/ci.yml`): instala con `npm ci`, corre lint, tests de configuración, build y tests unitarios con cobertura 80/80/80, en Node 22, sin secretos y con token de solo lectura.
- FEAT-002 Lint con angular-eslint 21 + ESLint 9 (`npm run lint`), con una regla que impide importar los datos simulados de `en-memoria/` desde código de producción (ADR-004).
- FEAT-002 Tests de configuración con `node --test` (`npm run test:config`) sobre el lint, el workflow, el launcher de Karma para CI y `AGENTS.md`.

### Changed
- FEAT-001 Angular 18.2 → 21.2 LTS y remoción de PrimeNG, PrimeIcons y Chart.js sin uso (ADR-003).
