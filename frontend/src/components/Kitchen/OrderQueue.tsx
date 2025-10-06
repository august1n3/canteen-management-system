import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ClockIcon, 
  PlayIcon,
  CheckIcon,
  ExclamationIcon,
  EyeIcon,
  XCircleIcon,
  VolumeUpIcon
} from '@heroicons/react/outline';
import { orderApi } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const OrderQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const { socket, joinRoom } = useSocket();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['kitchen-orders', filter],
    queryFn: () => orderApi.getOrders(1, 100, filter === 'all' ? undefined : filter),
    refetchInterval: 15000,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      orderApi.updateOrderStatus(orderId, status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      setSelectedOrder(null);
    }
  });

  useEffect(() => {
    if (socket) {
      joinRoom('kitchen');

      const handleNewOrder = (order: any) => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
        
        // Play notification sound
        if (soundEnabled) {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {
            // Fallback if audio file doesn't exist or can't play
            console.log('New order notification');
          });
        }
      };

      const handleOrderUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      };

      socket.on('newOrder', handleNewOrder);
      socket.on('orderUpdated', handleOrderUpdate);

      return () => {
        socket.off('newOrder', handleNewOrder);
        socket.off('orderUpdated', handleOrderUpdate);
      };
    }
  }, [socket, joinRoom, queryClient, soundEnabled]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-500 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'preparing':
        return 'bg-orange-500';
      case 'ready':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus });
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'confirmed';
      case 'confirmed':
        return 'preparing';
      case 'preparing':
        return 'ready';
      default:
        return currentStatus;
    }
  };

  const getStatusAction = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Confirm Order', icon: CheckIcon };
      case 'confirmed':
        return { label: 'Start Preparing', icon: PlayIcon };
      case 'preparing':
        return { label: 'Mark Ready', icon: CheckIcon };
      default:
        return { label: 'Update', icon: CheckIcon };
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !data?.data?.data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">🍳</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Unable to Load Kitchen Queue</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const orders = data.data.data;
  const filteredOrders = orders.filter((order: any) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kitchen Queue</h1>
            <p className="text-gray-600">Manage incoming orders and kitchen workflow</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-md ${
                soundEnabled 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <VolumeUpIcon className="h-5 w-5" />
            </button>
            
            {/* Queue Stats */}
            <div className="bg-white rounded-lg shadow px-4 py-2">
              <div className="text-sm text-gray-600">Active Orders</div>
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter((o: any) => ['pending', 'confirmed', 'preparing'].includes(o.status)).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'pending', label: 'Pending' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'preparing', label: 'Preparing' },
              { key: 'ready', label: 'Ready' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.key === 'all' 
                    ? orders.length 
                    : orders.filter((o: any) => o.status === tab.key).length
                  }
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Orders in Queue</h2>
          <p className="text-gray-600">All caught up! New orders will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order: any) => {
            const timeElapsed = getTimeElapsed(order.createdAt);
            const statusAction = getStatusAction(order.status);
            const StatusIcon = statusAction.icon;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-lg shadow-md border-l-4 ${getPriorityColor(order.priority || 'low')} hover:shadow-lg transition-shadow`}
              >
                <div className="p-4">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">{order.student.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {timeElapsed < 60 ? `${timeElapsed}m ago` : `${Math.floor(timeElapsed/60)}h ${timeElapsed%60}m ago`}
                    </div>
                    {timeElapsed > 30 && (
                      <div className="flex items-center text-red-600 text-sm">
                        <ExclamationIcon className="h-4 w-4 mr-1" />
                        Urgent
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-900">
                            {item.quantity}x {item.menuItem.name}
                          </span>
                          {item.specialInstructions && (
                            <ExclamationIcon className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <div className="mb-4 p-2 bg-yellow-50 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> {order.specialInstructions}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {order.status !== 'ready' && order.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
                        disabled={updateOrderMutation.isPending}
                      >
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {statusAction.label}
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Estimated Prep Time */}
                  {order.estimatedPrepTime && (
                    <div className="mt-2 text-center text-sm text-gray-600">
                      Est. prep time: {order.estimatedPrepTime} min
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order #{selectedOrder.orderNumber} Details
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Customer</label>
                    <p className="text-sm text-gray-900">{selectedOrder.student.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Time Elapsed</label>
                    <p className="text-sm text-gray-900">
                      {getTimeElapsed(selectedOrder.createdAt)} minutes
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Order Items</label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{item.quantity}x {item.menuItem.name}</span>
                            {item.specialInstructions && (
                              <div className="text-sm text-orange-600 mt-1">
                                <strong>Special:</strong> {item.specialInstructions}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {item.menuItem.preparationTime && `${item.menuItem.preparationTime}min`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.specialInstructions && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Order Instructions</label>
                    <p className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded-md">
                      {selectedOrder.specialInstructions}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  {selectedOrder.status !== 'ready' && selectedOrder.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder.id, getNextStatus(selectedOrder.status))}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      disabled={updateOrderMutation.isPending}
                    >
                      {getStatusAction(selectedOrder.status).label}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderQueue;