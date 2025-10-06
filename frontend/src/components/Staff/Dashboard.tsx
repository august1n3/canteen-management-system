import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ClipboardListIcon, 
  CurrencyDollarIcon, 
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  ExclamationCircleIcon
} from '@heroicons/react/outline';
import { orderApi, paymentApi, queueApi } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const Dashboard: React.FC = () => {
  const [realtimeStats, setRealtimeStats] = useState({
    activeOrders: 0,
    queueLength: 0,
    todayRevenue: 0
  });
  
  const { socket } = useSocket();

  // Fetch dashboard data
  const { data: orderAnalytics, isLoading: ordersLoading } = useQuery({
    queryKey: ['order-analytics'],
    queryFn: () => orderApi.getOrderAnalytics(),
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const { data: paymentAnalytics, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payment-analytics'],
    queryFn: () => paymentApi.getPaymentAnalytics(),
    refetchInterval: 30000
  });

  const { data: queueStatus, isLoading: queueLoading } = useQuery({
    queryKey: ['queue-status'],
    queryFn: () => queueApi.getQueueStatus({ limit: 10 }),
    refetchInterval: 10000 // More frequent updates for queue
  });

  const { data: todayOrders, isLoading: todayOrdersLoading } = useQuery({
    queryKey: ['orders-today'],
    queryFn: () => orderApi.getOrders(1, 10, undefined, { 
      date: new Date().toISOString().split('T')[0],
      limit: 10 
    }),
    refetchInterval: 15000
  });

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('new-order', (data) => {
        // Update realtime stats
        setRealtimeStats(prev => ({
          ...prev,
          activeOrders: prev.activeOrders + 1
        }));
      });

      socket.on('order-updated', (data) => {
        // Refetch data when orders are updated
        // You could also update specific stats here
      });

      socket.on('queue-updated', (data) => {
        setRealtimeStats(prev => ({
          ...prev,
          queueLength: data.queueLength || prev.queueLength
        }));
      });

      return () => {
        socket.off('new-order');
        socket.off('order-updated');
        socket.off('queue-updated');
      };
    }
  }, [socket]);

  const stats = [
    {
      name: 'Today\'s Orders',
      value: orderAnalytics?.data?.data?.totalOrders || 0,
      change: '+12%',
      changeType: 'increase' as const,
      icon: ClipboardListIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Today\'s Revenue',
      value: `$${(paymentAnalytics?.data?.data?.totalRevenue || 0).toFixed(2)}`,
      change: '+8%',
      changeType: 'increase' as const,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Active Queue',
      value: queueStatus?.data?.data?.statistics?.totalOrders || 0,
      change: '',
      changeType: 'neutral' as const,
      icon: UsersIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Avg Wait Time',
      value: `${queueStatus?.data?.data?.statistics?.avgWaitTime || 0} min`,
      change: '-2 min',
      changeType: 'decrease' as const,
      icon: ClockIcon,
      color: 'bg-purple-500'
    }
  ];

  const isLoading = ordersLoading || paymentsLoading || queueLoading;

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
        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-gray-600">Monitor orders and manage operations</p>
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
                  {stat.change && (
                    <p className={`ml-2 text-sm ${
                      stat.changeType === 'increase' 
                        ? 'text-green-600' 
                        : stat.changeType === 'decrease'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {stat.change}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="p-6">
            {todayOrdersLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {todayOrders?.data?.data?.orders?.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{order.id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.user.name} • ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'PREPARING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'READY'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!todayOrders?.data?.data?.orders || todayOrders.data.data.orders.length === 0) && (
                  <p className="text-gray-500 text-center py-8">No orders today yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Current Queue */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Queue</h3>
          </div>
          <div className="p-6">
            {queueLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {queueStatus?.data?.data?.queue?.slice(0, 5).map((queueItem: any) => (
                  <div key={queueItem.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">
                        #{queueItem.queuePosition} - {queueItem.customerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {queueItem.itemCount} items • {queueItem.waitTime} min wait
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        queueItem.status === 'CONFIRMED' 
                          ? 'bg-blue-100 text-blue-800'
                          : queueItem.status === 'PREPARING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {queueItem.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!queueStatus?.data?.data?.queue || queueStatus.data.data.queue.length === 0) && (
                  <p className="text-gray-500 text-center py-8">No orders in queue</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/staff/orders'}
            className="p-4 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ClipboardListIcon className="h-8 w-8 text-blue-500 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Orders</h4>
            <p className="text-sm text-gray-500">View and update order status</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/staff/payments'}
            className="p-4 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-green-500 mb-2" />
            <h4 className="font-medium text-gray-900">Process Payments</h4>
            <p className="text-sm text-gray-500">Handle cash and mobile payments</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/staff/menu'}
            className="p-4 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ExclamationCircleIcon className="h-8 w-8 text-yellow-500 mb-2" />
            <h4 className="font-medium text-gray-900">Update Menu</h4>
            <p className="text-sm text-gray-500">Manage items and availability</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/queue'}
            className="p-4 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <UsersIcon className="h-8 w-8 text-purple-500 mb-2" />
            <h4 className="font-medium text-gray-900">View Queue</h4>
            <p className="text-sm text-gray-500">Monitor current queue status</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// TODO: Add real-time order notifications with sound alerts
// TODO: Implement customizable dashboard widgets
// TODO: Add shift management and staff scheduling
// TODO: Implement performance metrics and KPIs
// TODO: Add weather-based demand forecasting