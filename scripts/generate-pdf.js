const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

const mdPath = path.resolve(__dirname, '../ENTERPRISE_SYSTEM_SPECIFICATION.md');
const htmlOutputPath = path.resolve(__dirname, '../ENTERPRISE_SYSTEM_SPECIFICATION.html');
const pdfOutputPath = path.resolve(__dirname, '../ENTERPRISE_SYSTEM_SPECIFICATION.pdf');

console.log('Reading Markdown specification...');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Parse markdown to HTML
const bodyHtml = marked.parse(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Enterprise System Specification - Mini Pokédex</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #1a1a1a;
      background: #ffffff;
      padding: 0;
      margin: 0;
    }

    h1, h2, h3, h4 {
      color: #0b192c;
      font-weight: 700;
      page-break-after: avoid;
    }

    h1 {
      font-size: 22pt;
      margin-top: 0;
      margin-bottom: 6px;
      border-bottom: 2px solid #007acc;
      padding-bottom: 8px;
    }

    h2 {
      font-size: 14pt;
      margin-top: 24px;
      margin-bottom: 10px;
      border-bottom: 1px solid #e1e4e8;
      padding-bottom: 6px;
      page-break-before: auto;
    }

    h3 {
      font-size: 11.5pt;
      margin-top: 16px;
      margin-bottom: 6px;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }

    /* Elegant Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #d0d7de;
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f6f8fa;
      font-weight: 600;
      color: #24292f;
    }

    tr:nth-child(even) td {
      background-color: #fbfcfd;
    }

    /* Code Blocks */
    pre {
      background: #f6f8fa;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      padding: 10px 12px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      overflow-x: auto;
      page-break-inside: avoid;
      white-space: pre-wrap;
      word-break: break-word;
    }

    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 9pt;
      background: #f3f4f6;
      padding: 2px 5px;
      border-radius: 4px;
      color: #0066cc;
    }

    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    /* Blockquotes / Callouts */
    blockquote {
      border-left: 4px solid #007acc;
      margin: 14px 0;
      padding: 8px 14px;
      background: #f0f7ff;
      color: #1e3a8a;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    blockquote p {
      margin: 0;
    }

    /* Lists */
    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Subtle Dividers */
    hr {
      height: 1px;
      background-color: #e1e4e8;
      border: none;
      margin: 20px 0;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }

    /* Print Header & Footer */
    .doc-meta {
      font-size: 9pt;
      color: #57606a;
      margin-bottom: 18px;
    }

    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="doc-meta">
    <strong>DOCUMENT ID:</strong> ENG-SPEC-POKEDEX-2026-V1 &nbsp;|&nbsp; <strong>CONFIDENTIALITY:</strong> CANDIDATE TECHNICAL SUBMISSION
  </div>
  ${bodyHtml}
</body>
</html>`;

fs.writeFileSync(htmlOutputPath, fullHtml, 'utf8');
console.log('✓ Generated HTML at:', htmlOutputPath);

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
console.log('Rendering PDF via Headless Chrome...');

const cmd = `"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfOutputPath}" "${htmlOutputPath}"`;
execSync(cmd, { stdio: 'inherit' });

console.log('✓ Successfully generated PDF at:', pdfOutputPath);
