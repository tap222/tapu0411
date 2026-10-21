const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

const mdPath = path.resolve(__dirname, '../ENTERPRISE_SYSTEM_SPECIFICATION.md');
const intermediateHtmlPath = path.resolve(__dirname, 'intermediate-spec.html');
const staticHtmlPath = path.resolve(__dirname, '../ENTERPRISE_SYSTEM_SPECIFICATION.html');
const pdfOutputPath = path.resolve(__dirname, '../ENTERPRISE_SYSTEM_SPECIFICATION.pdf');
const mermaidJsPath = path.resolve(__dirname, 'mermaid.min.js');

console.log('Reading Markdown specification...');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Configure marked to render mermaid blocks into <div class="mermaid">
marked.use({
  renderer: {
    code(token) {
      if (token.lang === 'mermaid') {
        return `<div class="mermaid-diagram-wrapper"><div class="mermaid">${token.text}</div></div>`;
      }
      return false;
    },
  },
});

const bodyHtml = marked.parse(mdContent);
const mermaidCode = fs.readFileSync(mermaidJsPath, 'utf8');

const intermediateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Enterprise System Specification - Mini Pokédex</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
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
      font-size: 20pt;
      margin-top: 0;
      margin-bottom: 6px;
      border-bottom: 2.5px solid #007acc;
      padding-bottom: 8px;
    }

    h2 {
      font-size: 13.5pt;
      margin-top: 22px;
      margin-bottom: 10px;
      border-bottom: 1px solid #d0d7de;
      padding-bottom: 5px;
      page-break-before: auto;
    }

    h3 {
      font-size: 11pt;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      margin-top: 0;
      margin-bottom: 8px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #d0d7de;
      padding: 6px 9px;
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
      padding: 8px 10px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 8pt;
      line-height: 1.4;
      overflow-x: auto;
      page-break-inside: avoid;
      white-space: pre-wrap;
      word-break: break-word;
    }

    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 8.5pt;
      background: #f3f4f6;
      padding: 2px 4px;
      border-radius: 4px;
      color: #0066cc;
    }

    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    /* Mermaid Graphical Diagram Wrappers */
    .mermaid-diagram-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 16px 0;
      padding: 14px;
      background: #fafbfc;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      page-break-inside: avoid;
      text-align: center;
    }

    .mermaid-diagram-wrapper svg {
      max-width: 95% !important;
      height: auto !important;
      margin: 0 auto;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid #007acc;
      margin: 12px 0;
      padding: 6px 12px;
      background: #f0f7ff;
      color: #1e3a8a;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    blockquote p {
      margin: 0;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 8px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 3px;
    }

    hr {
      height: 1px;
      background-color: #e1e4e8;
      border: none;
      margin: 16px 0;
    }

    .doc-meta {
      font-size: 8.5pt;
      color: #57606a;
      margin-bottom: 14px;
      font-family: monospace;
    }
  </style>
  <script>${mermaidCode}</script>
  <script>
    window.addEventListener("load", async function() {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          flowchart: { curve: 'linear', htmlLabels: false },
          sequence: { showSequenceNumbers: true },
          securityLevel: 'loose'
        });
        await mermaid.run();
        console.log("MERMAID_COMPLETE");
      } catch (err) {
        console.error("Mermaid error:", err);
      }
    });
  </script>
</head>
<body>
  <div class="doc-meta">
    DOCUMENT ID: ENG-SPEC-POKEDEX-2026-V1 &nbsp;|&nbsp; CANDIDATE ADVANCED TECHNICAL SPECIFICATION
  </div>
  ${bodyHtml}
</body>
</html>`;

fs.writeFileSync(intermediateHtmlPath, intermediateHtml, 'utf8');
console.log('✓ Wrote intermediate HTML with Mermaid scripts.');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

console.log('Rendering all Mermaid diagrams to native SVGs via Headless Chrome...');
const cmdDump = `"${chromePath}" --headless --disable-gpu --virtual-time-budget=6000 --dump-dom "${intermediateHtmlPath}"`;
const renderedDomWithSvgs = execSync(cmdDump, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });

// Remove the large inlined mermaid JS string from the static HTML so it remains clean
const staticCleanHtml = renderedDomWithSvgs.replace(/<script>[\s\S]*?<\/script>/gi, '');
fs.writeFileSync(staticHtmlPath, staticCleanHtml, 'utf8');
console.log('✓ Generated static HTML with rendered SVGs at:', staticHtmlPath);

console.log('Printing final PDF document with graphical diagrams...');
const cmdPdf = `"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfOutputPath}" "${staticHtmlPath}"`;
execSync(cmdPdf, { stdio: 'inherit' });

// Clean up temporary intermediate file
if (fs.existsSync(intermediateHtmlPath)) {
  fs.unlinkSync(intermediateHtmlPath);
}

console.log('✓ Successfully generated PDF at:', pdfOutputPath);
