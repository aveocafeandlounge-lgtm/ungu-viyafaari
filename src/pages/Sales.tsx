import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign,
  Loader2
} from 'lucide-react';

interface Sale {
  id: string;
  saleNumber: string;
  batchId: string;
  batchNumber: string;
  recipeId: string;
  recipeName: string;
  shopId: string;
  shopName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  notes: string;
  status: 'pending' | 'paid' | 'partial';
  paidAmount: number;
}

export default function Sales() {
  const { isRTL } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Load sales, batches, and shops from Firebase
  useEffect(() => {
    loadSales();
    loadBatches();
    loadShops();
  }, []);

  const loadSales = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'sales'));
      const salesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[];
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'batches'));
      const batchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBatches(batchesData);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const loadShops = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'shops'));
      const shopsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.recipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (saleData: Omit<Sale, 'id' | 'totalAmount'>) => {
    setLoading(true);
    try {
      const totalAmount = saleData.quantity * saleData.unitPrice;
      
      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), { ...saleData, totalAmount });
        setSales(sales.map(s => 
          s.id === editingSale.id ? { ...saleData, id: editingSale.id, totalAmount } : s
        ));
      } else {
        const docRef = await addDoc(collection(db, 'sales'), { ...saleData, totalAmount });
        setSales([...sales, { ...saleData, id: docRef.id, totalAmount }]);
      }
      
      setShowModal(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Error saving sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'sales', id));
        setSales(sales.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting sale:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sales</h1>
          <p className="text-gray-600">Track sales to shops</p>
        </div>
        <button
          onClick={() => { setEditingSale(null); setShowModal(true); }}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          Add Sale
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 ${isRTL ? 'left-auto right-3' : ''}`} />
        <input
          type="text"
          placeholder="Search sales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : ''}`}
        />
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sale #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{sale.saleNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{sale.recipeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{sale.shopName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{sale.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">MVR {sale.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">MVR {sale.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingSale(sale); setShowModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-purple-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredSales.map((sale) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900">{sale.saleNumber}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                    {sale.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Recipe</span>
                    <span className="font-medium text-gray-900">{sale.recipeName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Shop</span>
                    <span className="text-gray-900">{sale.shopName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <span className="text-gray-900">{sale.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold text-purple-700">MVR {sale.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setEditingSale(sale); setShowModal(true); }}
                    className="flex-1 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="flex-1 p-2 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4 text-purple-600" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
            {filteredSales.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                No sales found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showModal && (
        <SaleModal
          sale={editingSale}
          batches={batches}
          shops={shops}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingSale(null); }}
        />
      )}
    </div>
  );
}

function SaleModal({ 
  sale, 
  batches,
  shops,
  onSave, 
  onClose 
}: { 
  sale: Sale | null;
  batches: any[];
  shops: any[];
  onSave: (data: Omit<Sale, 'id' | 'totalAmount'>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    saleNumber: sale?.saleNumber || `SALE-${Date.now()}`,
    batchId: sale?.batchId || '',
    batchNumber: sale?.batchNumber || '',
    recipeId: sale?.recipeId || '',
    recipeName: sale?.recipeName || '',
    shopId: sale?.shopId || '',
    shopName: sale?.shopName || '',
    quantity: sale?.quantity || '',
    unitPrice: sale?.unitPrice || '',
    saleDate: sale?.saleDate || new Date().toISOString().split('T')[0],
    notes: sale?.notes || '',
    status: sale?.status || 'pending',
    paidAmount: sale?.paidAmount || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      saleNumber: formData.saleNumber,
      batchId: formData.batchId,
      batchNumber: formData.batchNumber,
      recipeId: formData.recipeId,
      recipeName: formData.recipeName,
      shopId: formData.shopId,
      shopName: formData.shopName,
      quantity: Number(formData.quantity),
      unitPrice: Number(formData.unitPrice),
      saleDate: formData.saleDate,
      notes: formData.notes,
      status: formData.status,
      paidAmount: Number(formData.paidAmount),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {sale ? 'Edit Sale' : 'Add Sale'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sale Number</label>
            <input
              type="text"
              value={formData.saleNumber}
              onChange={(e) => setFormData({ ...formData, saleNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
            <select
              value={formData.batchId}
              onChange={(e) => {
                const selectedBatch = batches.find(b => b.id === e.target.value);
                setFormData({
                  ...formData,
                  batchId: e.target.value,
                  batchNumber: selectedBatch?.batchNumber || '',
                  recipeId: selectedBatch?.recipeId || '',
                  recipeName: selectedBatch?.recipeName || '',
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.batchNumber} - {batch.recipeName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop</label>
            <select
              value={formData.shopId}
              onChange={(e) => {
                const selectedShop = shops.find(s => s.id === e.target.value);
                setFormData({
                  ...formData,
                  shopId: e.target.value,
                  shopName: selectedShop?.name || '',
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select shop</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (MVR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sale Date</label>
            <input
              type="date"
              value={formData.saleDate}
              onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'partial' | 'paid' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {formData.status !== 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount (MVR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-purple-700">
                MVR {(Number(formData.quantity) * Number(formData.unitPrice)).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
