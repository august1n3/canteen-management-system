"use client"

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  PlusIcon, 
  MinusIcon, 
  ShoppingCartIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/outline';
import { menuApi, orderApi } from '../../services/api';
import { MenuItem, CartItem } from '../../types';

const Kiosk: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'menu' | 'cart' | 'checkout' | 'success'>('welcome');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', studentId: '' });
  const [orderResult, setOrderResult] = useState<any>(null);
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-reset after 5 minutes of inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      const timer = setTimeout(() => {
        handleReset();
      }, 300000); // 5 minutes
      setIdleTimer(timer);
    };

    resetTimer();
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [currentStep]);

  // Reset on user interaction
  const handleUserInteraction = () => {
    if (idleTimer) clearTimeout(idleTimer);
    const timer = setTimeout(() => {
      handleReset();
    }, 300000);
    setIdleTimer(timer);
  };

  const handleReset = () => {
    setCurrentStep('welcome');
    setSelectedCategory('');
    setCartItems([]);
    setCustomerInfo({ name: '', studentId: '' });
    setOrderResult(null);
  };

  // Fetch menu items
  const { data: menuResponse, isLoading } = useQuery({
    queryKey: ['kiosk-menu', selectedCategory],
    queryFn: () => menuApi.getMenuItems({ 
      category: selectedCategory || undefined,
      available: true 
    }),
    enabled: currentStep === 'menu'
  });

  const menuItems = menuResponse?.data?.data?.menuItems || [];
  const categories = Array.from(new Set(menuItems.map((item: MenuItem) => item.category))) as string[];

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => orderApi.createOrder(orderData),
    onSuccess: (data) => {
      setOrderResult(data.data.data.order);
      setCurrentStep('success');
    }
  });

  const addToCart = (item: MenuItem) => {
    handleUserInteraction();
    const existingItem = cartItems.find(cartItem => cartItem.menuItemId === item.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(cartItem =>
        cartItem.menuItemId === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    handleUserInteraction();
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.menuItemId !== menuItemId));
    } else {
      setCartItems(cartItems.map(item =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrder = () => {
    if (!customerInfo.name || !customerInfo.studentId) return;
    
    const orderData = {
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity
      })),
      customerName: customerInfo.name,
      studentId: customerInfo.studentId
    };

    createOrderMutation.mutate(orderData);
  };

  // Welcome Screen
  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center">
        <div className="text-center max-w-2xl px-8">
          <h1 className="text-8xl font-bold mb-8">Welcome</h1>
          <h2 className="text-4xl mb-8">Canteen Kiosk</h2>
          <p className="text-2xl mb-12">Touch anywhere to start your order</p>
          <button
            onClick={() => {
              handleUserInteraction();
              setCurrentStep('menu');
            }}
            className="bg-white text-blue-600 text-3xl font-bold px-16 py-8 rounded-full shadow-2xl hover:scale-105 transform transition-all"
          >
            Start Ordering
          </button>
        </div>
      </div>
    );
  }

  // Success Screen
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 text-white flex items-center justify-center">
        <div className="text-center max-w-2xl px-8">
          <CheckCircleIcon className="mx-auto h-32 w-32 mb-8" />
          <h1 className="text-6xl font-bold mb-8">Order Placed!</h1>
          <div className="bg-white/20 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl mb-4">Order #{orderResult?.id?.slice(-8)}</h2>
            <p className="text-xl mb-2">{customerInfo.name}</p>
            <p className="text-lg mb-4">Student ID: {customerInfo.studentId}</p>
            <p className="text-2xl font-bold">Total: ${getTotalPrice().toFixed(2)}</p>
          </div>
          <p className="text-xl mb-8">Please wait for your order number to be called</p>
          <button
            onClick={handleReset}
            className="bg-white text-green-600 text-2xl font-bold px-12 py-6 rounded-full shadow-2xl hover:scale-105 transform transition-all"
          >
            Start New Order
          </button>
        </div>
      </div>
    );
  }

  // Main Kiosk Interface
  return (
    <div className="min-h-screen bg-gray-100" onClick={handleUserInteraction}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Canteen Kiosk</h1>
          <div className="flex items-center space-x-6">
            {cartItems.length > 0 && (
              <div className="text-right">
                <div className="text-xl">Cart: {getTotalItems()} items</div>
                <div className="text-2xl font-bold">Tzs. {getTotalPrice().toFixed(2)}</div>
              </div>
            )}
            <button
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg text-xl font-semibold"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

      {/* Menu Step */}
      {currentStep === 'menu' && (
        <div className="p-8">
          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6">Choose Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setSelectedCategory('')}
                className={`p-6 rounded-xl text-xl font-semibold transition-all ${
                  selectedCategory === '' 
                    ? 'bg-blue-600 text-white scale-105' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Items
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-6 rounded-xl text-xl font-semibold transition-all ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white scale-105' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {menuItems.map((item: MenuItem) => {
              const cartQuantity = cartItems.find(cartItem => cartItem.menuItemId === item.id)?.quantity || 0;
              const isOutOfStock = item.availability && item.availability.stockLevel <= 0;

              return (
                <div key={item.id} className={`bg-white rounded-xl shadow-lg overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}>
                  <div className="h-48 bg-gray-200 flex items-center justify-center text-6xl">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      '🍽️'
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                      <span className="text-2xl font-bold text-green-600">Tzs. {item.price.toFixed(2)}</span>
                    </div>
                    
                    {item.description && (
                      <p className="text-gray-600 mb-4 text-lg">{item.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      {cartQuantity === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          disabled={isOutOfStock}
                          className={`flex-1 py-4 px-6 rounded-lg text-xl font-semibold ${
                            isOutOfStock
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex items-center space-x-4 flex-1">
                          <button
                            onClick={() => updateQuantity(item.id, cartQuantity - 1)}
                            className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600"
                          >
                            <MinusIcon className="h-6 w-6" />
                          </button>
                          <span className="text-2xl font-bold px-6 py-3 bg-gray-100 rounded-lg min-w-[80px] text-center">
                            {cartQuantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, cartQuantity + 1)}
                            className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600"
                          >
                            <PlusIcon className="h-6 w-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continue Button */}
          {cartItems.length > 0 && (
            <div className="fixed bottom-8 right-8">
              <button
                onClick={() => setCurrentStep('checkout')}
                className="bg-green-600 text-white text-2xl font-bold px-12 py-6 rounded-full shadow-2xl hover:scale-105 transform transition-all flex items-center"
              >
                Continue to Checkout
                <ArrowRightIcon className="h-6 w-6 ml-2" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Checkout Step */}
      {currentStep === 'checkout' && (
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">Checkout</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Info */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Your Information</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xl font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-4 py-4 text-xl border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xl font-semibold text-gray-700 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={customerInfo.studentId}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, studentId: e.target.value })}
                      className="w-full px-4 py-4 text-xl border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your student ID"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="text-xl font-semibold">{item.name}</div>
                        <div className="text-gray-600">
                          Tzs. {item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-xl font-bold">
                        Tzs. {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total:</span>
                    <span>Tzs. {getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep('menu')}
                className="bg-gray-500 text-white text-xl font-semibold px-8 py-4 rounded-lg hover:bg-gray-600 flex items-center"
              >
                <ArrowLeftIcon className="h-6 w-6 mr-2" />
                Back to Menu
              </button>
              
              <button
                onClick={handlePlaceOrder}
                disabled={!customerInfo.name || !customerInfo.studentId || createOrderMutation.isPending}
                className="bg-green-600 text-white text-xl font-semibold px-12 py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <CheckCircleIcon className="h-6 w-6 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kiosk;

// TODO: Add payment integration for card/mobile payments
// TODO: Implement receipt printing functionality
// TODO: Add accessibility features (voice commands, high contrast)
// TODO: Implement order customization options
// TODO: Add promotional content and recommendations