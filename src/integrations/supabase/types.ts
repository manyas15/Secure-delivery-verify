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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      delivery_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          metadata: Json | null
          order_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          order_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agent_id: string | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_address: string
          gps_location: Json | null
          id: string
          items: Json
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_address: string
          gps_location?: Json | null
          id?: string
          items?: Json
          order_number: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: string
          gps_location?: Json | null
          id?: string
          items?: Json
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          attempts: number | null
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          is_verified: boolean | null
          order_id: string
          otp_code: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          is_verified?: boolean | null
          order_id: string
          otp_code: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          order_id?: string
          otp_code?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_verifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agent_id: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          agent_id: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
          order_id: string
          qr_data: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          order_id: string
          qr_data: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          order_id?: string
          qr_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      order_status:
        | "pending"
        | "assigned"
        | "in_transit"
        | "qr_generated"
        | "delivered"
        | "verified"
      user_role: "admin" | "agent" | "customer"
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
      order_status: [
        "pending",
        "assigned",
        "in_transit",
        "qr_generated",
        "delivered",
        "verified",
      ],
      user_role: ["admin", "agent", "customer"],
    },
  },
} as const
