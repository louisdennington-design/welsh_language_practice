export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          created_at: string;
          due_date: string | null;
          easiness_factor: number;
          interval: number;
          last_reviewed: string | null;
          repetitions: number;
          review_count: number;
          status: Database['public']['Enums']['progress_status'];
          updated_at: string;
          user_id: string;
          word_id: string;
        };
        Insert: {
          created_at?: string;
          due_date?: string | null;
          easiness_factor?: number;
          interval?: number;
          last_reviewed?: string | null;
          repetitions?: number;
          review_count?: number;
          status?: Database['public']['Enums']['progress_status'];
          updated_at?: string;
          user_id: string;
          word_id: string;
        };
        Update: {
          created_at?: string;
          due_date?: string | null;
          easiness_factor?: number;
          interval?: number;
          last_reviewed?: string | null;
          repetitions?: number;
          review_count?: number;
          status?: Database['public']['Enums']['progress_status'];
          updated_at?: string;
          user_id?: string;
          word_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_progress_word_id_fkey';
            columns: ['word_id'];
            isOneToOne: false;
            referencedRelation: 'words';
            referencedColumns: ['id'];
          },
        ];
      };
      user_stats: {
        Row: {
          created_at: string;
          current_streak: number;
          grace_days_used: number;
          last_session_date: string | null;
          longest_streak: number;
          total_learned: number;
          total_reviewed: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_streak?: number;
          grace_days_used?: number;
          last_session_date?: string | null;
          longest_streak?: number;
          total_learned?: number;
          total_reviewed?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_streak?: number;
          grace_days_used?: number;
          last_session_date?: string | null;
          longest_streak?: number;
          total_learned?: number;
          total_reviewed?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_stats_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      word_categories: {
        Row: {
          category_id: string;
          created_at: string;
          word_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          word_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          word_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'word_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'word_categories_word_id_fkey';
            columns: ['word_id'];
            isOneToOne: false;
            referencedRelation: 'words';
            referencedColumns: ['id'];
          },
        ];
      };
      words: {
        Row: {
          created_at: string;
          english: string;
          frequency_rank: number | null;
          id: string;
          legacy_type: string;
          notes: string | null;
          part_of_speech: string;
          welsh: string;
        };
        Insert: {
          created_at?: string;
          english: string;
          frequency_rank?: number | null;
          id?: string;
          legacy_type: string;
          notes?: string | null;
          part_of_speech: string;
          welsh: string;
        };
        Update: {
          created_at?: string;
          english?: string;
          frequency_rank?: number | null;
          id?: string;
          legacy_type?: string;
          notes?: string | null;
          part_of_speech?: string;
          welsh?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      progress_status: 'new' | 'learning' | 'learned' | 'failed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
