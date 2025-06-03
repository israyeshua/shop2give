import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserRole {
  id: string;
  userId: string;
  role: 'admin' | 'campaign_manager' | 'charity_owner' | 'contributor';
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Service for Supabase user operations
 */
export class SupabaseUsersService {
  /**
   * Gets the current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Gets the profile for a user
   */
  static async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Creates a new profile for a user
   */
  static async createUserProfile(profile: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  /**
   * Updates a user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<Profile>): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets roles for a user
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('userId', userId);
      
      if (error) throw error;
      return data?.map(role => role.role) || [];
    } catch (error) {
      console.error(`Error fetching roles for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Assigns a role to a user
   */
  static async assignUserRole(userId: string, role: 'admin' | 'charity_owner' | 'user'): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          userId,
          role,
          createdAt: new Date().toISOString()
        }]);
      
      if (error) throw error;
    } catch (error) {
      console.error(`Error assigning role ${role} to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Updates a user's role
   */
  static async updateUserRole(roleId: string, role: 'admin' | 'charity_owner' | 'user'): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          role,
          updatedAt: new Date().toISOString()
        })
        .eq('id', roleId);
      
      if (error) throw error;
    } catch (error) {
      console.error(`Error updating role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Removes a role from a user
   */
  static async removeUserRole(roleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    } catch (error) {
      console.error(`Error removing role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Gets all users with a particular role
   */
  static async getUsersByRole(role: 'admin' | 'charity_owner' | 'user'): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', role);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      return [];
    }
  }
}
