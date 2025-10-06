import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { EyeIcon, ClockIcon } from '@heroicons/react/outline';
import { orderApi } from '../../services/api';

const OrderHistory: React.FC = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['order-history', filter, page, limit],
    queryFn: () => orderApi.getOrders(page, limit, filter === 'all' ? undefined : filter),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !data?.data?.data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Unable to Load Orders</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { orders, pagination } = data.data.data;

  if (orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Orders Found</h2>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? "You haven't placed any orders yet."
              : `No ${filter} orders found.`
            }
          </p>
          <button
            onClick={() => router.push('/student')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
        <p className="text-gray-600">View and track all your previous orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Orders' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders?.map((order: any) => (
          <div key={order.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      Tzs. {order?.totalAmount?.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order?.items.length} item{order?.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item: any, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded"
                    >
                      {item.quantity}x {item.menuItem.name}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-600 text-sm rounded">
                      +{order.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Special Instructions */}
              {order.specialInstructions && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Special Instructions:</strong> {order.specialInstructions}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {order.status === 'completed' 
                    ? `Completed on ${new Date(order.updatedAt).toLocaleDateString()}`
                    : `Last updated ${new Date(order.updatedAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}`
                  }
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/track/${order.id}`)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  
                  {order.status === 'completed' && (
                    <button
                      onClick={() => {
                        // TODO: Implement reorder functionality
                        router.push('/student');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNumber = i + Math.max(1, page - 2);
                if (pageNumber > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`px-4 py-2 rounded-md ${
                      page === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;