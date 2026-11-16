# Verification FEAT-001

| Field | Value |
|---|---|
| Module | src/app/proyeccion/ (domain, data, platform, state, ui), src/environments/, src/app/app.component.ts |
| Line coverage | 100% |
| Branch coverage | 100% |
| Function coverage | 100% |
| Coverage floor | 80% (AGENTS.md, "Testing") |
| Lint | no configurado — AGENTS.md, Stack: "Linter / formatter: No configurado"; `tsc --noEmit` estricto (app y specs, con `--noUnusedLocals --noUnusedParameters`): 0 errores |

## Corridas

1. **2026-11-16, corrida 1:** la verificación cruzada independiente (`daw-module-verifier`) dio PASSED, pero `validate_verify.py` rechazó el reporte por F-VER-06: las líneas de "Required tests" de la spec eran descripciones sin identificador y el validador no podía leer ningún nombre de test. Loop correctivo VERIFY → CODE → PLAN: la spec agregó un identificador `test_…` a las 30 líneas (commit 725d4f8), sin cambiar código ni tests; CODE revalidó tests y SAST.
2. **2026-11-16, corrida 2 (esta):** mismo código y mismos resultados que la corrida 1, ahora con cada test prometido nombrado por su identificador.

Verificación cruzada independiente: `daw-module-verifier`, que no escribió el código. Comandos sobre el árbol limpio: `npm test` (25/25 en Chrome Headless 157, Angular 21.2.26), `npm run build` y `npm run build -- -c qa`, `grep -rE "2031-10-14|2026-09-01" build_package/` sobre producción (0 coincidencias), `npm audit --omit=dev` (0 vulnerabilidades).

## Acceptance criteria
- ✅ AC-01 — `decidirVista` (domain/vista-pantalla.ts), `ProyeccionStore.cargar` (state/proyeccion.store.ts), gateway en memoria, `formatearFechaCalendario` y la plantilla de `ProyeccionPageComponent`; verificado por `test_pantalla_beneficios_con_fechas`, `test_store_activa_pide_fechas`, `test_gateway_en_memoria_activo`, `test_formatea_fecha_calendario` y `test_app_renderiza_pantalla_real`
- ✅ AC-02 — plantilla sin controles ni handlers; verificado por `test_pantalla_sin_controles`
- ✅ AC-03 — `esFallecido` y `decidirVista`; verificado por `test_store_fallecido_no_pide_fechas` (0 llamadas a obtenerFechasMinimas), `test_pantalla_solo_titulo`, `test_decidir_vista_fallecido` y `test_gateway_en_memoria_fallecido`
- ✅ AC-04 — `resolverEscenario` (data/en-memoria/escenario.ts), `environment.ts` y `environment.qa.ts`; verificado por `test_resolver_escenario_faltante` y `test_environment_dev_y_qa_en_memoria`
- ✅ AC-05 — `resolverEscenario`; verificado por `test_resolver_escenario_invalido` (`xyz`, `FALLECIDO`, `<script>`)
- ✅ AC-06 — `environment.prod.ts` y `ProyeccionNoDisponibleGateway`; verificado por `test_environment_prod_no_disponible`, `test_gateway_no_disponible_error` y `test_builds_sin_datos_simulados` (el bundle de producción no contiene las fechas simuladas)
- ✅ AC-07 — verificado por `test_verificacion_manual_ac07`, registrada en docs/daw/reports/tests-FEAT-001.md: 4 tamaños con capturas en Angular 21.2.26 y axe con 0 problemas en activo y fallecido; `html { font-size: 18px }`

## Spec blocks
- ✅ Block 1 — 16/16 archivos; `test_app_se_crea_y_renderiza_pantalla` y `test_suite_karma_con_cobertura` en verde
- ✅ Block 2 — 12/12 archivos; `test_es_fallecido_solo_para_fallecido`, `test_formatea_fecha_calendario`, `test_fecha_calendario_invalida_lanza_error`, `test_resolver_escenario_valor_permitido`, `test_resolver_escenario_faltante`, `test_resolver_escenario_invalido`, `test_gateway_en_memoria_activo`, `test_gateway_en_memoria_fallecido`, `test_gateway_no_disponible_error` y `test_ubicacion_factory` en verde
- ✅ Block 3 — 4/4 archivos; `test_decidir_vista_beneficios`, `test_decidir_vista_fallecido`, `test_decidir_vista_error_o_faltante`, `test_store_activa_pide_fechas`, `test_store_fallecido_no_pide_fechas`, `test_store_error_estado` y `test_store_error_fechas` en verde
- ✅ Block 4 — 7/7 archivos; `test_pantalla_beneficios_con_fechas`, `test_pantalla_sin_controles`, `test_pantalla_solo_titulo`, `test_pantalla_carga_una_vez` y `test_app_renderiza_pantalla_real` en verde; `test_verificacion_manual_ac07` registrada
- ✅ Block 5 — 7/7 archivos; `test_environment_dev_y_qa_en_memoria` y `test_environment_prod_no_disponible` en verde
- ✅ Block 6 — 8/8 tareas; `test_audit_sin_high`, `test_suite_completa_en_verde` y `test_builds_sin_datos_simulados` en verde

Evidencia TDD: rojo registrado para los 6 bloques (`.daw-work/review-block-{1..6}.md`).

## Tests
- ✅ Sad-path tests: `test_resolver_escenario_invalido` y `test_resolver_escenario_faltante` (entrada inválida o ausente), `test_fecha_calendario_invalida_lanza_error` (fecha inválida), `test_store_error_estado` y `test_store_error_fechas` (carga que no se completa), `test_decidir_vista_error_o_faltante` y `test_gateway_no_disponible_error`

## Warnings
- ⚠️ W-VER-01 — `src/styles.scss:1` importa PrimeFlex y ninguna plantilla usa sus clases (unos 337 kB de CSS sin uso en el bundle); la spec (Block 1) y ADR-003 lo conservan
- ⚠️ W-VER-03 — `src/app/proyeccion/platform/ubicacion.token.spec.ts` cambia `window.location` con `history.replaceState` con Jasmine en orden aleatorio; lo restaura en un `finally`
- ⚠️ El caso de fecha inválida no cubre mes 00 ni día 00 o 32 (`fecha-calendario.ts:25`)

## Observaciones
- AC-04 y AC-05 se verifican por composición de tests unitarios, sin un test de URL a pantalla.
- La auditoría axe de AC-07 se corrió con Angular 18.2; plantilla y estilos no cambiaron desde entonces.
- El Summary y el Block 1 de la spec mencionan Angular 18.2, PrimeNG y Chart.js, reemplazados por el Block 6 (ADR-003).
- Pendientes para el ticket de conexión real, en decisions-FEAT-001.md: el valor en el mensaje de `FechaCalendarioInvalidaError` (R-05) y `cargar()` sin cancelar la carga anterior.
- El store y `decidirVista` usan solo "activa" como estado no fallecido en sus tests.

Result: PASSED
