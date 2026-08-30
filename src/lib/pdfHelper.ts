import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface PdfExportOptions {
  filename?: string;
  format?: 'a4' | 'a5' | 'letter' | [number, number];
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  scale?: number;
}

/**
 * Sanitizes a filename to ensure safe storage on Android and browser file systems.
 */
export function sanitizeFilename(filename: string, defaultExt: string = '.pdf'): string {
  let clean = filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .trim();

  if (!clean) {
    clean = `dokumen_${Date.now()}`;
  }

  const ext = defaultExt.startsWith('.') ? defaultExt : `.${defaultExt}`;
  if (!clean.toLowerCase().endsWith(ext.toLowerCase())) {
    clean = `${clean}${ext}`;
  }

  return clean;
}

/**
 * Checks and requests storage permissions on Android/Capacitor when needed.
 */
export async function requestStoragePermissions(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) return true;
    const status = await Filesystem.checkPermissions();
    if (status.publicStorage !== 'granted') {
      const request = await Filesystem.requestPermissions();
      return request.publicStorage === 'granted';
    }
    return true;
  } catch (err) {
    console.warn('Filesystem permission check/request warning:', err);
    return true;
  }
}

/**
 * Writes base64 data to Android storage using @capacitor/filesystem.
 * Tries Directory.Documents first, then fallbacks to Directory.Cache.
 */
export async function saveNativeFile(
  base64Data: string,
  filename: string,
  mimeType: 'application/pdf' | 'image/jpeg' = 'application/pdf'
): Promise<{ success: boolean; uri?: string; path?: string }> {
  try {
    await requestStoragePermissions();

    const cleanFilename = sanitizeFilename(filename, mimeType === 'application/pdf' ? '.pdf' : '.jpg');

    // 1. Primary write to Directory.Documents (accessible to user and Android file manager)
    try {
      const result = await Filesystem.writeFile({
        path: cleanFilename,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
      console.log('File successfully saved to Documents:', result.uri);
      return { success: true, uri: result.uri, path: cleanFilename };
    } catch (docErr) {
      console.warn('Saving to Directory.Documents failed, trying Directory.Cache fallback:', docErr);
      // 2. Fallback write to Directory.Cache
      const fallbackResult = await Filesystem.writeFile({
        path: cleanFilename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });
      console.log('File saved to Cache fallback:', fallbackResult.uri);
      return { success: true, uri: fallbackResult.uri, path: cleanFilename };
    }
  } catch (err) {
    console.error('Error saving native file via Capacitor Filesystem:', err);
    return { success: false };
  }
}

/**
 * Downloads a DOM element as a high-resolution PDF file.
 * Uses html2canvas-pro with full support for modern CSS color formats and crisp fonts.
 */
export async function downloadElementAsPdf(
  elementIdOrElement: string | HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  try {
    const targetElement =
      typeof elementIdOrElement === 'string'
        ? document.getElementById(elementIdOrElement)
        : elementIdOrElement;

    if (!targetElement) {
      console.error('Target element for PDF export not found:', elementIdOrElement);
      return false;
    }

    const {
      filename = 'dokumen.pdf',
      format = 'a4',
      orientation = 'portrait',
      marginMm = 6,
      scale = 2.5, // Crisp rendering for text and borders
    } = options;

    const isReceipt = targetElement.id === 'printable-receipt-area';
    const standardWidth = isReceipt ? (targetElement.scrollWidth || (Array.isArray(format) && format[0] === 58 ? 250 : 330)) : 794;

    // Render HTML element to high-res canvas using html2canvas-pro
    const canvas = await html2canvas(targetElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: isReceipt ? standardWidth : 1024,
      onclone: (_clonedDoc, clonedElement) => {
        clonedElement.style.margin = '0';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.transform = 'none';
        if (!isReceipt) {
          clonedElement.style.width = '794px';
          clonedElement.style.maxWidth = '794px';
          clonedElement.style.minWidth = '794px';
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Calculate dimensions in mm
    let targetFormat: 'a4' | 'a5' | 'letter' | [number, number] = format;
    if (isReceipt && Array.isArray(format)) {
      const widthMm = format[0]; // e.g. 58 or 80
      const printableWidth = widthMm - marginMm * 2;
      const exactHeightMm = Math.ceil((canvas.height * printableWidth) / canvas.width + marginMm * 2);
      targetFormat = [widthMm, exactHeightMm];
    }

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: targetFormat,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const printableWidth = pageWidth - marginMm * 2;
    const imgHeightInMm = (canvas.height * printableWidth) / canvas.width;

    let heightLeft = imgHeightInMm;
    let position = marginMm;

    // First page
    pdf.addImage(
      imgData,
      'JPEG',
      marginMm,
      position,
      printableWidth,
      imgHeightInMm,
      undefined,
      'FAST'
    );
    heightLeft -= pageHeight - marginMm * 2;

    // Multi-page handling if content exceeds 1 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeightInMm + marginMm;
      pdf.addPage();
      pdf.addImage(
        imgData,
        'JPEG',
        marginMm,
        position,
        printableWidth,
        imgHeightInMm,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight - marginMm * 2;
    }

    const cleanFilename = sanitizeFilename(filename, '.pdf');

    // Platform-specific export
    if (Capacitor.isNativePlatform()) {
      // Android / Capacitor: Save to storage using @capacitor/filesystem
      const pdfDataUri = pdf.output('datauristring');
      const base64Data = pdfDataUri.split(',')[1];
      const saveResult = await saveNativeFile(base64Data, cleanFilename, 'application/pdf');
      return saveResult.success;
    } else {
      // Browser: standard web download
      pdf.save(cleanFilename);
      return true;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

/**
 * Prints a specific DOM element cleanly with full CSS styling and robust fallbacks.
 * Uses in-document print isolation with @media print overrides, pop-up tab fallback,
 * and automatic PDF export when native dialog is restricted by sandboxes.
 */
export function printIsolatedElement(
  elementIdOrElement: string | HTMLElement,
  title: string = 'Cetak Dokumen',
  paperSize: 'a4' | 'a5' | '58mm' | '80mm' | 'auto' = 'a5'
): boolean {
  try {
    const targetElement =
      typeof elementIdOrElement === 'string'
        ? document.getElementById(elementIdOrElement)
        : elementIdOrElement;

    if (!targetElement) {
      console.error('Target element for printing not found:', elementIdOrElement);
      try {
        window.print();
      } catch (e) {
        console.error('window.print error:', e);
      }
      return false;
    }

    const isThermalReceipt = paperSize === '58mm' || paperSize === '80mm';
    const thermalWidthCss = paperSize === '58mm' ? '58mm' : '80mm';

    // 1. Gather all active stylesheets from document
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
    let stylesHtml = '';
    styleElements.forEach(el => {
      stylesHtml += el.outerHTML;
    });

    const printContent = targetElement.outerHTML;

    // 2. Try Method A: Open standalone printable new window (most reliable across all desktop/mobile browsers)
    try {
      const popupWidth = isThermalReceipt ? 450 : 850;
      const printWin = window.open('', '_blank', `width=${popupWidth},height=950,top=50,left=50`);
      if (printWin && !printWin.closed) {
        printWin.document.open();
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${title}</title>
              ${stylesHtml}
              <style>
                @page {
                  size: ${isThermalReceipt ? `${thermalWidthCss} auto` : paperSize === 'a5' ? 'A5 portrait' : paperSize === 'a4' ? 'A4 portrait' : 'auto'};
                  margin: ${isThermalReceipt ? '0' : paperSize === 'a5' ? '5mm' : '8mm'};
                }
                html, body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  margin: 0 !important;
                  padding: ${isThermalReceipt ? '0' : paperSize === 'a5' ? '4px' : '10px'} !important;
                  width: ${isThermalReceipt ? thermalWidthCss : '100%'} !important;
                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                * {
                  box-shadow: none !important;
                  text-shadow: none !important;
                }
                .no-print {
                  display: none !important;
                }
                .print-container {
                  display: flex;
                  justify-content: center;
                  width: ${isThermalReceipt ? thermalWidthCss : '100%'} !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                }
                .print-container > div, #printable-receipt-area {
                  width: ${isThermalReceipt ? thermalWidthCss : '100%'} !important;
                  max-width: ${isThermalReceipt ? thermalWidthCss : paperSize === 'a5' ? '600px' : '794px'} !important;
                  box-shadow: none !important;
                  border: none !important;
                  padding: ${isThermalReceipt ? (paperSize === '58mm' ? '2mm 1.5mm' : '3mm 2mm') : '0'} !important;
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 250);
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
        return true;
      }
    } catch (popupErr) {
      console.warn('Popup window print blocked or failed, trying in-page print:', popupErr);
    }

    // 3. Try Method B: In-Page Dynamic Print Mode (Direct Window Print with injected style tag)
    const existingPrintStyle = document.getElementById('dynamic-print-override-style');
    if (existingPrintStyle) {
      existingPrintStyle.remove();
    }

    const dynamicStyle = document.createElement('style');
    dynamicStyle.id = 'dynamic-print-override-style';
    dynamicStyle.innerHTML = `
      @media print {
        @page {
          size: ${isThermalReceipt ? `${thermalWidthCss} auto` : paperSize === 'a5' ? 'A5 portrait' : 'A4 portrait'};
          margin: ${isThermalReceipt ? '0' : '6mm'};
        }
        body {
          background: #ffffff !important;
          color: #000000 !important;
        }
        #main-sidebar,
        #main-topbar,
        #global-search-backdrop,
        .no-print,
        button,
        nav,
        aside,
        header {
          display: none !important;
        }
        #receipt-modal-overlay,
        #invoice-modal-overlay {
          position: static !important;
          background: transparent !important;
          padding: 0 !important;
          display: block !important;
          inset: auto !important;
          overflow: visible !important;
        }
        #receipt-modal-content,
        #invoice-modal-content {
          box-shadow: none !important;
          border: none !important;
          max-width: 100% !important;
          max-height: none !important;
          width: 100% !important;
          overflow: visible !important;
        }
        #receipt-modal-header,
        #receipt-modal-footer,
        #invoice-modal-header,
        #invoice-modal-footer {
          display: none !important;
        }
        #${typeof elementIdOrElement === 'string' ? elementIdOrElement : targetElement.id || 'printable-area'} {
          display: block !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 auto !important;
          padding: ${isThermalReceipt ? (paperSize === '58mm' ? '2mm 1.5mm' : '3mm 2mm') : '0'} !important;
          width: ${isThermalReceipt ? thermalWidthCss : '100%'} !important;
          max-width: ${isThermalReceipt ? thermalWidthCss : '100%'} !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(dynamicStyle);

    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (winPrintErr) {
        console.warn('Native window.print() failed:', winPrintErr);
        // Fallback to direct PDF export
        downloadElementAsPdf(targetElement, { filename: `${title}.pdf` });
      } finally {
        setTimeout(() => {
          if (document.head.contains(dynamicStyle)) {
            dynamicStyle.remove();
          }
        }, 1500);
      }
    }, 150);

    return true;
  } catch (err) {
    console.error('Print isolated element failed:', err);
    try {
      window.print();
    } catch (e) {
      console.error('Final window.print fallback error:', e);
    }
    return false;
  }
}

export interface JpgExportOptions {
  filename?: string;
  scale?: number;
  quality?: number;
}

/**
 * Downloads a DOM element as a crisp, high-resolution JPG image.
 */
export async function downloadElementAsJpg(
  elementIdOrElement: string | HTMLElement,
  options: JpgExportOptions = {}
): Promise<boolean> {
  try {
    const targetElement =
      typeof elementIdOrElement === 'string'
        ? document.getElementById(elementIdOrElement)
        : elementIdOrElement;

    if (!targetElement) {
      console.error('Target element for JPG export not found:', elementIdOrElement);
      return false;
    }

    const {
      filename = 'struk.jpg',
      scale = 3,
      quality = 0.96,
    } = options;

    const isReceipt = targetElement.id === 'printable-receipt-area';
    const standardWidth = isReceipt ? (targetElement.scrollWidth || 380) : 794;

    const canvas = await html2canvas(targetElement, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: isReceipt ? standardWidth : 1024,
      onclone: (_clonedDoc, clonedElement) => {
        clonedElement.style.margin = '0';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.transform = 'none';
        if (!isReceipt) {
          clonedElement.style.width = '794px';
          clonedElement.style.maxWidth = '794px';
          clonedElement.style.minWidth = '794px';
        }
      },
    });

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const cleanFilename = sanitizeFilename(filename, '.jpg');

    // Platform-specific export
    if (Capacitor.isNativePlatform()) {
      // Android / Capacitor: Save to storage using @capacitor/filesystem
      const base64Data = dataUrl.split(',')[1];
      const saveResult = await saveNativeFile(base64Data, cleanFilename, 'image/jpeg');
      return saveResult.success;
    } else {
      // Browser: standard download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
  } catch (error) {
    console.error('Error generating JPG:', error);
    return false;
  }
}

export interface ShareJpgResult {
  success: boolean;
  method: 'native-share' | 'fallback-download' | 'canceled';
  message?: string;
  error?: string;
}

export type SendJpgToWhatsappResult = ShareJpgResult;

/**
 * Shares a DOM element directly as a JPG image via the OS Native Share Sheet or Web Share API.
 * Allows user to share to any installed application (WhatsApp, Telegram, Gmail, Bluetooth, Drive, etc.).
 *
 * On Android / Capacitor:
 * Directly invokes Android Native Share Sheet with the in-memory JPG attached.
 *
 * On Web / Mobile Browser:
 * Invokes navigator.share if file sharing is supported, or downloads JPG and opens WhatsApp link.
 */
export async function shareElementAsJpg(
  elementIdOrElement: string | HTMLElement,
  options: {
    filename: string;
    title?: string;
    text?: string;
    phone?: string;
  }
): Promise<ShareJpgResult> {
  try {
    const targetElement =
      typeof elementIdOrElement === 'string'
        ? document.getElementById(elementIdOrElement)
        : elementIdOrElement;

    if (!targetElement) {
      return { success: false, method: 'fallback-download', error: 'Elemen struk tidak ditemukan' };
    }

    const {
      filename,
      title = 'Struk Sukunaru Studio',
      text = 'Berikut struk transaksi Anda.',
      phone,
    } = options;

    const cleanFilename = sanitizeFilename(filename, '.jpg');

    const isReceipt = targetElement.id === 'printable-receipt-area';
    const standardWidth = isReceipt ? (targetElement.scrollWidth || 380) : 794;

    // Render HTML element to high-res canvas in memory (scale: 3 for crisp text & barcodes)
    const canvas = await html2canvas(targetElement, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: isReceipt ? standardWidth : 1024,
      onclone: (_clonedDoc, clonedElement) => {
        clonedElement.style.margin = '0';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.transform = 'none';
        if (!isReceipt) {
          clonedElement.style.width = '794px';
          clonedElement.style.maxWidth = '794px';
          clonedElement.style.minWidth = '794px';
        }
      },
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
    const base64Data = dataUrl.split(',')[1];

    // 1. PRIMARY ANDROID / CAPACITOR NATIVE PATH
    if (Capacitor.isNativePlatform()) {
      try {
        await requestStoragePermissions();

        // Write to Cache for native sharing
        const writeResult = await Filesystem.writeFile({
          path: cleanFilename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        // Use @capacitor/share to open native Android Share Sheet with file attached
        await Share.share({
          title: title,
          text: text,
          url: writeResult.uri,
          dialogTitle: title,
        });

        return {
          success: true,
          method: 'native-share',
          message: 'Struk JPG berhasil dibagikan',
        };
      } catch (nativeErr: any) {
        // If user cancelled/dismissed the Android Share Sheet, handle cleanly without error
        if (
          nativeErr.name === 'AbortError' ||
          nativeErr.message?.toLowerCase().includes('abort') ||
          nativeErr.message?.toLowerCase().includes('cancel') ||
          nativeErr.message?.toLowerCase().includes('dismiss')
        ) {
          return { success: true, method: 'canceled' };
        }

        console.warn('Native Capacitor Share failed, saving to Documents storage fallback:', nativeErr);
        await saveNativeFile(base64Data, cleanFilename, 'image/jpeg');
        return {
          success: true,
          method: 'fallback-download',
          message: 'File berhasil disimpan',
        };
      }
    }

    // 2. WEB BROWSER PATH (Web Share API)
    const jpgBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.96);
    });

    if (!jpgBlob) {
      throw new Error('Gagal membuat data gambar JPG dari struk.');
    }

    const file = new File([jpgBlob], cleanFilename, { type: 'image/jpeg' });

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title,
            text: text,
          });
        } else {
          await navigator.share({
            title: title,
            text: text,
          });
        }
        return {
          success: true,
          method: 'native-share',
          message: 'Berhasil dibagikan',
        };
      } catch (shareErr: any) {
        if (
          shareErr.name === 'AbortError' ||
          shareErr.message?.toLowerCase().includes('abort') ||
          shareErr.message?.toLowerCase().includes('cancel') ||
          shareErr.message?.toLowerCase().includes('dismiss')
        ) {
          return { success: true, method: 'canceled' };
        }
        console.warn('Native Web Share API error, falling back to download:', shareErr);
      }
    }

    // 3. DESKTOP / FALLBACK WEB PATH
    try {
      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': pngBlob,
          }),
        ]);
      }
    } catch (clipErr) {
      console.warn('Clipboard write image failed (fallback will use download):', clipErr);
    }

    // Trigger local download of the generated in-memory JPG Blob
    const objectUrl = URL.createObjectURL(jpgBlob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

    return {
      success: true,
      method: 'fallback-download',
      message: 'File JPG berhasil diunduh untuk dibagikan',
    };
  } catch (error: any) {
    console.error('Error in shareElementAsJpg:', error);
    return {
      success: false,
      method: 'fallback-download',
      error: error.message || 'Gagal membagikan JPG. Silakan coba lagi.',
    };
  }
}

/**
 * Formats phone number into international WhatsApp format (e.g. 6281234567890).
 */
export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Opens WhatsApp properly based on device (Mobile App vs Desktop Web).
 * Prevents mobile browsers from opening the desktop web.whatsapp.com interface.
 * When phone is not provided, opens the WhatsApp contact selection screen with pre-filled message text.
 */
export function openWhatsApp(phone?: string, text?: string): void {
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth <= 768) ||
      (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1));

  const cleanPhone = formatWhatsAppPhone(phone);
  const defaultText = 'Berikut struk transaksi Sukunaru Studio.';
  const messageText = text && text.trim() ? text.trim() : defaultText;
  const encodedText = encodeURIComponent(messageText);

  if (isMobile) {
    if (cleanPhone && cleanPhone.length >= 9) {
      // Direct chat on mobile WhatsApp app
      window.location.href = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    } else {
      // Open WhatsApp contact chooser with text pre-filled
      window.location.href = `https://api.whatsapp.com/send?text=${encodedText}`;
    }
  } else {
    // Desktop environment
    if (cleanPhone && cleanPhone.length >= 9) {
      window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, '_blank');
    } else {
      window.open(`https://web.whatsapp.com/send?text=${encodedText}`, '_blank');
    }
  }
}

export const sendElementAsJpgToWhatsapp = shareElementAsJpg;

