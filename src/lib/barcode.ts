/**
 * Barcode generation utilities for Jaan Connect
 * Generates CODE128 barcodes for orders and invoices
 */

/**
 * Generate barcode value from order number
 * Format: ORD00000003 (11 characters)
 */
export function generateOrderBarcodeValue(orderNumber: string): string {
  const numericPart = orderNumber.replace(/[^0-9]/g, '');
  return 'ORD' + numericPart.padStart(8, '0');
}

/**
 * Generate barcode value from invoice number
 * Format: INV202600003 (14 characters)
 */
export function generateInvoiceBarcodeValue(invoiceNumber: string): string {
  // Extract year (e.g., "2026" from "INV-2026-00003")
  const yearMatch = invoiceNumber.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  
  // Extract final number part
  const numericPart = invoiceNumber.match(/\d+$/);
  const number = numericPart ? numericPart[0] : '0';
  
  return 'INV' + year + number.padStart(5, '0');
}

/**
 * Generate barcode image as base64 data URL
 */
export async function generateBarcodeImage(
  value: string,
  options?: {
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
  }
): Promise<string> {
  try {
    if (typeof window === 'undefined') return '';
    
    const JsBarcode = await import('jsbarcode');
    const canvas = document.createElement('canvas');
    
    // Handle both default and named exports
    const barcodeGenerator = (JsBarcode as any).default || JsBarcode;
    
    barcodeGenerator(canvas, value, {
      format: 'CODE128',
      width: options?.width || 2,
      height: options?.height || 50,
      displayValue: options?.displayValue !== false,
      fontSize: options?.fontSize || 14,
      margin: options?.margin ?? 10,
      background: '#ffffff',
      lineColor: '#000000',
    });
    
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Barcode generation failed:', e);
    return '';
  }
}

/**
 * Generate barcode image for order
 */
export async function generateOrderBarcode(
  orderNumber: string,
  options?: Parameters<typeof generateBarcodeImage>[1]
): Promise<string> {
  const barcodeValue = generateOrderBarcodeValue(orderNumber);
  return generateBarcodeImage(barcodeValue, options);
}

/**
 * Generate barcode image for invoice
 */
export async function generateInvoiceBarcode(
  invoiceNumber: string,
  options?: Parameters<typeof generateBarcodeImage>[1]
): Promise<string> {
  const barcodeValue = generateInvoiceBarcodeValue(invoiceNumber);
  return generateBarcodeImage(barcodeValue, options);
}
