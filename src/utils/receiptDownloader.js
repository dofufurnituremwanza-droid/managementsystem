/**
 * Downloads a DOM element as a standalone, styled, printable HTML receipt file
 * Can be shared via WhatsApp, email, or opened in any browser to Save as PDF / Print.
 */
export const downloadReceiptHtml = (filename, elementId) => {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`Element #${elementId} not found for download`);
    return;
  }

  const cleanName = (filename || 'DOFU-Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${filename} - DOFU FURNITURE MWANZA</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f3f4f6;
      color: #111827;
      padding: 30px 16px;
      margin: 0;
      display: flex;
      justify-content: center;
    }
    .print-document {
      width: 100%;
      max-width: 620px;
      background: #ffffff;
      padding: 28px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }
    table { width: 100%; border-collapse: collapse; }
    img { max-width: 100%; }
    .no-print { display: none !important; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-document { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  ${el.outerHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
