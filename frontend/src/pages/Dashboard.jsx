import { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  LayoutGrid, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Clock
} from 'lucide-react';
import apiClient from '../api/client';
import UploadZone from '../components/UploadZone';
import ListingTable from '../components/ListingTable';
import Pricing from '../components/Pricing';

// Session initialization
const initializeSession = () => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Steps enum
const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  REVIEW: 'review'
};

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    const sid = initializeSession();
    setSessionId(sid);
  }, []);

  // Handle file upload
  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setCurrentStep(STEPS.PROCESSING);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Transform clusters data into flat listing array
      const clusters = response.data.clusters || [];
      const processedListings = transformClustersToListings(clusters);
      
      setListings(processedListings);
      setCurrentStep(STEPS.REVIEW);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process images. Please try again.');
      setCurrentStep(STEPS.UPLOAD);
    } finally {
      setIsProcessing(false);
    }
  };

  // Transform clusters to flat listings array
  const transformClustersToListings = (clusters) => {
    let id = 1;
    return clusters.flatMap((cluster) => {
      const products = cluster.products || [];
      return products.map((product) => ({
        id: `${cluster.clusterId}-${id++}`,
        title: product.title || '',
        brand: product.brand || '',
        category: product.category || '',
        price: product.price || '',
        imageUrl: product.imageUrl || '',
        clusterId: cluster.clusterId,
      }));
    });
  };

  // Handle listing update
  const handleUpdateListing = (id, field, value) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Handle listing delete
  const handleDeleteListing = (id) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle reprocess
  const handleReprocess = async () => {
    setCurrentStep(STEPS.UPLOAD);
    setListings([]);
  };

  // Reset to upload
  const handleNewUpload = () => {
    setCurrentStep(STEPS.UPLOAD);
    setListings([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Catalog AI</h1>
                <p className="text-xs text-slate-500">Product Catalog Generator</p>
              </div>
            </div>

            {/* Session Badge */}
            {sessionId && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-slate-600 font-medium">
                  Session: {sessionId.slice(0, 12)}...
                </span>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex items-center gap-4">
              <button
                onClick={handleReprocess}
                className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
              >
                New Catalog
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <ProgressSteps currentStep={currentStep} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="transition-all duration-300">
          {currentStep === STEPS.UPLOAD && (
            <UploadStep onUpload={handleUpload} isLoading={isProcessing} />
          )}

          {currentStep === STEPS.PROCESSING && (
            <ProcessingStep />
          )}

          {currentStep === STEPS.REVIEW && (
            <ReviewStep
              listings={listings}
              onUpdate={handleUpdateListing}
              onDelete={handleDeleteListing}
              onNewUpload={handleNewUpload}
            />
          )}
        </div>

        {/* Pricing Section (shown below main content) */}
        {currentStep === STEPS.REVIEW && listings.length > 0 && (
          <div className="mt-16">
            <Pricing />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © 2024 Catalog AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-slate-500 hover:text-indigo-600">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-indigo-600">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-indigo-600">
                API Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Progress Steps Component
function ProgressSteps({ currentStep }) {
  const steps = [
    { id: STEPS.UPLOAD, label: 'Upload', icon: Sparkles },
    { id: STEPS.PROCESSING, label: 'AI Processing', icon: Clock },
    { id: STEPS.REVIEW, label: 'Review & Export', icon: LayoutGrid },
  ];

  const getStepStatus = (stepId) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                ${status === 'completed' ? 'bg-indigo-100 text-indigo-700' : ''}
                ${status === 'current' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : ''}
                ${status === 'pending' ? 'bg-slate-100 text-slate-400' : ''}
              `}
            >
              {status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </div>

            {!isLast && (
              <div
                className={`
                  w-8 h-0.5 mx-2
                  ${status === 'completed' ? 'bg-indigo-400' : 'bg-slate-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Upload Step Component
function UploadStep({ onUpload, isLoading }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Upload Your Product Images
        </h2>
        <p className="text-slate-600">
          Drag and drop images to automatically generate your product catalog using AI clustering
        </p>
      </div>

      <UploadZone onUpload={onUpload} isLoading={isLoading} />

      {/* Features List */}
      <div className="mt-12 grid sm:grid-cols-3 gap-6">
        {[
          { icon: Sparkles, title: 'AI Clustering', desc: 'Automatically groups similar products' },
          { icon: LayoutGrid, title: 'Smart Parsing', desc: 'Extracts brand, category & attributes' },
          { icon: CheckCircle2, title: 'Easy Export', desc: 'Download as CSV or JSON' },
        ].map((feature, index) => (
          <div key={index} className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-xl flex items-center justify-center">
              <feature.icon className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">{feature.title}</h3>
            <p className="text-sm text-slate-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Processing Step Component
function ProcessingStep() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="relative mb-8">
        <div className="w-24 h-24 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
        <div className="absolute inset-0 w-24 h-24 mx-auto">
          <svg className="w-full h-full">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-indigo-200"
              strokeDasharray="276.46"
              strokeDashoffset="50"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="276.46"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        AI is Processing Your Images
      </h2>
      <p className="text-slate-600 mb-6">
        Our AI is analyzing your product images, extracting attributes, and clustering similar items...
      </p>

      <div className="bg-white rounded-xl border border-slate-200 p-4 text-left">
        <div className="space-y-3">
          <ProcessingItem label="Analyzing images" done />
          <ProcessingItem label="Extracting product attributes" done />
          <ProcessingItem label="Clustering similar products" active />
          <ProcessingItem label="Generating catalog data" pending />
        </div>
      </div>
    </div>
  );
}

// Processing Item Component
function ProcessingItem({ label, done, active, pending }) {
  return (
    <div className="flex items-center gap-3">
      {done && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      {active && <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />}
      {pending && <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
      
      <span
        className={`
          text-sm
          ${done ? 'text-slate-900' : ''}
          ${active ? 'text-indigo-700 font-medium' : ''}
          ${pending ? 'text-slate-400' : ''}
        `}
      >
        {label}
      </span>
    </div>
  );
}

// Review Step Component
function ReviewStep({ listings, onUpdate, onDelete, onNewUpload }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Your Product Catalog
          </h2>
          <p className="text-slate-600">
            Review and edit the AI-generated product details below
          </p>
        </div>

        <button
          onClick={onNewUpload}
          className="
            px-4 py-2 bg-white border border-slate-300 text-slate-700
            hover:border-indigo-300 hover:text-indigo-600 rounded-lg
            transition-colors flex items-center gap-2 text-sm font-medium
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Add More Images
        </button>
      </div>

      <ListingTable
        data={listings}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />

      {/* Quick Stats */}
      <div className="mt-8 grid sm:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={listings.length} icon={ShoppingBag} />
        <StatCard 
          label="Unique Categories" 
          value={new Set(listings.map(l => l.category).filter(Boolean)).size} 
          icon={LayoutGrid} 
        />
        <StatCard 
          label="Total Value" 
          value={`$${listings.reduce((sum, l) => sum + (parseFloat(l.price) || 0), 0).toLocaleString()}`} 
          icon={Sparkles} 
        />
        <StatCard 
          label="Branded Products" 
          value={listings.filter(l => l.brand).length} 
          icon={CheckCircle2} 
        />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

