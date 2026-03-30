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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attribute_values: {
        Row: {
          attribute_id: string
          created_at: string | null
          id: string
          tenant_id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribute_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attributes: {
        Row: {
          created_at: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attributes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          id: string
          ip: string | null
          resource: string | null
          role: string | null
          tenant_id: string | null
          ua: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          resource?: string | null
          role?: string | null
          tenant_id?: string | null
          ua?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          resource?: string | null
          role?: string | null
          tenant_id?: string | null
          ua?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_alt: string | null
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_backup__20251112: {
        Row: {
          created_at: string | null
          id: string | null
          image_alt: string | null
          image_url: string | null
          name: string | null
          parent_id: string | null
          slug: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          image_alt?: string | null
          image_url?: string | null
          name?: string | null
          parent_id?: string | null
          slug?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          image_alt?: string | null
          image_url?: string | null
          name?: string | null
          parent_id?: string | null
          slug?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          content: Json
          id: string
          key: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          key: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          key?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          customer_id: string
          discount_cents: number
          id: string
          order_id: string | null
          redeemed_at: string
          tenant_id: string
        }
        Insert: {
          coupon_id: string
          customer_id: string
          discount_cents: number
          id?: string
          order_id?: string | null
          redeemed_at?: string
          tenant_id: string
        }
        Update: {
          coupon_id?: string
          customer_id?: string
          discount_cents?: number
          id?: string
          order_id?: string | null
          redeemed_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: Json
          code: string
          created_at: string
          id: string
          max_discount_cents: number | null
          min_order_cents: number | null
          per_user_limit: number | null
          status: string
          tenant_id: string
          total_redemptions_limit: number | null
          type: string
          valid_from: string | null
          valid_until: string | null
          value_cents: number | null
          value_percent: number | null
        }
        Insert: {
          applies_to?: Json
          code: string
          created_at?: string
          id?: string
          max_discount_cents?: number | null
          min_order_cents?: number | null
          per_user_limit?: number | null
          status?: string
          tenant_id: string
          total_redemptions_limit?: number | null
          type: string
          valid_from?: string | null
          valid_until?: string | null
          value_cents?: number | null
          value_percent?: number | null
        }
        Update: {
          applies_to?: Json
          code?: string
          created_at?: string
          id?: string
          max_discount_cents?: number | null
          min_order_cents?: number | null
          per_user_limit?: number | null
          status?: string
          tenant_id?: string
          total_redemptions_limit?: number | null
          type?: string
          valid_from?: string | null
          valid_until?: string | null
          value_cents?: number | null
          value_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          line1: string
          line2: string | null
          name: string | null
          phone: string | null
          pincode: string
          state: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          line1: string
          line2?: string | null
          name?: string | null
          phone?: string | null
          pincode: string
          state: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          line1?: string
          line2?: string | null
          name?: string | null
          phone?: string | null
          pincode?: string
          state?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          dob: string | null
          email: string
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          marketing_opt_in: boolean
          phone: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dob?: string | null
          email: string
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dob?: string | null
          email?: string
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      filter_presets: {
        Row: {
          created_at: string | null
          description: string | null
          filter_config: Json
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          filter_config?: Json
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          filter_config?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_presets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_settings: {
        Row: {
          auto_play: boolean
          auto_play_interval_ms: number
          bg_overlay_class: string | null
          created_at: string
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_play?: boolean
          auto_play_interval_ms?: number
          bg_overlay_class?: string | null
          created_at?: string
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_play?: boolean
          auto_play_interval_ms?: number
          bg_overlay_class?: string | null
          created_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          badge: string | null
          bg_overlay_class: string | null
          countdown: boolean | null
          countdown_end: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          description: string | null
          features: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          position: number
          sale_text: string | null
          subtitle: string | null
          tenant_id: string
          title: string | null
          updated_at: string
          urgency_text: string | null
        }
        Insert: {
          badge?: string | null
          bg_overlay_class?: string | null
          countdown?: boolean | null
          countdown_end?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          sale_text?: string | null
          subtitle?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string
          urgency_text?: string | null
        }
        Update: {
          badge?: string | null
          bg_overlay_class?: string | null
          countdown?: boolean | null
          countdown_end?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          position?: number
          sale_text?: string | null
          subtitle?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
          urgency_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hero_slides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_outbox: {
        Row: {
          attempts: number
          created_at: string
          event_key: string
          id: string
          next_retry_at: string | null
          payload: Json
          status: string
          tenant_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_key: string
          id?: string
          next_retry_at?: string | null
          payload: Json
          status?: string
          tenant_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_key?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_outbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      module_registry: {
        Row: {
          description: string | null
          metadata: Json
          module_key: string
          status: string
          version: string
        }
        Insert: {
          description?: string | null
          metadata?: Json
          module_key: string
          status: string
          version: string
        }
        Update: {
          description?: string | null
          metadata?: Json
          module_key?: string
          status?: string
          version?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal_cents: number
          tenant_id: string
          unit_price_cents: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          subtotal_cents: number
          tenant_id: string
          unit_price_cents: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal_cents?: number
          tenant_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_order"
            columns: ["order_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "fk_order_items_product"
            columns: ["product_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          email: string
          id: string
          order_source: string
          order_number: string
          payment_env: string
          payment_provider: string
          razorpay_order_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          total_cents: number
        }
        Insert: {
          created_at?: string
          currency?: string
          email: string
          id?: string
          order_source?: string
          order_number: string
          payment_env?: string
          payment_provider?: string
          razorpay_order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          total_cents: number
        }
        Update: {
          created_at?: string
          currency?: string
          email?: string
          id?: string
          order_source?: string
          order_number?: string
          payment_env?: string
          payment_provider?: string
          razorpay_order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id?: string
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          provider: string
          raw: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          provider: string
          raw: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          provider?: string
          raw?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_registry: {
        Row: {
          checksum: string | null
          interface_key: string
          metadata: Json
          plugin_key: string
          status: string
          version: string
        }
        Insert: {
          checksum?: string | null
          interface_key: string
          metadata?: Json
          plugin_key: string
          status: string
          version: string
        }
        Update: {
          checksum?: string | null
          interface_key?: string
          metadata?: Json
          plugin_key?: string
          status?: string
          version?: string
        }
        Relationships: []
      }
      portfolio_images: {
        Row: {
          alt: string | null
          id: string
          project_id: string
          sort_order: number
          tenant_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          id?: string
          project_id: string
          sort_order?: number
          tenant_id: string
          url: string
        }
        Update: {
          alt?: string | null
          id?: string
          project_id?: string
          sort_order?: number
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_portfolio_images_project"
            columns: ["project_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "portfolio_projects"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "portfolio_images_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_projects: {
        Row: {
          created_at: string
          description: string | null
          featured: boolean
          hero_image_url: string | null
          id: string
          location: string | null
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          location?: string | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          location?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attribute_values: {
        Row: {
          attribute_value_id: string
          created_at: string | null
          product_id: string
          tenant_id: string
        }
        Insert: {
          attribute_value_id: string
          created_at?: string | null
          product_id: string
          tenant_id: string
        }
        Update: {
          attribute_value_id?: string
          created_at?: string | null
          product_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_value_id_fkey"
            columns: ["attribute_value_id"]
            isOneToOne: false
            referencedRelation: "attribute_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          attribute_id: string
          created_at: string | null
          product_id: string
          tenant_id: string
        }
        Insert: {
          attribute_id: string
          created_at?: string | null
          product_id: string
          tenant_id: string
        }
        Update: {
          attribute_id?: string
          created_at?: string | null
          product_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attributes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          product_id: string
          tenant_id: string
        }
        Insert: {
          category_id: string
          product_id: string
          tenant_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_categories_category"
            columns: ["category_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "fk_product_categories_product"
            columns: ["product_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "product_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_drafts: {
        Row: {
          badge_color: string | null
          badge_display_from: string | null
          badge_display_until: string | null
          badge_priority: number | null
          category_id: string | null
          compare_at_price_cents: number | null
          created_at: string | null
          created_by: string | null
          custom_badge_text: string | null
          description: string | null
          draft_data: Json
          expires_at: string | null
          fashion_details: Json | null
          id: string
          images: Json | null
          is_bestseller: boolean | null
          is_featured: boolean | null
          is_limited_edition: boolean | null
          is_new_arrival: boolean | null
          is_on_sale: boolean | null
          is_sold_out: boolean | null
          low_stock_threshold: number | null
          meta_description: string | null
          meta_title: string | null
          name: string | null
          price_cents: number | null
          requires_shipping: boolean | null
          size_guide: Json | null
          sku: string | null
          slug: string | null
          stock: number | null
          tags: string[] | null
          tax_class_id: string | null
          tenant_id: string
          updated_at: string | null
          variants: Json | null
          weight_kg: number | null
        }
        Insert: {
          badge_color?: string | null
          badge_display_from?: string | null
          badge_display_until?: string | null
          badge_priority?: number | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_badge_text?: string | null
          description?: string | null
          draft_data: Json
          expires_at?: string | null
          fashion_details?: Json | null
          id?: string
          images?: Json | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_limited_edition?: boolean | null
          is_new_arrival?: boolean | null
          is_on_sale?: boolean | null
          is_sold_out?: boolean | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          price_cents?: number | null
          requires_shipping?: boolean | null
          size_guide?: Json | null
          sku?: string | null
          slug?: string | null
          stock?: number | null
          tags?: string[] | null
          tax_class_id?: string | null
          tenant_id: string
          updated_at?: string | null
          variants?: Json | null
          weight_kg?: number | null
        }
        Update: {
          badge_color?: string | null
          badge_display_from?: string | null
          badge_display_until?: string | null
          badge_priority?: number | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          created_at?: string | null
          created_by?: string | null
          custom_badge_text?: string | null
          description?: string | null
          draft_data?: Json
          expires_at?: string | null
          fashion_details?: Json | null
          id?: string
          images?: Json | null
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_limited_edition?: boolean | null
          is_new_arrival?: boolean | null
          is_on_sale?: boolean | null
          is_sold_out?: boolean | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          price_cents?: number | null
          requires_shipping?: boolean | null
          size_guide?: Json | null
          sku?: string | null
          slug?: string | null
          stock?: number | null
          tags?: string[] | null
          tax_class_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          variants?: Json | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_drafts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_drafts_tax_class_id_fkey"
            columns: ["tax_class_id"]
            isOneToOne: false
            referencedRelation: "tax_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_drafts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          id: string
          product_id: string
          sort_order: number
          tenant_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          id?: string
          product_id: string
          sort_order?: number
          tenant_id: string
          url: string
        }
        Update: {
          alt?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_images_product"
            columns: ["product_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "product_images_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_size_guides: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          size_guide_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          size_guide_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          size_guide_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_size_guides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_size_guides_size_guide_id_fkey"
            columns: ["size_guide_id"]
            isOneToOne: false
            referencedRelation: "size_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_size_guides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          tag_name: string
          tag_type: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          tag_name: string
          tag_type?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          tag_name?: string
          tag_type?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_options: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          product_id: string
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          product_id: string
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          product_id?: string
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "variant_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          allow_backorders: boolean | null
          attributes: Json | null
          barcode: string | null
          compare_at_price_cents: number | null
          cost_cents: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
          product_id: string
          sku: string | null
          stock: number | null
          tenant_id: string
          track_inventory: boolean | null
          updated_at: string | null
          weight_grams: number | null
        }
        Insert: {
          allow_backorders?: boolean | null
          attributes?: Json | null
          barcode?: string | null
          compare_at_price_cents?: number | null
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
          product_id: string
          sku?: string | null
          stock?: number | null
          tenant_id: string
          track_inventory?: boolean | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Update: {
          allow_backorders?: boolean | null
          attributes?: Json | null
          barcode?: string | null
          compare_at_price_cents?: number | null
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          product_id?: string
          sku?: string | null
          stock?: number | null
          tenant_id?: string
          track_inventory?: boolean | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorders: boolean | null
          badge_color: string | null
          badge_display_from: string | null
          badge_display_until: string | null
          badge_priority: number | null
          care_instructions: string | null
          compare_at_price_cents: number | null
          cost_per_item_cents: number | null
          created_at: string
          currency: string
          custom_badge_text: string | null
          description: string | null
          dimensions: string | null
          fit_type: string | null
          gift_card_amount_cents: number | null
          gift_card_expiry_days: number | null
          has_variants: boolean
          hero_image_url: string | null
          hs_code: string | null
          id: string
          is_bestseller: boolean | null
          is_featured: boolean | null
          is_gift_card: boolean | null
          is_limited_edition: boolean | null
          is_new_arrival: boolean | null
          is_on_sale: boolean | null
          is_sold_out: boolean | null
          low_stock_threshold: number | null
          material_composition: string | null
          meta_description: string | null
          meta_title: string | null
          model_height_cm: number | null
          model_wearing_size: string | null
          model_weight_kg: number | null
          name: string
          price_cents: number
          requires_shipping: boolean | null
          seo_url: string | null
          size_guide_type: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          tags: string[] | null
          tax_class_id: string | null
          taxable: boolean | null
          tenant_id: string
          track_inventory: boolean | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          allow_backorders?: boolean | null
          badge_color?: string | null
          badge_display_from?: string | null
          badge_display_until?: string | null
          badge_priority?: number | null
          care_instructions?: string | null
          compare_at_price_cents?: number | null
          cost_per_item_cents?: number | null
          created_at?: string
          currency?: string
          custom_badge_text?: string | null
          description?: string | null
          dimensions?: string | null
          fit_type?: string | null
          gift_card_amount_cents?: number | null
          gift_card_expiry_days?: number | null
          has_variants?: boolean
          hero_image_url?: string | null
          hs_code?: string | null
          id?: string
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_gift_card?: boolean | null
          is_limited_edition?: boolean | null
          is_new_arrival?: boolean | null
          is_on_sale?: boolean | null
          is_sold_out?: boolean | null
          low_stock_threshold?: number | null
          material_composition?: string | null
          meta_description?: string | null
          meta_title?: string | null
          model_height_cm?: number | null
          model_wearing_size?: string | null
          model_weight_kg?: number | null
          name: string
          price_cents: number
          requires_shipping?: boolean | null
          seo_url?: string | null
          size_guide_type?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          tags?: string[] | null
          tax_class_id?: string | null
          taxable?: boolean | null
          tenant_id: string
          track_inventory?: boolean | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          allow_backorders?: boolean | null
          badge_color?: string | null
          badge_display_from?: string | null
          badge_display_until?: string | null
          badge_priority?: number | null
          care_instructions?: string | null
          compare_at_price_cents?: number | null
          cost_per_item_cents?: number | null
          created_at?: string
          currency?: string
          custom_badge_text?: string | null
          description?: string | null
          dimensions?: string | null
          fit_type?: string | null
          gift_card_amount_cents?: number | null
          gift_card_expiry_days?: number | null
          has_variants?: boolean
          hero_image_url?: string | null
          hs_code?: string | null
          id?: string
          is_bestseller?: boolean | null
          is_featured?: boolean | null
          is_gift_card?: boolean | null
          is_limited_edition?: boolean | null
          is_new_arrival?: boolean | null
          is_on_sale?: boolean | null
          is_sold_out?: boolean | null
          low_stock_threshold?: number | null
          material_composition?: string | null
          meta_description?: string | null
          meta_title?: string | null
          model_height_cm?: number | null
          model_wearing_size?: string | null
          model_weight_kg?: number | null
          name?: string
          price_cents?: number
          requires_shipping?: boolean | null
          seo_url?: string | null
          size_guide_type?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          tags?: string[] | null
          tax_class_id?: string | null
          taxable?: boolean | null
          tenant_id?: string
          track_inventory?: boolean | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tax_class_id_fkey"
            columns: ["tax_class_id"]
            isOneToOne: false
            referencedRelation: "tax_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      settings_company_profile: {
        Row: {
          address: string | null
          brand_accent_hex: string | null
          brand_neutrals: Json
          created_at: string
          email: string | null
          gst_rate_percent: number | null
          gstin: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          social: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand_accent_hex?: string | null
          brand_neutrals?: Json
          created_at?: string
          email?: string | null
          gst_rate_percent?: number | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          social?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand_accent_hex?: string | null
          brand_neutrals?: Json
          created_at?: string
          email?: string | null
          gst_rate_percent?: number | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          social?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_company_profile_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      size_guides: {
        Row: {
          category: string
          created_at: string | null
          gender: string | null
          id: string
          measurements: Json
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          gender?: string | null
          id?: string
          measurements: Json
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          gender?: string | null
          id?: string
          measurements?: Json
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "size_guides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_classes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          rate_percent: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          rate_percent?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          rate_percent?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          is_primary: boolean
          ssl_status: Database["public"]["Enums"]["domain_ssl_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          is_primary?: boolean
          ssl_status?: Database["public"]["Enums"]["domain_ssl_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          is_primary?: boolean
          ssl_status?: Database["public"]["Enums"]["domain_ssl_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_feature_flags: {
        Row: {
          enabled: boolean
          flag_id: string
          rollout: Json
          tenant_id: string
          updated_at: string
          variant: string | null
        }
        Insert: {
          enabled?: boolean
          flag_id: string
          rollout?: Json
          tenant_id: string
          updated_at?: string
          variant?: string | null
        }
        Update: {
          enabled?: boolean
          flag_id?: string
          rollout?: Json
          tenant_id?: string
          updated_at?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_feature_flags_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_flow_overrides: {
        Row: {
          config: Json
          enabled: boolean
          flow_key: string
          id: string
          plugin_key: string
          tenant_id: string
          updated_at: string
          version: string | null
        }
        Insert: {
          config?: Json
          enabled?: boolean
          flow_key: string
          id?: string
          plugin_key: string
          tenant_id: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          config?: Json
          enabled?: boolean
          flow_key?: string
          id?: string
          plugin_key?: string
          tenant_id?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_flow_overrides_plugin_key_fkey"
            columns: ["plugin_key"]
            isOneToOne: false
            referencedRelation: "plugin_registry"
            referencedColumns: ["plugin_key"]
          },
          {
            foreignKeyName: "tenant_flow_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_integration_secrets: {
        Row: {
          id: string
          integration_key: string
          metadata: Json
          secret_enc: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          integration_key: string
          metadata?: Json
          secret_enc: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          integration_key?: string
          metadata?: Json
          secret_enc?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_integration_secrets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_modules: {
        Row: {
          active_until: string | null
          billing_period: string | null
          billing_plan: string | null
          config: Json
          enabled: boolean
          last_payment_at: string | null
          module_key: string
          tenant_id: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          active_until?: string | null
          billing_period?: string | null
          billing_plan?: string | null
          config?: Json
          enabled?: boolean
          last_payment_at?: string | null
          module_key: string
          tenant_id: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          active_until?: string | null
          billing_period?: string | null
          billing_plan?: string | null
          config?: Json
          enabled?: boolean
          last_payment_at?: string | null
          module_key?: string
          tenant_id?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_modules_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "module_registry"
            referencedColumns: ["module_key"]
          },
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_settings: {
        Row: {
          capture_mode: Database["public"]["Enums"]["capture_mode"]
          created_at: string
          enabled: boolean
          env: string
          id: string
          last_verified_at: string | null
          razorpay_key_id: string | null
          razorpay_key_secret: string | null
          tenant_id: string
          test_mode: boolean
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          capture_mode?: Database["public"]["Enums"]["capture_mode"]
          created_at?: string
          enabled?: boolean
          env: string
          id?: string
          last_verified_at?: string | null
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          tenant_id: string
          test_mode?: boolean
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          capture_mode?: Database["public"]["Enums"]["capture_mode"]
          created_at?: string
          enabled?: boolean
          env?: string
          id?: string
          last_verified_at?: string | null
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          tenant_id?: string
          test_mode?: boolean
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["tenant_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["tenant_status"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["tenant_status"]
        }
        Relationships: []
      }
      variant_combinations: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          option_value_id: string
          product_id: string
          tenant_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          option_value_id: string
          product_id: string
          tenant_id: string
          variant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          option_value_id?: string
          product_id?: string
          tenant_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_combinations_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "variant_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_combinations_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "variant_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_combinations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_combinations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_combinations_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          sort_order: number | null
          tenant_id: string
          variant_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          sort_order?: number | null
          tenant_id: string
          variant_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          sort_order?: number | null
          tenant_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_images_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_option_values: {
        Row: {
          color_hex: string | null
          cost_adjustment_cents: number | null
          created_at: string | null
          display_value: string
          id: string
          image_url: string | null
          option_id: string
          price_adjustment_cents: number | null
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          color_hex?: string | null
          cost_adjustment_cents?: number | null
          created_at?: string | null
          display_value: string
          id?: string
          image_url?: string | null
          option_id: string
          price_adjustment_cents?: number | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
          value: string
        }
        Update: {
          color_hex?: string | null
          cost_adjustment_cents?: number | null
          created_at?: string | null
          display_value?: string
          id?: string
          image_url?: string | null
          option_id?: string
          price_adjustment_cents?: number | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "variant_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_option_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_options: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          name: string
          required: boolean | null
          sort_order: number | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          name: string
          required?: boolean | null
          sort_order?: number | null
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          name?: string
          required?: boolean | null
          sort_order?: number | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variant_options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_accounts: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_ledger: {
        Row: {
          account_id: string
          amount_cents: number
          created_at: string
          currency: string
          entry_type: string
          id: string
          metadata: Json
          reference_id: string | null
          source_key: string
          tenant_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          created_at?: string
          currency?: string
          entry_type: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          source_key: string
          tenant_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          created_at?: string
          currency?: string
          entry_type?: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          source_key?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "wallet_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_tenant_module_entitlements: {
        Row: {
          active_until: string | null
          billing_period: string | null
          billing_plan: string | null
          enabled: boolean | null
          entitlement_status: string | null
          is_enabled_effective: boolean | null
          last_payment_at: string | null
          module_key: string | null
          tenant_id: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          version: string | null
        }
        Insert: {
          active_until?: string | null
          billing_period?: string | null
          billing_plan?: string | null
          enabled?: boolean | null
          entitlement_status?: never
          is_enabled_effective?: never
          last_payment_at?: string | null
          module_key?: string | null
          tenant_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          version?: string | null
        }
        Update: {
          active_until?: string | null
          billing_period?: string | null
          billing_plan?: string | null
          enabled?: boolean | null
          entitlement_status?: never
          is_enabled_effective?: never
          last_payment_at?: string | null
          module_key?: string | null
          tenant_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_modules_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "module_registry"
            referencedColumns: ["module_key"]
          },
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_tenant_module_subscription: {
        Args: {
          p_billing_period: string
          p_billing_plan: string
          p_module_key: string
          p_tenant_id: string
        }
        Returns: string
      }
      calculate_variant_cost: {
        Args: { p_product_id: string; p_variant_combinations: Json }
        Returns: number
      }
      calculate_variant_price: {
        Args: { p_product_id: string; p_variant_combinations: Json }
        Returns: number
      }
      delete_order_safely: {
        Args: { order_id_param: string; tenant_id_param: string }
        Returns: {
          deleted_items_count: number
          deleted_order_id: string
        }[]
      }
      delete_product_safely: {
        Args: { product_id_param: string; tenant_id_param: string }
        Returns: {
          deleted_categories: number
          deleted_images: number
          deleted_order_items: number
          deleted_product_id: string
        }[]
      }
      expire_tenant_modules: { Args: never; Returns: undefined }
      get_tenant_dashboard_stats: {
        Args: { tenant_id_param: string }
        Returns: {
          low_stock_products: number
          pending_orders: number
          published_products: number
          total_products: number
          total_revenue: number
        }[]
      }
      is_tenant_admin: { Args: { tid: string }; Returns: boolean }
      is_tenant_editor: { Args: { tid: string }; Returns: boolean }
      is_tenant_member: { Args: { tid: string }; Returns: boolean }
      start_tenant_module_trial: {
        Args: {
          p_force?: boolean
          p_module_key: string
          p_tenant_id: string
          p_trial_days?: number
        }
        Returns: string
      }
      start_tenant_trial_for_all_modules: {
        Args: { p_force?: boolean; p_tenant_id: string; p_trial_days?: number }
        Returns: number
      }
    }
    Enums: {
      capture_mode: "auto" | "manual"
      domain_ssl_status: "pending" | "active" | "error"
      order_status: "pending" | "paid" | "failed" | "fulfilled" | "cancelled"
      platform_role: "superadmin" | "staff"
      product_status: "draft" | "published"
      project_status: "draft" | "published"
      tenant_member_role: "tenant_admin" | "tenant_editor"
      tenant_status: "active" | "suspended" | "maintenance"
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
      capture_mode: ["auto", "manual"],
      domain_ssl_status: ["pending", "active", "error"],
      order_status: ["pending", "paid", "failed", "fulfilled", "cancelled"],
      platform_role: ["superadmin", "staff"],
      product_status: ["draft", "published"],
      project_status: ["draft", "published"],
      tenant_member_role: ["tenant_admin", "tenant_editor"],
      tenant_status: ["active", "suspended", "maintenance"],
    },
  },
} as const
