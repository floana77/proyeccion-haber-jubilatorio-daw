// Tests de la configuración de lint (FEAT-002, Block 1). Se corren con `npm run test:config`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eslint = new ESLint({ cwd: raiz });

const REGLA_EN_MEMORIA = 'no-restricted-imports';

async function lintear(codigo, rutaRelativa) {
  const filePath = path.join(raiz, rutaRelativa);
  const [resultado] = await eslint.lintText(codigo, { filePath });
  return { resultado, filePath };
}

function erroresDe(resultado, ruleId) {
  return resultado.messages.filter((m) => m.severity === 2 && m.ruleId === ruleId);
}

function assertNoIgnorado(resultado) {
  const ignorado = resultado.messages.find((m) => m.ruleId === null && /ignored/i.test(m.message));
  assert.equal(ignorado, undefined, `el archivo quedó fuera del lint: ${ignorado?.message}`);
}

const IMPORT_EN_MEMORIA_DESDE_SRC_APP = [
  '// archivo de prueba',
  "import { proveerGatewayEnMemoria } from '../app/proyeccion/data/en-memoria/proyeccion-en-memoria.gateway';",
  '',
  'export const proveedores = [proveerGatewayEnMemoria()];',
  '',
].join('\n');

test('test_lint_reporta_import_invalido_de_en_memoria', async () => {
  const codigo = [
    '// componente de ui',
    "import { proveerGatewayEnMemoria } from '../../data/en-memoria/proyeccion-en-memoria.gateway';",
    '',
    'export const proveedores = [proveerGatewayEnMemoria()];',
    '',
  ].join('\n');
  const { resultado, filePath } = await lintear(
    codigo,
    'src/app/proyeccion/ui/proyeccion-page/import-invalido.ts',
  );

  assert.equal(resultado.filePath, filePath);
  const errores = erroresDe(resultado, REGLA_EN_MEMORIA);
  assert.equal(errores.length, 1, `se esperaba 1 error de ${REGLA_EN_MEMORIA}, hubo: ${JSON.stringify(resultado.messages)}`);
  assert.equal(errores[0].line, 2);
});

test('test_lint_reporta_import_invalido_de_carpeta_en_memoria', async () => {
  const codigo = [
    '// componente de ui',
    "import { proveerGatewayEnMemoria } from '../../data/en-memoria';",
    '',
    'export const proveedores = [proveerGatewayEnMemoria()];',
    '',
  ].join('\n');
  const { resultado, filePath } = await lintear(
    codigo,
    'src/app/proyeccion/ui/proyeccion-page/import-carpeta-invalido.ts',
  );

  assert.equal(resultado.filePath, filePath);
  const errores = erroresDe(resultado, REGLA_EN_MEMORIA);
  assert.equal(errores.length, 1, `se esperaba 1 error de ${REGLA_EN_MEMORIA}, hubo: ${JSON.stringify(resultado.messages)}`);
  assert.equal(errores[0].line, 2);
});

test('test_lint_reporta_error_invalido_en_template', async () => {
  const template = ['<div>', '  <input ([value])="valor" />', '</div>', ''].join('\n');
  const { resultado, filePath } = await lintear(
    template,
    'src/app/proyeccion/ui/proyeccion-page/template-invalido.component.html',
  );

  assert.equal(resultado.filePath, filePath);
  const errores = erroresDe(resultado, '@angular-eslint/template/banana-in-box');
  assert.equal(errores.length, 1, `se esperaba 1 error de banana-in-box, hubo: ${JSON.stringify(resultado.messages)}`);
  assert.equal(errores[0].line, 2);
});

test('test_lint_permite_en_memoria_en_environment_ts', async () => {
  for (const ambiente of ['src/environments/environment.ts', 'src/environments/environment.qa.ts']) {
    const { resultado } = await lintear(IMPORT_EN_MEMORIA_DESDE_SRC_APP, ambiente);
    assertNoIgnorado(resultado);
    assert.deepEqual(erroresDe(resultado, REGLA_EN_MEMORIA), [], `${ambiente} no puede tener errores de ${REGLA_EN_MEMORIA}`);
  }
  // Control: environment.prod.ts sigue sin poder importarlo (la excepción no es general a src/environments/).
  const { resultado: prod } = await lintear(IMPORT_EN_MEMORIA_DESDE_SRC_APP, 'src/environments/environment.prod.ts');
  assert.equal(erroresDe(prod, REGLA_EN_MEMORIA).length, 1, 'environment.prod.ts debería ser rechazado');
});

test('test_lint_permite_en_memoria_en_spec', async () => {
  const { resultado } = await lintear(IMPORT_EN_MEMORIA_DESDE_SRC_APP, 'src/environments/environment.spec.ts');
  assertNoIgnorado(resultado);
  assert.deepEqual(erroresDe(resultado, REGLA_EN_MEMORIA), []);
});

test('test_lint_del_proyecto_sin_errores', async () => {
  const resultados = await eslint.lintFiles(['src/**/*.ts', 'src/**/*.html']);
  assert.ok(resultados.length > 0, 'el lint no encontró archivos en src/');
  const conErrores = resultados
    .filter((r) => r.errorCount > 0)
    .map((r) => ({
      archivo: path.relative(raiz, r.filePath),
      errores: r.messages.filter((m) => m.severity === 2).map((m) => `${m.line}:${m.column} ${m.ruleId} ${m.message}`),
    }));
  assert.deepEqual(conErrores, [], `el proyecto tiene errores de lint: ${JSON.stringify(conErrores, null, 2)}`);
});
