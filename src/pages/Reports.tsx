import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
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
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { user, isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    loadReportData();
  }, [selectedReport, dateRange, user]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let data = null;
      
      if (!user) return setReportData(null);
      const canViewAll = isAdmin || isSuperAdmin;

      if (selectedReport === 'sales') {
        const salesRef = canViewAll ? collection(db, 'sales') : query(collection(db, 'sales'), where('owner', '==', user.uid));
        const salesSnapshot = await getDocs(salesRef);
        const salesData = salesSnapshot.docs.map(doc => doc.data());
        data = {
          totalSales: salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
          totalQuantity: salesData.reduce((sum, s) => sum + (s.quantity || 0), 0),
          salesByShop: {},
          salesByProduct: {},
          sales: salesData,
        };
      } else if (selectedReport === 'collections') {
        const collectionsRef = canViewAll ? collection(db, 'collections') : query(collection(db, 'collections'), where('owner', '==', user.uid));
        const collectionsSnapshot = await getDocs(collectionsRef);
        const collectionsData = collectionsSnapshot.docs.map(doc => doc.data());
        data = {
          totalCollected: collectionsData.reduce((sum, c) => sum + (c.amount || 0), 0),
          collectionsByShop: {},
          collections: collectionsData,
        };
      } else if (selectedReport === 'inventory') {
        const purchasesRef = canViewAll ? collection(db, 'purchases') : query(collection(db, 'purchases'), where('owner', '==', user.uid));
        const purchasesSnapshot = await getDocs(purchasesRef);
        const purchasesData = purchasesSnapshot.docs.map(doc => doc.data());
        data = {
          totalInventory: purchasesData.reduce((sum, p) => sum + (p.usableQuantity || 0), 0),
          totalValue: purchasesData.reduce((sum, p) => sum + ((p.usableQuantity || 0) * (p.effectiveCostPerUnit || 0)), 0),
          inventoryByItem: {},
          purchases: purchasesData,
        };
      } else if (selectedReport === 'profit') {
        const salesRef = canViewAll ? collection(db, 'sales') : query(collection(db, 'sales'), where('owner', '==', user.uid));
        const collectionsRef = canViewAll ? collection(db, 'collections') : query(collection(db, 'collections'), where('owner', '==', user.uid));
        const purchasesRef = canViewAll ? collection(db, 'purchases') : query(collection(db, 'purchases'), where('owner', '==', user.uid));
        
        const salesSnapshot = await getDocs(salesRef);
        const collectionsSnapshot = await getDocs(collectionsRef);
        const purchasesSnapshot = await getDocs(purchasesRef);
        
        const salesData = salesSnapshot.docs.map(doc => doc.data());
        const collectionsData = collectionsSnapshot.docs.map(doc => doc.data());
        const purchasesData = purchasesSnapshot.docs.map(doc => doc.data());
        
        const totalRevenue = salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const totalCollected = collectionsData.reduce((sum, c) => sum + (c.amount || 0), 0);
        const totalCost = purchasesData.reduce((sum, p) => sum + ((p.totalCost || 0)), 0);
        
        data = {
          totalRevenue,
          totalCollected,
          totalCost,
          grossProfit: totalRevenue - totalCost,
          netProfit: totalCollected - totalCost,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2) : 0,
        };
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Report Data */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading report data...</div>
          ) : (
            <>
              {selectedReport === 'sales' && <SalesReport data={reportData} />}
              {selectedReport === 'collections' && <CollectionsReport data={reportData} />}
              {selectedReport === 'inventory' && <InventoryReport data={reportData} />}
              {selectedReport === 'profit' && <ProfitReport data={reportData} />}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SalesReport({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-purple-700">MVR {data?.totalSales?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-teal-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
          <p className="text-2xl font-bold text-teal-700">{data?.totalQuantity || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-700">{data?.sales?.length || 0}</p>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-800 mb-3">Recent Sales</h4>
        {data?.sales?.length > 0 ? (
          <div className="space-y-2">
            {data.sales.slice(0, 5).map((sale: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{sale.productName}</p>
                  <p className="text-sm text-gray-600">{sale.shopName} - {sale.saleDate}</p>
                </div>
                <p className="font-semibold text-purple-700">MVR {sale.totalAmount?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No sales data available</p>
        )}
      </div>
    </div>
  );
}

function CollectionsReport({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-teal-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-1">Total Collected</p>
        <p className="text-2xl font-bold text-teal-700">MVR {data?.totalCollected?.toLocaleString() || 0}</p>
      </div>
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-800 mb-3">Recent Collections</h4>
        {data?.collections?.length > 0 ? (
          <div className="space-y-2">
            {data.collections.slice(0, 5).map((collection: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{collection.shopName}</p>
                  <p className="text-sm text-gray-600">{collection.date}</p>
                </div>
                <p className="font-semibold text-teal-700">MVR {collection.amount?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No collection data available</p>
        )}
      </div>
    </div>
  );
}

function InventoryReport({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Inventory</p>
          <p className="text-2xl font-bold text-purple-700">{data?.totalInventory || 0} units</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-blue-700">MVR {data?.totalValue?.toFixed(2) || 0}</p>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-800 mb-3">Inventory Items</h4>
        {data?.purchases?.length > 0 ? (
          <div className="space-y-2">
            {data.purchases.slice(0, 5).map((purchase: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{purchase.itemName}</p>
                  <p className="text-sm text-gray-600">{purchase.supplier}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-700">{purchase.usableQuantity} {purchase.usableUnit}</p>
                  <p className="text-sm text-gray-600">MVR {purchase.effectiveCostPerUnit?.toFixed(2)}/unit</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No inventory data available</p>
        )}
      </div>
    </div>
  );
}

function ProfitReport({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-purple-700">MVR {data?.totalRevenue?.toFixed(2) || 0}</p>
        </div>
        <div className="bg-teal-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-teal-700">MVR {data?.totalCollected?.toFixed(2) || 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-red-700">MVR {data?.totalCost?.toFixed(2) || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Gross Profit</p>
          <p className="text-2xl font-bold text-green-700">MVR {data?.grossProfit?.toFixed(2) || 0}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Net Profit</p>
          <p className="text-2xl font-bold text-blue-700">MVR {data?.netProfit?.toFixed(2) || 0}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
          <p className="text-2xl font-bold text-orange-700">{data?.profitMargin || 0}%</p>
        </div>
      </div>
    </div>
  );
}
