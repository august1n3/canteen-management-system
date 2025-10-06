import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon, FireIcon, CheckCircleIcon } from '@heroicons/react/outline';
import { queueApi } from '../../services/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../constants/config';

const QueueDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [socket, setSocket] = useState<any>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Setup socket connection for public display (no auth required)
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Queue display connected to socket');
    });

    newSocket.on('queue-updated', () => {
      // Refetch queue data when updated
      refetch();
    });

    newSocket.on('new-order', () => {
      refetch();
    });

    newSocket.on('order-updated', () => {
      refetch();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch queue data
  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ['public-queue'],
    queryFn: () => queueApi.getQueueStatus({ limit: 20 }),
    refetchInterval: 10000 // Refetch every 10 seconds as backup
  });

  const queueItems = queueData?.data?.data?.queue || [];
  const stats = queueData?.data?.data?.statistics || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-500 text-white';
      case 'PREPARING':
        return 'bg-yellow-500 text-white';
      case 'READY':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <ClockIcon className="h-5 w-5" />;
      case 'PREPARING':
        return <FireIcon className="h-5 w-5" />;
      case 'READY':
        return <CheckCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-white"></div>
          <p className="text-white text-xl mt-4">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-blue-600 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Canteen Queue Display</h1>
              <p className="text-blue-100 text-xl">Live Order Status</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-blue-100">
                {currentTime.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">
                {stats.totalOrders || 0}
              </div>
              <div className="text-gray-300">Total Orders</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {stats.preparingOrders || 0}
              </div>
              <div className="text-gray-300">Preparing</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">
                {stats.readyOrders || 0}
              </div>
              <div className="text-gray-300">Ready</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">
                {stats.avgWaitTime || 0}m
              </div>
              <div className="text-gray-300">Avg Wait</div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {queueItems.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircleIcon className="mx-auto h-24 w-24 text-gray-400 mb-4" />
              <h2 className="text-4xl font-bold text-gray-400 mb-2">
                All Orders Completed!
              </h2>
              <p className="text-xl text-gray-500">
                No orders currently in the queue
              </p>
            </div>
          ) : (
            <>
              {/* Ready Orders Section */}
              {stats.readyOrders > 0 && (
                <div className="mb-12">
                  <div className="flex items-center mb-6">
                    <CheckCircleIcon className="h-8 w-8 text-green-400 mr-3" />
                    <h2 className="text-3xl font-bold text-green-400">
                      Ready for Pickup
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {queueItems
                      .filter((order: any) => order.status === 'READY')
                      .map((order: any) => (
                        <div
                          key={order.id}
                          className="bg-green-600 rounded-lg p-6 text-center animate-pulse"
                        >
                          <div className="text-6xl font-bold mb-2">
                            #{order.queuePosition}
                          </div>
                          <div className="text-xl font-semibold mb-1">
                            {order.customerName}
                          </div>
                          {order.studentId && (
                            <div className="text-green-200">
                              ID: {order.studentId}
                            </div>
                          )}
                          <div className="mt-3 text-sm bg-green-700 rounded px-3 py-1 inline-block">
                            {order.itemCount} items
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Preparing Orders Section */}
              {stats.preparingOrders > 0 && (
                <div className="mb-12">
                  <div className="flex items-center mb-6">
                    <FireIcon className="h-8 w-8 text-yellow-400 mr-3" />
                    <h2 className="text-3xl font-bold text-yellow-400">
                      Currently Preparing
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {queueItems
                      .filter((order: any) => order.status === 'PREPARING')
                      .map((order: any) => (
                        <div
                          key={order.id}
                          className="bg-yellow-600 rounded-lg p-4 text-center"
                        >
                          <div className="text-4xl font-bold mb-2">
                            #{order.queuePosition}
                          </div>
                          <div className="text-lg font-semibold">
                            {order.customerName}
                          </div>
                          <div className="text-yellow-200 text-sm">
                            {order.itemCount} items
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Waiting Orders Section */}
              {stats.confirmedOrders > 0 && (
                <div>
                  <div className="flex items-center mb-6">
                    <ClockIcon className="h-8 w-8 text-blue-400 mr-3" />
                    <h2 className="text-3xl font-bold text-blue-400">
                      In Queue
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {queueItems
                      .filter((order: any) => order.status === 'CONFIRMED')
                      .slice(0, 10) // Show max 10 waiting orders
                      .map((order: any) => (
                        <div
                          key={order.id}
                          className="bg-blue-600 rounded-lg p-3 text-center"
                        >
                          <div className="text-3xl font-bold mb-1">
                            #{order.queuePosition}
                          </div>
                          <div className="text-sm font-semibold">
                            {order.customerName}
                          </div>
                          <div className="text-blue-200 text-xs">
                            Est. {Math.max(order.waitTime, 0)}m
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Live Updates</span>
            </div>
            <div className="text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-300">Waiting</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-300">Preparing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded animate-pulse"></div>
              <span className="text-gray-300">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDisplay;

// TODO: Add sound notifications for ready orders
// TODO: Implement screen saver mode for idle periods
// TODO: Add customizable themes and branding
// TODO: Implement multi-language support
// TODO: Add weather display and announcements