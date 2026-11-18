# Decisiones FEAT-002 fuera de la spec

Formato: decisión — quién la aprobó — fecha — bloque.

- `typescript-eslint` fijado en la versión exacta `8.73.0` (sin `^`), alineado con la versión de `@typescript-eslint/*` que trae angular-eslint 21.4.0; si angular-eslint sube su versión podría volver a duplicarse — aprobado por la usuaria — 2026-11-18 — Block 1.
- `test_lint_del_proyecto_sin_errores` exige además que el lint encuentre al menos un archivo, para que un glob que no matchea nada no pase como verde vacío — aprobado por la usuaria — 2026-11-18 — Block 1.
