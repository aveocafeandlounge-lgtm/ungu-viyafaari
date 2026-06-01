import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  Users,
  Loader2,
  ChefHat
} from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  nameDv: string;
  category: string;
  ingredients: string[];
  steps: string[];
  cookingTime: number;
  servingSize: number;
}

export default function Recipes() {
  const { t, isRTL } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: '1',
      name: 'Mas Huni',
      nameDv: 'މަސް ހުނި',
      category: 'hedhika',
      ingredients: ['Tuna (canned)', 'Onion', 'Coconut', 'Chili', 'Lime'],
      steps: ['Mix tuna with chopped onion', 'Add grated coconut', 'Mix in chili', 'Squeeze lime juice', 'Serve with roshi'],
      cookingTime: 15,
      servingSize: 4,
    },
    {
      id: '2',
      name: 'Bis Keeku',
      nameDv: 'ބިސް ކީކު',
      category: 'hedhika',
      ingredients: ['Flour', 'Sugar', 'Butter', 'Eggs', 'Cardamom'],
      steps: ['Mix flour and sugar', 'Add butter and eggs', 'Knead dough', 'Roll and cut', 'Bake at 180°C for 20 minutes'],
      cookingTime: 30,
      servingSize: 12,
    },
    {
      id: '3',
      name: 'Gulha',
      nameDv: 'ގުލްހާ',
      category: 'hedhika',
      ingredients: ['Flour', 'Tuna', 'Onion', 'Chili', 'Oil for frying'],
      steps: ['Make dough with flour', 'Prepare tuna filling', 'Fill dough balls', 'Deep fry until golden', 'Serve hot'],
      cookingTime: 45,
      servingSize: 20,
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'hedhika', label: t.hedhika },
    { value: 'meals', label: t.meals },
    { value: 'drinks', label: t.drinks },
    { value: 'snacks', label: t.snacks },
  ];

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.nameDv.includes(searchTerm)
  );

  const handleSave = async (recipeData: Omit<Recipe, 'id'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (editingRecipe) {
      setRecipes(recipes.map(r => 
        r.id === editingRecipe.id ? { ...recipeData, id: editingRecipe.id } : r
      ));
    } else {
      setRecipes([...recipes, { ...recipeData, id: Date.now().toString() }]);
    }
    
    setShowModal(false);
    setEditingRecipe(null);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setRecipes(recipes.filter(r => r.id !== id));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.recipes}</h1>
          <p className="text-gray-600">Store and manage traditional Maldivian recipes</p>
        </div>
        <button
          onClick={() => { setEditingRecipe(null); setShowModal(true); }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          {t.addRecipe}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 ${isRTL ? 'left-auto right-3' : ''}`} />
        <input
          type="text"
          placeholder={t.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : ''}`}
        />
      </div>

      {/* Recipes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-orange-300" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
                    <p className="text-sm text-gray-600">{recipe.nameDv}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingRecipe(recipe); setShowModal(true); }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.cookingTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servingSize} servings</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">{t.ingredients}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {recipe.ingredients.join(', ')}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    {categories.find(c => c.value === recipe.category)?.label}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recipe Modal */}
      {showModal && (
        <RecipeModal
          recipe={editingRecipe}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingRecipe(null); }}
          t={t}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}

function RecipeModal({ 
  recipe, 
  categories, 
  onSave, 
  onClose, 
  t,
  isRTL 
}: { 
  recipe: Recipe | null;
  categories: { value: string; label: string }[];
  onSave: (data: Omit<Recipe, 'id'>) => void;
  onClose: () => void;
  t: any;
  isRTL: boolean;
}) {
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    nameDv: recipe?.nameDv || '',
    category: recipe?.category || '',
    ingredients: recipe?.ingredients.join(', ') || '',
    steps: recipe?.steps.join('\n') || '',
    cookingTime: recipe?.cookingTime || '',
    servingSize: recipe?.servingSize || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      nameDv: formData.nameDv,
      category: formData.category,
      ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
      steps: formData.steps.split('\n').map(s => s.trim()).filter(s => s),
      cookingTime: Number(formData.cookingTime),
      servingSize: Number(formData.servingSize),
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
            {recipe ? t.editRecipe : t.addRecipe}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.recipeName}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.recipeNameDv}
            </label>
            <input
              type="text"
              value={formData.nameDv}
              onChange={(e) => setFormData({ ...formData, nameDv: e.target.value })}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isRTL ? 'rtl' : ''}`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.category}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.ingredients}
            </label>
            <textarea
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              rows={3}
              placeholder="Separate ingredients with commas"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.steps}
            </label>
            <textarea
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              rows={4}
              placeholder="Enter each step on a new line"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.cookingTime} (min)
              </label>
              <input
                type="number"
                value={formData.cookingTime}
                onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.servingSize}
              </label>
              <input
                type="number"
                value={formData.servingSize}
                onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t.save}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
