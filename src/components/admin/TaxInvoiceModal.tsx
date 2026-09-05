'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  Edit3,
  Check,
  Plus,
  Trash2,
  X,
  RotateCcw,
  FileText,
  ChefHat,
  Bike,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

export interface OrderItemData {
  id: string;
  name: string;
  size: string;
  crust: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryType: string;
  orderType?: 'Delivery' | 'Dine-in';
  tableNumber?: string | null;
  paymentMethod?: 'COD' | 'UPI';
  totalAmount: number;
  status: 'Pending' | 'Preparing' | 'Dispatched' | 'Delivered' | 'Cancelled';
  createdAt: string;
  items: OrderItemData[];
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
}

interface EditableInvoiceData {
  restaurantName: string;
  legalEntity: string;
  storeAddress: string;
  gstin: string;
  fssai: string;
  invoiceNumber: string;
  dateStr: string;
  customerName: string;
  customerPhone: string;
  destinationAddress: string;
  dispatchPartner: string;
  orderStatus: string;
  paymentMode: string;
  orderType: 'Delivery' | 'Dine-in';
  tableNumber: string;
  items: Array<{
    id: string;
    name: string;
    size: string;
    crust: string;
    quantity: number;
    price: number;
  }>;
  packagingDeliveryFee: number;
  discount: number;
  gstPercent: number;
  specialInstructions: string;
  footerNote: string;
}

interface TaxInvoiceModalProps {
  order: OrderData;
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'invoice' | 'kot';
}

export default function TaxInvoiceModal({
  order,
  isOpen,
  onClose,
  defaultMode = 'invoice',
}: TaxInvoiceModalProps) {
  const [slipMode, setSlipMode] = useState<'invoice' | 'kot'>(defaultMode);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const slipRef = useRef<HTMLDivElement>(null);

  // Initialize editable slip data from the order
  const initInvoiceData = (sourceOrder: OrderData): EditableInvoiceData => {
    const isDineIn =
      sourceOrder.deliveryType === 'Dine-in' || sourceOrder.orderType === 'Dine-in';

    // Calculate baseline item prices
    const initialItems = (sourceOrder.items && sourceOrder.items.length > 0)
      ? sourceOrder.items.map((it, idx) => ({
          id: it.id || `item-${idx}`,
          name: it.name || 'Artisanal Pizza Item',
          size: it.size || 'Standard',
          crust: it.crust || 'Standard Crust',
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
        }))
      : [
          {
            id: 'item-1',
            name: 'Artisanal Woodfired Pizza',
            size: 'Medium (10")',
            crust: 'Cheese Burst',
            quantity: 1,
            price: sourceOrder.totalAmount || 499,
          },
        ];

    const orderDate = sourceOrder.createdAt
      ? new Date(sourceOrder.createdAt)
      : new Date();
    const formattedDate = orderDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      restaurantName: '7CHEESE PIZZA',
      legalEntity: '7CHEESE ARTISANAL FOODWORKS PVT. LTD.',
      storeAddress: '108 Kaladhungi Road, Near Canal Cross, Haldwani, Uttarakhand 263139',
      gstin: '05AAACS1429P1Z3',
      fssai: '12623005000192',
      invoiceNumber: `INV-${sourceOrder.id || Math.floor(10000 + Math.random() * 90000)}`,
      dateStr: formattedDate,
      customerName: sourceOrder.customerName || (isDineIn ? 'In-House Guest' : 'Valued Customer'),
      customerPhone: sourceOrder.customerPhone || (isDineIn ? 'Table Service' : 'N/A'),
      destinationAddress: isDineIn
        ? `Table #${sourceOrder.tableNumber || '01'} (Dine-In Area)`
        : sourceOrder.deliveryAddress || 'Kaladhungi Road, Haldwani',
      dispatchPartner: isDineIn
        ? 'Dine-In Floor Steward'
        : 'BlueDart / 7Cheese FastRider',
      orderStatus: sourceOrder.status || 'CONFIRMED',
      paymentMode: sourceOrder.paymentMethod || (isDineIn ? 'UPI / Cash' : 'Cash on Delivery (COD)'),
      orderType: isDineIn ? 'Dine-in' : 'Delivery',
      tableNumber: sourceOrder.tableNumber || '01',
      items: initialItems,
      packagingDeliveryFee: isDineIn ? 0 : 40,
      discount: 0,
      gstPercent: 5,
      specialInstructions: isDineIn
        ? 'Serve hot with extra oregano & chilli flakes packets'
        : 'Please do not ring bell if late night, contact on phone.',
      footerNote: isDineIn
        ? 'THANK YOU FOR DINING WITH 7CHEESE ARTISANAL PIZZA.'
        : 'THANK YOU FOR SUPPORTING 7CHEESE ARCHITECTURAL PIZZA ARTISANS.',
    };
  };

  const [slipData, setSlipData] = useState<EditableInvoiceData>(() =>
    initInvoiceData(order)
  );

  useEffect(() => {
    if (order) {
      setSlipData(initInvoiceData(order));
      setIsEditing(false);
      setSlipMode(defaultMode);
    }
  }, [order, defaultMode]);

  if (!isOpen || !order) return null;

  // Real-time calculations
  const itemsSubtotal = slipData.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const gstAmount = Math.round((itemsSubtotal * slipData.gstPercent) / 100);
  const grandTotal = Math.max(
    0,
    itemsSubtotal + slipData.packagingDeliveryFee + gstAmount - slipData.discount
  );

  // Handle item change
  const handleItemChange = (
    index: number,
    field: 'name' | 'size' | 'crust' | 'quantity' | 'price',
    value: string | number
  ) => {
    const updated = [...slipData.items];
    updated[index] = {
      ...updated[index],
      [field]: field === 'quantity' || field === 'price' ? Number(value) : value,
    };
    setSlipData({ ...slipData, items: updated });
  };

  const handleAddItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: 'New Custom Item',
      size: 'Standard',
      crust: 'Standard Crust',
      quantity: 1,
      price: 199,
    };
    setSlipData({ ...slipData, items: [...slipData.items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    if (slipData.items.length <= 1) return;
    const updated = slipData.items.filter((_, i) => i !== index);
    setSlipData({ ...slipData, items: updated });
  };

  const handleResetToDefault = () => {
    setSlipData(initInvoiceData(order));
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSlip = async () => {
    // Generate PDF directly (no HTML download) using jsPDF text layout.
    // Manual text layout used instead of html2canvas: Tailwind v4 oklch
    // colors break canvas capture, standard jsPDF fonts also lack ₹ glyph
    // so "Rs." is used throughout the PDF.
    const { jsPDF } = await import('jspdf');
    const isKot = slipMode === 'kot';
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const usableWidth = pageWidth - margin * 2;
    let y = 16;

    const ensureSpace = (needed: number) => {
      if (y + needed > 280) {
        doc.addPage();
        y = 16;
      }
    };
    const sectionGap = (gap = 4) => {
      y += gap;
    };

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(slipData.restaurantName || '7CHEESE PIZZA', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(slipData.legalEntity || '', margin, y);
    y += 4;
    const addressLines = doc.splitTextToSize(slipData.storeAddress || '', usableWidth * 0.6);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 4;
    doc.setFontSize(8);
    doc.text(`GSTIN: ${slipData.gstin || '-'}  |  FSSAI: ${slipData.fssai || '-'}`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(
      isKot ? 'KITCHEN ORDER TICKET' : 'OFFICIAL TAX INVOICE',
      pageWidth - margin,
      16,
      { align: 'right' }
    );
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(slipData.invoiceNumber || '', pageWidth - margin, 22, { align: 'right' });
    doc.text(slipData.dateStr || '', pageWidth - margin, 27, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(
      slipData.orderType === 'Dine-in' ? `TABLE #${slipData.tableNumber}` : 'HOME DELIVERY',
      pageWidth - margin,
      32,
      { align: 'right' }
    );
    y = Math.max(y, 38);

    doc.setDrawColor(30);
    doc.line(margin, y, pageWidth - margin, y);
    sectionGap(5);

    // Parties
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(slipData.orderType === 'Dine-in' ? 'GUEST & TABLE INFO' : 'BILLED / DELIVERED TO:', margin, y);
    doc.text(slipData.orderType === 'Dine-in' ? 'SERVICE STATION' : 'DISPATCH & PAYMENT:', pageWidth / 2 + 4, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const leftBlock = [
      slipData.customerName || '',
      `Phone: ${slipData.customerPhone || 'N/A'}`,
      ...doc.splitTextToSize(slipData.destinationAddress || '', usableWidth / 2 - 4),
    ];
    const rightBlock = [
      `Service: ${slipData.dispatchPartner || ''}`,
      `Payment: ${slipData.paymentMode || ''}`,
      `Status: ${slipData.orderStatus || ''}`,
    ];
    const blockHeight = Math.max(leftBlock.length, rightBlock.length) * 4.5;
    ensureSpace(blockHeight + 4);
    doc.text(leftBlock, margin, y);
    doc.text(rightBlock, pageWidth / 2 + 4, y);
    y += blockHeight + 3;
    doc.line(margin, y, pageWidth - margin, y);
    sectionGap(5);

    // Items table header
    const colX = [margin, margin + 78, margin + 118, margin + 134, margin + 156];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ITEM', colX[0], y);
    doc.text('SIZE / CRUST', colX[1], y);
    doc.text('QTY', colX[2], y);
    doc.text('PRICE', colX[3], y, { align: 'right' });
    doc.text('TOTAL', pageWidth - margin, y, { align: 'right' });
    y += 2;
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Items rows
    doc.setFont('helvetica', 'normal');
    slipData.items.forEach((it) => {
      const nameLines = doc.splitTextToSize(it.name || 'Item', 72);
      const variantLines = doc.splitTextToSize(
        `${it.size || ''}${it.crust ? ` - ${it.crust}` : ''}`,
        36
      );
      const rowHeight = Math.max(nameLines.length, variantLines.length) * 4 + 2;
      ensureSpace(rowHeight + 2);
      doc.text(nameLines, colX[0], y);
      doc.setFontSize(7);
      doc.text(variantLines, colX[1], y);
      doc.setFontSize(8);
      doc.text(String(it.quantity), colX[2], y);
      doc.text(`Rs.${it.price}`, colX[3], y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs.${it.quantity * it.price}`, pageWidth - margin, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += rowHeight;
    });
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    sectionGap(5);

    // Totals (right aligned)
    ensureSpace(30);
    doc.setFontSize(9);
    const totalRight = pageWidth - margin;
    const totalLabelX = totalRight - 62;
    doc.text('Subtotal:', totalLabelX, y);
    doc.text(`Rs.${itemsSubtotal}`, totalRight, y, { align: 'right' });
    y += 5;
    if (slipData.packagingDeliveryFee > 0) {
      doc.text('Delivery / Packaging:', totalLabelX, y);
      doc.text(`Rs.${slipData.packagingDeliveryFee}`, totalRight, y, { align: 'right' });
      y += 5;
    }
    doc.text(`GST (${slipData.gstPercent}%):`, totalLabelX, y);
    doc.text(`Rs.${gstAmount}`, totalRight, y, { align: 'right' });
    y += 5;
    if (slipData.discount > 0) {
      doc.text('Discount:', totalLabelX, y);
      doc.text(`-Rs.${slipData.discount}`, totalRight, y, { align: 'right' });
      y += 5;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', totalLabelX, y);
    doc.text(`Rs.${grandTotal}`, totalRight, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    sectionGap(6);

    // Notes + footer
    if (slipData.specialInstructions) {
      ensureSpace(12);
      doc.setFontSize(8);
      doc.text('Notes:', margin, y);
      y += 4;
      const noteLines = doc.splitTextToSize(slipData.specialInstructions, usableWidth);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4 + 3;
    }
    ensureSpace(12);
    doc.setDrawColor(150);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0);
    y += 5;
    doc.setFontSize(8);
    const footerLines = doc.splitTextToSize(slipData.footerNote || '', usableWidth);
    doc.text(footerLines, pageWidth / 2, y, { align: 'center' });

    doc.save(`${isKot ? 'KOT' : 'Tax_Invoice'}_${slipData.invoiceNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container matching screenshot */}
      <div className="relative w-full max-w-2xl my-auto print:max-w-none print:w-full">
        {/* Printable Card */}
        <div
          id="tax-invoice-printable"
          ref={slipRef}
          className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 transition-all font-sans print:border-0 print:shadow-none print:p-6 print:rounded-none"
        >
          {/* Top action header (hidden on paper print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 mb-5 print:hidden">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black tracking-wider uppercase text-slate-500">
                OFFICIAL TAX INVOICE • PACKING SLIP
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Edit Toggle */}
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
                title="Edit details before printing"
              >
                {isEditing ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Done Editing</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Slip</span>
                  </>
                )}
              </button>

              {/* Download */}
              <button
                type="button"
                onClick={handleDownloadSlip}
                className="flex items-center space-x-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                title="Download PDF Slip"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* Print Document Button (Matching Screenshot) */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center space-x-1.5 bg-black hover:bg-slate-800 text-white text-xs font-black px-4 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PRINT DOCUMENT</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Edit helper banner */}
          {isEditing && (
            <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 print:hidden">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Slip Edit Mode Enabled:</strong> You can edit any field, customer info, quantities, item prices, or taxes directly below before printing.
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-700 hover:text-black underline cursor-pointer shrink-0 ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Slip</span>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIP CONTENT                                             */}
          {/* ======================================================== */}

          {/* Restaurant Brand Header & Invoice Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              {isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={slipData.restaurantName}
                    onChange={(e) =>
                      setSlipData({ ...slipData, restaurantName: e.target.value })
                    }
                    className="font-black text-xl tracking-tight text-black border border-slate-300 rounded px-2 py-0.5 w-full outline-none focus:border-red-600"
                    placeholder="Restaurant Name"
                  />
                  <input
                    type="text"
                    value={slipData.legalEntity}
                    onChange={(e) =>
                      setSlipData({ ...slipData, legalEntity: e.target.value })
                    }
                    className="text-xs text-slate-600 border border-slate-300 rounded px-2 py-0.5 w-full outline-none"
                    placeholder="Legal Entity Name"
                  />
                  <input
                    type="text"
                    value={slipData.storeAddress}
                    onChange={(e) =>
                      setSlipData({ ...slipData, storeAddress: e.target.value })
                    }
                    className="text-xs text-slate-600 border border-slate-300 rounded px-2 py-0.5 w-full outline-none"
                    placeholder="Store Address"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slipData.gstin}
                      onChange={(e) =>
                        setSlipData({ ...slipData, gstin: e.target.value })
                      }
                      className="text-[11px] text-slate-600 border border-slate-300 rounded px-2 py-0.5 w-1/2 outline-none font-mono"
                      placeholder="GSTIN"
                    />
                    <input
                      type="text"
                      value={slipData.fssai}
                      onChange={(e) =>
                        setSlipData({ ...slipData, fssai: e.target.value })
                      }
                      className="text-[11px] text-slate-600 border border-slate-300 rounded px-2 py-0.5 w-1/2 outline-none font-mono"
                      placeholder="FSSAI Lic No."
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                    {slipData.restaurantName}
                  </h1>
                  <p className="text-[11px] text-slate-600 uppercase tracking-wider font-semibold">
                    {slipData.legalEntity}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {slipData.storeAddress}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    GSTIN: <span className="font-bold text-slate-800">{slipData.gstin}</span>
                    {slipData.fssai && (
                      <span> • FSSAI: <span className="font-bold text-slate-800">{slipData.fssai}</span></span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Right Meta Column */}
            <div className="text-left sm:text-right space-y-1 sm:min-w-[200px]">
              <div className="text-sm font-mono font-black text-slate-900">
                {isEditing ? (
                  <div className="flex items-center space-x-1 sm:justify-end">
                    <span className="text-xs font-bold text-slate-500">INV #:</span>
                    <input
                      type="text"
                      value={slipData.invoiceNumber}
                      onChange={(e) =>
                        setSlipData({ ...slipData, invoiceNumber: e.target.value })
                      }
                      className="font-mono text-xs border border-slate-300 rounded px-1.5 py-0.5 outline-none font-bold text-right"
                    />
                  </div>
                ) : (
                  <span>
                    {slipMode === 'kot' ? 'KOT #' : 'INVOICE #'}{slipData.invoiceNumber}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600">
                {isEditing ? (
                  <input
                    type="text"
                    value={slipData.dateStr}
                    onChange={(e) =>
                      setSlipData({ ...slipData, dateStr: e.target.value })
                    }
                    className="text-xs border border-slate-300 rounded px-1.5 py-0.5 outline-none text-right w-full"
                  />
                ) : (
                  <span>Date: {slipData.dateStr}</span>
                )}
              </div>

              <div className="text-xs font-mono font-bold text-slate-800">
                {isEditing ? (
                  <div className="flex items-center gap-1 sm:justify-end mt-1">
                    <select
                      value={slipData.orderType}
                      onChange={(e) =>
                        setSlipData({
                          ...slipData,
                          orderType: e.target.value as 'Delivery' | 'Dine-in',
                        })
                      }
                      className="text-xs border border-slate-300 rounded px-1.5 py-0.5 outline-none"
                    >
                      <option value="Dine-in">Dine-in Table</option>
                      <option value="Delivery">Home Delivery</option>
                    </select>
                    {slipData.orderType === 'Dine-in' && (
                      <input
                        type="text"
                        value={slipData.tableNumber}
                        onChange={(e) =>
                          setSlipData({ ...slipData, tableNumber: e.target.value })
                        }
                        placeholder="Table #"
                        className="w-16 text-xs border border-slate-300 rounded px-1.5 py-0.5 outline-none text-center font-bold"
                      />
                    )}
                  </div>
                ) : (
                  <span className="inline-block bg-slate-100 text-slate-900 px-2 py-0.5 rounded text-[11px] font-black border border-slate-300">
                    {slipData.orderType === 'Dine-in'
                      ? `🍽️ TABLE #${slipData.tableNumber}`
                      : '🛵 LIVE DELIVERY'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Billed & Shipped To + Dispatch Partner Section (Matching Screenshot) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            {/* Left: Customer */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                {slipData.orderType === 'Dine-in' ? 'GUEST & TABLE INFO' : 'BILLED & SHIPPED TO'}
              </span>
              {isEditing ? (
                <div className="space-y-1 pt-1">
                  <input
                    type="text"
                    value={slipData.customerName}
                    onChange={(e) =>
                      setSlipData({ ...slipData, customerName: e.target.value })
                    }
                    className="w-full text-xs font-bold border border-slate-300 rounded px-2 py-0.5"
                    placeholder="Customer Name"
                  />
                  <input
                    type="text"
                    value={slipData.customerPhone}
                    onChange={(e) =>
                      setSlipData({ ...slipData, customerPhone: e.target.value })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2 py-0.5"
                    placeholder="Phone"
                  />
                  <textarea
                    value={slipData.destinationAddress}
                    onChange={(e) =>
                      setSlipData({ ...slipData, destinationAddress: e.target.value })
                    }
                    rows={2}
                    className="w-full text-xs border border-slate-300 rounded px-2 py-0.5"
                    placeholder="Delivery Address or Table Notes"
                  />
                </div>
              ) : (
                <div>
                  <div className="font-extrabold text-sm text-slate-900">
                    {slipData.customerName}
                  </div>
                  <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                    {slipData.customerPhone}
                  </div>
                  <div className="text-slate-600 text-xs mt-1 leading-snug">
                    {slipData.destinationAddress}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Dispatch Partner & Payment */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  {slipData.orderType === 'Dine-in' ? 'SERVICE STATION' : 'DISPATCH PARTNER'}
                </span>
                {isEditing ? (
                  <div className="space-y-1 pt-1">
                    <input
                      type="text"
                      value={slipData.dispatchPartner}
                      onChange={(e) =>
                        setSlipData({ ...slipData, dispatchPartner: e.target.value })
                      }
                      className="w-full text-xs font-bold border border-slate-300 rounded px-2 py-0.5"
                      placeholder="Dispatch Partner / Waiter"
                    />
                    <input
                      type="text"
                      value={slipData.paymentMode}
                      onChange={(e) =>
                        setSlipData({ ...slipData, paymentMode: e.target.value })
                      }
                      className="w-full text-xs border border-slate-300 rounded px-2 py-0.5"
                      placeholder="Payment Method"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="font-extrabold text-sm text-slate-900">
                      {slipData.dispatchPartner}
                    </div>
                    <div className="text-slate-600 text-xs mt-0.5">
                      Payment Mode: <strong className="text-slate-900">{slipData.paymentMode}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  STATUS:
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={slipData.orderStatus}
                    onChange={(e) =>
                      setSlipData({ ...slipData, orderStatus: e.target.value })
                    }
                    className="text-xs font-bold border border-slate-300 rounded px-2 py-0.5 text-right w-28"
                  />
                ) : (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase">
                    {slipData.orderStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ITEMS TABLE                                              */}
          {/* ======================================================== */}
          <div className="py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                    <th className="pb-2">ITEM DESCRIPTION</th>
                    <th className="pb-2">SIZE / CRUST</th>
                    <th className="pb-2 text-center">QTY</th>
                    <th className="pb-2 text-right">UNIT PRICE</th>
                    <th className="pb-2 text-right">TOTAL</th>
                    {isEditing && <th className="pb-2 text-center w-10"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slipData.items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 pr-2 font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) =>
                              handleItemChange(idx, 'name', e.target.value)
                            }
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                          />
                        ) : (
                          <div>
                            <span>{it.name}</span>
                            {slipMode === 'kot' && (
                              <span className="ml-2 inline-block px-1.5 py-0.2 text-[9px] bg-red-100 text-[#e31837] font-black rounded uppercase">
                                Kitchen Order
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-slate-600">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={it.size}
                              onChange={(e) =>
                                handleItemChange(idx, 'size', e.target.value)
                              }
                              placeholder="Size"
                              className="w-20 border border-slate-300 rounded px-1.5 py-1 text-[11px]"
                            />
                            <input
                              type="text"
                              value={it.crust}
                              onChange={(e) =>
                                handleItemChange(idx, 'crust', e.target.value)
                              }
                              placeholder="Crust"
                              className="w-28 border border-slate-300 rounded px-1.5 py-1 text-[11px]"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px]">
                            {it.size} {it.crust && it.crust !== 'Standard' ? `• ${it.crust}` : ''}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', e.target.value)
                            }
                            className="w-14 border border-slate-300 rounded px-1.5 py-1 text-xs text-center font-black"
                          />
                        ) : (
                          <span className="font-mono text-sm">{it.quantity}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={it.price}
                            onChange={(e) =>
                              handleItemChange(idx, 'price', e.target.value)
                            }
                            className="w-20 border border-slate-300 rounded px-1.5 py-1 text-xs text-right font-mono"
                          />
                        ) : (
                          <span>₹{it.price}</span>
                        )}
                      </td>

                      <td className="py-2.5 pl-2 text-right font-bold text-slate-900 font-mono">
                        ₹{it.quantity * it.price}
                      </td>

                      {isEditing && (
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Item Button in Edit Mode */}
            {isEditing && (
              <div className="pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* TOTALS & FINANCIAL SUMMARY                               */}
          {/* ======================================================== */}
          <div className="border-t-2 border-slate-300 pt-4 flex flex-col sm:flex-row justify-between gap-6">
            {/* Left: Notes & Kitchen Prep Instructions */}
            <div className="sm:max-w-[280px] space-y-1.5 text-xs text-slate-600">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                {slipMode === 'kot' ? 'KITCHEN INSTRUCTIONS / CHEF NOTE' : 'SPECIAL ORDER NOTES'}
              </span>
              {isEditing ? (
                <textarea
                  value={slipData.specialInstructions}
                  onChange={(e) =>
                    setSlipData({ ...slipData, specialInstructions: e.target.value })
                  }
                  rows={3}
                  className="w-full text-xs border border-slate-300 rounded p-2 outline-none"
                  placeholder="Special instructions..."
                />
              ) : (
                <p className="text-[11px] italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  "{slipData.specialInstructions}"
                </p>
              )}
            </div>

            {/* Right: Calculations Breakdown */}
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">₹{itemsSubtotal}</span>
              </div>

              <div className="flex justify-between text-slate-600 items-center">
                <span>Shipping / Service:</span>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={slipData.packagingDeliveryFee}
                    onChange={(e) =>
                      setSlipData({
                        ...slipData,
                        packagingDeliveryFee: Number(e.target.value),
                      })
                    }
                    className="w-18 text-xs font-mono text-right border border-slate-300 rounded px-1 py-0.5"
                  />
                ) : (
                  <span className="font-mono font-bold text-slate-900">
                    {slipData.packagingDeliveryFee === 0
                      ? 'FREE'
                      : `₹${slipData.packagingDeliveryFee}`}
                  </span>
                )}
              </div>

              <div className="flex justify-between text-slate-600 items-center">
                <span>
                  GST (Included {isEditing ? '' : `${slipData.gstPercent}%`}):
                </span>
                {isEditing ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      max="28"
                      value={slipData.gstPercent}
                      onChange={(e) =>
                        setSlipData({ ...slipData, gstPercent: Number(e.target.value) })
                      }
                      className="w-12 text-xs font-mono text-right border border-slate-300 rounded px-1 py-0.5"
                    />
                    <span>%</span>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-slate-900">₹{gstAmount}</span>
                )}
              </div>

              {/* Discount if present or in edit mode */}
              {(slipData.discount > 0 || isEditing) && (
                <div className="flex justify-between text-emerald-700 items-center">
                  <span>Discount:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={slipData.discount}
                      onChange={(e) =>
                        setSlipData({ ...slipData, discount: Number(e.target.value) })
                      }
                      className="w-18 text-xs font-mono text-right border border-slate-300 rounded px-1 py-0.5 text-emerald-700"
                    />
                  ) : (
                    <span className="font-mono font-bold">-₹{slipData.discount}</span>
                  )}
                </div>
              )}

              {/* Grand Total Row (Bold & Big) */}
              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline text-slate-950">
                <span className="text-sm font-black uppercase tracking-tight">Grand Total:</span>
                <span className="text-xl font-black font-mono">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SLIP FOOTER & BARCODE                                    */}
          {/* ======================================================== */}
          <div className="mt-8 pt-5 border-t border-slate-200 text-center space-y-2">
            {isEditing ? (
              <input
                type="text"
                value={slipData.footerNote}
                onChange={(e) =>
                  setSlipData({ ...slipData, footerNote: e.target.value })
                }
                className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-300 rounded px-2 py-1"
              />
            ) : (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {slipData.footerNote}
              </p>
            )}

            {/* Barcode Graphic */}
            <div className="pt-1 flex items-center justify-center space-x-1 opacity-70">
              <span className="font-mono text-xs tracking-widest select-none text-slate-700 font-bold">
                ||||| | |||| ||||| || |||||| |||| | ||||| ||
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
