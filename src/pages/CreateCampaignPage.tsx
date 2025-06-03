import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CreateCampaignChat } from '../components/campaign/CreateCampaignChat';
import { CampaignForm } from '../components/Campaign/CampaignForm';
import { useAuth } from '../lib/auth';

export function CreateCampaignPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: 0,
    category: '',
  });

  // Redirect to auth page if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleChatUpdate = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  if (!user) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Campaign</h1>
          <p className="mt-2 text-gray-600">
            Let our AI assistant help you create a compelling campaign
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <CreateCampaignChat onUpdateForm={handleChatUpdate} />
          </div>
          <div>
            <CampaignForm initialData={formData} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}