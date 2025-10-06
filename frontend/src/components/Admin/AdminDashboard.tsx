import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UsersIcon, 
  ClipboardListIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  TrendingUpIcon
} from '@heroicons/react/outline';
import { orderApi, paymentApi, reportsApi } from '@/services/api';

const AdminDashboard: React.FC = () => {
  // Fetch analytics data
  const { data: orderAnalytics, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-order-analytics'],
    queryFn: () => orderApi.getOrderAnalytics(),
    refetchInterval: 60000 // Refetch every minute
  });

  const { data: paymentAnalytics, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payment-analytics'],
    queryFn: () => paymentApi.getPaymentAnalytics(),
    refetchInterval: 60000
  });

  const { data: dailySales, isLoading: salesLoading } = useQuery({
    queryKey: ['daily-sales-report'],
    queryFn: () => reportsApi.getDailySalesReport(),
    refetchInterval: 300000 // Refetch every 5 minutes
  });

  const stats = [
    {
      name: 'Total Users',
      value: '1,234',
      change: '+12%',
      changeType: 'increase' as const,
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Orders Today',
      value: orderAnalytics?.data?.data?.totalOrders || 0,
      change: '+8%',
      changeType: 'increase' as const,
      icon: ClipboardListIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Revenue Today',
      value: `$${(paymentAnalytics?.data?.data?.totalRevenue || 0).toFixed(2)}`,
      change: '+15%',
      changeType: 'increase' as const,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Success Rate',
      value: `${(orderAnalytics?.data?.data?.completionRate || 0).toFixed(1)}%`,
      change: '+2%',
      changeType: 'increase' as const,
      icon: ChartBarIcon,
      color: 'bg-purple-500'
    }
  ];

  const isLoading = ordersLoading || paymentsLoading || salesLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-md ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`ml-2 text-sm ${
                    stat.changeType === 'increase' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/admin/users'}
            className="p-4 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <UsersIcon className="h-8 w-8 text-blue-500 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-500">Add staff, manage permissions</p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/reports'}
            className="p-4 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-green-500 mb-2" />
            <h3 className="font-medium text-gray-900">View Reports</h3>
            <p className="text-sm text-gray-500">Sales, inventory, analytics</p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/inventory'}
            className="p-4 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ClipboardListIcon className="h-8 w-8 text-yellow-500 mb-2" />
            <h3 className="font-medium text-gray-900">Inventory</h3>
            <p className="text-sm text-gray-500">Stock levels, bulk updates</p>
          </button>

          <button
            onClick={() => window.location.href = '/staff/menu'}
            className="p-4 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <CogIcon className="h-8 w-8 text-purple-500 mb-2" />
            <h3 className="font-medium text-gray-900">Menu Setup</h3>
            <p className="text-sm text-gray-500">Add items, set prices</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Order #{1000 + i}</p>
                  <p className="text-sm text-gray-500">Student Name • $12.50</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Queue Length</span>
              <span className="font-semibold">5 orders</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Kitchen Status</span>
              <span className="text-green-600 font-semibold">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payment System</span>
              <span className="text-green-600 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Low Stock Items</span>
              <span className="text-yellow-600 font-semibold">3 items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Overview</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">Sales charts will be implemented here</p>
            <p className="text-sm text-gray-400">Integration with chart library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;