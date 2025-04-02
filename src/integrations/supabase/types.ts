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
          result: Json | null
          session_id: string | null
          status: string | null
          status_message: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          id?: string | null
          model?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          file_path?: string | null
          id?: string | null
          model?: string | null
          result?: Json | null
          session_id?: string | null
          status?: string | null
          status_message?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
