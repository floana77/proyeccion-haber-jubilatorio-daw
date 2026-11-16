# Decisiones de implementación — FEAT-001

Supuestos tomados durante CODE y aprobados por la usuaria. Formato: decisión — quién la aprobó — fecha — bloque.

- `CUSTOM_ELEMENTS_SCHEMA` provisorio en `src/app/app.component.ts`, con el template `<app-proyeccion-page />`, hasta que el Block 4 importe el componente real y lo quite — la usuaria — 2026-11-16 — Block 1
- `src/environments/environment.ts` creado mínimo (`production: false`, `gatewayProviders: []`) para que compile `app.config.ts`; el Block 5 lo modifica en lugar de crearlo — la usuaria — 2026-11-16 — Block 1
- `"assets": ["src/assets"]` en los builders de build y test de `angular.json`, para que las tipografías lleguen al build; `color: #1a2e22` en el body, de la paleta de NFR-02 — la usuaria — 2026-11-16 — Block 1
- Versiones de `karma-coverage` ~2.2, `karma-chrome-launcher` ~3.2, `karma-jasmine` ~5.1 y `karma-jasmine-html-reporter` ~2.1, budgets de production y qa (1,5 MB aviso, 3 MB error) y `jasmine.random: true`, iguales que en proyeccion-haber-jubilatorio-v3 — la usuaria — 2026-11-16 — Block 1
