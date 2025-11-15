'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [config, setConfig] = useState(null);
  const [botStatus, setBotStatus] = useState('unknown');

  useEffect(() => {
    // Fetch config to show current mode
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your auto-store system</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Operation Mode</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {config?.mode === 'DiscordBotOnly' && '🤖 Bot Only'}
                  {config?.mode === 'WebOnly' && '🌐 Web Only'}
                  {config?.mode === 'IntegratedMode' && '🔗 Integrated'}
                  {!config && '...'}
                </p>
              </div>
              <div className="text-4xl">📍</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Database</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {config?.database?.type === 'mysql' && 'MySQL'}
                  {config?.database?.type === 'mongodb' && 'MongoDB'}
                  {!config && '...'}
                </p>
              </div>
              <div className="text-4xl">🗄️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Payment</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {config?.payment?.provider || '...'}
                </p>
              </div>
              <div className="text-4xl">💳</div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Web Dashboard</span>
              </div>
              <span className="text-green-600 font-medium">Online</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="font-medium">Discord Bot</span>
              </div>
              <span className="text-yellow-600 font-medium">Check via /status command</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${config?.features?.maintenance ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="font-medium">Maintenance Mode</span>
              </div>
              <span className={`font-medium ${config?.features?.maintenance ? 'text-red-600' : 'text-green-600'}`}>
                {config?.features?.maintenance ? 'ON (Users blocked)' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/settings"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 text-center transition shadow-md hover:shadow-lg"
          >
            <div className="text-4xl mb-2">⚙️</div>
            <div className="font-bold text-lg">Settings</div>
            <div className="text-sm text-blue-100 mt-1">Configure system</div>
          </Link>

          <Link
            href="/admin/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 text-center transition shadow-md hover:shadow-lg"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="font-bold text-lg">Dashboard</div>
            <div className="text-sm text-purple-100 mt-1">View analytics</div>
          </Link>

          <Link
            href="/admin/products"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 text-center transition shadow-md hover:shadow-lg"
          >
            <div className="text-4xl mb-2">📦</div>
            <div className="font-bold text-lg">Products</div>
            <div className="text-sm text-green-100 mt-1">Manage inventory</div>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-6 text-center transition shadow-md hover:shadow-lg"
          >
            <div className="text-4xl mb-2">🛒</div>
            <div className="font-bold text-lg">Orders</div>
            <div className="text-sm text-orange-100 mt-1">View transactions</div>
          </Link>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 mb-2">📌 Important Notes</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
            <li>For <strong>Windows (Desktop)</strong>: Use Discord bot commands (<code>/config</code>) to manage settings</li>
            <li>For <strong>Ubuntu (Server)</strong>: Use this web dashboard to manage settings</li>
            <li>Always restart the bot after changing critical settings (token, database, mode)</li>
            <li>Use <code>/config view</code> in Discord to see current configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
