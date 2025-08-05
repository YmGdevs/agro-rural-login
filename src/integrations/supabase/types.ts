export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      export_applications: {
        Row: {
          application_type: string
          approval_comments: string | null
          created_at: string
          destination_country: string
          estimated_value: number | null
          exporter_id: string
          id: string
          products: string[]
          quantity_kg: number | null
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          application_type?: string
          approval_comments?: string | null
          created_at?: string
          destination_country: string
          estimated_value?: number | null
          exporter_id: string
          id?: string
          products: string[]
          quantity_kg?: number | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          application_type?: string
          approval_comments?: string | null
          created_at?: string
          destination_country?: string
          estimated_value?: number | null
          exporter_id?: string
          id?: string
          products?: string[]
          quantity_kg?: number | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_applications_exporter_id_fkey"
            columns: ["exporter_id"]
            isOneToOne: false
            referencedRelation: "exporters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      export_certificates: {
        Row: {
          application_id: string
          certificate_number: string
          certificate_pdf_url: string | null
          certificate_type: string
          created_at: string
          expiry_date: string
          id: string
          issued_by: string
          issued_date: string
          qr_code_data: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          certificate_number: string
          certificate_pdf_url?: string | null
          certificate_type?: string
          created_at?: string
          expiry_date: string
          id?: string
          issued_by: string
          issued_date?: string
          qr_code_data?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          certificate_number?: string
          certificate_pdf_url?: string | null
          certificate_type?: string
          created_at?: string
          expiry_date?: string
          id?: string
          issued_by?: string
          issued_date?: string
          qr_code_data?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_certificates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "export_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      export_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          exporter_id: string
          file_size: number | null
          file_url: string
          id: string
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          upload_date: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          exporter_id: string
          file_size?: number | null
          file_url: string
          id?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          upload_date?: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          exporter_id?: string
          file_size?: number | null
          file_url?: string
          id?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          upload_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_documents_exporter_id_fkey"
            columns: ["exporter_id"]
            isOneToOne: false
            referencedRelation: "exporters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exporters: {
        Row: {
          company_address: string | null
          company_name: string
          company_nuit: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          export_products: string[] | null
          id: string
          registration_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_name: string
          company_nuit: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          export_products?: string[] | null
          id?: string
          registration_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_name?: string
          company_nuit?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          export_products?: string[] | null
          id?: string
          registration_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loan_requests: {
        Row: {
          amount: number | null
          community_consent: boolean
          created_at: string
          description: string | null
          extensionista_id: string
          id: string
          item_description: string | null
          justification: string
          loan_type: string
          producer_id: string
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          community_consent?: boolean
          created_at?: string
          description?: string | null
          extensionista_id: string
          id?: string
          item_description?: string | null
          justification: string
          loan_type: string
          producer_id: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          community_consent?: boolean
          created_at?: string
          description?: string | null
          extensionista_id?: string
          id?: string
          item_description?: string | null
          justification?: string
          loan_type?: string
          producer_id?: string
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_loan_requests_extensionista"
            columns: ["extensionista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_loan_requests_producer"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_loan_requests_reviewer"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas: {
        Row: {
          area_metros_quadrados: number | null
          coordenadas: Json
          created_at: string
          id: string
          nome: string
          perimetro_metros: number | null
          produtor_id: string
          updated_at: string
        }
        Insert: {
          area_metros_quadrados?: number | null
          coordenadas: Json
          created_at?: string
          id?: string
          nome: string
          perimetro_metros?: number | null
          produtor_id: string
          updated_at?: string
        }
        Update: {
          area_metros_quadrados?: number | null
          coordenadas?: Json
          created_at?: string
          id?: string
          nome?: string
          perimetro_metros?: number | null
          produtor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      producers: {
        Row: {
          created_at: string
          documento_url: string | null
          extensionista_id: string | null
          genero: string
          id: string
          idade: number
          nome_completo: string
          nuit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          documento_url?: string | null
          extensionista_id?: string | null
          genero: string
          id?: string
          idade: number
          nome_completo: string
          nuit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          documento_url?: string | null
          extensionista_id?: string | null
          genero?: string
          id?: string
          idade?: number
          nome_completo?: string
          nuit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "producers_extensionista_id_fkey"
            columns: ["extensionista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          full_name: string | null
          id: string
          region: string | null
          role: Database["public"]["Enums"]["app_role"]
          territory: Json | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          territory?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          territory?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      regional_capacity: {
        Row: {
          average_loan_amount: number | null
          created_at: string
          id: string
          region: string
          success_rate: number | null
          total_area_m2: number | null
          total_parcelas: number | null
          total_producers: number | null
          updated_at: string
        }
        Insert: {
          average_loan_amount?: number | null
          created_at?: string
          id?: string
          region: string
          success_rate?: number | null
          total_area_m2?: number | null
          total_parcelas?: number | null
          total_producers?: number | null
          updated_at?: string
        }
        Update: {
          average_loan_amount?: number | null
          created_at?: string
          id?: string
          region?: string
          success_rate?: number | null
          total_area_m2?: number | null
          total_parcelas?: number | null
          total_producers?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          created_at: string
          id: string
          loan_request_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          updated_at: string
          voucher_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          loan_request_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          updated_at?: string
          voucher_code: string
        }
        Update: {
          created_at?: string
          id?: string
          loan_request_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          updated_at?: string
          voucher_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_vouchers_loan_request"
            columns: ["loan_request_id"]
            isOneToOne: true
            referencedRelation: "loan_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_certificate_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_voucher_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_extensionistas_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          username: string
          created_at: string
          updated_at: string
          producers_count: number
          parcelas_count: number
          total_area_m2: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "extensionista"
        | "admin"
        | "backoffice"
        | "empresa_fomentadora"
        | "agrodealer"
        | "exportador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "extensionista",
        "admin",
        "backoffice",
        "empresa_fomentadora",
        "agrodealer",
        "exportador",
      ],
    },
  },
} as const
