import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { CampaignPage } from './pages/CampaignPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductPage } from './pages/ProductPage';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { SearchPage } from './pages/SearchPage';
import { AboutPage } from './pages/AboutPage';
import { CreateCampaignPage } from './pages/CreateCampaignPage';
import { CampaignAIPage } from './pages/CampaignAIPage';
import { SuccessPage } from './pages/SuccessPage';
import { CancelPage } from './pages/CancelPage';

// Error boundary component for catching route-level errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 max-w-lg mx-auto my-10 bg-white rounded-md shadow-md">
          <h2 className="text-2xl font-semibold text-red-600">Something went wrong</h2>
          <p className="mt-4 text-gray-600">We apologize for the inconvenience. Please try refreshing the page.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <HomePage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/auth" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AuthPage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/campaign-ai" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CampaignAIPage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/campaigns" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CampaignsPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/campaigns/:slug" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CampaignPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/create-campaign" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CreateCampaignPage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/categories" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CategoriesPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/category/:slug" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CategoryPage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/products" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ProductsPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/products/:id" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ProductPage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/cart" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CartPage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/search" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SearchPage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/about" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AboutPage />
            </Suspense>
          </ErrorBoundary>
        } />
        
        <Route path="/success" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SuccessPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/cancel" element={
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <CancelPage />
            </Suspense>
          </ErrorBoundary>
        } />
      </Routes>
    </Router>
  );
}

export default App;