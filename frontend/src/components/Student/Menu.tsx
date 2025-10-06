'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/outline';
import { menuApi } from '../../services/api';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { MenuItem } from '../../types';

const Menu: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart, cartItems, updateQuantity } = useCart();

  // Fetch menu items
  const { data: menuResponse, isLoading, error } = useQuery({
    queryKey: ['menu', selectedCategory, true], // true for available only
    queryFn: () => menuApi.getMenuItems({ 
      category: selectedCategory || undefined,
      available: true 
    })
  });

  const menuItems = menuResponse?.data?.data?.menuItems || [];

  // Filter items by search term
  const filteredItems = menuItems.filter((item: MenuItem) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique categories
  const categories = Array.from(new Set<string>(menuItems.map((item: MenuItem) => item.category)));

  const getCartQuantity = (itemId: string) => {
    const cartItem = cartItems.find(item => item.menuItemId === itemId);
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    });
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      updateQuantity(itemId, 0);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load menu items</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
        <p className="text-gray-600 mt-2">Browse our delicious offerings</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: MenuItem) => {
          const cartQuantity = getCartQuantity(item.id);
          const isOutOfStock = item.availability && item.availability.stockLevel <= 0;
          
          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                isOutOfStock ? 'opacity-50' : ''
              }`}
            >
              {/* Image */}
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-4xl">🍽️</div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className="text-lg font-bold text-green-600">
                    Tzs. {item.price.toFixed(2)}
                  </span>
                </div>

                {item.description && (
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                )}

                {/* Category and Prep Time */}
                <div className="flex justify-between text-xs text-gray-500 mb-3">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {item.category.charAt(0) + item.category.slice(1).toLowerCase().replace('_', ' ')}
                  </span>
                  {item.preparationTime && (
                    <span>{item.preparationTime} min</span>
                  )}
                </div>

                {/* Stock Status */}
                {item.availability && (
                  <div className="mb-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.availability.stockLevel > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.availability.stockLevel > 0 
                        ? `${item.availability.stockLevel} available`
                        : 'Out of stock'
                      }
                    </span>
                  </div>
                )}

                {/* Allergens */}
                {item.allergens && item.allergens.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-orange-600">
                      Allergens: {item.allergens.join(', ')}
                    </p>
                  </div>
                )}

                {/* Add to Cart Controls */}
                <div className="flex items-center justify-between">
                  {cartQuantity === 0 ? (
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={isOutOfStock}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                        isOutOfStock
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <ShoppingCartIcon className="h-4 w-4 mr-2" />
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, cartQuantity - 1)}
                        className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="font-medium px-3 py-1 bg-gray-100 rounded">
                        {cartQuantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, cartQuantity + 1)}
                        disabled={item.availability && cartQuantity >= item.availability.stockLevel}
                        className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            No menu items found
          </div>
          <p className="text-gray-400">
            {searchTerm || selectedCategory
              ? 'Try adjusting your filters'
              : 'Menu items will appear here when available'
            }
          </p>
        </div>
      )}

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
              <div className="font-semibold">
                Total: Tzs. {cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
              </div>
            </div>
            <Link
              href="/student/cart"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;

// TODO: Add item customization options (size, extras, etc.)
// TODO: Implement wishlist/favorites functionality
// TODO: Add nutritional information display
// TODO: Implement item recommendations based on order history
// TODO: Add advanced filtering options (dietary restrictions, price range)