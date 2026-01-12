import { useEffect, useState, useRef } from 'react';
import { X, Download, Printer, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePDF } from '@/lib/pdf';
import { generateInvoiceBarcode } from '@/lib/barcode';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface InvoiceViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number | null;
}

export function InvoiceViewer({ open, onOpenChange, invoiceId }: InvoiceViewerProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [barcodeImage, setBarcodeImage] = useState<string>('');
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (invoiceId && open) {
      fetchInvoice();
    }
  }, [invoiceId, open]);

  useEffect(() => {
    if (invoice?.invoice_number) {
      generateInvoiceBarcode(invoice.invoice_number, {
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
      }).then(setBarcodeImage);
    }
  }, [invoice]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API_URL}/api/admin/invoices/${invoiceId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setInvoice(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (invoice) {
      await generateInvoicePDF(invoice);
    }
  };

  if (!invoice && !loading) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
        {/* Header with actions */}
        <div className="flex items-center justify-between p-6 border-b bg-white print:hidden">
          <DialogHeader className="flex-1">
            <DialogTitle>Invoice {invoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Content - A4 Size */}
        <div className="overflow-y-auto p-6 bg-gray-50 print:p-0 print:bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div
              ref={printRef}
              className="bg-white shadow-lg mx-auto print:shadow-none printable-invoice"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm',
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium text-gray-900 mb-1">Jaan Connect</div>
                    <div>123 Business Street</div>
                    <div>City, State 12345</div>
                    <div>Phone: (555) 123-4567</div>
                    <div>Email: billing@jaanconnect.com</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-4">
                    {invoice.invoice_number}
                  </div>
                  {barcodeImage && (
                    <div className="mb-3 flex justify-end">
                      <img src={barcodeImage} alt="Invoice Barcode" className="h-16" />
                    </div>
                  )}
                  {invoice.barcode && (
                    <div className="text-xs text-gray-500 mb-2 font-mono">
                      {invoice.barcode}
                    </div>
                  )}
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                    Bill To
                  </h3>
                  <div className="text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{invoice.customer_name}</div>
                    <div>{invoice.customer_email}</div>
                    {invoice.customer_phone && <div>{invoice.customer_phone}</div>}
                    <div className="mt-2">
                      <div>{invoice.billing_street}</div>
                      {invoice.billing_street2 && <div>{invoice.billing_street2}</div>}
                      <div>
                        {invoice.billing_city}, {invoice.billing_state} {invoice.billing_zip}
                      </div>
                      <div>{invoice.billing_country}</div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-medium">
                        {new Date(invoice.issue_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">
                        {new Date(invoice.due_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {invoice.paid_date && (
                      <div className="flex justify-between text-green-600">
                        <span>Paid Date:</span>
                        <span className="font-medium">
                          {new Date(invoice.paid_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mb-12">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="text-left py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Description
                      </th>
                      <th className="text-center py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Quantity
                      </th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Unit Price
                      </th>
                      <th className="text-right py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-4 text-sm text-gray-700">{item.description}</td>
                        <td className="py-4 text-sm text-center text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="py-4 text-sm text-right text-gray-700">
                          ${Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="py-4 text-sm text-right font-medium text-gray-900">
                          ${Number(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-12">
                <div className="w-64">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${Number(invoice.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">${Number(invoice.tax).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">
                        ${Number(invoice.shipping_fee).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-gray-900 text-base font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${Number(invoice.total).toFixed(2)}</span>
                    </div>
                    {Number(invoice.amount_paid) > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Amount Paid:</span>
                          <span className="font-medium">
                            ${Number(invoice.amount_paid).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-300 text-base font-bold">
                          <span
                            className={
                              Number(invoice.balance_due) > 0 ? 'text-red-600' : 'text-green-600'
                            }
                          >
                            Balance Due:
                          </span>
                          <span
                            className={
                              Number(invoice.balance_due) > 0 ? 'text-red-600' : 'text-green-600'
                            }
                          >
                            ${Number(invoice.balance_due).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mb-12">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                    Notes
                  </h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-8 mt-auto">
                <div className="text-center text-xs text-gray-500">
                  <p>Thank you for your business!</p>
                  <p className="mt-2">
                    Payment is due within {Math.ceil((new Date(invoice.due_date).getTime() - new Date(invoice.issue_date).getTime()) / (1000 * 60 * 60 * 24))} days from the invoice date.
                  </p>
                  <p className="mt-1">
                    Please make checks payable to Jaan Connect and mail to the address above.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-0,
          .print\\:p-0 * {
            visibility: visible;
          }
          .print\\:p-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </Dialog>
  );
}
