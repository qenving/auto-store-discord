export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h1 className="text-6xl font-bold mb-4">Auto-Store</h1>
        <p className="text-2xl mb-8">Ecosystem Management System</p>

        <div className="space-x-4">
          <a
            href="/admin"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Admin Dashboard
          </a>

          <a
            href="/admin/settings"
            className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
          >
            ⚙️ Settings
          </a>
        </div>

        <div className="mt-12 text-sm opacity-75">
          <p>🤖 Discord Bot Integration</p>
          <p>💳 QRIS Payment Support</p>
          <p>📦 Auto-Delivery System</p>
        </div>
      </div>
    </div>
  )
}
