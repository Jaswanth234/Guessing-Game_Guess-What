// Since the package uses CommonJS, we'll create a file with .cjs extension
import { writeFileSync } from 'fs';

writeFileSync('convert-to-pdf.cjs', `
const markdownpdf = require('markdown-pdf');
const fs = require('fs');

console.log('Starting conversion of CODE_DOCUMENTATION.md to PDF...');

markdownpdf()
  .from('CODE_DOCUMENTATION.md')
  .to('CODE_DOCUMENTATION.pdf', function () {
    console.log('Conversion complete. PDF file created: CODE_DOCUMENTATION.pdf');
  });
`);

console.log('Created convert-to-pdf.cjs file. Now run: node convert-to-pdf.cjs');