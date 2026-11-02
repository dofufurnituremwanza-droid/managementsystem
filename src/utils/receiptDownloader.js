import html2pdf from 'html2pdf.js';

/**
 * Generates and downloads a true, crisp PDF document directly from any DOM element.
 * Formatted specifically for A4 receipts, invoices, proformas, and job cards.
 *
 * Can be invoked with:
 *   downloadReceiptPdf(filename, elementId)
 * or
 *   downloadReceiptPdf(elementId, filename)
 */
export const downloadReceiptPdf = async (arg1, arg2) => {
  // Identify which argument is the element ID and which is the filename
  const isArg1Element = Boolean(document.getElementById(arg1));
  const elementId = isArg1Element ? arg1 : arg2;
  const rawFilename = isArg1Element ? arg2 : arg1;

  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`Element #${elementId} not found for PDF export.`);
    // Fallback to print dialog
    window.print();
    return false;
  }

  const cleanName = (rawFilename || 'DOFU-Document').replace(/[^a-zA-Z0-9_-]/g, '_');

  const opt = {
    margin: [8, 8, 8, 8], // mm
    filename: `${cleanName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      letterRendering: true,
      logging: false,
      scrollY: 0,
      scrollX: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(el).save();
    return true;
  } catch (err) {
    console.error('Error generating PDF with html2pdf:', err);
    window.print();
    return false;
  }
};

/**
 * Generates an in-memory PDF File object from a DOM element.
 * Perfect for Web Share API file attachment on mobile and modern browsers.
 */
export const generateReceiptPdfFile = async (arg1, arg2) => {
  const isArg1Element = Boolean(document.getElementById(arg1));
  const elementId = isArg1Element ? arg1 : arg2;
  const rawFilename = isArg1Element ? arg2 : arg1;

  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`Element #${elementId} not found for PDF export.`);
    return null;
  }

  const cleanName = (rawFilename || 'DOFU-Document').replace(/[^a-zA-Z0-9_-]/g, '_');

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `${cleanName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      letterRendering: true,
      logging: false,
      scrollY: 0,
      scrollX: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    const worker = html2pdf().set(opt).from(el);
    const pdfBlob = await worker.output('blob');
    if (!pdfBlob) return null;
    return new File([pdfBlob], `${cleanName}.pdf`, { type: 'application/pdf' });
  } catch (err) {
    console.error('Error creating PDF file:', err);
    return null;
  }
};

export const downloadReceiptHtml = downloadReceiptPdf;
