"use client"
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  DownloadIcon,
  RefreshIcon,
  TrendingUpIcon,
  CashIcon,
  ClipboardListIcon,
  UserGroupIcon,
  ExclamationIcon,
  CheckCircleIcon,
  FireIcon
} from '@heroicons/react/outline';
import { reportsApi, orderApi, paymentApi } from '@/services/api';

type Tab = 'overview' | 'daily' | 'monthly' | 'inventory' | 'customers';

// ── CSS bar chart ─────────────────────────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color = 'bg-blue-500', formatValue = (v: number) => String(v) }: {
  data: any[];
  labelKey: string;
  valueKey: string;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 py-4">No data</p>;
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-24 text-xs text-gray-500 text-right shrink-0 truncate">{item[labelKey]}</div>
          <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
            <div
              className={`${color} h-5 rounded-full transition-all`}
              style={{ width: `${((item[valueKey] || 0) / max) * 100}%`, minWidth: item[valueKey] ? '4px' : 0 }}
            />
          </div>
          <div className="w-24 text-xs font-medium text-gray-700 shrink-0">{formatValue(item[valueKey] || 0)}</div>
        </div>
      ))}
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
      <div className={`p-3 rounded-md ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

const fmt = (n: number | undefined) =>
  `TZS ${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // ── queries ──────────────────────────────────────────────────────────────────
  const { data: orderAnalytics, isLoading: oLoading } = useQuery({
    queryKey: ['order-analytics', dateRange],
    queryFn: () => orderApi.getOrderAnalytics(dateRange),
    enabled: activeTab === 'overview',
  });
  const { data: paymentAnalytics, isLoading: pLoading } = useQuery({
    queryKey: ['payment-analytics', dateRange],
    queryFn: () => paymentApi.getPaymentAnalytics(dateRange),
    enabled: activeTab === 'overview',
  });
  const { data: dailyReport, isLoading: dailyLoading, refetch: refetchDaily } = useQuery({
    queryKey: ['daily-report', selectedDate],
    queryFn: () => reportsApi.getDailySalesReport({ date: selectedDate }),
    enabled: activeTab === 'daily',
  });
  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-report', selectedMonth, selectedYear],
    queryFn: () => reportsApi.getMonthlySalesReport({ month: selectedMonth, year: selectedYear }),
    enabled: activeTab === 'monthly',
  });
  const { data: inventoryReport, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => reportsApi.getInventoryReport(),
    enabled: activeTab === 'inventory',
  });
  const { data: customerReport, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-report', dateRange],
    queryFn: () => reportsApi.getCustomerReport(dateRange),
    enabled: activeTab === 'customers',
  });

  // ── export ───────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const sources: Record<Tab, any> = {
      overview: { orderAnalytics: orderAnalytics?.data, paymentAnalytics: paymentAnalytics?.data },
      daily: dailyReport?.data,
      monthly: monthlyReport?.data,
      inventory: inventoryReport?.data,
      customers: customerReport?.data,
    };
    const blob = new Blob([JSON.stringify(sources[activeTab] || {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'daily', label: 'Daily Sales' },
    { key: 'monthly', label: 'Monthly Sales' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'customers', label: 'Customers' },
  ];

  // ── shorthand ─────────────────────────────────────────────────────────────────
  const oData = orderAnalytics?.data?.data;
  const pData = paymentAnalytics?.data?.data;
  const daily = dailyReport?.data?.data;
  const monthly = monthlyReport?.data?.data;
  const inventory = inventoryReport?.data?.data;
  const customers = customerReport?.data?.data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive canteen performance insights</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <DownloadIcon className="h-5 w-5" />
          Export JSON
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Date range controls */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="date" value={dateRange.startDate}
                  onChange={e => setDateRange(d => ({ ...d, startDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="date" value={dateRange.endDate}
                  onChange={e => setDateRange(d => ({ ...d, endDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              {[
                { label: 'Today', days: 0 },
                { label: '7 days', days: 7 },
                { label: '30 days', days: 30 },
                { label: '90 days', days: 90 },
              ].map(({ label, days }) => (
                <button key={label} onClick={() => setDateRange({
                  startDate: new Date(Date.now() - days * 86400000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                })} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700">
                  {label}
                </button>
              ))}
            </div>

            {/* Summary cards */}
            {(oLoading || pLoading) ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Orders" value={oData?.totalOrders || 0} icon={ClipboardListIcon} color="bg-blue-500" />
                <StatCard label="Total Revenue" value={fmt(pData?.totalRevenue)} icon={CashIcon} color="bg-green-500" />
                <StatCard label="Avg Order Value" value={fmt(oData?.avgOrderValue)} icon={TrendingUpIcon} color="bg-purple-500" />
                <StatCard label="Completion Rate" value={`${(oData?.completionRate || 0).toFixed(1)}%`} icon={CheckCircleIcon} color="bg-yellow-500" />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Order Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Completed', key: 'completedOrders', color: 'text-green-600' },
                    { label: 'Pending', key: 'pendingOrders', color: 'text-yellow-600' },
                    { label: 'Cancelled', key: 'cancelledOrders', color: 'text-red-600' },
                  ].map(({ label, key, color }) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <span className="text-gray-600 text-sm">{label}</span>
                      <span className={`font-semibold ${color}`}>{(oData as any)?.[key] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Mobile Money', key: 'mobileMoneyTotal' },
                    { label: 'Cash', key: 'cashTotal' },
                    { label: 'Card', key: 'cardTotal' },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <span className="text-gray-600 text-sm">{label}</span>
                      <span className="font-semibold">{fmt((pData as any)?.[key])}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DAILY SALES ───────────────────────────────────────────────────── */}
        {activeTab === 'daily' && (
          <div className="p-6 space-y-6">
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                <input type="date" value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <button onClick={() => refetchDaily()} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700">
                <RefreshIcon className="h-4 w-4" /> Refresh
              </button>
            </div>

            {dailyLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : daily ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Orders" value={daily.summary?.totalOrders || 0} icon={ClipboardListIcon} color="bg-blue-500" />
                  <StatCard label="Revenue" value={fmt(daily.summary?.totalRevenue)} icon={CashIcon} color="bg-green-500" />
                  <StatCard label="Avg Order" value={fmt(daily.summary?.avgOrderValue)} icon={TrendingUpIcon} color="bg-purple-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Selling Items */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FireIcon className="h-5 w-5 text-orange-500" /> Top Selling Items
                    </h3>
                    {(daily.topSellingItems || []).length === 0 ? (
                      <p className="text-sm text-gray-400">No completed orders on this date.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                              <th className="pb-2 font-medium">Item</th>
                              <th className="pb-2 font-medium">Category</th>
                              <th className="pb-2 font-medium text-right">Qty</th>
                              <th className="pb-2 font-medium text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(daily.topSellingItems || []).map((item: any, i: number) => (
                              <tr key={i} className="border-b border-gray-200 last:border-0">
                                <td className="py-2 font-medium text-gray-900">{item.name}</td>
                                <td className="py-2 text-gray-500">{item.category}</td>
                                <td className="py-2 text-right font-semibold">{item.totalQuantitySold}</td>
                                <td className="py-2 text-right text-green-600 font-semibold">{fmt(item.totalRevenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Payment Methods</h3>
                    {(daily.paymentMethods || []).length === 0 ? (
                      <p className="text-sm text-gray-400">No payments on this date.</p>
                    ) : (
                      <div className="space-y-3">
                        {(daily.paymentMethods || []).map((pm: any, i: number) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                            <div>
                              <span className="font-medium text-gray-800">{pm.method}</span>
                              <span className="ml-2 text-xs text-gray-400">{pm.transactionCount} txns</span>
                            </div>
                            <span className="font-semibold text-green-600">{fmt(pm.totalAmount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hourly breakdown */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">Hourly Order Volume</h3>
                  <BarChart
                    data={(daily.hourlyBreakdown || [])
                      .sort((a: any, b: any) => a.hour - b.hour)
                      .map((h: any) => ({ ...h, label: `${String(h.hour).padStart(2, '0')}:00` }))}
                    labelKey="label"
                    valueKey="orderCount"
                    color="bg-blue-500"
                    formatValue={v => `${v} orders`}
                  />
                </div>

                {/* Order status breakdown */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(daily.orderBreakdown || []).map((s: any, i: number) => (
                      <div key={i} className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-gray-900">{s.count}</div>
                        <div className="text-xs text-gray-500 mt-1">{s.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-400 py-12">Select a date to view the daily report.</p>
            )}
          </div>
        )}

        {/* ── MONTHLY SALES ─────────────────────────────────────────────────── */}
        {activeTab === 'monthly' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  {['January','February','March','April','May','June','July','August','September','October','November','December']
                    .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {monthlyLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : monthly ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Orders" value={monthly.summary?.totalOrders || 0} icon={ClipboardListIcon} color="bg-blue-500" />
                  <StatCard label="Revenue" value={fmt(monthly.summary?.totalRevenue)} icon={CashIcon} color="bg-green-500" />
                  <StatCard label="Avg Order" value={fmt(monthly.summary?.avgOrderValue)} icon={TrendingUpIcon} color="bg-purple-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Daily Revenue Trend</h3>
                    <BarChart
                      data={(monthly.dailyTrends || []).map((d: any) => ({ ...d, label: d.date?.slice(5) }))}
                      labelKey="label"
                      valueKey="revenue"
                      color="bg-green-500"
                      formatValue={v => fmt(v)}
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Customer Metrics</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Unique Customers', value: monthly.customerMetrics?.totalCustomers || 0 },
                        { label: 'Avg Orders / Customer', value: (monthly.customerMetrics?.avgOrdersPerCustomer || 0).toFixed(1) },
                        { label: 'Avg Spend / Customer', value: fmt(monthly.customerMetrics?.avgSpendPerCustomer) },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                          <span className="text-gray-600 text-sm">{label}</span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {(monthly.dailyTrends || []).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Daily Trends Table</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 border-b">
                            <th className="pb-2 font-medium">Date</th>
                            <th className="pb-2 font-medium text-right">Orders</th>
                            <th className="pb-2 font-medium text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(monthly.dailyTrends || []).map((d: any, i: number) => (
                            <tr key={i} className="border-b border-gray-200 last:border-0">
                              <td className="py-2 text-gray-700">{d.date}</td>
                              <td className="py-2 text-right font-semibold">{d.orderCount}</td>
                              <td className="py-2 text-right text-green-600 font-semibold">{fmt(d.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-bold">
                            <td className="py-2 text-gray-800">Total</td>
                            <td className="py-2 text-right">{(monthly.dailyTrends || []).reduce((s: number, d: any) => s + d.orderCount, 0)}</td>
                            <td className="py-2 text-right text-green-700">{fmt((monthly.dailyTrends || []).reduce((s: number, d: any) => s + d.revenue, 0))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-gray-400 py-12">No data for selected period.</p>
            )}
          </div>
        )}

        {/* ── INVENTORY ─────────────────────────────────────────────────────── */}
        {activeTab === 'inventory' && (
          <div className="p-6 space-y-6">
            {inventoryLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : inventory ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Inventory Value" value={fmt(inventory.totalInventoryValue)} icon={CashIcon} color="bg-green-500" />
                  <StatCard label="Low Stock Items" value={(inventory.lowStockItems || []).length} icon={ExclamationIcon} color="bg-red-500" />
                  <StatCard label="Categories" value={(inventory.categoryStockLevels || []).length} icon={ChartBarIcon} color="bg-blue-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <ExclamationIcon className="h-5 w-5 text-red-500" /> Low Stock Alerts
                      <span className="ml-auto bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">≤ 10 units</span>
                    </h3>
                    {(inventory.lowStockItems || []).length === 0 ? (
                      <div className="flex items-center gap-2 text-green-600 py-4">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="text-sm">All items are well stocked</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                              <th className="pb-2 font-medium">Item</th>
                              <th className="pb-2 font-medium">Category</th>
                              <th className="pb-2 font-medium text-right">Stock</th>
                              <th className="pb-2 font-medium text-right">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(inventory.lowStockItems || []).map((item: any, i: number) => (
                              <tr key={i} className="border-b border-gray-200 last:border-0">
                                <td className="py-2 font-medium text-gray-900">{item.name}</td>
                                <td className="py-2 text-gray-500">{item.category}</td>
                                <td className={`py-2 text-right font-bold ${(item.stockQuantity || 0) <= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {item.stockQuantity ?? 0}
                                </td>
                                <td className="py-2 text-right text-gray-600">{fmt(item.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Stock by Category</h3>
                    <BarChart
                      data={(inventory.categoryStockLevels || []).map((c: any) => ({
                        label: c.category,
                        stock: c._sum?.stockQuantity || 0,
                      }))}
                      labelKey="label"
                      valueKey="stock"
                      color="bg-blue-500"
                      formatValue={v => `${v} units`}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-400 py-12">Loading inventory data...</p>
            )}
          </div>
        )}

        {/* ── CUSTOMERS ─────────────────────────────────────────────────────── */}
        {activeTab === 'customers' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="date" value={dateRange.startDate}
                  onChange={e => setDateRange(d => ({ ...d, startDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="date" value={dateRange.endDate}
                  onChange={e => setDateRange(d => ({ ...d, endDate: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>

            {customerLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            ) : customers ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="New Students" value={customers.customerAcquisition || 0} icon={UserGroupIcon} color="bg-blue-500" />
                  <StatCard label="Active Customers" value={customers.avgOrderValues?.totalCustomers || 0} icon={UserGroupIcon} color="bg-green-500" />
                  <StatCard label="Avg Spend / Customer" value={fmt(customers.avgOrderValues?.overallAvg)} icon={CashIcon} color="bg-purple-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Top Customers by Spend</h3>
                    {(customers.topCustomers || []).length === 0 ? (
                      <p className="text-sm text-gray-400 py-4">No customer data for this period.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b">
                              <th className="pb-2 font-medium">#</th>
                              <th className="pb-2 font-medium">Name</th>
                              <th className="pb-2 font-medium">Student ID</th>
                              <th className="pb-2 font-medium text-right">Orders</th>
                              <th className="pb-2 font-medium text-right">Total Spent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(customers.topCustomers || []).map((c: any, i: number) => (
                              <tr key={i} className="border-b border-gray-200 last:border-0">
                                <td className="py-2 text-gray-400 font-medium">{i + 1}</td>
                                <td className="py-2">
                                  <div className="font-medium text-gray-900">{c.firstName} {c.lastName}</div>
                                  <div className="text-xs text-gray-400">{c.email}</div>
                                </td>
                                <td className="py-2 text-gray-500">{c.studentId || '—'}</td>
                                <td className="py-2 text-right font-semibold">{c.orderCount}</td>
                                <td className="py-2 text-right text-green-600 font-semibold">{fmt(c.totalSpent)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-800 mb-4">Order Frequency Distribution</h3>
                    {customers.orderFrequency ? (
                      <BarChart
                        data={Object.entries(customers.orderFrequency).map(([key, val]) => ({
                          range: `${key} order${key === '1' ? '' : 's'}`,
                          customers: val as number,
                        }))}
                        labelKey="range"
                        valueKey="customers"
                        color="bg-purple-500"
                        formatValue={v => `${v} customers`}
                      />
                    ) : (
                      <p className="text-sm text-gray-400">No frequency data.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-400 py-12">No customer data for selected period.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
