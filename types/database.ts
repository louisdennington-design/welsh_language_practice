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
      user_card_state: {
        Row: {
          created_at: string;
          in_stack: boolean;
          status: Database['public']['Enums']['card_state_status'];
          updated_at: string;
          user_id: string;
          word_id: number;
        };
        Insert: {
          created_at?: string;
          in_stack?: boolean;
          status?: Database['public']['Enums']['card_state_status'];
          updated_at?: string;
          user_id: string;
          word_id: number;
        };
        Update: {
          created_at?: string;
          in_stack?: boolean;
          status?: Database['public']['Enums']['card_state_status'];
          updated_at?: string;
          user_id?: string;
          word_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_card_state_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_card_state_word_id_fkey';
            columns: ['word_id'];
            isOneToOne: false;
            referencedRelation: 'lexicon';
            referencedColumns: ['id'];
          },
        ];
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
      user_queue_state: {
        Row: {
          created_at: string;
          cursor: number;
          focus_key: string;
          last_session_seed: number | null;
          queue: number[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          cursor?: number;
          focus_key: string;
          last_session_seed?: number | null;
          queue?: number[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          cursor?: number;
          focus_key?: string;
          last_session_seed?: number | null;
          queue?: number[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_queue_state_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_stats: {
        Row: {
          category_progress: Json;
          created_at: string;
          current_streak: number;
          grace_days_used: number;
          last_session_date: string | null;
          longest_streak: number;
          session_history: Json | null;
          total_learned: number;
          total_reviewed: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_progress?: Json;
          created_at?: string;
          current_streak?: number;
          grace_days_used?: number;
          last_session_date?: string | null;
          longest_streak?: number;
          session_history?: Json | null;
          total_learned?: number;
          total_reviewed?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_progress?: Json;
          created_at?: string;
          current_streak?: number;
          grace_days_used?: number;
          last_session_date?: string | null;
          longest_streak?: number;
          session_history?: Json | null;
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
      translation_feedback: {
        Row: {
          created_at: string;
          english_1: string;
          id: number;
          theme: string | null;
          user_id: string | null;
          welsh_lc: string;
          word_id: number;
        };
        Insert: {
          created_at?: string;
          english_1: string;
          id?: number;
          theme?: string | null;
          user_id?: string | null;
          welsh_lc: string;
          word_id: number;
        };
        Update: {
          created_at?: string;
          english_1?: string;
          id?: number;
          theme?: string | null;
          user_id?: string | null;
          welsh_lc?: string;
          word_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'translation_feedback_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'translation_feedback_word_id_fkey';
            columns: ['word_id'];
            isOneToOne: false;
            referencedRelation: 'lexicon';
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
      lexicon: {
        Row: {
          english_1: string | null;
          english_2: string | null;
          english_3: string | null;
          id: number;
          spacy_pos_1: string | null;
          spacy_pos_2: string | null;
          spacy_pos_3: string | null;
          welsh: string | null;
          welsh_frequency: number | null;
          welsh_lc: string | null;
          welsh_zipf: number | null;
          wordnet_lexnames_1: string | null;
          wordnet_lexnames_2: string | null;
          wordnet_lexnames_3: string | null;
          wordnet_pos_tags_1: string | null;
          wordnet_pos_tags_2: string | null;
          wordnet_pos_tags_3: string | null;
          wordnet_themes_1: string | null;
          wordnet_themes_reduced: string[] | null;
          wordnet_themes_2: string | null;
          wordnet_themes_3: string | null;
        };
        Insert: {
          english_1?: string | null;
          english_2?: string | null;
          english_3?: string | null;
          id?: number;
          spacy_pos_1?: string | null;
          spacy_pos_2?: string | null;
          spacy_pos_3?: string | null;
          welsh?: string | null;
          welsh_frequency?: number | null;
          welsh_lc?: string | null;
          welsh_zipf?: number | null;
          wordnet_lexnames_1?: string | null;
          wordnet_lexnames_2?: string | null;
          wordnet_lexnames_3?: string | null;
          wordnet_pos_tags_1?: string | null;
          wordnet_pos_tags_2?: string | null;
          wordnet_pos_tags_3?: string | null;
          wordnet_themes_1?: string | null;
          wordnet_themes_reduced?: string[] | null;
          wordnet_themes_2?: string | null;
          wordnet_themes_3?: string | null;
        };
        Update: {
          english_1?: string | null;
          english_2?: string | null;
          english_3?: string | null;
          id?: number;
          spacy_pos_1?: string | null;
          spacy_pos_2?: string | null;
          spacy_pos_3?: string | null;
          welsh?: string | null;
          welsh_frequency?: number | null;
          welsh_lc?: string | null;
          welsh_zipf?: number | null;
          wordnet_lexnames_1?: string | null;
          wordnet_lexnames_2?: string | null;
          wordnet_lexnames_3?: string | null;
          wordnet_pos_tags_1?: string | null;
          wordnet_pos_tags_2?: string | null;
          wordnet_pos_tags_3?: string | null;
          wordnet_themes_1?: string | null;
          wordnet_themes_reduced?: string[] | null;
          wordnet_themes_2?: string | null;
          wordnet_themes_3?: string | null;
        };
        Relationships: [];
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
      card_state_status: 'active' | 'removed';
      progress_status: 'new' | 'learning' | 'learned' | 'failed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
