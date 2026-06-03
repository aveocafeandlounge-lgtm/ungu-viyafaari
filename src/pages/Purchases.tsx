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
  Package, 
  Loader2,
  Calculator
} from 'lucide-react';

interface Purchase {
  id: string;
  itemName: string;
  itemNameDv: string;
  category: string;
  rawQuantity: number;
  rawUnit: string;
  pricePerUnit: number;
  cuttingCharges: number;
  wastePercentage: number;
  usableQuantity: number;
  usableUnit: string;
  effectiveCostPerUnit: number;
  totalCost: number;
  purchaseDate: string;
  supplier: string;
  notes: string;
}

export default function Purchases() {
  const { t, isRTL } = useLanguage();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [existingItemNames, setExistingItemNames] = useState<string[]>([]);

  // Load purchases from Firebase
  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'purchases'));
      const purchasesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Purchase[];
      setPurchases(purchasesData);

      // Extract unique suppliers
      const uniqueSuppliers = Array.from(new Set(purchasesData.map(p => p.supplier).filter(Boolean)));
      setSuppliers(uniqueSuppliers);

      // Extract unique item names for autocomplete
      const uniqueItemNames = Array.from(new Set(purchasesData.map(p => p.itemName).filter(Boolean)));
      setExistingItemNames(uniqueItemNames);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'fish', label: 'Fish' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'flour', label: 'Flour' },
    { value: 'spices', label: 'Spices' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'other', label: 'Other' },
  ];

  const filteredPurchases = purchases.filter(purchase =>
    purchase.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.itemNameDv.includes(searchTerm)
  );

  const calculateUsableQuantity = (
    rawQuantity: number,
    wastePercentage: number
  ) => {
    return rawQuantity * (1 - wastePercentage / 100);
  };

  const calculateEffectiveCost = (
    rawQuantity: number,
    pricePerUnit: number,
    cuttingCharges: number,
    usableQuantity: number
  ) => {
    const totalRawCost = rawQuantity * pricePerUnit;
    const totalCost = totalRawCost + cuttingCharges;
    return totalCost / usableQuantity;
  };

  const handleSave = async (purchaseData: Omit<Purchase, 'id' | 'usableQuantity' | 'effectiveCostPerUnit' | 'totalCost'>) => {
    setLoading(true);
    try {
      const usableQuantity = calculateUsableQuantity(purchaseData.rawQuantity, purchaseData.wastePercentage);
      const totalCost = (purchaseData.rawQuantity * purchaseData.pricePerUnit) + purchaseData.cuttingCharges;
      const effectiveCostPerUnit = calculateEffectiveCost(
        purchaseData.rawQuantity,
        purchaseData.pricePerUnit,
        purchaseData.cuttingCharges,
        usableQuantity
      );

      const purchaseWithCalculations = {
        ...purchaseData,
        usableQuantity,
        effectiveCostPerUnit,
        totalCost,
      };

      if (editingPurchase) {
        await updateDoc(doc(db, 'purchases', editingPurchase.id), purchaseWithCalculations);
        setPurchases(purchases.map(p =>
          p.id === editingPurchase.id ? { ...purchaseWithCalculations, id: editingPurchase.id } : p
        ));
      } else {
        // Check if there's an existing purchase with same item name and same price per unit
        const existingPurchase = purchases.find(p =>
          p.itemName === purchaseData.itemName &&
          p.rawUnit === purchaseData.rawUnit &&
          Math.abs(p.pricePerUnit - purchaseData.pricePerUnit) < 0.01
        );

        if (existingPurchase) {
          // Update existing purchase by adding quantities
          const updatedRawQuantity = existingPurchase.rawQuantity + purchaseData.rawQuantity;
          const updatedUsableQuantity = existingPurchase.usableQuantity + usableQuantity;
          const updatedTotalCost = existingPurchase.totalCost + totalCost;

          await updateDoc(doc(db, 'purchases', existingPurchase.id), {
            rawQuantity: updatedRawQuantity,
            usableQuantity: updatedUsableQuantity,
            totalCost: updatedTotalCost,
          });

          setPurchases(purchases.map(p =>
            p.id === existingPurchase.id
              ? { ...p, rawQuantity: updatedRawQuantity, usableQuantity: updatedUsableQuantity, totalCost: updatedTotalCost }
              : p
          ));
        } else {
          // Create new purchase record
          const docRef = await addDoc(collection(db, 'purchases'), purchaseWithCalculations);
          setPurchases([...purchases, { ...purchaseWithCalculations, id: docRef.id }]);
        }
      }

      // Reload suppliers to include any new ones
      const updatedPurchases = editingPurchase
        ? purchases.map(p => p.id === editingPurchase.id ? { ...purchaseWithCalculations, id: editingPurchase.id } : p)
        : [...purchases, purchaseWithCalculations];
      const uniqueSuppliers = Array.from(new Set(updatedPurchases.map(p => p.supplier).filter(Boolean)));
      setSuppliers(uniqueSuppliers);

      setShowModal(false);
      setEditingPurchase(null);
    } catch (error) {
      console.error('Error saving purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'purchases', id));
        setPurchases(purchases.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting purchase:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Calculate MTD/YTD stats
  const getMTDDate = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDayOfMonth.toISOString().split('T')[0];
  };

  const getYTDDate = () => {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    return firstDayOfYear.toISOString().split('T')[0];
  };

  const mtdDate = getMTDDate();
  const ytdDate = getYTDDate();

  const totalPurchases = purchases.length;
  const purchasesMTD = purchases.filter(p => p.purchaseDate >= mtdDate).length;
  const purchasesYTD = purchases.filter(p => p.purchaseDate >= ytdDate).length;
  const totalCost = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const costMTD = purchases.filter(p => p.purchaseDate >= mtdDate).reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const costYTD = purchases.filter(p => p.purchaseDate >= ytdDate).reduce((sum, p) => sum + (p.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Purchases</h1>
          <p className="text-gray-600">Manage bulk purchases and inventory</p>
        </div>
        <button
          onClick={() => { setEditingPurchase(null); setShowModal(true); }}
          className="bg-purple-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-800 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          Add Purchase
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-600">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Purchases</h3>
          <p className="text-2xl font-bold text-gray-800">{totalPurchases}</p>
          <p className="text-xs text-gray-500 mt-2">MTD: {purchasesMTD} | YTD: {purchasesYTD}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-teal-600">
              <Calculator className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Cost</h3>
          <p className="text-2xl font-bold text-gray-800">MVR {totalCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">MTD: MVR {costMTD.toLocaleString()} | YTD: MVR {costYTD.toLocaleString()}</p>
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

      {/* Purchases List */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raw Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usable Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waste</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-800">{purchase.itemName}</div>
                        <div className="text-sm text-gray-500">{purchase.itemNameDv}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {purchase.rawQuantity} {purchase.rawUnit}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-medium text-green-600">{purchase.usableQuantity.toFixed(2)} {purchase.usableUnit}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        {purchase.wastePercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      MVR {purchase.effectiveCostPerUnit.toFixed(2)}/{purchase.usableUnit}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      MVR {purchase.totalCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingPurchase(purchase); setShowModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-purple-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPurchases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No purchases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredPurchases.map((purchase) => (
              <motion.div key={purchase.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="font-semibold text-gray-900">{purchase.itemName}</span>
                      <span className="text-sm text-gray-500 ml-2">{purchase.itemNameDv}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                    {purchase.wastePercentage}% waste
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Raw Quantity</span>
                    <span className="font-medium text-gray-800">{purchase.rawQuantity} {purchase.rawUnit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Usable Quantity</span>
                    <span className="font-medium text-green-600">{purchase.usableQuantity.toFixed(2)} {purchase.usableUnit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Effective Cost</span>
                    <span className="font-medium text-gray-800">MVR {purchase.effectiveCostPerUnit.toFixed(2)}/{purchase.usableUnit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Cost</span>
                    <span className="font-bold text-gray-900">MVR {purchase.totalCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => { setEditingPurchase(purchase); setShowModal(true); }} 
                    className="flex-1 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4 text-gray-600" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(purchase.id)} 
                    className="flex-1 p-2 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4 text-purple-700" /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
            {filteredPurchases.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                No purchases found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showModal && (
        <PurchaseModal
          purchase={editingPurchase}
          categories={categories}
          suppliers={suppliers}
          existingItemNames={existingItemNames}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingPurchase(null); }}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}

function PurchaseModal({
  purchase,
  categories,
  suppliers,
  existingItemNames,
  onSave,
  onClose,
  isRTL
}: {
  purchase: Purchase | null;
  categories: { value: string; label: string }[];
  suppliers: string[];
  existingItemNames: string[];
  onSave: (data: Omit<Purchase, 'id' | 'usableQuantity' | 'effectiveCostPerUnit' | 'totalCost'>) => void;
  onClose: () => void;
  isRTL: boolean;
}) {
  const [formData, setFormData] = useState({
    itemName: purchase?.itemName || '',
    itemNameDv: purchase?.itemNameDv || '',
    category: purchase?.category || '',
    rawQuantity: purchase?.rawQuantity || 0,
    rawUnit: purchase?.rawUnit || 'kg',
    pricePerUnit: purchase?.pricePerUnit || 0,
    cuttingCharges: purchase?.cuttingCharges || 0,
    wastePercentage: purchase?.wastePercentage || 0,
    usableUnit: purchase?.usableUnit || 'kg',
    purchaseDate: purchase?.purchaseDate || new Date().toISOString().split('T')[0],
    supplier: purchase?.supplier || '',
    notes: purchase?.notes || '',
  });
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [filteredItems, setFilteredItems] = useState<string[]>([]);

  const usableQuantity = calculateUsableQuantity(formData.rawQuantity, formData.wastePercentage);
  const totalCost = (formData.rawQuantity * formData.pricePerUnit) + formData.cuttingCharges;
  const effectiveCostPerUnit = usableQuantity > 0 ? totalCost / usableQuantity : 0;

  function calculateUsableQuantity(rawQuantity: number, wastePercentage: number) {
    return rawQuantity * (1 - wastePercentage / 100);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      itemName: formData.itemName,
      itemNameDv: formData.itemNameDv,
      category: formData.category,
      rawQuantity: formData.rawQuantity,
      rawUnit: formData.rawUnit,
      pricePerUnit: formData.pricePerUnit,
      cuttingCharges: formData.cuttingCharges,
      wastePercentage: formData.wastePercentage,
      usableUnit: formData.usableUnit,
      purchaseDate: formData.purchaseDate,
      supplier: formData.supplier,
      notes: formData.notes,
    });
  };

  const handleItemNameChange = (value: string) => {
    setFormData({ ...formData, itemName: value });
    if (value.length > 0) {
      const filtered = existingItemNames.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
      setShowItemDropdown(true);
    } else {
      setShowItemDropdown(false);
    }
  };

  const handleItemSelect = (itemName: string) => {
    setFormData({ ...formData, itemName });
    setShowItemDropdown(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {purchase ? 'Edit Purchase' : 'Add Purchase'}
          </h2>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name (English)
              </label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => handleItemNameChange(e.target.value)}
                onFocus={() => {
                  if (formData.itemName.length > 0) {
                    const filtered = existingItemNames.filter(item =>
                      item.toLowerCase().includes(formData.itemName.toLowerCase())
                    );
                    setFilteredItems(filtered);
                    setShowItemDropdown(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                autoComplete="off"
              />
              {showItemDropdown && filteredItems.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredItems.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleItemSelect(item)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name (Dhivehi)
              </label>
              <input
                type="text"
                value={formData.itemNameDv}
                onChange={(e) => setFormData({ ...formData, itemNameDv: e.target.value })}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isRTL ? 'rtl' : ''}`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raw Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rawQuantity}
                  onChange={(e) => setFormData({ ...formData, rawQuantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={formData.rawUnit}
                  onChange={(e) => setFormData({ ...formData, rawUnit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                  <option value="pcs">pcs</option>
                  <option value="L">L</option>
                  <option value="mL">mL</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit (MVR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cutting Charges (MVR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cuttingCharges}
                onChange={(e) => setFormData({ ...formData, cuttingCharges: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waste Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.wastePercentage}
                onChange={(e) => setFormData({ ...formData, wastePercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Head, bones, skins, and other non-usable parts
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usable Unit
              </label>
              <select
                value={formData.usableUnit}
                onChange={(e) => setFormData({ ...formData, usableUnit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
                <option value="pcs">pcs</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select or type new supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or add new"
                  value={formData.supplier && !suppliers.includes(formData.supplier) ? formData.supplier : ''}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Cost Calculation Preview */}
            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-purple-700" />
                <span className="font-semibold text-gray-800">Cost Calculation</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Raw Cost:</span>
                  <span className="font-medium">MVR {(formData.rawQuantity * formData.pricePerUnit).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cutting Charges:</span>
                  <span className="font-medium">MVR {formData.cuttingCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Usable Quantity:</span>
                  <span className="font-medium text-green-600">{usableQuantity.toFixed(2)} {formData.usableUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Effective Cost:</span>
                  <span className="font-medium">MVR {effectiveCostPerUnit.toFixed(2)}/{formData.usableUnit}</span>
                </div>
                <div className="flex justify-between col-span-2 border-t border-purple-200 pt-2">
                  <span className="text-gray-600 font-medium">Total Cost:</span>
                  <span className="font-bold text-purple-700">MVR {totalCost.toFixed(2)}</span>
                </div>
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
        </div>
      </motion.div>
    </div>
  );
}
