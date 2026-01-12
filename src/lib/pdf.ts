let _pdfMakePromise: Promise<any> | null = null;

async function getPdfMake() {
  if (!_pdfMakePromise) {
    _pdfMakePromise = (async () => {
      const pdfMakeModule: any = await import('pdfmake/build/pdfmake');
      const pdfFonts: any = await import('pdfmake/build/vfs_fonts');
      const pm = pdfMakeModule.default ?? pdfMakeModule;
      const vfs = pdfFonts?.vfs ?? pdfFonts?.pdfMake?.vfs;
      if (vfs) {
        pm.vfs = vfs;
      }
      return pm;
    })();
  }
  return _pdfMakePromise;
}

// Safe currency formatter to prevent NaN in PDF output
function formatCurrency(value: number | string | undefined | null): string {
  const num = Number(value);
  if (!Number.isFinite(num) || isNaN(num)) {
    return '0.00';
  }
  return Math.max(0, num).toFixed(2);
}

// Generate barcode as base64 image for pdfmake
async function generateBarcodeImage(value: string): Promise<string> {
  try {
    if (typeof window === 'undefined') return '';
    const JsBarcode = await import('jsbarcode');
    const canvas = document.createElement('canvas');
    
    // Use the module directly - it's a function
    const barcodeGenerator = JsBarcode.default || JsBarcode;
    barcodeGenerator(canvas, value, {
      format: 'CODE128',
      width: 2,
      height: 50,
      margin: 0,
      displayValue: false,
    });
    
    const imageData = canvas.toDataURL('image/png');
    console.log('Barcode generated:', imageData ? 'Success' : 'Failed', 'for', value);
    return imageData || '';
  } catch (e) {
    console.error('Barcode generation failed:', e);
    return '';
  }
}

interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  billing_street: string;
  billing_street2?: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;
  billing_country: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  status: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  notes?: string;
}

interface OrderData {
  order_number: string;
  customer: string;
  email: string;
  phone?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  status: string;
  date: string;
  notes?: string;
}

export async function generateInvoicePDF(invoice: InvoiceData) {
  const pdfMake = await getPdfMake();
  
  // Safeguard calculations to avoid NaN and ensure consistent totals
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const normalizedItems = items.map((it) => {
    const qty = Math.max(0, Number(it.quantity) || 0);
    const unit = Math.max(0, Number(it.unit_price) || 0);
    const total = Number(it.total_price) || 0;
    return {
      ...it,
      quantity: qty,
      unit_price: unit,
      total_price: Math.max(0, total || (qty * unit)),
    };
  });
  
  // Calculate totals with proper fallback logic
  const computedSubtotal = normalizedItems.reduce((sum, it) => sum + (Number(it.total_price) || 0), 0);
  
  // Ensure all values are valid numbers, never NaN
  // Use computed subtotal as primary source, fall back to API value only if it's a valid number
  const subtotal = Number.isFinite(Number(invoice.subtotal)) ? Number(invoice.subtotal) : computedSubtotal;
  const tax = Number.isFinite(Number(invoice.tax)) ? Number(invoice.tax) : 0;
  const shipping = Number.isFinite(Number(invoice.shipping_fee)) ? Number(invoice.shipping_fee) : 0;
  const total = Number.isFinite(Number(invoice.total)) ? Number(invoice.total) : (subtotal + tax + shipping);
  const amountPaid = Number.isFinite(Number(invoice.amount_paid)) ? Number(invoice.amount_paid) : 0;
  const balanceDue = Math.max(0, total - amountPaid);

  // Generate barcode image
  let barcodeImage = '';
  try {
    barcodeImage = await generateBarcodeImage(invoice.invoice_number);
  } catch (e) {
    console.warn('Barcode generation error:', e);
  }

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    styles: {
      header: {
        fontSize: 28,
        bold: true,
        color: '#1e293b',
      },
      subheader: {
        fontSize: 11,
        bold: true,
        color: '#475569',
        margin: [0, 0, 0, 5],
      },
      label: {
        fontSize: 9,
        color: '#64748b',
        bold: true,
      },
      value: {
        fontSize: 10,
        color: '#1e293b',
      },
    },
    content: [
      // Professional Header with gradient effect
      {
        canvas: [
          { 
            type: 'rect', 
            x: 0, 
            y: 0, 
            w: 515, 
            h: 80, 
            color: '#f8fafc',
            lineColor: '#e2e8f0',
            lineWidth: 1,
          },
          { 
            type: 'line', 
            x1: 0, 
            y1: 0, 
            x2: 515, 
            y2: 0, 
            lineWidth: 4, 
            lineColor: '#0ea5e9' 
          },
        ],
      },
      
      // Company Logo/Name and Invoice Number (overlaid on header box)
      {
        absolutePosition: { x: 50, y: 55 },
        stack: [
          {
            columns: [
              {
                width: '*',
                stack: [
                  { 
                    text: 'JAAN CONNECT', 
                    fontSize: 24, 
                    bold: true, 
                    color: '#0ea5e9',
                    margin: [0, 0, 0, 2],
                  },
                  { 
                    text: 'Wholesale Distribution', 
                    fontSize: 10, 
                    color: '#64748b',
                  },
                ],
              },
              {
                width: 'auto',
                stack: [
                  { 
                    text: 'INVOICE', 
                    fontSize: 28, 
                    bold: true, 
                    color: '#1e293b', 
                    alignment: 'right',
                  },
                  { 
                    text: invoice.invoice_number, 
                    fontSize: 12, 
                    color: '#475569', 
                    alignment: 'right',
                    bold: true,
                  },
                ],
              },
            ],
          },
        ],
      },

      { text: '', margin: [0, 85, 0, 20] },

      // Status Badge and Barcode Section
      {
        columns: [
          {
            width: '60%',
            stack: [
              {
                table: {
                  widths: ['auto'],
                  body: [[{
                    text: invoice.status.toUpperCase(),
                    style: 'label',
                    fillColor: invoice.status === 'paid' ? '#dcfce7' : 
                               invoice.status === 'overdue' ? '#fee2e2' : 
                               invoice.status === 'draft' ? '#f1f5f9' : '#fef3c7',
                    color: invoice.status === 'paid' ? '#166534' :
                           invoice.status === 'overdue' ? '#991b1b' :
                           invoice.status === 'draft' ? '#475569' : '#854d0e',
                    bold: true,
                    margin: [8, 4, 8, 4],
                    border: [false, false, false, false],
                  }]],
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 15],
              },
            ],
          },
          {
            width: '40%',
            stack: [
              barcodeImage ? {
                image: barcodeImage,
                width: 160,
                height: 45,
                alignment: 'right',
                margin: [0, 0, 0, 3],
              } : {
                text: `CODE: ${invoice.invoice_number}`,
                fontSize: 9,
                alignment: 'right',
                color: '#64748b',
                font: 'Courier',
                margin: [0, 15, 0, 3],
              },
              {
                text: invoice.invoice_number,
                fontSize: 8,
                color: '#94a3b8',
                alignment: 'right',
              },
            ],
          },
        ],
        margin: [0, 0, 0, 25],
      },

      // Bill From and Bill To Section
      {
        columns: [
          {
            width: '48%',
            stack: [
              {
                canvas: [{
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 240,
                  h: 2,
                  color: '#0ea5e9',
                }],
                margin: [0, 0, 0, 10],
              },
              { text: 'BILL FROM', style: 'subheader', color: '#0ea5e9' },
              { text: 'Jaan Connect', fontSize: 12, bold: true, color: '#1e293b', margin: [0, 0, 0, 4] },
              { text: '123 Business Street', fontSize: 9, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: 'City, State 12345', fontSize: 9, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: 'United States', fontSize: 9, color: '#64748b', margin: [0, 0, 0, 4] },
              { text: 'Phone: (555) 123-4567', fontSize: 9, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: 'Email: billing@jaanconnect.com', fontSize: 9, color: '#64748b' },
            ],
          },
          { width: '4%', text: '' },
          {
            width: '48%',
            stack: [
              {
                canvas: [{
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 240,
                  h: 2,
                  color: '#64748b',
                }],
                margin: [0, 0, 0, 10],
              },
              { text: 'BILL TO', style: 'subheader' },
              { text: invoice.customer_name, fontSize: 12, bold: true, color: '#1e293b', margin: [0, 0, 0, 4] },
              { text: invoice.customer_email, fontSize: 9, color: '#64748b', margin: [0, 0, 0, 2] },
              ...(invoice.customer_phone ? [{ text: invoice.customer_phone, fontSize: 9, color: '#64748b', margin: [0, 0, 0, 4] }] : [{ text: '', margin: [0, 0, 0, 4] }]),
              { text: invoice.billing_street, fontSize: 9, color: '#64748b', margin: [0, 0, 0, 2] },
              ...(invoice.billing_street2 ? [{ text: invoice.billing_street2, fontSize: 9, color: '#64748b', margin: [0, 0, 0, 2] }] : []),
              { text: `${invoice.billing_city}, ${invoice.billing_state} ${invoice.billing_zip}`, fontSize: 9, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: invoice.billing_country, fontSize: 9, color: '#64748b' },
            ],
          },
        ],
        margin: [0, 0, 0, 25],
      },

      // Invoice Details
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { 
                stack: [
                  { text: 'ISSUE DATE', style: 'label', margin: [0, 0, 0, 4] },
                  { 
                    text: new Date(invoice.issue_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }), 
                    fontSize: 10, 
                    color: '#1e293b',
                    bold: true,
                  },
                ],
                fillColor: '#f8fafc',
                border: [false, false, false, false],
                margin: [10, 10, 10, 10],
              },
              { 
                stack: [
                  { text: 'DUE DATE', style: 'label', margin: [0, 0, 0, 4] },
                  { 
                    text: new Date(invoice.due_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }), 
                    fontSize: 10, 
                    color: '#dc2626',
                    bold: true,
                  },
                ],
                fillColor: '#f8fafc',
                border: [false, false, false, false],
                margin: [10, 10, 10, 10],
              },
              ...(invoice.paid_date ? [{
                stack: [
                  { text: 'PAID DATE', style: 'label', margin: [0, 0, 0, 4] },
                  { 
                    text: new Date(invoice.paid_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }), 
                    fontSize: 10, 
                    color: '#16a34a',
                    bold: true,
                  },
                ],
                fillColor: '#f8fafc',
                border: [false, false, false, false],
                margin: [10, 10, 10, 10],
              }] : [{
                stack: [
                  { text: 'PAYMENT TERMS', style: 'label', margin: [0, 0, 0, 4] },
                  { 
                    text: 'Net 30', 
                    fontSize: 10, 
                    color: '#1e293b',
                    bold: true,
                  },
                ],
                fillColor: '#f8fafc',
                border: [false, false, false, false],
                margin: [10, 10, 10, 10],
              }]),
              { 
                stack: [
                  { text: 'AMOUNT DUE', style: 'label', margin: [0, 0, 0, 4] },
                  { 
                    text: `$${formatCurrency(balanceDue)}`, 
                    fontSize: 14, 
                    color: balanceDue > 0 ? '#dc2626' : '#16a34a',
                    bold: true,
                  },
                ],
                fillColor: '#f8fafc',
                border: [false, false, false, false],
                margin: [10, 10, 10, 10],
              },
            ],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 25],
      },

      // Items Table Header
      {
        canvas: [{
          type: 'rect',
          x: 0,
          y: 0,
          w: 515,
          h: 2,
          color: '#0ea5e9',
        }],
        margin: [0, 0, 0, 0],
      },
      
      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 60, 80, 90],
          body: [
            [
              { 
                text: 'DESCRIPTION', 
                fontSize: 10, 
                bold: true, 
                color: '#475569',
                fillColor: '#f1f5f9',
                margin: [10, 8, 5, 8],
                border: [false, false, false, false],
              },
              { 
                text: 'QTY', 
                fontSize: 10, 
                bold: true, 
                color: '#475569',
                fillColor: '#f1f5f9',
                alignment: 'center',
                margin: [5, 8, 5, 8],
                border: [false, false, false, false],
              },
              { 
                text: 'UNIT PRICE', 
                fontSize: 10, 
                bold: true, 
                color: '#475569',
                fillColor: '#f1f5f9',
                alignment: 'right',
                margin: [5, 8, 5, 8],
                border: [false, false, false, false],
              },
              { 
                text: 'AMOUNT', 
                fontSize: 10, 
                bold: true, 
                color: '#475569',
                fillColor: '#f1f5f9',
                alignment: 'right',
                margin: [5, 8, 10, 8],
                border: [false, false, false, false],
              },
            ],
            ...normalizedItems.map((item, index) => [
              { 
                text: item.description, 
                fontSize: 10, 
                color: '#1e293b',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                margin: [10, 10, 5, 10],
                border: [false, false, false, false],
              },
              { 
                text: String(item.quantity), 
                fontSize: 10, 
                color: '#475569',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                alignment: 'center',
                margin: [5, 10, 5, 10],
                border: [false, false, false, false],
              },
              { 
                text: `$${formatCurrency(item.unit_price)}`, 
                fontSize: 10, 
                color: '#475569',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                alignment: 'right',
                margin: [5, 10, 5, 10],
                border: [false, false, false, false],
              },
              { 
                text: `$${formatCurrency(item.total_price)}`, 
                fontSize: 10, 
                color: '#1e293b',
                fillColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                alignment: 'right',
                bold: true,
                margin: [5, 10, 10, 10],
                border: [false, false, false, false],
              },
            ]),
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 0],
      },

      // Bottom border for items table
      {
        canvas: [{
          type: 'rect',
          x: 0,
          y: 0,
          w: 515,
          h: 1,
          color: '#e2e8f0',
        }],
        margin: [0, 0, 0, 20],
      },

      // Totals Section
      {
        columns: [
          { 
            width: '*', 
            text: '',
          },
          {
            width: 240,
            stack: [
              // Subtotal
              {
                columns: [
                  { 
                    text: 'Subtotal', 
                    fontSize: 10, 
                    color: '#64748b',
                    width: '*',
                  },
                  { 
                    text: `$${formatCurrency(subtotal)}`, 
                    fontSize: 10, 
                    color: '#1e293b',
                    bold: true,
                    alignment: 'right',
                    width: 'auto',
                  },
                ],
                margin: [0, 0, 0, 8],
              },
              // Tax
              {
                columns: [
                  { 
                    text: 'Tax', 
                    fontSize: 10, 
                    color: '#64748b',
                    width: '*',
                  },
                  { 
                    text: `$${formatCurrency(tax)}`, 
                    fontSize: 10, 
                    color: '#1e293b',
                    bold: true,
                    alignment: 'right',
                    width: 'auto',
                  },
                ],
                margin: [0, 0, 0, 8],
              },
              // Shipping
              {
                columns: [
                  { 
                    text: 'Shipping', 
                    fontSize: 10, 
                    color: '#64748b',
                    width: '*',
                  },
                  { 
                    text: `$${formatCurrency(shipping)}`, 
                    fontSize: 10, 
                    color: '#1e293b',
                    bold: true,
                    alignment: 'right',
                    width: 'auto',
                  },
                ],
                margin: [0, 0, 0, 12],
              },
              // Divider
              {
                canvas: [{
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 240,
                  y2: 0,
                  lineWidth: 2,
                  lineColor: '#0ea5e9',
                }],
                margin: [0, 0, 0, 12],
              },
              // Total
              {
                columns: [
                  { 
                    text: 'TOTAL', 
                    fontSize: 12, 
                    bold: true, 
                    color: '#1e293b',
                    width: '*',
                  },
                  { 
                    text: `$${formatCurrency(total)}`, 
                    fontSize: 16, 
                    bold: true, 
                    color: '#0ea5e9',
                    alignment: 'right',
                    width: 'auto',
                  },
                ],
                margin: [0, 0, 0, 12],
              },
              ...(amountPaid > 0 ? [
                // Amount Paid
                {
                  columns: [
                    { 
                      text: 'Amount Paid', 
                      fontSize: 10, 
                      color: '#16a34a',
                      width: '*',
                    },
                    { 
                      text: `$${formatCurrency(amountPaid)}`, 
                      fontSize: 10, 
                      color: '#16a34a',
                      bold: true,
                      alignment: 'right',
                      width: 'auto',
                    },
                  ],
                  margin: [0, 0, 0, 8],
                },
                // Balance Due
                {
                  columns: [
                    { 
                      text: 'Balance Due', 
                      fontSize: 11, 
                      bold: true,
                      color: balanceDue > 0 ? '#dc2626' : '#16a34a',
                      width: '*',
                    },
                    { 
                      text: `$${formatCurrency(balanceDue)}`, 
                      fontSize: 13, 
                      bold: true,
                      color: balanceDue > 0 ? '#dc2626' : '#16a34a',
                      alignment: 'right',
                      width: 'auto',
                    },
                  ],
                  fillColor: balanceDue > 0 ? '#fef2f2' : '#f0fdf4',
                  margin: [10, 8, 10, 8],
                },
              ] : []),
            ],
          },
        ],
        margin: [0, 0, 0, 30],
      },

      // Footer
      {
        canvas: [{
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,
          lineColor: '#e2e8f0',
        }],
        margin: [0, 0, 0, 15],
      },
      {
        columns: [
          {
            width: '60%',
            stack: [
              { 
                text: 'Thank you for your business!', 
                fontSize: 11, 
                bold: true,
                color: '#1e293b',
                margin: [0, 0, 0, 6],
              },
              { 
                text: `Payment is due within ${Math.ceil((new Date(invoice.due_date).getTime() - new Date(invoice.issue_date).getTime()) / (1000 * 60 * 60 * 24))} days from the invoice date.`,
                fontSize: 9,
                color: '#64748b',
                margin: [0, 0, 0, 4],
              },
              { 
                text: 'For questions about this invoice, please contact billing@jaanconnect.com',
                fontSize: 9,
                color: '#64748b',
              },
            ],
          },
          {
            width: '40%',
            stack: [
              {
                text: 'PAYMENT METHODS',
                fontSize: 9,
                bold: true,
                color: '#475569',
                margin: [0, 0, 0, 4],
              },
              {
                text: '• Wire Transfer\n• Check\n• ACH\n• Credit Card',
                fontSize: 8,
                color: '#64748b',
                lineHeight: 1.4,
              },
            ],
            alignment: 'right',
          },
        ],
      },
    ],
  };

  pdfMake.createPdf(docDefinition).download(`${invoice.invoice_number}.pdf`);
}

export async function generateOrderReceiptPDF(order: OrderData) {
  const pdfMake = await getPdfMake();
  
  // Generate barcode image
  let barcodeImage = '';
  try {
    barcodeImage = await generateBarcodeImage(order.order_number);
  } catch (e) {
    console.warn('Barcode generation error:', e);
  }

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [50, 50, 50, 50],
    content: [
      // Header with branding line
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 8, lineColor: '#0ea5e9' }
        ]
      },
      { text: '', margin: [0, 10] },

      // Title and Order Number
      {
        columns: [
          {
            text: 'ORDER RECEIPT',
            fontSize: 32,
            bold: true,
            color: '#111827',
          },
          {
            stack: [
              { text: order.order_number, fontSize: 14, bold: true, alignment: 'right', color: '#111827' },
              {
                text: order.status.toUpperCase(),
                fontSize: 10,
                alignment: 'right',
                color: order.status === 'delivered' ? '#10b981' : order.status === 'cancelled' ? '#ef4444' : '#3b82f6',
              },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Company and Customer Info
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'FROM', fontSize: 11, bold: true, color: '#111827', margin: [0, 0, 0, 8] },
              { text: 'Jaan Connect', fontSize: 13, bold: true, color: '#111827' },
              { text: '123 Business Street', fontSize: 10, color: '#6b7280' },
              { text: 'City, State 12345', fontSize: 10, color: '#6b7280' },
              { text: 'Phone: (555) 123-4567', fontSize: 10, color: '#6b7280' },
              { text: 'Email: orders@jaanconnect.com', fontSize: 10, color: '#6b7280' },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'SHIP TO', fontSize: 11, bold: true, color: '#111827', margin: [0, 0, 0, 8] },
              { text: order.customer, fontSize: 13, bold: true, color: '#111827' },
              { text: order.email, fontSize: 10, color: '#6b7280' },
              order.phone ? { text: order.phone, fontSize: 10, color: '#6b7280' } : {},
              { text: order.shippingAddress.street, fontSize: 10, color: '#6b7280', margin: [0, 8, 0, 0] },
              { text: `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`, fontSize: 10, color: '#6b7280' },
              { text: order.shippingAddress.country, fontSize: 10, color: '#6b7280' },
            ],
          },
        ],
        margin: [0, 0, 0, 25],
      },

      // Order Date, Payment, and Barcode
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'ORDER DETAILS', fontSize: 11, bold: true, color: '#111827', margin: [0, 0, 0, 10] },
              {
                columns: [
                  { text: 'Order Date:', width: '40%', fontSize: 10, color: '#6b7280' },
                  {
                    text: new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    fontSize: 10,
                    bold: true,
                    color: '#111827',
                  },
                ],
              },
              {
                columns: [
                  { text: 'Payment Method:', width: '40%', fontSize: 10, color: '#6b7280', margin: [0, 8, 0, 0] },
                  { text: order.paymentMethod, fontSize: 10, bold: true, color: '#111827' },
                ],
              },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'BARCODE', fontSize: 11, bold: true, color: '#111827', margin: [0, 0, 0, 10], alignment: 'right' },
              barcodeImage
                ? { image: barcodeImage, width: 180, height: 50, alignment: 'right' }
                : { text: `║${order.order_number.slice(0, 8)}║`, font: 'Courier', fontSize: 12, alignment: 'right' },
              { text: order.order_number, fontSize: 8, color: '#6b7280', alignment: 'right', margin: [0, 5, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 25],
      },

      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 70, 60, 70, 80],
          body: [
            [
              { text: 'ITEM', fontSize: 10, bold: true, color: '#111827', fillColor: '#f3f4f6' },
              { text: 'SKU', fontSize: 10, bold: true, color: '#111827', fillColor: '#f3f4f6' },
              { text: 'QTY', fontSize: 10, bold: true, color: '#111827', fillColor: '#f3f4f6', alignment: 'center' },
              { text: 'PRICE', fontSize: 10, bold: true, color: '#111827', fillColor: '#f3f4f6', alignment: 'right' },
              { text: 'TOTAL', fontSize: 10, bold: true, color: '#111827', fillColor: '#f3f4f6', alignment: 'right' },
            ],
            ...order.items.map((item) => [
              { text: item.name, fontSize: 10, color: '#374151' },
              { text: item.sku, fontSize: 10, color: '#6b7280' },
              { text: String(item.quantity), fontSize: 10, color: '#374151', alignment: 'center' },
              { text: `$${Number(item.price).toFixed(2)}`, fontSize: 10, color: '#374151', alignment: 'right' },
              { text: `$${(item.quantity * item.price).toFixed(2)}`, fontSize: 10, color: '#374151', alignment: 'right', bold: true },
            ]),
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 2 : 0.5),
          vLineWidth: () => 0,
          hLineColor: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? '#111827' : '#e5e7eb'),
          paddingTop: () => 10,
          paddingBottom: () => 10,
          fillColor: (rowIndex: number) => (rowIndex > 0 && rowIndex % 2 === 1 ? '#f9fafb' : undefined),
        },
        margin: [0, 0, 0, 30],
      },

      // Totals Section
      {
        columns: [
          { text: '', width: '*' },
          {
            width: 250,
            table: {
              widths: ['*', 80],
              body: [
                [
                  { text: 'Subtotal', fontSize: 10, color: '#6b7280', alignment: 'right' },
                  { text: `$${Number(order.subtotal).toFixed(2)}`, fontSize: 10, color: '#111827', bold: true, alignment: 'right' },
                ],
                [
                  { text: 'Tax', fontSize: 10, color: '#6b7280', alignment: 'right' },
                  { text: `$${Number(order.tax).toFixed(2)}`, fontSize: 10, color: '#111827', bold: true, alignment: 'right' },
                ],
                [
                  { text: 'Shipping', fontSize: 10, color: '#6b7280', alignment: 'right' },
                  { text: `$${Number(order.shipping).toFixed(2)}`, fontSize: 10, color: '#111827', bold: true, alignment: 'right' },
                ],
                [
                  { text: 'TOTAL', fontSize: 12, bold: true, color: '#111827', alignment: 'right' },
                  { text: `$${Number(order.total).toFixed(2)}`, fontSize: 12, bold: true, color: '#0ea5e9', alignment: 'right', fillColor: '#f0f9ff' },
                ],
              ],
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0,
              hLineColor: () => '#e5e7eb',
              paddingTop: () => 8,
              paddingBottom: () => 8,
            },
          },
        ],
        margin: [0, 0, 0, 30],
      },

      // Footer
      {
        stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }] },
          { text: 'Thank you for your order!', fontSize: 10, color: '#6b7280', alignment: 'center', margin: [0, 10, 0, 0] },
          { text: 'For questions, contact us at orders@jaanconnect.com', fontSize: 9, color: '#9ca3af', alignment: 'center' },
        ],
      },
    ],
  };

  pdfMake.createPdf(docDefinition).download(`${order.order_number}_Receipt.pdf`);
}
