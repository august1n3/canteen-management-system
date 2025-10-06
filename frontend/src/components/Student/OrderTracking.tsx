import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleIcon, ClockIcon, BeakerIcon , TruckIcon } from '@heroicons/react/outline';
import { orderApi } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: CheckCircleIcon },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircleIcon },
  { key: 'preparing', label: 'Preparing', icon: BeakerIcon },
  { key: 'ready', label: 'Ready for Pickup', icon: TruckIcon },
  { key: 'completed', label: 'Completed', icon: CheckCircleIcon }
];

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { socket, joinRoom } = useSocket();

  const { data: order, refetch, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  useEffect(() => {
    if (orderId && socket) {
      joinRoom(`order-${orderId}`);

      const handleOrderUpdate = (updatedOrder: any) => {
        refetch();
      };

      socket.on('orderUpdated', handleOrderUpdate);

      return () => {
        socket.off('orderUpdated', handleOrderUpdate);
      };
    }
  }, [orderId, socket, joinRoom, refetch]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !order?.data?.data?.order) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find an order with ID: {orderId}
          </p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            View Order History
          </button>
        </div>
      </div>
    );
  }

  const orderData = order.data.data.order;
  const currentStatusIndex = statusSteps.findIndex(step => step.key === orderData.status);
  
  const getEstimatedTime = () => {
    switch (orderData.status) {
      case 'pending':
      case 'confirmed':
        return '15-20 minutes';
      case 'preparing':
        return '10-15 minutes';
      case 'ready':
        return 'Ready now!';
      case 'completed':
        return 'Order completed';
      default:
        return 'Calculating...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{orderData.orderNumber}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(orderData.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ${orderData.totalPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {orderData.paymentStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Order Status</h2>
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const IconComponent = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2
                      ${isCompleted 
                        ? isCurrent 
                          ? 'bg-blue-600 text-white animate-pulse' 
                          : 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${
                        isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </div>
                      {isCurrent && (
                        <div className="text-xs text-blue-600 mt-1">
                          Current
                        </div>
                      )}
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`
                        absolute h-0.5 w-16 mt-6 ml-12
                        ${index < currentStatusIndex ? 'bg-green-600' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estimated Time */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-900">Estimated Time</div>
                <div className="text-blue-700">{getEstimatedTime()}</div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="space-y-3">
              {orderData.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                    {item.specialInstructions && (
                      <p className="text-sm text-gray-600 mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">Qty: {item.quantity}</span>
                    <span className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          {orderData.specialInstructions && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Special Instructions</h4>
              <p className="text-yellow-700">{orderData.specialInstructions}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex space-x-4">
            <button
              onClick={() => navigate('/orders')}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 transition-colors"
            >
              View All Orders
            </button>
            {orderData.status === 'ready' && (
              <button
                onClick={() => navigate('/menu')}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors"
              >
                Order Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;