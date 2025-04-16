export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      brightcove_publications: {
        Row: {
          brightcove_master_url: string | null
          brightcove_response: Json | null
          created_at: string
          id: string
          is_published: boolean | null
          model_id: string | null
          model_name: string
          session_id: string
          transcription_url: string | null
          updated_at: string
          video_id: string
        }
        Insert: {
          brightcove_master_url?: string | null
          brightcove_response?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          model_id?: string | null
          model_name: string
          session_id: string
          transcription_url?: string | null
          updated_at?: string
          video_id: string
        }
        Update: {
          brightcove_master_url?: string | null
          brightcove_response?: Json | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          model_id?: string | null
          model_name?: string
          session_id?: string
          transcription_url?: string | null
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brightcove_publications_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "transcription_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brightcove_publications_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "transcriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brightcove_publications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "transcription_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_uploads: {
        Row: {
          brightcove_response: Json | null
          brightcove_track_id: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string
          language: string
          s3_key: string
          s3_url: string
          video_id: string
        }
        Insert: {
          brightcove_response?: Json | null
          brightcove_track_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          language: string
          s3_key: string
          s3_url: string
          video_id: string
        }
        Update: {
          brightcove_response?: Json | null
          brightcove_track_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          language?: string
          s3_key?: string
          s3_url?: string
          video_id?: string
        }
        Relationships: []
      }
      case_confidential_info: {
        Row: {
          ahmed_spending: number
          case_id: string | null
          case_name: string
          created_at: string | null
          id: string
          is_zakah: boolean
          refer_name: string
        }
        Insert: {
          ahmed_spending?: number
          case_id?: string | null
          case_name: string
          created_at?: string | null
          id?: string
          is_zakah?: boolean
          refer_name: string
        }
        Update: {
          ahmed_spending?: number
          case_id?: string | null
          case_name?: string
          created_at?: string | null
          id?: string
          is_zakah?: boolean
          refer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_confidential_info_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_private_spending: {
        Row: {
          amount: number
          case_id: string | null
          created_at: string | null
          description: string | null
          id: string
        }
        Insert: {
          amount: number
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_private_spending_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tags: {
        Row: {
          case_id: string
          tag_id: string
        }
        Insert: {
          case_id: string
          tag_id: string
        }
        Update: {
          case_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_tags_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          created_at: string
          description: string
          description_ar: string
          id: string
          is_published: boolean
          monthly_cost: number
          months_covered: number
          months_needed: number
          photo_url: string | null
          short_description: string
          short_description_ar: string
          status: string
          title: string
          title_ar: string
          total_secured_money: number | null
        }
        Insert: {
          created_at?: string
          description: string
          description_ar: string
          id?: string
          is_published?: boolean
          monthly_cost: number
          months_covered?: number
          months_needed: number
          photo_url?: string | null
          short_description: string
          short_description_ar: string
          status?: string
          title: string
          title_ar: string
          total_secured_money?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          description_ar?: string
          id?: string
          is_published?: boolean
          monthly_cost?: number
          months_covered?: number
          months_needed?: number
          photo_url?: string | null
          short_description?: string
          short_description_ar?: string
          status?: string
          title?: string
          title_ar?: string
          total_secured_money?: number | null
        }
        Relationships: []
      }
      charity_events: {
        Row: {
          collected_money: number
          contributors_count: number
          created_at: string
          date: string
          description: string
          description_ar: string
          id: string
          is_published: boolean
          name: string
          name_ar: string
          needed_money: number
          photo_url: string | null
        }
        Insert: {
          collected_money?: number
          contributors_count?: number
          created_at?: string
          date: string
          description: string
          description_ar: string
          id?: string
          is_published?: boolean
          name: string
          name_ar: string
          needed_money: number
          photo_url?: string | null
        }
        Update: {
          collected_money?: number
          contributors_count?: number
          created_at?: string
          date?: string
          description?: string
          description_ar?: string
          id?: string
          is_published?: boolean
          name?: string
          name_ar?: string
          needed_money?: number
          photo_url?: string | null
        }
        Relationships: []
      }
      cloud_storage_accounts: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expires_at: string | null
          id: string
          last_used: string | null
          name: string | null
          provider: string
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          last_used?: string | null
          name?: string | null
          provider: string
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          last_used?: string | null
          name?: string | null
          provider?: string
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fasela_program_feedbacks: {
        Row: {
          cohort: string | null
          created_at: string
          email: string
          feedback: string
          id: string
          name: string
          rating: number
        }
        Insert: {
          cohort?: string | null
          created_at?: string
          email: string
          feedback: string
          id?: string
          name: string
          rating: number
        }
        Update: {
          cohort?: string | null
          created_at?: string
          email?: string
          feedback?: string
          id?: string
          name?: string
          rating?: number
        }
        Relationships: []
      }
      pledges: {
        Row: {
          case_id: string
          cash_collected: boolean | null
          contributor_name: string
          email: string | null
          event_id: string | null
          generic_pledge: boolean | null
          id: string
          instapay_handle: string | null
          is_anonymous: boolean
          is_zakah: boolean | null
          money_collected: boolean | null
          months_pledged: number
          pledge_budget: number | null
          pledge_timestamp: string
        }
        Insert: {
          case_id: string
          cash_collected?: boolean | null
          contributor_name: string
          email?: string | null
          event_id?: string | null
          generic_pledge?: boolean | null
          id?: string
          instapay_handle?: string | null
          is_anonymous?: boolean
          is_zakah?: boolean | null
          money_collected?: boolean | null
          months_pledged: number
          pledge_budget?: number | null
          pledge_timestamp?: string
        }
        Update: {
          case_id?: string
          cash_collected?: boolean | null
          contributor_name?: string
          email?: string | null
          event_id?: string | null
          generic_pledge?: boolean | null
          id?: string
          instapay_handle?: string | null
          is_anonymous?: boolean
          is_zakah?: boolean | null
          money_collected?: boolean | null
          months_pledged?: number
          pledge_budget?: number | null
          pledge_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "pledges_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "charity_events"
            referencedColumns: ["id"]
          },
        ]
      }
      program_stats: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          key: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      soulmate_matching_preferences: {
        Row: {
          created_at: string
          education: string[] | null
          family_values: string[] | null
          id: string
          location: string | null
          max_age: number | null
          min_age: number | null
          religiosity: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education?: string[] | null
          family_values?: string[] | null
          id?: string
          location?: string | null
          max_age?: number | null
          min_age?: number | null
          religiosity?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education?: string[] | null
          family_values?: string[] | null
          id?: string
          location?: string | null
          max_age?: number | null
          min_age?: number | null
          religiosity?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      soulmate_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: []
      }
      soulmate_profile_photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      soulmate_user_connections: {
        Row: {
          created_at: string
          id: string
          liked_user_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_user_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_user_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      soulmate_user_profiles: {
        Row: {
          about_me: string | null
          age: number
          created_at: string
          education: string | null
          family_values: string | null
          gender: string
          id: string
          location: string
          name: string
          occupation: string | null
          religiosity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about_me?: string | null
          age: number
          created_at?: string
          education?: string | null
          family_values?: string | null
          gender: string
          id?: string
          location: string
          name: string
          occupation?: string | null
          religiosity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about_me?: string | null
          age?: number
          created_at?: string
          education?: string | null
          family_values?: string | null
          gender?: string
          id?: string
          location?: string
          name?: string
          occupation?: string | null
          religiosity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          payment_data: Json | null
          payment_provider: string
          status: string
          transaction_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_data?: Json | null
          payment_provider: string
          status?: string
          transaction_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_data?: Json | null
          payment_provider?: string
          status?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          cohort: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          story: string
          updated_at: string
        }
        Insert: {
          cohort?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          story: string
          updated_at?: string
        }
        Update: {
          cohort?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          story?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      transcription_exports: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          format: string
          id: string
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          format: string
          id?: string
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          format?: string
          id?: string
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      transcription_integrations: {
        Row: {
          created_at: string | null
          id: string
          key_name: string
          key_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_name: string
          key_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_name?: string
          key_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transcription_sessions: {
        Row: {
          accepted_model_id: string | null
          audio_file_name: string | null
          created_at: string
          id: string
          last_updated: string
          prompt_config: Json | null
          prompt_text: string | null
          selected_model: string | null
          selected_models: string[]
          selected_transcription: string | null
          selected_transcription_url: string | null
          transcriptions: Json
          user_id: string
          video_id: string | null
          vtt_file_url: string | null
        }
        Insert: {
          accepted_model_id?: string | null
          audio_file_name?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          prompt_config?: Json | null
          prompt_text?: string | null
          selected_model?: string | null
          selected_models?: string[]
          selected_transcription?: string | null
          selected_transcription_url?: string | null
          transcriptions?: Json
          user_id: string
          video_id?: string | null
          vtt_file_url?: string | null
        }
        Update: {
          accepted_model_id?: string | null
          audio_file_name?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          prompt_config?: Json | null
          prompt_text?: string | null
          selected_model?: string | null
          selected_models?: string[]
          selected_transcription?: string | null
          selected_transcription_url?: string | null
          transcriptions?: Json
          user_id?: string
          video_id?: string | null
          vtt_file_url?: string | null
        }
        Relationships: []
      }
      transcriptions: {
        Row: {
          created_at: string
          error: string | null
          file_path: string
          id: string
          model: string
          prompt_text: string | null
          result: Json | null
          session_id: string | null
          status: string
          status_message: string | null
          updated_at: string
          user_id: string | null
          vtt_file_url: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          file_path: string
          id?: string
          model: string
          prompt_text?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string
          status_message?: string | null
          updated_at?: string
          user_id?: string | null
          vtt_file_url?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          file_path?: string
          id?: string
          model?: string
          prompt_text?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string
          status_message?: string | null
          updated_at?: string
          user_id?: string | null
          vtt_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "transcription_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_blocked?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      transcription_jobs: {
        Row: {
          created_at: string | null
          error: string | null
          file_path: string | null
          id: string | null
          model: string | null
          prompt_text: string | null
          result: Json | null
          session_id: string | null
          status: string | null
          status_message: string | null
          updated_at: string | null
          user_id: string | null
          vtt_file_url: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          id?: string | null
          model?: string | null
          prompt_text?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string | null
          vtt_file_url?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          id?: string | null
          model?: string | null
          prompt_text?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string | null
          vtt_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "transcription_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_action_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          count: number
        }[]
      }
      get_daily_signups: {
        Args: { days_back: number }
        Returns: {
          date: string
          count: number
        }[]
      }
      get_gender_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          gender: string
          count: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      track_user_action: {
        Args: { action_type: string; action_details: Json }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      user_role: ["user", "admin"],
    },
  },
} as const
