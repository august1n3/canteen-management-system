import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  FireIcon,
  PlayIcon
} from '@heroicons/react/outline';
import { queueApi, orderApi } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const KitchenDashboard: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Fetch queue data
  const { data: queueData, isLoading } = useQuery({
    queryKey: ['kitchen-queue'],
    queryFn: () => queueApi.getQueueStatus(),
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch queue analytics
  const { data: queueAnalytics } = useQuery({
    queryKey: ['queue-analytics'],
    queryFn: () => queueApi.getQueueAnalytics(),
    refetchInterval: 30000
  });

  // Mutation to update order status
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status, notes }: { 
      orderId: string; 
      status: string; 
      notes?: string 
    }) => orderApi.updateOrderStatus(orderId, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] });
      setSelectedOrder(null);
    }
  });

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('new-order', (data) => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] });
        // Play notification sound
        playNotificationSound();
      });

      socket.on('order-updated', (data) => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] });
      });

      return () => {
        socket.off('new-order');
        socket.off('order-updated');
      };
    }
  }, [socket, queryClient]);

  const playNotificationSound = () => {
    // Create audio context and play notification
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio notification not available');
    }
  };

  const handleStatusUpdate = (orderId: string, status: string) => {
    updateOrderMutation.mutate({ orderId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (waitTime: number) => {
    if (waitTime > 15) return 'border-l-red-500';
    if (waitTime > 10) return 'border-l-yellow-500';
    return 'border-l-green-500';
  };

  const queueItems = queueData?.data?.data?.queue || [];
  const stats = queueData?.data?.data?.statistics || {};

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
          <p className="text-gray-600">Manage order preparation and queue</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-500">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Orders</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalOrders || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-yellow-500">
              <FireIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Preparing</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.preparingOrders || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-500">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ready</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.readyOrders || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-purple-500">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Wait</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.avgWaitTime || 0}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Queue */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Order Queue</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Live Updates</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {queueItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders in queue</h3>
              <p className="mt-1 text-sm text-gray-500">Great job! All orders are completed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queueItems.map((order: any) => (
                <div
                  key={order.id}
                  className={`bg-gray-50 rounded-lg p-4 border-l-4 ${getPriorityColor(order.waitTime)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-900">
                        #{order.queuePosition}
                      </span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {order.customerName}
                        </h3>
                        {order.studentId && (
                          <p className="text-sm text-gray-500">ID: {order.studentId}</p>
                        )}
                      </div>
                      {order.waitTime > 15 && (
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {order.waitTime}m wait
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Items ({order.itemCount}):</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between bg-white p-2 rounded">
                          <span className="font-medium">{item.quantity}x {item.name}</span>
                          <span className="text-sm text-gray-500">{item.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2">
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                        disabled={updateOrderMutation.isPending}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Start Preparing
                      </button>
                    )}
                    
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'READY')}
                        disabled={updateOrderMutation.isPending}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Mark Ready
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Order Details - #{selectedOrder.queuePosition}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Time</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.orderTime).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="text-sm text-gray-900">${selectedOrder.totalAmount?.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between bg-gray-50 p-2 rounded">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="text-sm text-gray-500">{item.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;

// TODO: Add recipe instructions and preparation notes
// TODO: Implement timer functionality for tracking preparation time
// TODO: Add ingredient availability checking
// TODO: Implement batch cooking suggestions
// TODO: Add allergen and dietary restriction highlights