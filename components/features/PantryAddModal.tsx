'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Sparkles, AlertCircle, Scan } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Modal } from '@/components/ui/Modal';
import { CameraScanner } from './CameraScanner';
import { PantryItem } from '@/src/types/pantry';
import { imageToBase64 } from '@/src/utils/pantryStorage';
import { imageAnalysisService, PantryItemAnalysis } from '@/src/services/ai/fallback/ImageAnalysisService';
import bridge from '@/src/lib/react-native-bridge';

interface PantryAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: PantryItem) => void;
  initialData?: {
    name?: string;
    notes?: string;
    tags?: string[];
  };
  contextMessage?: string;
}

export function PantryAddModal({ isOpen, onClose, onAddItem, initialData, contextMessage }: PantryAddModalProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PantryItemAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable] = useState<boolean>(true); // Always available with Gemini API
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<PantryItem>>({
    name: '',
    notes: '',
    tags: []
  });


  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', notes: '', tags: [] });
      setImagePreview('');
      setAnalysis(null);
      setError(null);
      setShowCamera(false);
    } else if (initialData) {
      // Pre-fill form with initial data
      setFormData({
        name: initialData.name || '',
        notes: initialData.notes || '',
        tags: initialData.tags || []
      });
    }
  }, [isOpen, initialData]);

  // Handle camera capture
  const handleCameraCapture = async (imageData: string) => {
    setShowCamera(false);
    setImagePreview(imageData);
    setFormData({ ...formData, imageUrl: imageData });
    
    // Analyze with AI if available
    if (aiAvailable) {
      await analyzeImage(imageData);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await imageToBase64(file);
        setImagePreview(base64);
        setFormData({ ...formData, imageUrl: base64 });
        
        // Analyze with AI if available
        if (aiAvailable) {
          await analyzeImage(base64);
        }
      } catch (error) {
        console.error('Error converting image:', error);
        setError('Failed to process image');
      }
    }
  };

  // Analyze image with AI
  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await imageAnalysisService.analyzeImage(imageData);
      setAnalysis(result);
      
      // Auto-fill form with analysis results
      if (result.confidence > 0.5) {
        setFormData(prev => ({
          ...prev,
          name: result.name || prev.name,
          notes: result.dosageInfo || prev.notes,
          tags: [...new Set([...(prev.tags || []), ...(result.suggestedTags || [])])]
        }));
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setError('Failed to analyze image. You can still add the item manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick analyze text input
  const handleQuickAnalyze = async () => {
    if (!formData.name || !aiAvailable) return;
    
    setIsAnalyzing(true);
    try {
      const result = await imageAnalysisService.analyzeItemName(formData.name);
      setAnalysis(result);
      
      // Merge with existing data
      if (result.confidence > 0.3) {
        setFormData(prev => ({
          ...prev,
          notes: result.dosageInfo ? `${prev.notes}\n${result.dosageInfo}`.trim() : prev.notes,
          tags: [...new Set([...(prev.tags || []), ...(result.suggestedTags || [])])]
        }));
      }
    } catch (error) {
      console.error('Quick analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle tag selection
  const toggleTag = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.name?.trim()) return;

    const item: PantryItem = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      imageUrl: formData.imageUrl,
      notes: formData.notes || '',
      tags: formData.tags || [],
      dateAdded: new Date().toISOString()
    };

    onAddItem(item);
    onClose();
  };

  // Show camera scanner
  if (showCamera) {
    return (
      <CameraScanner
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
        isProcessing={isAnalyzing}
        processingMessage="Analyzing item with AI..."
      />
    );
  }

  const modalHeader = (
    <h2 className="text-xl font-semibold text-primary-text">Add to Pantry</h2>
  );

  const modalFooter = (
    <button
      onClick={handleSubmit}
      disabled={!formData.name?.trim() || isAnalyzing}
      className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose to-burgundy text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-feedback touch-manipulation"
    >
      {isAnalyzing ? 'Analyzing...' : 'Add to Pantry'}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={modalHeader}
      footer={modalFooter}
      size="lg"
      className="max-w-lg"
    >

      {/* Context Message */}
      {contextMessage && (
        <div className="mb-4 p-4 bg-sage-light/20 rounded-xl border border-sage/20">
              <p className="text-sm text-gray-700 leading-relaxed flex items-start">
                <Sparkles className="w-4 h-4 text-sage-dark mr-2 mt-0.5 flex-shrink-0" />
                {contextMessage}
              </p>
            </div>
          )}
          <div className="space-y-4 pt-4">
            

            {/* Image Capture Options */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Add Photo <span className="text-xs font-normal">(Optional)</span> {aiAvailable && <span className="text-rose text-xs">• AI Enhanced</span>}
              </label>
              
              {imagePreview ? (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
                    <OptimizedImage
                      src={imagePreview}
                      alt="Item preview"
                      fill
                      className="object-cover"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          <span className="text-sm font-medium">Analyzing...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setImagePreview('');
                      setFormData({ ...formData, imageUrl: undefined });
                      setAnalysis(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all duration-200 touch-feedback touch-manipulation active:scale-95 active:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      // Request camera permission if in React Native
                      if (bridge.isInReactNative()) {
                        const granted = await bridge.requestCameraPermission();
                        if (!granted) {
                          setError('Camera permission is required to scan items');
                          return;
                        }
                      }
                      setShowCamera(true);
                    }}
                    className="h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-1 hover:border-rose/50 hover:bg-rose/5 transition-all touch-feedback"
                  >
                    <Scan className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Scan Item</span>
                    {aiAvailable && (
                      <span className="text-[10px] text-rose font-medium">AI Powered</span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-1 hover:border-rose/50 hover:bg-rose/5 transition-all touch-feedback"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500">Upload Photo</span>
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* AI Analysis Results */}
            {analysis && analysis.confidence > 0.3 && (
              <div className="rounded-xl bg-blue-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">AI Analysis</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    analysis.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                    analysis.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {Math.round(analysis.confidence * 100)}% confident
                  </span>
                </div>
                
                {analysis.description && (
                  <p className="text-sm text-blue-800">{analysis.description}</p>
                )}
                
                {analysis.warnings && analysis.warnings.length > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-orange-800">
                      {analysis.warnings.join('. ')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={handleQuickAnalyze}
                  placeholder="e.g., Vitamin D3, Turmeric, Chamomile Tea"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose/30"
                />
                {aiAvailable && formData.name && !imagePreview && (
                  <button
                    onClick={handleQuickAnalyze}
                    disabled={isAnalyzing}
                    className="px-4 py-3 rounded-xl bg-rose/10 text-rose font-medium hover:bg-rose/20 transition-all touch-feedback disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['supplement', 'medicine', 'vitamin', 'herb', 'food', 'remedy', 'sleep-aid', 'pain-relief', 'immune-support'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all touch-feedback ${
                      formData.tags?.includes(tag)
                        ? 'bg-rose text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              {/* Custom Tag Input */}
              <input
                type="text"
                placeholder="Add custom tags (press Enter)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-rose/30"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const tag = input.value.trim().toLowerCase();
                    if (tag && !formData.tags?.includes(tag)) {
                      setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
                      input.value = '';
                    }
                  }
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., 1000 IU daily, organic, helps with sleep"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose/30 resize-none"
              />
            </div>
      </div>
    </Modal>
  );
}