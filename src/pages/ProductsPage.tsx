
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProductsSection } from '../components/ProductsSection';

export function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ProductsSection />
      </main>
      <Footer />
    </div>
  );
}