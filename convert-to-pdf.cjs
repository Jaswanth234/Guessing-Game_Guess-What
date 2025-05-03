
const markdownpdf = require('markdown-pdf');
const fs = require('fs');

console.log('Starting conversion of CODE_DOCUMENTATION.md to PDF...');

markdownpdf()
  .from('CODE_DOCUMENTATION.md')
  .to('CODE_DOCUMENTATION.pdf', function () {
    console.log('Conversion complete. PDF file created: CODE_DOCUMENTATION.pdf');
  });
