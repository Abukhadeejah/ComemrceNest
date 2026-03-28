'use client';

import React, { useState, useEffect } from 'react';
import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { formatPrice } from '@/lib/cart';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '800', '900'] });

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'paid' | 'failed' | 'fulfilled' | 'cancelled';
  total_cents: number;
  payment_provider: string;
  created_at: string;
  email: string;
  wallet_used?: number;
  cash_paid?: number;
  cashback_amount?: number;
  cashback_pct?: number;
  item_count?: number;
  items?: Array<{
    id: string;
    quantity: number;
    total_price: number;
    product?: {
      name?: string;
      variant?: {
        color?: string;
      };
    };
  }>;
}

interface CustomerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
}

interface Address {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  gstin?: string;
  is_default: boolean;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      
      // Load profile
      const profileRes = await fetch('/api/customers/profile', { credentials: 'include' });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.customer);
      }

      // Load orders
      const ordersRes = await fetch('/api/customers/orders', { credentials: 'include' });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      // Load addresses
      const addressesRes = await fetch('/api/customers/addresses', { credentials: 'include' });
      if (addressesRes.ok) {
        const addressesData = await addressesRes.json();
        setAddresses(addressesData.addresses || []);
      }
    } catch (error) {
      console.error('Failed to load account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'fulfilled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCashbackStatus = (order: Order) => {
    if (order.status !== 'paid') {
      return { text: 'Payment Pending', color: 'text-yellow-600' };
    }

    if ((order.cashback_amount || 0) > 0) {
      return { text: 'Credited', color: 'text-green-600' };
    }

    if ((order.cash_paid || 0) > 0) {
      return { text: 'Pending (5 days)', color: 'text-blue-600' };
    }

    return { text: 'Not Eligible', color: 'text-gray-500' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-3`}>My Account</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
        </div>

        {/* Profile Header */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.first_name?.charAt(0) || profile.email.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer'}</h2>
                <p className="text-gray-600">{profile.email}</p>
                <p className="text-sm text-gray-500">Member since {formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'orders', label: 'Order History', count: orders.length },
                { key: 'profile', label: 'Profile', count: null },
                { key: 'addresses', label: 'Addresses', count: addresses.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Orders</h3>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                    <Link
                      href="/products"
                      className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">Order #{order.order_number}</h4>
                            <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right space-y-2">
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                            <p className={`text-xs font-medium ${getCashbackStatus(order).color}`}>
                              Cashback: {getCashbackStatus(order).text}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="text-lg font-semibold text-gray-900">{formatPrice(order.total_cents)}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Payment Method</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">{order.payment_provider || 'N/A'}</p>
                            {(order.wallet_used || 0) > 0 && (
                              <p className="text-xs text-blue-600 mt-1">Wallet: ₹{(order.wallet_used || 0).toFixed(2)}</p>
                            )}
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Cashback</p>
                            {(order.cashback_amount || 0) > 0 ? (
                              <p className="text-sm font-semibold text-green-600">
                                +₹{(order.cashback_amount || 0).toFixed(2)}
                                {(order.cashback_pct || 0) > 0 ? ` (${order.cashback_pct}%)` : ''}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">-</p>
                            )}
                          </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <div className="border-t pt-4 mb-4">
                            <p className="text-sm text-gray-500 mb-2">
                              Items ({order.item_count || order.items.length})
                            </p>
                            <div className="space-y-1">
                              {order.items.slice(0, 2).map((item) => (
                                <div key={item.id} className="flex justify-between text-sm text-gray-700">
                                  <span>
                                    {item.product?.name || 'Product'} × {item.quantity}
                                  </span>
                                  <span>₹{(item.total_price || 0).toFixed(2)}</span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <p className="text-xs text-gray-500">+{order.items.length - 2} more items</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4">
                            <Link
                              href={`/orders/${order.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Details
                            </Link>

                            {(order.status === 'paid' || order.status === 'fulfilled') && (
                              <a
                                href={`/api/orders/${order.id}/invoice`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                              >
                                Download Invoice
                              </a>
                            )}
                          </div>

                          {order.status === 'pending' && (
                            <Link
                              href={`/checkout/success?orderId=${order.order_number}`}
                              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                            >
                              Complete Payment
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                {profile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {profile.first_name || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {profile.last_name || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {profile.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {profile.phone || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {formatDate(profile.created_at)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Profile information not available</p>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Add New Address
                  </button>
                </div>
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
                    <p className="text-gray-600 mb-4">Add an address to make checkout faster</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 rounded-lg p-4 relative">
                        {address.is_default && (
                          <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">{`${address.first_name} ${address.last_name || ''}`.trim()}</h4>
                          <p className="text-gray-700">{address.address_line_1}</p>
                          {address.address_line_2 && (
                            <p className="text-gray-700">{address.address_line_2}</p>
                          )}
                          <p className="text-gray-700">{address.city}, {address.state} {address.postal_code}</p>
                          <p className="text-gray-600 text-sm">Phone: {address.phone}</p>
                          {address.gstin && (
                            <p className="text-gray-600 text-sm">GSTIN: {address.gstin}</p>
                          )}
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
                          
