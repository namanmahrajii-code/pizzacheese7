'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Bike,
  UtensilsCrossed,
  Printer,
  Calendar,
  Search,
  Filter,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Receipt,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { OrderData } from './TaxInvoiceModal';

interface SalesKOTPanelProps {
  orders: OrderData[];
  onOpenInvoice: (order: OrderData, mode: 'invoice' | 'kot') => void;
}

export default function SalesKOTPanel({ orders, onOpenInvoice }: SalesKOTPanelProps) {
  // Time filter: 'today' | 'yesterday' | '7days' | 'month' | 'all'
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all'>('today');
  
  // Table channel filter: 'all' | 'dine-in' | 'delivery'
  const [channelFilter, setChannelFilter] = useState<'all' | 'dine-in' | 'delivery'>('all');
  
  // Payment filter: 'all' | 'UPI' | 'COD'
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'UPI' | 'COD'>('all');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Shift Close / Z-Report modal
  const [showZReport, setShowZReport] = useState(false);

  // Date helper
  const isDateInRange = (dateStr: string, filter: typeof timeFilter) => {
    if (filter === 'all') return true;
    const orderDate = new Date(dateStr);
    const now = new Date();

    if (filter === 'today') {
      return (
        orderDate.getDate() === now.getDate() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }

    if (filter === 'yesterday') {
      const yDate = new Date();
      yDate.setDate(yDate.getDate() - 1);
      return (
        orderDate.getDate() === yDate.getDate() &&
        orderDate.getMonth() === yDate.getMonth() &&
        orderDate.getFullYear() === yDate.getFullYear()
      );
    }

    if (filter === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      return orderDate >= past7;
    }

    if (filter === 'month') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }

    return true;
  };

  // Filter orders by time range first
  const timeFilteredOrders = useMemo(() => {
    return orders.filter((o) => isDateInRange(o.createdAt, timeFilter));
  }, [orders, timeFilter]);

  // Calculations for Live Delivery vs Dine-In Orders like KOT software
  const metrics = useMemo(() => {
    const validOrders = timeFilteredOrders.filter((o) => o.status !== 'Cancelled');

    // Dine-In Specifics
    const dineInOrders = validOrders.filter(
      (o) => o.deliveryType === 'Dine-in' || o.orderType === 'Dine-in'
    );
    const dineInRevenue = dineInOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const dineInCompleted = dineInOrders.filter((o) => o.status === 'Delivered').length;
    const dineInActive = dineInOrders.filter((o) => o.status !== 'Delivered').length;
    const dineInAov = dineInOrders.length > 0 ? Math.round(dineInRevenue / dineInOrders.length) : 0;
    const dineInUpi = dineInOrders.filter((o) => o.paymentMethod === 'UPI').reduce((acc, o) => acc + o.totalAmount, 0);
    const dineInCash = dineInRevenue - dineInUpi;

    // Live Delivery Specifics
    const deliveryOrders = validOrders.filter(
      (o) => o.deliveryType !== 'Dine-in' && o.orderType !== 'Dine-in'
    );
    const deliveryRevenue = deliveryOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const deliveryCompleted = deliveryOrders.filter((o) => o.status === 'Delivered').length;
    const deliveryActive = deliveryOrders.filter((o) => o.status !== 'Delivered').length;
    const deliveryAov = deliveryOrders.length > 0 ? Math.round(deliveryRevenue / deliveryOrders.length) : 0;
    const deliveryUpi = deliveryOrders.filter((o) => o.paymentMethod === 'UPI').reduce((acc, o) => acc + o.totalAmount, 0);
    const deliveryCod = deliveryRevenue - deliveryUpi;

    // Combined Totals
    const totalGrossRevenue = dineInRevenue + deliveryRevenue;
    const totalOrdersCount = dineInOrders.length + deliveryOrders.length;
    const totalAov = totalOrdersCount > 0 ? Math.round(totalGrossRevenue / totalOrdersCount) : 0;
    const totalGstCollected = Math.round((totalGrossRevenue * 5) / 105); // Approx 5% embedded GST

    // Cancelled Orders
    const cancelledOrders = timeFilteredOrders.filter((o) => o.status === 'Cancelled');
    const cancelledRevenue = cancelledOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    return {
      totalGrossRevenue,
      totalOrdersCount,
      totalAov,
      totalGstCollected,
      // Dine-In
      dineInRevenue,
      dineInCount: dineInOrders.length,
      dineInCompleted,
      dineInActive,
      dineInAov,
      dineInUpi,
      dineInCash,
      // Delivery
      deliveryRevenue,
      deliveryCount: deliveryOrders.length,
      deliveryCompleted,
      deliveryActive,
      deliveryAov,
      deliveryUpi,
      deliveryCod,
      // Cancellations
      cancelledCount: cancelledOrders.length,
      cancelledRevenue,
    };
  }, [timeFilteredOrders]);

  // Ledger Filtered List
  const ledgerOrders = useMemo(() => {
    return timeFilteredOrders.filter((o) => {
      const isDineIn = o.deliveryType === 'Dine-in' || o.orderType === 'Dine-in';

      // Channel filter
      if (channelFilter === 'dine-in' && !isDineIn) return false;
      if (channelFilter === 'delivery' && isDineIn) return false;

      // Payment filter
      if (paymentFilter === 'UPI' && o.paymentMethod !== 'UPI') return false;
      if (paymentFilter === 'COD' && o.paymentMethod === 'UPI') return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = o.id.toLowerCase().includes(q);
        const nameMatch = (o.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (o.customerPhone || '').includes(q);
        const tableMatch = (o.tableNumber || '').includes(q);
        if (!idMatch && !nameMatch && !phoneMatch && !tableMatch) return false;
      }

      return true;
    });
  }, [timeFilteredOrders, channelFilter, paymentFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Time Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e31837]/20 border border-[#e31837]/30 flex items-center justify-center text-xl text-[#e31837]">
              📊
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Sales & KOT Register Panel
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculate every sale with distinct live delivery and dine-in KOT metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Time Filters & Shift Z-Report */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pill Buttons */}
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center text-xs font-bold">
            {(
              [
                { id: 'today', label: 'Today (Shift)' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  timeFilter === t.id
                    ? 'bg-[#e31837] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Daily Z-Report Button */}
          <button
            type="button"
            onClick={() => setShowZReport(true)}
            className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black px-3.5 py-2.5 rounded-2xl border border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Shift Z-Report</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TOP-LEVEL METRICS SUMMARY CARDS                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Sales */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Gross Sales
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black">
              ₹
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              ₹{metrics.totalGrossRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
              <span className="text-emerald-400 font-bold">{metrics.totalOrdersCount} Orders</span>
              <span>• Avg Ticket ₹{metrics.totalAov}</span>
            </div>
          </div>
        </div>

        {/* Live Delivery Orders Stream */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1">
              <Bike className="w-3.5 h-3.5" />
              <span>Live Delivery Sales</span>
            </span>
            <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/30">
              {metrics.deliveryCount} Bills
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              ₹{metrics.deliveryRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span className="text-slate-300">
                Delivered: <strong className="text-emerald-400">{metrics.deliveryCompleted}</strong>
              </span>
              <span>•</span>
              <span className="text-slate-300">
                In-Transit: <strong className="text-amber-400">{metrics.deliveryActive}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Dine-In Orders Stream */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Dine-In Table Sales</span>
            </span>
            <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">
              {metrics.dineInCount} Tables
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              ₹{metrics.dineInRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span className="text-slate-300">
                Settled: <strong className="text-emerald-400">{metrics.dineInCompleted}</strong>
              </span>
              <span>•</span>
              <span className="text-slate-300">
                Active: <strong className="text-amber-400">{metrics.dineInActive}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Tax & Reconciliation */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tax (GST 5%) Collected
            </span>
            <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black">
              %
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              ₹{metrics.totalGstCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span>Included in gross food billing</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DINE-IN VS LIVE DELIVERY COMPARATIVE KOT CARDS        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Stream Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">🛵 Live Delivery Stream (Rider KOT)</h3>
                <span className="text-[10px] text-slate-400">Home deliveries via online store</span>
              </div>
            </div>
            <span className="text-sm font-black text-blue-400">
              ₹{metrics.deliveryRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Orders</span>
              <span className="text-base font-black text-white mt-1 block">{metrics.deliveryCount}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg Delivery Bill</span>
              <span className="text-base font-black text-white mt-1 block">₹{metrics.deliveryAov}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Fulfillment Rate</span>
              <span className="text-base font-black text-emerald-400 mt-1 block">
                {metrics.deliveryCount > 0
                  ? `${Math.round((metrics.deliveryCompleted / metrics.deliveryCount) * 100)}%`
                  : '100%'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prepaid / UPI Online:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">₹{metrics.deliveryUpi}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Banknote className="w-3.5 h-3.5 text-amber-400" />
                <span>Cash on Delivery (COD):</span>
              </span>
              <span className="font-mono font-bold text-amber-400">₹{metrics.deliveryCod}</span>
            </div>
          </div>
        </div>

        {/* Dine-In Stream Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">🍽️ Dine-In Restaurant Stream (Kitchen KOT)</h3>
                <span className="text-[10px] text-slate-400">Table QR scans & in-house guest billing</span>
              </div>
            </div>
            <span className="text-sm font-black text-amber-400">
              ₹{metrics.dineInRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Tables Served</span>
              <span className="text-base font-black text-white mt-1 block">{metrics.dineInCount}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg Table Spend</span>
              <span className="text-base font-black text-white mt-1 block">₹{metrics.dineInAov}</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Settlement Rate</span>
              <span className="text-base font-black text-amber-400 mt-1 block">
                {metrics.dineInCount > 0
                  ? `${Math.round((metrics.dineInCompleted / metrics.dineInCount) * 100)}%`
                  : '100%'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>UPI Table Pay:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">₹{metrics.dineInUpi}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Banknote className="w-3.5 h-3.5 text-amber-400" />
                <span>Cash Counter Settle:</span>
              </span>
              <span className="font-mono font-bold text-amber-400">₹{metrics.dineInCash}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. EVERY SALE ITEM-BY-ITEM DETAILED REGISTER LEDGER      */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Ledger Header & Search/Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white">Itemized Sales Ledger (Every Sale)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {ledgerOrders.length} transaction records with direct Tax Invoice and KOT printing.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Order #, Table, Guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#e31837] transition-colors"
              />
            </div>

            {/* Channel Filter */}
            <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-800 flex text-xs">
              <button
                type="button"
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  channelFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('dine-in')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  channelFilter === 'dine-in'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🍽️ Dine-In
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('delivery')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  channelFilter === 'delivery'
                    ? 'bg-blue-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛵 Delivery
              </button>
            </div>

            {/* Payment Filter */}
            <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-800 flex text-xs">
              <button
                type="button"
                onClick={() => setPaymentFilter('all')}
                className={`px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  paymentFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Pay
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('UPI')}
                className={`px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  paymentFilter === 'UPI'
                    ? 'bg-emerald-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                UPI
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('COD')}
                className={`px-2 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  paymentFilter === 'COD'
                    ? 'bg-amber-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cash/COD
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="pb-3 pl-2">Order ID & Time</th>
                <th className="pb-3">Stream / Destination</th>
                <th className="pb-3">Customer / Guest</th>
                <th className="pb-3">Items Summary</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3 text-right">Tax (5%)</th>
                <th className="pb-3 text-right">Gross Total</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right pr-2">Slips & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ledgerOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-bold">
                    No sales matching the selected filters found.
                  </td>
                </tr>
              ) : (
                ledgerOrders.map((ord) => {
                  const isDineIn = ord.deliveryType === 'Dine-in' || ord.orderType === 'Dine-in';
                  const tax = Math.round((ord.totalAmount * 5) / 105);
                  const itemsCount = (ord.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
                  const itemsPreview = (ord.items || [])
                    .map((it) => `${it.quantity}x ${it.name}`)
                    .slice(0, 2)
                    .join(', ');

                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Order ID & Time */}
                      <td className="py-3.5 pl-2 font-mono">
                        <div className="font-black text-white">#{ord.id}</div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Stream / Destination */}
                      <td className="py-3.5">
                        {isDineIn ? (
                          <span className="inline-flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-1 rounded-lg">
                            <span>🍽️</span>
                            <span>Table #{ord.tableNumber || '01'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black px-2.5 py-1 rounded-lg">
                            <Bike className="w-3 h-3" />
                            <span>Live Delivery</span>
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5">
                        <div className="font-bold text-slate-200">
                          {ord.customerName || (isDineIn ? 'In-House Guest' : 'Guest')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {ord.customerPhone || 'N/A'}
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 max-w-[200px]">
                        <div className="truncate text-slate-300 font-medium text-[11px]" title={itemsPreview}>
                          {itemsPreview || 'Pizza items'}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {itemsCount} total {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="py-3.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            ord.paymentMethod === 'UPI'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {ord.paymentMethod || 'COD / Cash'}
                        </span>
                      </td>

                      {/* Tax */}
                      <td className="py-3.5 text-right font-mono text-slate-400 text-[11px]">
                        ₹{tax}
                      </td>

                      {/* Gross Total */}
                      <td className="py-3.5 text-right font-mono font-black text-sm text-[#e31837]">
                        ₹{ord.totalAmount}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : ord.status === 'Cancelled'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>

                      {/* Slips & Actions */}
                      <td className="py-3.5 pr-2 text-right space-x-1.5 whitespace-nowrap">
                        {/* Tax Invoice Slip */}
                        <button
                          type="button"
                          onClick={() => onOpenInvoice(ord, 'invoice')}
                          className="inline-flex items-center space-x-1 bg-white hover:bg-slate-200 text-slate-900 font-black text-[11px] px-2.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                          title="View, Edit & Print Official Tax Invoice"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Tax Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DAY-END / SHIFT CLOSE Z-REPORT MODAL                  */}
      {/* ======================================================== */}
      {showZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white text-slate-950 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3 font-sans">
              <div>
                <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">
                  7CHEESE SHIFT Z-REPORT
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Period: {timeFilter.toUpperCase()} • Generated {new Date().toLocaleTimeString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowZReport(false)}
                className="text-slate-400 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div className="flex justify-between font-bold border-b border-dashed border-slate-300 pb-1">
                <span>TOTAL GROSS SALES:</span>
                <span>₹{metrics.totalGrossRevenue}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Bills Issued:</span>
                <span>{metrics.totalOrdersCount}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>• Live Delivery Sales ({metrics.deliveryCount}):</span>
                <span>₹{metrics.deliveryRevenue}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>• Dine-In Table Sales ({metrics.dineInCount}):</span>
                <span>₹{metrics.dineInRevenue}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-300 pt-1">
                <span>Total UPI / Online:</span>
                <span>₹{metrics.dineInUpi + metrics.deliveryUpi}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cash Collected:</span>
                <span>₹{metrics.dineInCash + metrics.deliveryCod}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5% included):</span>
                <span>₹{metrics.totalGstCollected}</span>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-3 flex justify-end space-x-2 font-sans">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-black hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Z-Report</span>
              </button>
              <button
                type="button"
                onClick={() => setShowZReport(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
