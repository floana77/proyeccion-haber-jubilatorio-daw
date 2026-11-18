// Karma para los tests unitarios. La ruta de Chrome se toma de la variable CHROME_BIN.
// Los umbrales de cobertura tienen que coincidir con el piso de AGENTS.md (Testing): 80/80/80.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: { jasmine: { random: true }, clearContext: false },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
      check: {
        global: {
          lines: 80,
          branches: 80,
          functions: 80,
        },
      },
    },
    reporters: ['progress', 'coverage'],
    browsers: ['ChromeHeadless'],
    // Solo para el CI (`npm test -- --browsers=ChromeHeadlessCI`): el runner efímero no tiene
    // sandbox de usuario para Chrome. En local se sigue usando ChromeHeadless con sandbox.
    customLaunchers: {
      ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox'] },
    },
    restartOnFileChange: true,
  });
};
