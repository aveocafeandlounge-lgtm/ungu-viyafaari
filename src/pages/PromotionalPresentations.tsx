import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Video, 
  Image as ImageIcon, 
  Download, 
  Play, 
  Pause, 
  Plus,
  Trash2,
  Sparkles,
  Wand2,
  FileText
} from 'lucide-react';

interface Slide {
  id: string;
  text: string;
  image: string | null;
  duration: number;
  transition: string;
}

interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  audio: string | null;
  script: string;
  createdAt: string;
}

const templates = [
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    icon: ImageIcon,
    color: 'bg-purple-500',
    description: 'Highlight your best products',
    defaultSlides: [
      { text: 'Our Best Products', image: null, duration: 3, transition: 'fade' },
      { text: 'Fresh & Delicious', image: null, duration: 3, transition: 'slide' },
      { text: 'Order Now!', image: null, duration: 3, transition: 'zoom' },
    ],
    defaultScript: `[Scene 1]
Hook: "Wait until you see this!"
Action: Show product close-up
Text overlay: "Our Best Products"

[Scene 2]
Hook: "Fresh ingredients make all the difference"
Action: Show preparation process
Text overlay: "Fresh & Delicious"

[Scene 3]
Hook: "Ready in minutes!"
Action: Final product reveal
Text overlay: "Order Now!"

[Call to Action]
"Link in bio to order now!"
"Don't forget to like and follow!"
`
  },
  {
    id: 'recipe-teaser',
    name: 'Recipe Teaser',
    icon: Sparkles,
    color: 'bg-orange-500',
    description: 'Share your secret recipes',
    defaultSlides: [
      { text: 'Secret Recipe', image: null, duration: 3, transition: 'fade' },
      { text: 'Ingredients', image: null, duration: 3, transition: 'slide' },
      { text: 'Cook Together', image: null, duration: 3, transition: 'zoom' },
    ],
    defaultScript: `[Scene 1]
Hook: "This secret recipe changes everything!"
Action: Show final dish
Text overlay: "Secret Recipe"

[Scene 2]
Hook: "Here's what you need"
Action: Show ingredients one by one
Text overlay: "Ingredients"

[Scene 3]
Hook: "Let's cook together!"
Action: Show cooking process
Text overlay: "Cook Together"

[Call to Action]
"Save this for later!"
"Follow for more recipes!"
`
  },
  {
    id: 'sale-promo',
    name: 'Sale Promotion',
    icon: Wand2,
    color: 'bg-green-500',
    description: 'Announce special offers',
    defaultSlides: [
      { text: 'SPECIAL OFFER', image: null, duration: 3, transition: 'fade' },
      { text: 'Limited Time', image: null, duration: 3, transition: 'slide' },
      { text: 'Shop Now!', image: null, duration: 3, transition: 'zoom' },
    ],
    defaultScript: `[Scene 1]
Hook: "You don't want to miss this!"
Action: Show sale banner with excitement
Text overlay: "SPECIAL OFFER"

[Scene 2]
Hook: "Limited time only!"
Action: Show countdown or urgency
Text overlay: "Limited Time"

[Scene 3]
Hook: "Get it before it's gone!"
Action: Show products with prices
Text overlay: "Shop Now!"

[Call to Action]
"Link in bio!"
"Tag a friend who needs this!"
`
  },
];

export default function PromotionalPresentations() {
  const { user } = useAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);

  useEffect(() => {
    loadPresentations();
  }, [user]);

  const loadPresentations = async () => {
    // Load from localStorage for now (could be Firebase in production)
    const saved = localStorage.getItem('promotionalPresentations');
    if (saved) {
      setPresentations(JSON.parse(saved));
    }
  };

  const savePresentations = (updated: Presentation[]) => {
    setPresentations(updated);
    localStorage.setItem('promotionalPresentations', JSON.stringify(updated));
  };

  const createFromTemplate = (template: any) => {
    const newPresentation: Presentation = {
      id: Date.now().toString(),
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      slides: template.defaultSlides.map((slide: any) => ({
        ...slide,
        id: Math.random().toString(36).substr(2, 9),
      })),
      audio: null,
      script: template.defaultScript || '',
      createdAt: new Date().toISOString(),
    };
    setSelectedPresentation(newPresentation);
    setIsEditing(true);
    setShowTemplateModal(false);
    savePresentations([...presentations, newPresentation]);
  };

  const addSlide = () => {
    if (!selectedPresentation) return;
    const newSlide: Slide = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'New Slide',
      image: null,
      duration: 3,
      transition: 'fade',
    };
    const updated = {
      ...selectedPresentation,
      slides: [...selectedPresentation.slides, newSlide],
    };
    setSelectedPresentation(updated);
    updatePresentation(updated);
  };

  const deleteSlide = (index: number) => {
    if (!selectedPresentation) return;
    const updated = {
      ...selectedPresentation,
      slides: selectedPresentation.slides.filter((_, i) => i !== index),
    };
    setSelectedPresentation(updated);
    setCurrentSlideIndex(Math.max(0, index - 1));
    updatePresentation(updated);
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    if (!selectedPresentation) return;
    const updated = {
      ...selectedPresentation,
      slides: selectedPresentation.slides.map((slide, i) =>
        i === index ? { ...slide, ...updates } : slide
      ),
    };
    setSelectedPresentation(updated);
    updatePresentation(updated);
  };

  const updatePresentation = (updated: Presentation) => {
    savePresentations(presentations.map(p => p.id === updated.id ? updated : p));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSlide(currentSlideIndex, { image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportVideo = async () => {
    if (!selectedPresentation) return;
    
    // Create a simple canvas-based video export
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // For now, we'll create a simple image sequence
    // In production, you'd use a library like ffmpeg.wasm or canvas-record
    const slides = selectedPresentation.slides;
    let currentSlide = 0;
    
    const drawSlide = () => {
      if (currentSlide >= slides.length) {
        // Export complete
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${selectedPresentation.title}.png`;
        link.href = dataUrl;
        link.click();
        return;
      }

      const slide = slides[currentSlide];
      
      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#6B46C1');
      gradient.addColorStop(1, '#9333EA');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slide.text, canvas.width / 2, canvas.height / 2);
      
      // Draw image if exists
      if (slide.image) {
        const img = new Image();
        img.onload = () => {
          const imgHeight = 400;
          const imgWidth = (img.width / img.height) * imgHeight;
          ctx.drawImage(img, (canvas.width - imgWidth) / 2, canvas.height / 2 - 200, imgWidth, imgHeight);
        };
        img.src = slide.image;
      }
      
      currentSlide++;
      setTimeout(drawSlide, slide.duration * 1000);
    };
    
    drawSlide();
  };

  const exportScript = () => {
    if (!selectedPresentation) return;
    
    const scriptContent = selectedPresentation.script || 'No script written yet.';
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${selectedPresentation.title}-script.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (showScriptEditor && selectedPresentation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Video Script Editor</h2>
                <p className="text-gray-600">Write your TikTok video script for {selectedPresentation.title}</p>
              </div>
              <button
                onClick={() => setShowScriptEditor(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script (Include scene descriptions, hooks, actions, and call-to-action)
              </label>
              <textarea
                value={selectedPresentation.script}
                onChange={(e) => {
                  const updated = { ...selectedPresentation, script: e.target.value };
                  setSelectedPresentation(updated);
                  updatePresentation(updated);
                }}
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                placeholder={`[Scene 1]
Hook: "Your attention-grabbing opening line"
Action: Describe what happens on screen
Text overlay: "Text that appears"

[Scene 2]
Hook: "Next engaging line"
Action: Next action
Text overlay: "Next text"

[Call to Action]
"Your CTA text"
"Follow for more!"`}
              />
            </div>
            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Script Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Start with a strong hook in the first 3 seconds</li>
                <li>• Keep each scene under 10 seconds</li>
                <li>• Include clear visual actions for each scene</li>
                <li>• End with a clear call-to-action</li>
                <li>• Use trending sounds and hashtags in your actual video</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowScriptEditor(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Save & Close
              </button>
              <button
                onClick={exportScript}
                className="flex-1 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export as .txt
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showTemplateModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose a Template</h2>
            <p className="text-gray-600">Select a template to get started with your promotional video</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => createFromTemplate(template)}
                className="bg-gray-50 rounded-xl p-6 text-left hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center mb-4`}>
                  <template.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </motion.button>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              onClick={() => setShowTemplateModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isEditing && selectedPresentation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Presentation</h1>
            <p className="text-gray-600">{selectedPresentation.title}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setShowScriptEditor(true)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Edit Script
            </button>
            <button
              onClick={exportVideo}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export Video
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slide Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Slide {currentSlideIndex + 1} of {selectedPresentation.slides.length}</h3>
                <button
                  onClick={addSlide}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Slide
                </button>
              </div>

              {selectedPresentation.slides.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
                    <input
                      type="text"
                      value={selectedPresentation.slides[currentSlideIndex]?.text || ''}
                      onChange={(e) => updateSlide(currentSlideIndex, { text: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter slide text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <ImageIcon className="w-5 h-5" />
                        Upload Image
                      </label>
                      {selectedPresentation.slides[currentSlideIndex]?.image && (
                        <button
                          onClick={() => updateSlide(currentSlideIndex, { image: null })}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {selectedPresentation.slides[currentSlideIndex]?.image && (
                      <img
                        src={selectedPresentation.slides[currentSlideIndex]?.image || ''}
                        alt="Slide preview"
                        className="mt-2 rounded-lg max-h-48 object-cover"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
                    <input
                      type="number"
                      value={selectedPresentation.slides[currentSlideIndex]?.duration || 3}
                      onChange={(e) => updateSlide(currentSlideIndex, { duration: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transition</label>
                    <select
                      value={selectedPresentation.slides[currentSlideIndex]?.transition || 'fade'}
                      onChange={(e) => updateSlide(currentSlideIndex, { transition: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="zoom">Zoom</option>
                    </select>
                  </div>

                  {selectedPresentation.slides.length > 1 && (
                    <button
                      onClick={() => deleteSlide(currentSlideIndex)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete Slide
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Slide Thumbnails */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Slides</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedPresentation.slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`flex-shrink-0 w-24 h-36 rounded-lg border-2 transition-colors ${
                      index === currentSlideIndex ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-xs text-center text-gray-700 line-clamp-3">{slide.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Preview</h3>
              <div className="aspect-[9/16] bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center p-4">
                <div className="text-center text-white">
                  {selectedPresentation.slides[currentSlideIndex]?.image && (
                    <img
                      src={selectedPresentation.slides[currentSlideIndex]?.image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <p className="text-2xl font-bold">{selectedPresentation.slides[currentSlideIndex]?.text}</p>
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={selectedPresentation.title}
                    onChange={(e) => {
                      const updated = { ...selectedPresentation, title: e.target.value };
                      setSelectedPresentation(updated);
                      updatePresentation(updated);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Music</label>
                  <input
                    type="file"
                    accept="audio/*"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Promotional Presentations</h1>
          <p className="text-gray-600">Create engaging videos for TikTok and social media</p>
        </div>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Video className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Presentations</p>
              <p className="text-2xl font-bold text-gray-800">{presentations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Slides</p>
              <p className="text-2xl font-bold text-gray-800">
                {presentations.reduce((sum, p) => sum + p.slides.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Download className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Exported Videos</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Presentations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Your Presentations</h3>
        </div>
        {presentations.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No presentations yet</p>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
            >
              Create Your First Presentation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {presentations.map((presentation) => (
              <motion.div
                key={presentation.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{presentation.title}</h4>
                      <p className="text-sm text-gray-600">
                        {presentation.slides.length} slides • Created {new Date(presentation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPresentation(presentation);
                        setIsEditing(true);
                      }}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this presentation?')) {
                          savePresentations(presentations.filter(p => p.id !== presentation.id));
                        }
                      }}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
