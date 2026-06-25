const ts = require('typescript');
const path = require('path');

const fileNames = [
  path.join(__dirname, 'src/app/components/pos/pos-edit.component.ts'),
  path.join(__dirname, 'src/app/app.routes.ts'),
  path.join(__dirname, 'src/app/components/invoice/invoice-view.component.ts'),
  path.join(__dirname, 'src/app/components/report/revenue-history.component.ts'),
  path.join(__dirname, 'src/app/components/product/product-purchase-history-modal.component.ts'),
  path.join(__dirname, 'src/app/components/dashboard/dashboard.component.ts'),
  path.join(__dirname, 'src/app/components/report/reports.component.ts'),
  path.join(__dirname, 'src/app/components/product/products.component.ts'),
  path.join(__dirname, 'src/app/components/layout/layout.component.ts')
];

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  strict: true,
  noEmit: true,
  skipLibCheck: true
};

console.log('Compiling files...', fileNames);
const program = ts.createProgram(fileNames, compilerOptions);
const emitResult = program.emit();

const allDiagnostics = ts
  .getPreEmitDiagnostics(program)
  .concat(emitResult.diagnostics);

allDiagnostics.forEach(diagnostic => {
  if (diagnostic.file) {
    const { line, character } = ts.getLineAndCharacterOfPosition(
      diagnostic.file,
      diagnostic.start
    );
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  } else {
    console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  }
});

console.log(`Diagnostic check complete. Total errors: ${allDiagnostics.length}`);
