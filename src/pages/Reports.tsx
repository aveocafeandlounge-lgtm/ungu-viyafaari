import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  FileDown
} from 'lucide-react';

export default function Reports() {
  const { t } = useLanguage();
  const [selectedReport, setSelectedReport] = useState<string>('sales');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const reports = [
    { id: 'sales', name: t.salesSummary, icon: DollarSign, description: 'View total sales and revenue' },
    { id: 'collections', name: t.collectionReport, icon: FileText, description: 'Track payment collections' },
    { id: 'inventory', name: t.inventoryReport, icon: BarChart3, description: 'Monitor stock levels' },
    { id: 'profit', name: t.profitAnalysis, icon: TrendingUp, description: 'Analyze profit margins' },
  ];

  const handleExportPDF = () => {
    // Simulate PDF export
    alert('PDF export would be generated here');
  };

  const handleExportCSV = () => {
    // Simulate CSV export
    alert('CSV export would be generated here');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.reports}</h1>
        <p className="text-gray-600">Generate and export business reports</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report) => (
          <motion.button
            key={report.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedReport(report.id)}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedReport === report.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-purple-300'
            }`}
          >
            <report.icon className={`w-8 h-8 mb-3 ${
              selectedReport === report.id ? 'text-purple-700' : 'text-gray-400'
            }`} />
            <h3 className="font-semibold text-gray-800 mb-1">{report.name}</h3>
            <p className="text-sm text-gray-600">{report.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Date Range
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <motion.div
        key={selectedReport}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {reports.find(r => r.id === selectedReport)?.name}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              {t.exportPDF}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t.exportCSV}
            </button>
          </div>
        </div>

        {/* Mock Report Data */}
        <div className="space-y-4">
          {selectedReport === 'sales' && <SalesReport />}
          {selectedReport === 'collections' && <CollectionsReport />}
          {selectedReport === 'inventory' && <InventoryReport />}
          {selectedReport === 'profit' && <ProfitReport />}
        </div>
      </motion.div>
    </div>
  );
}

function SalesReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-800">MVR 0</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Average Order</p>
          <p className="text-2xl font-bold text-gray-800">MVR 0</p>
        </div>
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                No sales data available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
          No sales data available
        </div>
      </div>
    </div>
  );
}

function CollectionsReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-gray-800">MVR 0</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">MVR 0</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
          <p className="text-2xl font-bold text-green-600">0%</p>
        </div>
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                No collection data available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
          No collection data available
        </div>
      </div>
    </div>
  );
}

function InventoryReport() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'purchases'));
      const purchasesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = purchases.length;
  const totalStockValue = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const lowStockItems = purchases.filter(p => p.usableQuantity < 10).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
          <p className="text-2xl font-bold text-orange-600">{lowStockItems}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Stock Value</p>
          <p className="text-2xl font-bold text-gray-800">MVR {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usable Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-800">{purchase.itemName}</div>
                    <div className="text-sm text-gray-500">{purchase.itemNameDv}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <span className={purchase.usableQuantity < 10 ? 'text-orange-600 font-medium' : ''}>
                    {purchase.usableQuantity.toFixed(2)} {purchase.usableUnit}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  MVR {purchase.effectiveCostPerUnit.toFixed(2)}/{purchase.usableUnit}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  MVR {purchase.totalCost.toFixed(2)}
                </td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No inventory data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {purchases.map((purchase) => (
          <div key={purchase.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">{purchase.itemName}</span>
              <span className={purchase.usableQuantity < 10 ? 'px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs' : 'px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs'}>
                {purchase.usableQuantity < 10 ? 'Low Stock' : 'In Stock'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usable Stock:</span>
                <span className="font-medium text-gray-800">{purchase.usableQuantity.toFixed(2)} {purchase.usableUnit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Effective Cost:</span>
                <span className="font-medium text-gray-800">MVR {purchase.effectiveCostPerUnit.toFixed(2)}/{purchase.usableUnit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-bold text-gray-900">MVR {purchase.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
        {purchases.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
            No inventory data available
          </div>
        )}
      </div>
    </div>
  );
}

function ProfitReport() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800">MVR 0</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-gray-800">MVR 0</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Net Profit</p>
          <p className="text-2xl font-bold text-green-600">MVR 0</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">Profit Margin</p>
        <p className="text-3xl font-bold text-green-600">0%</p>
      </div>
    </div>
  );
}
