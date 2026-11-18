# Test run FEAT-002

| Field | Value |
|---|---|
| Runner | Karma 6.4.4 + Jasmine 5.2.0 (Angular CLI 21.2.30, Angular 21.2.26), Chrome Headless 157, Node 22.23.2 |
| Command | `npm test` (`ng test --watch=false --code-coverage`) |
| Total | 25 |
| Passed | 25 |
| Failed | 0 |
| Skipped | 0 |
| Line coverage | 100% |
| Branch coverage | 100% |
| Function coverage | 100% |
| Coverage floor | 80% líneas, 80% ramas, 80% funciones (AGENTS.md, "Testing") |
| Lint | `npm run lint` (`ng lint`, angular-eslint 21.4.0 + ESLint 9.39.5) — "All files pass linting.", 0 errores; typecheck `npm run build` (strict + strictTemplates) — sin errores |

## Failures
(none)

## Skips
(none)

## Tests de configuración (node --test)

Los tests de `config/*.test.mjs` (Blocks 1, 2 y 3) no los corre Karma; se corrieron aparte con `npm run test:config` (`node --test config/*.test.mjs`, Node 22.23.2): 17 tests, todos en verde, ninguno salteado. No miden cobertura: verifican `eslint.config.js`, el lint del proyecto, `.github/workflows/ci.yml`, el launcher de `karma.conf.js` y `AGENTS.md`, y no ejecutan código de `src/`.

- `config/lint.test.mjs`: test_lint_reporta_import_invalido_de_en_memoria, test_lint_reporta_import_invalido_de_carpeta_en_memoria, test_lint_reporta_error_invalido_en_template, test_lint_permite_en_memoria_en_environment_ts, test_lint_permite_en_memoria_en_spec, test_lint_del_proyecto_sin_errores.
- `config/ci-workflow.test.mjs`: test_workflow_dispara_solo_en_pull_request, test_workflow_instala_con_npm_ci, test_workflow_corre_lint_y_falla_con_error, test_workflow_corre_build_y_falla_con_error_de_tipos, test_workflow_corre_tests_y_falla_con_cobertura_baja, test_workflow_sin_secretos, test_workflow_permisos_solo_lectura, test_workflow_acciones_pineadas_por_sha, test_workflow_timeout_15_minutos, test_karma_launcher_ci_sin_sandbox_solo_en_ci, test_agents_declara_lint_y_ci.

La suite de Karma también se corrió con el launcher del CI (`npm test -- --browsers=ChromeHeadlessCI`) al cerrar el Block 2 y en la verificación del Block 2: mismo resultado, 25 de 25 y 100% de cobertura.

La corrida real del workflow en el pull request del ticket se comprueba en CLOSEOUT, por decisión de la usuaria (`docs/daw/specs/decisions-FEAT-002.md`).
