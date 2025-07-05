export default function MainDashboard() {
  return (
    <div className="p-8">
      <h1 className="mb-6 font-bold text-3xl">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-2 font-semibold text-lg">Total Value</h3>
          <p className="font-bold text-3xl">$0.00</p>
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold text-lg">24h Change</h3>
          <p className="font-bold text-3xl text-crypto-green">+0.00%</p>
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold text-lg">Wallets</h3>
          <p className="font-bold text-3xl">0</p>
        </div>
      </div>
    </div>
  );
}
