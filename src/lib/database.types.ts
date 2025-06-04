export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          role: 'creator' | 'cause' | 'customer' | 'admin'
          profile_data: Json
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'creator' | 'cause' | 'customer' | 'admin'
          profile_data?: Json
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'creator' | 'cause' | 'customer' | 'admin'
          profile_data?: Json
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      creators: {
        Row: {
          id: string
          user_id: string
          business_name: string
          description: string | null
          profile_image_url: string | null
          stripe_connect_id: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          description?: string | null
          profile_image_url?: string | null
          stripe_connect_id?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          description?: string | null
          profile_image_url?: string | null
          stripe_connect_id?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      causes: {
        Row: {
          id: string
          user_id: string
          organization_name: string
          mission_statement: string | null
          tax_id: string | null
          verification_status: 'pending' | 'verified' | 'rejected'
          stripe_connect_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name: string
          mission_statement?: string | null
          tax_id?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          stripe_connect_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string
          mission_statement?: string | null
          tax_id?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          stripe_connect_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'creator' | 'cause' | 'customer' | 'admin'
      verification_status: 'pending' | 'verified' | 'rejected'
      order_status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
    }
  }
}