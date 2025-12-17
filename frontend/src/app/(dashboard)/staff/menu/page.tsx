"use client"
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  PencilIcon as EditIcon, 
  TrashIcon,
  SearchIcon,
  FilterIcon,
  EyeIcon,
  EyeOffIcon 
} from '@heroicons/react/outline';
import { menuApi } from '../../../../services/api';

interface MenuFilters {
  category?: string;
  availability?: string;
  search?: string;
}

const MenuManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MenuFilters>({});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['menu-items', filters],
    queryFn: () => menuApi.getMenuItems(filters),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      menuApi.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      setIsModalOpen(false);
      setSelectedItem(null);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    }
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => 
      menuApi.updateMenuItem(id, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    }
  });

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = (formData: FormData) => {
    if (selectedItem) {
      updateItemMutation.mutate({
        id: selectedItem.id,
        data: Object.fromEntries(formData)
      });
    }
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleToggleAvailability = (id: string, available: boolean) => {
    toggleAvailabilityMutation.mutate({ id, available: !available });
  };

  const applyFilters = (newFilters: Partial<MenuFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
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
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Unable to Load Menu Items</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const menuItems = data.data.data.menuItems;
  console.log(menuItems)
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
            <p className="text-gray-600">Manage menu items, pricing, and availability</p>
          </div>
          <button
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={filters.search || ''}
                onChange={(e) => applyFilters({ search: e.target.value })}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <FilterIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={filters.category || ''}
                onChange={(e) => applyFilters({ category: e.target.value || undefined })}
              >
                <option value="">All Categories</option>
                <option value="appetizers">Appetizers</option>
                <option value="mains">Main Courses</option>
                <option value="desserts">Desserts</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={filters.availability || ''}
                onChange={(e) => applyFilters({ availability: e.target.value || undefined })}
              >
                <option value="">All Items</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>

              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item: any) => (
          <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="aspect-w-16 aspect-h-9">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleAvailability(item.id, item.available)}
                    className={`p-1 rounded ${
                      item.available 
                        ? 'text-green-600 hover:text-green-800' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    disabled={toggleAvailabilityMutation.isPending}
                  >
                    {item.available ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeOffIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl font-bold text-green-600">Tzs. {item.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500 capitalize">{item.category}</span>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
                {item.preparationTime && (
                  <span className="text-sm text-gray-500">{item.preparationTime} min</span>
                )}
              </div>

              {/* Dietary Restrictions */}
              {item.dietaryRestrictions && item.dietaryRestrictions.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {item.dietaryRestrictions.map((restriction: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {restriction}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditItem(item)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 flex items-center justify-center"
                >
                  <EditIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700"
                  disabled={deleteItemMutation.isPending}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Menu Items Found</h2>
          <p className="text-gray-600 mb-6">Start by adding some delicious items to your menu.</p>
          <button
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Add First Menu Item
          </button>
        </div>
      )}

      {/* Menu Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handleSaveItem(formData);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={selectedItem?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={selectedItem?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      required
                      defaultValue={selectedItem?.price || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      required
                      defaultValue={selectedItem?.category || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      <option value="appetizers">Appetizers</option>
                      <option value="mains">Main Courses</option>
                      <option value="desserts">Desserts</option>
                      <option value="beverages">Beverages</option>
                      <option value="snacks">Snacks</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preparation Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="preparationTime"
                    defaultValue={selectedItem?.preparationTime || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="available"
                      defaultChecked={selectedItem?.available ?? true}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateItemMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateItemMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;