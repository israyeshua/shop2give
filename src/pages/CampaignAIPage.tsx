import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CreateCampaignChat } from '../components/Campaign/CreateCampaignChat';
import { CategorySuggestion } from '../components/Campaign/CategorySuggestion';
import { useAuth } from '../lib/auth';
import { type CategorySuggestion as CategorySuggestionType } from '../lib/categoryDetection';

type CampaignData = {
  title: string;
  description: string;
  goalAmount: number;
  category: string;
  imageUrl?: string;
};

export function CampaignAIPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaignData, setCampaignData] = useState<CampaignData>({
    title: '',
    description: '',
    goalAmount: 0,
    category: '',
  });
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestionType | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleChatUpdate = (data: Partial<CampaignData>) => {
    setCampaignData(prev => ({ ...prev, ...data }));
  };

  const handleCategoryDetected = (category: string) => {
    if (categorySuggestion && categorySuggestion.category === category) {
      // If we already have this category suggestion, don't override it
      return;
    }
    // Temporary placeholder - in a real implementation, you'd get the full suggestion object
    setCategorySuggestion({
      category: category as any,
      confidence: 85,
      keywords: []
    });
  };

  const handleAcceptCategory = (category: string) => {
    setCampaignData(prev => ({ ...prev, category }));
    setCategorySuggestion(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <CreateCampaignChat 
              onUpdateForm={handleChatUpdate} 
              onCategoryDetected={handleCategoryDetected}
            />
            {categorySuggestion && (
              <div className="mt-4">
                <CategorySuggestion 
                  suggestion={categorySuggestion} 
                  onAccept={handleAcceptCategory} 
                />
              </div>
            )}
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Campaign Preview</h2>
            {campaignData.title && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-brand-teal">
                  {campaignData.title}
                </h1>
                {campaignData.imageUrl && (
                  <img
                    src={campaignData.imageUrl}
                    alt={campaignData.title}
                    className="h-48 w-full rounded-lg object-cover"
                  />
                )}
                <p className="text-gray-600">{campaignData.description}</p>
                {campaignData.goalAmount > 0 && (
                  <div className="rounded-lg bg-brand-pink/30 p-4">
                    <p className="text-lg font-bold text-brand-teal">
                      Goal: €{campaignData.goalAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                {campaignData.category && (
                  <div className="inline-block rounded-full bg-brand-teal/10 px-3 py-1 text-sm font-medium text-brand-teal">
                    {campaignData.category}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}