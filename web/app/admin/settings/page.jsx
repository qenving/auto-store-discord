'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch current config
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
      setLoading(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load configuration' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    }

    setSaving(false);
  };

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="border-b px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">⚙️ System Configuration</h1>
            <p className="text-gray-600 mt-1">Manage your auto-store settings</p>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`mx-6 mt-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* MODE SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                📍 Operation Mode
              </h2>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="DiscordBotOnly"
                    checked={config?.mode === 'DiscordBotOnly'}
                    onChange={(e) => updateConfig('mode', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">🤖 Discord Bot Only</div>
                    <div className="text-sm text-gray-600">Recommended - Only run Discord bot (easiest)</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="WebOnly"
                    checked={config?.mode === 'WebOnly'}
                    onChange={(e) => updateConfig('mode', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">🌐 Web Only</div>
                    <div className="text-sm text-gray-600">Only run website (without bot)</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="IntegratedMode"
                    checked={config?.mode === 'IntegratedMode'}
                    onChange={(e) => updateConfig('mode', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium">🔗 Integrated Mode</div>
                    <div className="text-sm text-gray-600">Bot + Website fully integrated (all features)</div>
                  </div>
                </label>
              </div>
            </section>

            {/* DATABASE SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                🗄️ Database Configuration
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Database Type</label>
                <select
                  value={config?.database?.type || 'mysql'}
                  onChange={(e) => updateConfig('database.type', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>

              {config?.database?.type === 'mysql' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700">MySQL Configuration</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                      <input
                        type="text"
                        value={config?.database?.mysql?.host || ''}
                        onChange={(e) => updateConfig('database.mysql.host', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="localhost"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                      <input
                        type="number"
                        value={config?.database?.mysql?.port || 3306}
                        onChange={(e) => updateConfig('database.mysql.port', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={config?.database?.mysql?.user || ''}
                        onChange={(e) => updateConfig('database.mysql.user', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="root"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={config?.database?.mysql?.password || ''}
                        onChange={(e) => updateConfig('database.mysql.password', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
                      <input
                        type="text"
                        value={config?.database?.mysql?.database || ''}
                        onChange={(e) => updateConfig('database.mysql.database', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="autostore"
                      />
                    </div>
                  </div>
                </div>
              )}

              {config?.database?.type === 'mongodb' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-4">MongoDB Configuration</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Connection URI</label>
                    <input
                      type="text"
                      value={config?.database?.mongodb?.uri || ''}
                      onChange={(e) => updateConfig('database.mongodb.uri', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                      placeholder="mongodb://localhost:27017/autostore"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* DISCORD BOT SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                🤖 Discord Bot Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bot Token</label>
                  <input
                    type="password"
                    value={config?.discord?.token || ''}
                    onChange={(e) => updateConfig('discord.token', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                    placeholder="Paste your Discord bot token here"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application ID</label>
                    <input
                      type="text"
                      value={config?.discord?.clientId || ''}
                      onChange={(e) => updateConfig('discord.clientId', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Client/Application ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Server/Guild ID</label>
                    <input
                      type="text"
                      value={config?.discord?.guildId || ''}
                      onChange={(e) => updateConfig('discord.guildId', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Your Discord server ID"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner User ID</label>
                    <input
                      type="text"
                      value={config?.discord?.ownerId || ''}
                      onChange={(e) => updateConfig('discord.ownerId', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Your Discord user ID"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium text-gray-700 mb-3">📢 Notification Channels (Optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Testimoni Channel</label>
                      <input
                        type="text"
                        value={config?.discord?.channels?.testimoni || ''}
                        onChange={(e) => updateConfig('discord.channels.testimoni', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Channel ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Order Log Channel</label>
                      <input
                        type="text"
                        value={config?.discord?.channels?.orderLog || ''}
                        onChange={(e) => updateConfig('discord.channels.orderLog', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Channel ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Payment Log Channel</label>
                      <input
                        type="text"
                        value={config?.discord?.channels?.paymentLog || ''}
                        onChange={(e) => updateConfig('discord.channels.paymentLog', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Channel ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Admin Log Channel</label>
                      <input
                        type="text"
                        value={config?.discord?.channels?.adminLog || ''}
                        onChange={(e) => updateConfig('discord.channels.adminLog', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="Channel ID"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PAYMENT SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                💳 Payment Gateway
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Provider</label>
                <select
                  value={config?.payment?.provider || 'midtrans'}
                  onChange={(e) => updateConfig('payment.provider', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="midtrans">Midtrans (Recommended)</option>
                  <option value="duitku">Duitku</option>
                  <option value="tripay">Tripay</option>
                </select>
              </div>

              {config?.payment?.provider === 'midtrans' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900">Midtrans Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Server Key</label>
                      <input
                        type="password"
                        value={config?.payment?.midtrans?.serverKey || ''}
                        onChange={(e) => updateConfig('payment.midtrans.serverKey', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="SB-Mid-server-..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Key</label>
                      <input
                        type="text"
                        value={config?.payment?.midtrans?.clientKey || ''}
                        onChange={(e) => updateConfig('payment.midtrans.clientKey', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="SB-Mid-client-..."
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config?.payment?.midtrans?.isProduction || false}
                          onChange={(e) => updateConfig('payment.midtrans.isProduction', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">Production Mode (uncheck for sandbox/testing)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* FEATURES SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                ✨ Features
              </h2>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-800">Auto Delivery</div>
                    <div className="text-sm text-gray-600">Automatically send products via DM after purchase</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.features?.autoDelivery || false}
                    onChange={(e) => updateConfig('features.autoDelivery', e.target.checked)}
                    className="w-5 h-5 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-800">Auto Expire Invoice</div>
                    <div className="text-sm text-gray-600">Automatically cancel unpaid invoices</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.features?.autoExpireInvoice || false}
                    onChange={(e) => updateConfig('features.autoExpireInvoice', e.target.checked)}
                    className="w-5 h-5 text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-800">Maintenance Mode</div>
                    <div className="text-sm text-gray-600">Users cannot use the bot when enabled</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.features?.maintenance || false}
                    onChange={(e) => updateConfig('features.maintenance', e.target.checked)}
                    className="w-5 h-5 text-red-600"
                  />
                </label>
              </div>
            </section>

            {/* LIMITS SECTION */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                📊 Transaction Limits
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Pending Orders</label>
                  <input
                    type="number"
                    value={config?.limits?.maxPendingOrders || 5}
                    onChange={(e) => updateConfig('limits.maxPendingOrders', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="1"
                    max="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Per user (anti-spam)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Deposit (IDR)</label>
                  <input
                    type="number"
                    value={config?.limits?.minDeposit || 10000}
                    onChange={(e) => updateConfig('limits.minDeposit', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum deposit amount</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Deposit (IDR)</label>
                  <input
                    type="number"
                    value={config?.limits?.maxDeposit || 10000000}
                    onChange={(e) => updateConfig('limits.maxDeposit', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="10000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum deposit amount</p>
                </div>
              </div>
            </section>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={fetchConfig}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Reset Changes
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> After saving changes, you need to restart the bot for changes to take effect.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
