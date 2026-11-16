# PRD FEAT-001: Obtener las fechas mínimas de jubilación al ingresar al módulo

| Field | Value |
|-------|-------|
| Ticket | FEAT-001 |
| Tracker | none |
| Date | 2026-11-16T14:50:00Z |
| PRD loops | 1 |
| Loops since last human decision | 0 |

## Context and Problem
Este ticket implementa el requerimiento RF-01 de `PRD-001-proyeccion-haber-jubilatorio.md`: al ingresar al módulo de proyección, el afiliado tiene que ver sus fechas mínimas de jubilación para Jubilación Ordinaria y Jubilación Parcial, salvo que su matrícula esté en estado "fallecido".

Hoy el repositorio no tiene código. Este es el primer ticket del módulo: arma la pantalla inicial sobre la que los tickets siguientes agregan la selección del beneficio, el selector de fecha, el botón **Proyectar**, las alertas y el manejo de errores.

Los servicios backend actuales no están disponibles en desarrollo ni en QA (PRD-001, Riesgos y Dependencias), así que en este ticket los datos del afiliado son simulados y se eligen por escenario.

Decisiones de la usuaria en DEFINE (2026-11-16):
1. El alcance es solo RF-01. RF-05 (alerta de fallecido) y RF-13 (error al cargar los datos) quedan fuera.
2. Si el afiliado es fallecido, la pantalla muestra solo el título: no se consultan las fechas ni se muestra alerta.
3. Si no es fallecido, la pantalla muestra el título y dos tarjetas solo de lectura, una por beneficio, con su fecha mínima.
4. Se usan solo datos simulados; conectar los servicios reales queda fuera.
5. El caso se elige con el parámetro de URL `escenario` (`activo`, `fallecido`), solo en desarrollo y QA; sin parámetro, `activo`.
6. Un valor de `escenario` que no es `activo` ni `fallecido` muestra el caso `activo` (AC-05).

## Goals
- Que el afiliado no fallecido vea, al ingresar al módulo, sus dos fechas mínimas de jubilación sin hacer ningún clic.
- Que no se soliciten fechas mínimas para un afiliado fallecido.
- Que QA pueda probar los dos casos (activo y fallecido) sin modificar código.
- Dejar la pantalla con la estructura del diseño aprobado (Opción A — Tarjeta única guiada, `docs/disenos/`) para que los tickets siguientes solo agreguen comportamiento.

## Functional Requirements
- FR-01: Al ingresar al módulo, el sistema debe obtener el estado de la matrícula del afiliado.
- FR-02: Si el estado de la matrícula no es "fallecido", el sistema debe obtener las fechas mínimas de jubilación del afiliado para Jubilación Ordinaria y Jubilación Parcial.
- FR-03: Si el estado de la matrícula no es "fallecido", el sistema debe mostrar el título "Tu proyección de haber jubilatorio" y dos tarjetas solo de lectura: "Jubilación Ordinaria", con el texto "El beneficio completo, a partir de tu fecha mínima.", y "Jubilación Parcial", con el texto "Combina actividad reducida con un haber proporcional."; cada una con la leyenda "Fecha mínima: " seguida de su fecha en formato dd/mm/aaaa.
- FR-04: Si el estado de la matrícula es "fallecido", el sistema debe mostrar solo el título "Tu proyección de haber jubilatorio" y no debe solicitar las fechas mínimas de jubilación.
- FR-05: En los ambientes de desarrollo y QA, el sistema debe tomar los datos simulados del escenario que indica el parámetro de URL `escenario`: `activo` (afiliado con matrícula activa, Jubilación Ordinaria 14/10/2031 y Jubilación Parcial 01/09/2026) o `fallecido` (afiliado con matrícula en estado fallecido). Sin parámetro, el sistema debe usar `activo`.
- FR-06: En el ambiente de producción, el sistema no debe mostrar datos simulados, aunque la URL incluya el parámetro `escenario`.

## Non-Functional Requirements
- NFR-01: Responsive: en anchos de pantalla de 360 px a 1920 px, la pantalla se muestra sin scroll horizontal, sin elementos superpuestos ni textos cortados (subconjunto de RNF-03 del PRD-001).
- NFR-02: Accesibilidad: el contraste entre texto y fondo es ≥ 4,5:1 para el texto normal y ≥ 3:1 para el texto grande (WCAG 2.1 AA), y el texto base mide ≥ 18 px (subconjunto de RNF-04 del PRD-001).

## Acceptance Criteria
*(EARS — see `.daw/rules/validation-rules.instructions.md` §1 for the five patterns)*

- AC-01 (FR-01, FR-02, FR-03): WHEN un afiliado ingresa al módulo con `?escenario=activo` en desarrollo, THE sistema SHALL mostrar el título "Tu proyección de haber jubilatorio", la tarjeta "Jubilación Ordinaria" con "Fecha mínima: 14/10/2031" y la tarjeta "Jubilación Parcial" con "Fecha mínima: 01/09/2026".
- AC-02 (FR-03): WHEN se muestran las tarjetas de beneficio, THE sistema SHALL NOT mostrar en la pantalla controles de selección de beneficio, selector de fecha ni botón **Proyectar**, y un clic sobre una tarjeta SHALL NOT cambiar lo que se muestra.
- AC-03 (FR-01, FR-04): WHEN un afiliado ingresa al módulo con `?escenario=fallecido` en desarrollo, THE sistema SHALL mostrar solo el título "Tu proyección de haber jubilatorio", sin tarjetas de beneficio, sin fechas y sin alertas, y SHALL NOT solicitar las fechas mínimas de jubilación.
- AC-04 (FR-05): WHEN un afiliado ingresa al módulo sin el parámetro `escenario` en desarrollo o en QA, THE sistema SHALL mostrar lo mismo que en AC-01.
- AC-05 (FR-05): IF el parámetro `escenario` tiene un valor que no es `activo` ni `fallecido`, THEN THE sistema SHALL mostrar lo mismo que en AC-01.
- AC-06 (FR-06): WHERE el ambiente es producción, THE sistema SHALL NOT mostrar las fechas 14/10/2031 ni 01/09/2026 ni ningún otro dato simulado, con `?escenario=activo`, con `?escenario=fallecido` y sin parámetro.
- AC-07 (NFR-01, NFR-02): WHEN la pantalla del escenario `activo` se ve en 360×640, 768×1024, 1024×768 y 1920×1080 px, THE sistema SHALL mostrarla sin scroll horizontal, sin elementos superpuestos ni textos cortados, con contraste ≥ 4,5:1 en el texto normal y ≥ 3:1 en el texto grande, y con texto base ≥ 18 px.

## Out of Scope
- RF-05 del PRD-001: la alerta "No es posible realizar proyección para afiliados con estado matricular fallecido".
- RF-13 del PRD-001: el mensaje "No pudimos cargar sus datos. Vuelva a ingresar al módulo.", el indicador de carga y el límite de 10 s, incluida la sesión vencida.
- Selección y preselección del tipo de beneficio (RF-03, RF-07), selector de fecha (RF-04, RF-12), botón **Proyectar** y reporte PDF (RF-06, RF-08 a RF-10).
- Alerta "Ud. se encuentra en condiciones de jubilarse" (RF-11), botón "Inicie su trámite de jubilación aquí" (RF-02) y etiqueta "Ya disponible" (RF-14).
- Conexión con los servicios backend reales de estado de matrícula y fechas mínimas, y con la sesión del sitio actual.
- Escenarios simulados distintos de `activo` y `fallecido` (por ejemplo, matrícula cancelada o suspendida, o fechas vencidas).
- Compatibilidad verificada en los 5 navegadores de RNF-05 del PRD-001, áreas táctiles de RNF-04 y visibilidad de **Proyectar** sin scroll de RNF-03.

## Risks and Mitigations
- Riesgo: este ticket no se puede publicar en producción por sí solo, porque no conecta los servicios reales y no maneja errores de carga → mitigación: decisión explícita de la usuaria en DEFINE (decisión 1 y 4); la versión sirve para desarrollo y QA, y producción espera a los tickets de RF-13 y de conexión real. AC-06 asegura que producción no muestre datos simulados mientras tanto.
- Riesgo: el contrato de los datos simulados difiere del de los servicios reales, que todavía no se conocen → mitigación: el acceso a los datos queda aislado detrás de una única interfaz (AGENTS.md, Architecture conventions), de modo que conectar los servicios reales reemplaza solo esa implementación.
## Dependencies
- `PRD-001-proyeccion-haber-jubilatorio.md`: PRD de origen (RF-01) y fuente de los textos y de los valores de NFR-01 y NFR-02.
- Diseños aprobados en `docs/disenos/` (Opción A — Tarjeta única guiada): estructura del título y de las tarjetas de beneficio. Donde difieren, prevalece este PRD.
- Futura: los servicios backend actuales de estado de matrícula y fechas mínimas (fuera de alcance de este ticket).
