import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { MinusIcon, PlusIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/outline';
import { useCart } from '../../contexts/CartContext';
import { orderApi } from '../../services/api';

const Cart: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems } = useCart();
  const [specialInstructions, setSpecialInstructions] = useState('');
  const router = useRouter();

  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => orderApi.createOrder(orderData),
    onSuccess: (data) => {
      clearCart();
      const orderId = data.data.data.order.id;
      router.push(`/track/${orderId}`);
    }
  });

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;

    const orderData = {
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      specialInstructions
    };

    createOrderMutation.mutate(orderData);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <ShoppingCartIcon className="mx-auto h-24 w-24 text-gray-300" />
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-500">Start adding some delicious items from the menu!</p>
          <button
            onClick={() => router.push('/student')}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-gray-600">{getTotalItems()} items</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.menuItemId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">Tzs. {item.price.toFixed(2)} each</p>
                  {item.specialInstructions && (
                    <p className="text-sm text-blue-600 mt-1">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="font-medium px-3 py-1 bg-gray-100 rounded">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Special Instructions */}
          <div className="mt-6">
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              id="instructions"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any special requests for your order..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            />
          </div>

          {/* Order Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>Tzs.{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => router.push('/menu')}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={createOrderMutation.isPending}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createOrderMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Placing Order...
                </div>
              ) : (
                'Place Order'
              )}
            </button>
          </div>

          {createOrderMutation.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">
                Failed to place order. Please try again.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;