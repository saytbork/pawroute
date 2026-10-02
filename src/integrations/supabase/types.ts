export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      booking_events: {
        Row: {
          booking_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          message: string;
        };
        Insert: {
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          message: string;
        };
        Update: {
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          message?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          address: string | null;
          behavior_notes: string | null;
          block_end: string | null;
          breed: string | null;
          buffer_min: number;
          confirmation_email_status: string;
          contact_consent: boolean;
          created_at: string;
          customer_name: string;
          deposit_required: number | null;
          dog_name: string;
          duration_min: number;
          email: string;
          estimated_price: number | null;
          id: string;
          is_demo: boolean;
          lat: number | null;
          lng: number | null;
          manage_token: string;
          needs_review: boolean;
          original_message: string | null;
          phone: string | null;
          postal_code: string | null;
          preferred_window: string | null;
          reminder_sent_at: string | null;
          reminder_status: string | null;
          reschedule_count: number;
          review_decision: string | null;
          review_reasons: string[];
          review_resolved_at: string | null;
          route_metadata: Json;
          route_status: string;
          scheduled_end: string | null;
          scheduled_start: string | null;
          service: string;
          status: string;
          updated_at: string;
          weight_lb: number | null;
        };
        Insert: {
          address?: string | null;
          behavior_notes?: string | null;
          block_end?: string | null;
          breed?: string | null;
          buffer_min?: number;
          confirmation_email_status?: string;
          contact_consent?: boolean;
          created_at?: string;
          customer_name: string;
          deposit_required?: number | null;
          dog_name: string;
          duration_min?: number;
          email: string;
          estimated_price?: number | null;
          id?: string;
          is_demo?: boolean;
          lat?: number | null;
          lng?: number | null;
          manage_token?: string;
          needs_review?: boolean;
          original_message?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          preferred_window?: string | null;
          reminder_sent_at?: string | null;
          reminder_status?: string | null;
          reschedule_count?: number;
          review_decision?: string | null;
          review_reasons?: string[];
          review_resolved_at?: string | null;
          route_metadata?: Json;
          route_status?: string;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          service: string;
          status?: string;
          updated_at?: string;
          weight_lb?: number | null;
        };
        Update: {
          address?: string | null;
          behavior_notes?: string | null;
          block_end?: string | null;
          breed?: string | null;
          buffer_min?: number;
          confirmation_email_status?: string;
          contact_consent?: boolean;
          created_at?: string;
          customer_name?: string;
          deposit_required?: number | null;
          dog_name?: string;
          duration_min?: number;
          email?: string;
          estimated_price?: number | null;
          id?: string;
          is_demo?: boolean;
          lat?: number | null;
          lng?: number | null;
          manage_token?: string;
          needs_review?: boolean;
          original_message?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          preferred_window?: string | null;
          reminder_sent_at?: string | null;
          reminder_status?: string | null;
          reschedule_count?: number;
          review_decision?: string | null;
          review_reasons?: string[];
          review_resolved_at?: string | null;
          route_metadata?: Json;
          route_status?: string;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          service?: string;
          status?: string;
          updated_at?: string;
          weight_lb?: number | null;
        };
        Relationships: [];
      };
      geocode_cache: {
        Row: {
          created_at: string;
          label: string | null;
          lat: number;
          lng: number;
          query: string;
        };
        Insert: {
          created_at?: string;
          label?: string | null;
          lat: number;
          lng: number;
          query: string;
        };
        Update: {
          created_at?: string;
          label?: string | null;
          lat?: number;
          lng?: number;
          query?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_first_owner: { Args: never; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      owner_seat_taken: { Args: never; Returns: boolean };
    };
    Enums: {
      app_role: "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const;