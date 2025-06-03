
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CampaignsSection } from '../components/CampaignsSection';

export function CampaignsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <CampaignsSection />
      </main>
      <Footer />
    </div>
  );
}