import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Box, 
  AlertTriangle,
  Loader2,
  DollarSign
} from 'lucide-react';
import { CheckCircle } from 'lucide-react';

interface Batch {
  id: string;
  batchNumber: string;
  recipeId: string;
  recipeName: string;
  shopId: string;
  shopName: string;
  quantity: number;
  remaining: number;
  productionDate: string;
  expiryDate: string;
  cost: number;
  portionSellingPrice: number;
  totalRevenue: number;
  status: 'active' | 'expired' | 'low-stock';
  ingredientsUsed?: Array<{
    purchaseId: string;
    itemName: string;
    quantityUsed: number;
    unit: string;
  }>;
}

export default function Batches() {
  const { t, isRTL } = useLanguage();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const { user, isAdmin, isSuperAdmin } = useAuth();

  // Load batches, recipes, and shops from Firebase
  useEffect(() => {
    loadBatches();
    loadRecipes();
    loadShops();
  }, [user, isAdmin, isSuperAdmin]);

  const loadBatches = async () => {
    try {
      if (!user) return;
      const batchesRef = isAdmin || isSuperAdmin ? collection(db, 'batches') : query(collection(db, 'batches'), where('owner', '==', user.uid));
      const querySnapshot = await getDocs(batchesRef);
      const batchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Batch[];
      setBatches(batchesData);
      // Also mark batches that already have sales as inSales (migrate existing data)
      try {
        const salesRef = isAdmin || isSuperAdmin ? collection(db, 'sales') : query(collection(db, 'sales'), where('owner', '==', user.uid));
        const salesSnapshot = await getDocs(salesRef);
        const soldBatchIds = new Set(salesSnapshot.docs.map(s => s.data().batchId));
        const updated = await Promise.all(batchesData.map(async (b) => {
          if (soldBatchIds.has(b.id) && !(b as any).inSales) {
            try {
              await updateDoc(doc(db, 'batches', b.id), { inSales: true });
            } catch (err) {
              console.error('Error updating batch inSales for', b.id, err);
            }
            return { ...b, inSales: true } as Batch & { inSales?: boolean };
          }
          return b;
        }));
        setBatches(updated as Batch[]);
      } catch (err) {
        console.error('Error migrating batches inSales during load:', err);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      if (!user) return;
      const recipesRef = isAdmin || isSuperAdmin ? collection(db, 'recipes') : query(collection(db, 'recipes'), where('owner', '==', user.uid));
      const querySnapshot = await getDocs(recipesRef);
      const recipesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(recipesData);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const loadShops = async () => {
    try {
      if (!user) return;
      const shopsRef = isAdmin || isSuperAdmin ? collection(db, 'shops') : query(collection(db, 'shops'), where('owner', '==', user.uid));
      const querySnapshot = await getDocs(shopsRef);
      const shopsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.recipeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (batchData: Omit<Batch, 'id' | 'status'>) => {
    setLoading(true);
    try {
      const status = batchData.remaining === 0 ? 'expired' :
                     batchData.remaining < batchData.quantity * 0.2 ? 'low-stock' : 'active';

      // Deduct inventory from purchases when creating a new batch
      if (!editingBatch && batchData.ingredientsUsed && batchData.ingredientsUsed.length > 0) {
        for (const ingredient of batchData.ingredientsUsed) {
          const purchaseQuery = isAdmin || isSuperAdmin
            ? query(collection(db, 'purchases'), where('itemName', '==', ingredient.itemName))
            : query(collection(db, 'purchases'), where('itemName', '==', ingredient.itemName), where('owner', '==', user?.uid));
          const purchaseSnapshot = await getDocs(purchaseQuery);
          
          if (!purchaseSnapshot.empty) {
            const purchaseDoc = purchaseSnapshot.docs[0];
            const purchaseData = purchaseDoc.data();
            const currentUsableQuantity = purchaseData.usableQuantity || 0;
            const newUsableQuantity = currentUsableQuantity - ingredient.quantityUsed;
            
            if (newUsableQuantity >= 0) {
              await updateDoc(doc(db, 'purchases', purchaseDoc.id), {
                usableQuantity: newUsableQuantity,
              });
            } else {
              console.warn(`Insufficient inventory for ${ingredient.itemName}. Required: ${ingredient.quantityUsed}, Available: ${currentUsableQuantity}`);
            }
          }
        }
      }
      
      if (editingBatch) {
        await updateDoc(doc(db, 'batches', editingBatch.id), { ...batchData, status });
        setBatches(batches.map(b => 
          b.id === editingBatch.id ? { ...batchData, id: editingBatch.id, status } : b
        ));
      } else {
        const docRef = await addDoc(collection(db, 'batches'), { ...batchData, status, owner: user?.uid });
        setBatches([...batches, { ...batchData, id: docRef.id, status }]);
      }
      
      setShowModal(false);
      setEditingBatch(null);
    } catch (error) {
      console.error('Error saving batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'batches', id));
        setBatches(batches.filter(b => b.id !== id));
      } catch (error) {
        console.error('Error deleting batch:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'low-stock': return 'bg-orange-100 text-orange-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.batches}</h1>
              <p className="text-gray-600">Track production batches and inventory</p>
            </div>
            <button
              onClick={() => { setEditingBatch(null); setShowModal(true); }}
              className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2 self-start"
            >
              <Plus className="w-5 h-5" />
              {t.addBatch}
            </button>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-80"
        >
          <img src="/storyset/cake%20shop-pana.svg" alt="Batches Illustration" className="w-full" />
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-600">
              <Box className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Batches</h3>
          <p className="text-2xl font-bold text-gray-800">{batches.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-teal-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-800">MVR {batches.reduce((sum, b) => sum + (b.totalRevenue || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Low Stock</h3>
          <p className="text-2xl font-bold text-gray-800">{batches.filter(b => b.status === 'low-stock').length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Expired</h3>
          <p className="text-2xl font-bold text-gray-800">{batches.filter(b => b.status === 'expired').length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 ${isRTL ? 'left-auto right-3' : ''}`} />
        <input
          type="text"
          placeholder={t.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : ''}`}
        />
      </div>

      {/* Low Stock Alerts */}
      {batches.some(b => b.status === 'low-stock') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-800">{t.lowStockAlert}</p>
            <p className="text-sm text-orange-600">
              {batches.filter(b => b.status === 'low-stock').length} batches need attention
            </p>
          </div>
        </motion.div>
      )}

      {/* Batches List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.batchNumber}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.productName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.shopName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.quantity}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.remaining}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.productionDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.expiryDate}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBatches.map((batch) => (
                  <motion.tr
                    key={batch.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{batch.batchNumber}</span>
                        { (batch as any).inSales && (
                          <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.recipeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.shopName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${batch.remaining < batch.quantity * 0.2 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {batch.remaining}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.productionDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {batch.expiryDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {batch.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingBatch(batch); setShowModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(batch.id)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-purple-700" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredBatches.map((batch) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900">{batch.batchNumber}</span>
                    { (batch as any).inSales && (
                      <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                      {batch.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.recipeName}</span>
                    <span className="font-medium text-gray-900">{batch.recipeName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.shopName}</span>
                    <span className="text-gray-900">{batch.shopName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.quantity}</span>
                    <span className="text-gray-900">{batch.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.remaining}</span>
                    <span className={`font-medium ${batch.remaining < batch.quantity * 0.2 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {batch.remaining}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.productionDate}</span>
                    <span className="text-gray-900">{batch.productionDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t.expiryDate}</span>
                    <span className="text-gray-900">{batch.expiryDate}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setEditingBatch(batch); setShowModal(true); }}
                    className="flex-1 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="flex-1 p-2 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4 text-purple-600" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showModal && (
        <BatchModal
          batch={editingBatch}
          recipes={recipes}
          shops={shops}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingBatch(null); }}
          t={t}
          existingBatches={batches}
        />
      )}
    </div>
  );
}

function BatchModal({ 
  batch, 
  recipes,
  shops,
  onSave, 
  onClose, 
  t,
  existingBatches
}: { 
  batch: Batch | null;
  recipes: any[];
  shops: any[];
  onSave: (data: Omit<Batch, 'id' | 'status'>) => Promise<void>;
  onClose: () => void;
  t: any;
  existingBatches: Batch[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchNumber: batch?.batchNumber || `BATCH-${String(existingBatches.length + 1).padStart(3, '0')}`,
    recipeId: batch?.recipeId || '',
    recipeName: batch?.recipeName || '',
    shopId: batch?.shopId || '',
    shopName: batch?.shopName || '',
    quantity: batch?.quantity || '',
    remaining: batch?.remaining || '',
    productionDate: batch?.productionDate || '',
    expiryDate: batch?.expiryDate || '',
    cost: batch?.cost || '',
    portionSellingPrice: batch?.portionSellingPrice || '',
    totalRevenue: batch?.totalRevenue || '',
    ingredientsUsed: batch?.ingredientsUsed || [],
  });

  const selectedRecipe = recipes.find(r => r.id === formData.recipeId);
  const recipeCost = selectedRecipe?.totalCost || 0;
  const calculatedCost = recipeCost * Number(formData.quantity || 0);
  const calculatedRevenue = Number(formData.quantity || 0) * Number(formData.portionSellingPrice || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave({
        batchNumber: formData.batchNumber,
        recipeId: formData.recipeId,
        recipeName: formData.recipeName,
        shopId: formData.shopId,
        shopName: formData.shopName,
        quantity: Number(formData.quantity),
        remaining: Number(formData.quantity),
        productionDate: formData.productionDate,
        expiryDate: formData.expiryDate,
        cost: calculatedCost,
        portionSellingPrice: Number(formData.portionSellingPrice),
        totalRevenue: calculatedRevenue,
        ingredientsUsed: formData.ingredientsUsed,
      });
    } catch (err) {
      console.error('Error saving batch from modal:', err);
    } finally {
      setIsSubmitting(false);
    }
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
            {batch ? t.editBatch : t.addBatch}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Number
            </label>
            <input
              type="text"
              value={formData.batchNumber}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe
            </label>
            <select
              value={formData.recipeId}
              onChange={(e) => {
                const selectedRecipe = recipes.find(r => r.id === e.target.value);
                setFormData({
                  ...formData,
                  recipeId: e.target.value,
                  recipeName: selectedRecipe?.name || '',
                  ingredientsUsed: selectedRecipe?.ingredients?.map((ing: any) => ({
                    purchaseId: ing.purchaseId || '',
                    itemName: ing.name || ing.itemName || '',
                    quantityUsed: ing.quantity || 0,
                    unit: ing.unit || 'g',
                  })) || [],
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select recipe</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shop
            </label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Portions
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portion Selling Price (MVR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.portionSellingPrice}
              onChange={(e) => setFormData({ ...formData, portionSellingPrice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Date
              </label>
              <input
                type="date"
                value={formData.productionDate}
                onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          {/* Cost and Revenue Preview */}
          <div className="bg-purple-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Recipe Cost per Portion:</span>
              <span className="text-sm font-semibold text-gray-900">MVR {recipeCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Cost ({formData.quantity || 0} portions):</span>
              <span className="text-sm font-semibold text-gray-900">MVR {calculatedCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Revenue ({formData.quantity || 0} × MVR {formData.portionSellingPrice || 0}):</span>
              <span className="text-sm font-bold text-purple-700">MVR {calculatedRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-purple-200">
              <span className="text-sm font-medium text-gray-700">Profit:</span>
              <span className={`text-sm font-bold ${calculatedRevenue - calculatedCost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                MVR {(calculatedRevenue - calculatedCost).toFixed(2)}
              </span>
            </div>
          </div>
          
          {formData.ingredientsUsed.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients Used (Inventory Deduction)
              </label>
              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                {formData.ingredientsUsed.map((ingredient: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{ingredient.itemName}</span>
                    <span className="font-medium text-purple-700">
                      {ingredient.quantityUsed} {ingredient.unit}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-purple-200 text-xs text-gray-600">
                  These ingredients will be deducted from inventory when batch is created
                </div>
              </div>
            </div>
          )}
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
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg transition-colors ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-purple-800'}`}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
