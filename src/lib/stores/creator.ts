import { create } from 'zustand';
import { supabase } from '../supabase';
import { useAuth } from '../auth';

interface Creator {
  id: string;
  user_id: string;
  business_name: string;
  description: string | null;
  profile_image_url: string | null;
  stripe_connect_id: string | null;
  is_verified: boolean;
}

interface CreatorStore {
  creator: Creator | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  updateProfile: (data: Partial<Creator>) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<string>;
}

export const useCreator = create<CreatorStore>((set, get) => ({
  creator: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    const user = useAuth.getState().user;
    if (!user) return;

    try {
      set({ isLoading: true, error: null });
      
      const { data: creator, error } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      set({ creator, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const user = useAuth.getState().user;
    if (!user) throw new Error('Not authenticated');

    try {
      set({ isLoading: true, error: null });
      
      const { data: updatedCreator, error } = await supabase
        .from('creators')
        .update(data)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      set({ creator: updatedCreator, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  uploadProfileImage: async (file: File) => {
    const user = useAuth.getState().user;
    if (!user) throw new Error('Not authenticated');

    try {
      set({ isLoading: true, error: null });
      
      const fileExt = file.name.split('.').pop();
      const filePath = \`${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('creator-profiles')
        .getPublicUrl(filePath);

      await get().updateProfile({ profile_image_url: publicUrl });
      
      return publicUrl;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));