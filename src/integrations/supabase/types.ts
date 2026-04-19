export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          comissao_por_numero: number
          debito_api_token: string | null
          id: string
          updated_at: string
          wallet_card: string | null
          wallet_emola: string | null
          wallet_mpesa: string | null
        }
        Insert: {
          comissao_por_numero?: number
          debito_api_token?: string | null
          id?: string
          updated_at?: string
          wallet_card?: string | null
          wallet_emola?: string | null
          wallet_mpesa?: string | null
        }
        Update: {
          comissao_por_numero?: number
          debito_api_token?: string | null
          id?: string
          updated_at?: string
          wallet_card?: string | null
          wallet_emola?: string | null
          wallet_mpesa?: string | null
        }
        Relationships: []
      }
      affiliate_sales: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          lottery_id: string
          origem: string
          purchase_id: string
          quantidade: number
          valor_comissao: number
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          lottery_id: string
          origem?: string
          purchase_id: string
          quantidade: number
          valor_comissao: number
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          lottery_id?: string
          origem?: string
          purchase_id?: string
          quantidade?: number
          valor_comissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sales_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_sales_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          codigo: string
          criado_em: string
          email: string | null
          id: string
          metodo_pagamento: string | null
          nome: string
          saldo: number
          status: string
          telefone: string
          total_comissao: number
          total_vendas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo: string
          criado_em?: string
          email?: string | null
          id?: string
          metodo_pagamento?: string | null
          nome: string
          saldo?: number
          status?: string
          telefone: string
          total_comissao?: number
          total_vendas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo?: string
          criado_em?: string
          email?: string | null
          id?: string
          metodo_pagamento?: string | null
          nome?: string
          saldo?: number
          status?: string
          telefone?: string
          total_comissao?: number
          total_vendas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lotteries: {
        Row: {
          criado_em: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          numeros_vendidos: number
          preco_numero: number
          premios: Json | null
          status: string
          total_numeros: number
        }
        Insert: {
          criado_em?: string
          data_fim: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          numeros_vendidos?: number
          preco_numero?: number
          premios?: Json | null
          status?: string
          total_numeros?: number
        }
        Update: {
          criado_em?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          numeros_vendidos?: number
          preco_numero?: number
          premios?: Json | null
          status?: string
          total_numeros?: number
        }
        Relationships: []
      }
      lottery_numbers: {
        Row: {
          expires_at: string | null
          id: string
          lottery_id: string
          numero: string
          reserved_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          lottery_id: string
          numero: string
          reserved_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          lottery_id?: string
          numero?: string
          reserved_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lottery_numbers_lottery_id_fkey"
            columns: ["lottery_id"]
            isOneToOne: false
            referencedRelation: "lotteries"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_results: {
        Row: {
          drawn_at: string
          id: string
          lottery_id: string
          prize_info: Json | null
          winner_name: string | null
          winner_phone: string | null
          winner_user_id: string | null
          winning_number: string
        }
        Insert: {
          drawn_at?: string
          id?: string
          lottery_id: string
          prize_info?: Json | null
          winner_name?: string | null
          winner_phone?: string | null
          winner_user_id?: string | null
          winning_number: string
        }
        Update: {
          drawn_at?: string
          id?: string
          lottery_id?: string
          prize_info?: Json | null
          winner_name?: string | null
          winner_phone?: string | null
          winner_user_id?: string | null
          winning_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "lottery_results_lottery_id_fkey"
            columns: ["lottery_id"]
            isOneToOne: false
            referencedRelation: "lotteries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          criado_em: string
          email: string
          id: string
          nome_completo: string
          telefone: string
        }
        Insert: {
          criado_em?: string
          email: string
          id: string
          nome_completo: string
          telefone: string
        }
        Update: {
          criado_em?: string
          email?: string
          id?: string
          nome_completo?: string
          telefone?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          affiliate_code: string | null
          comprovativo_url: string | null
          created_at: string
          id: string
          lottery_id: string
          metodo: string
          numeros: Json
          quantidade: number
          status: string
          telefone: string
          user_id: string
          valor_total: number
          whatsapp: string | null
        }
        Insert: {
          affiliate_code?: string | null
          comprovativo_url?: string | null
          created_at?: string
          id?: string
          lottery_id: string
          metodo: string
          numeros?: Json
          quantidade: number
          status?: string
          telefone: string
          user_id: string
          valor_total: number
          whatsapp?: string | null
        }
        Update: {
          affiliate_code?: string | null
          comprovativo_url?: string | null
          created_at?: string
          id?: string
          lottery_id?: string
          metodo?: string
          numeros?: Json
          quantidade?: number
          status?: string
          telefone?: string
          user_id?: string
          valor_total?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_lottery_id_fkey"
            columns: ["lottery_id"]
            isOneToOne: false
            referencedRelation: "lotteries"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          debito_reference: string | null
          id: string
          metodo: string
          msisdn: string
          purchase_id: string
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debito_reference?: string | null
          id?: string
          metodo: string
          msisdn: string
          purchase_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debito_reference?: string | null
          id?: string
          metodo?: string
          msisdn?: string
          purchase_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          affiliate_id: string
          conta_destino: string | null
          created_at: string
          id: string
          metodo: string
          notas: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          affiliate_id: string
          conta_destino?: string | null
          created_at?: string
          id?: string
          metodo: string
          notas?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          affiliate_id?: string
          conta_destino?: string | null
          created_at?: string
          id?: string
          metodo?: string
          notas?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      affiliate_ranking: {
        Row: {
          codigo: string | null
          id: string | null
          nome: string | null
          total_comissao: number | null
          total_vendas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_affiliate_code: { Args: never; Returns: string }
      generate_lottery_numbers: {
        Args: { p_lottery_id: string; p_total: number }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
