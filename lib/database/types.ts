export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      __migrations: {
        Row: {
          applied_at: string;
          name: string;
        };
        Insert: {
          applied_at?: string;
          name: string;
        };
        Update: {
          applied_at?: string;
          name?: string;
        };
        Relationships: [];
      };
      affiliate_clicks: {
        Row: {
          anonymous_session_id: string | null;
          article_id: string | null;
          brand_id: string | null;
          clicked_at: string;
          destination_type: Database["public"]["Enums"]["destination_type"];
          destination_url: string;
          id: string;
          product_id: string | null;
          referrer_path: string | null;
        };
        Insert: {
          anonymous_session_id?: string | null;
          article_id?: string | null;
          brand_id?: string | null;
          clicked_at?: string;
          destination_type: Database["public"]["Enums"]["destination_type"];
          destination_url: string;
          id?: string;
          product_id?: string | null;
          referrer_path?: string | null;
        };
        Update: {
          anonymous_session_id?: string | null;
          article_id?: string | null;
          brand_id?: string | null;
          clicked_at?: string;
          destination_type?: Database["public"]["Enums"]["destination_type"];
          destination_url?: string;
          id?: string;
          product_id?: string | null;
          referrer_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_clicks_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: {
          anonymous_session_id: string | null;
          article_id: string | null;
          brand_id: string | null;
          event_type: Database["public"]["Enums"]["analytics_event_type"];
          id: string;
          occurred_at: string;
          path: string | null;
          product_id: string | null;
        };
        Insert: {
          anonymous_session_id?: string | null;
          article_id?: string | null;
          brand_id?: string | null;
          event_type: Database["public"]["Enums"]["analytics_event_type"];
          id?: string;
          occurred_at?: string;
          path?: string | null;
          product_id?: string | null;
        };
        Update: {
          anonymous_session_id?: string | null;
          article_id?: string | null;
          brand_id?: string | null;
          event_type?: Database["public"]["Enums"]["analytics_event_type"];
          id?: string;
          occurred_at?: string;
          path?: string | null;
          product_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      article_brands: {
        Row: {
          article_id: string;
          brand_id: string;
          created_at: string;
        };
        Insert: {
          article_id: string;
          brand_id: string;
          created_at?: string;
        };
        Update: {
          article_id?: string;
          brand_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_brands_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_brands_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      article_products: {
        Row: {
          article_id: string;
          created_at: string;
          display_order: number;
          editorial_label: string | null;
          product_id: string;
          sponsorship_status: string | null;
        };
        Insert: {
          article_id: string;
          created_at?: string;
          display_order?: number;
          editorial_label?: string | null;
          product_id: string;
          sponsorship_status?: string | null;
        };
        Update: {
          article_id?: string;
          created_at?: string;
          display_order?: number;
          editorial_label?: string | null;
          product_id?: string;
          sponsorship_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "article_products_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          affiliate_disclosure_required: boolean;
          article_type: Database["public"]["Enums"]["article_type"];
          author_id: string | null;
          body: string | null;
          created_at: string;
          excerpt: string | null;
          featured_image_path: string | null;
          id: string;
          is_demo: boolean;
          is_sponsored: boolean;
          published_at: string | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          sponsor_brand_id: string | null;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          affiliate_disclosure_required?: boolean;
          article_type: Database["public"]["Enums"]["article_type"];
          author_id?: string | null;
          body?: string | null;
          created_at?: string;
          excerpt?: string | null;
          featured_image_path?: string | null;
          id?: string;
          is_demo?: boolean;
          is_sponsored?: boolean;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          sponsor_brand_id?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          affiliate_disclosure_required?: boolean;
          article_type?: Database["public"]["Enums"]["article_type"];
          author_id?: string | null;
          body?: string | null;
          created_at?: string;
          excerpt?: string | null;
          featured_image_path?: string | null;
          id?: string;
          is_demo?: boolean;
          is_sponsored?: boolean;
          published_at?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          sponsor_brand_id?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_sponsor_brand_id_fkey";
            columns: ["sponsor_brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor: string | null;
          after_state: Json | null;
          before_state: Json | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor?: string | null;
          after_state?: Json | null;
          before_state?: Json | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor?: string | null;
          after_state?: Json | null;
          before_state?: Json | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      brand_categories: {
        Row: {
          brand_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          brand_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          brand_id?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_categories_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_claims: {
        Row: {
          applicant_name: string;
          brand_id: string;
          comments: string | null;
          company_email: string;
          created_at: string;
          id: string;
          job_title: string | null;
          proof_path: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["review_outcome_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          applicant_name: string;
          brand_id: string;
          comments?: string | null;
          company_email: string;
          created_at?: string;
          id?: string;
          job_title?: string | null;
          proof_path?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_outcome_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          applicant_name?: string;
          brand_id?: string;
          comments?: string | null;
          company_email?: string;
          created_at?: string;
          id?: string;
          job_title?: string | null;
          proof_path?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_outcome_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_claims_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_owners: {
        Row: {
          brand_id: string;
          created_at: string;
          granted_by: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          brand_id: string;
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          brand_id?: string;
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_owners_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_submissions: {
        Row: {
          brand_name: string;
          categories: string[] | null;
          comments: string | null;
          created_at: string;
          description: string | null;
          evidence_url: string | null;
          id: string;
          manufacturing_information: string | null;
          relationship_to_brand: string | null;
          status: Database["public"]["Enums"]["review_outcome_status"];
          submitter_email: string;
          submitter_name: string;
          updated_at: string;
          website_url: string;
        };
        Insert: {
          brand_name: string;
          categories?: string[] | null;
          comments?: string | null;
          created_at?: string;
          description?: string | null;
          evidence_url?: string | null;
          id?: string;
          manufacturing_information?: string | null;
          relationship_to_brand?: string | null;
          status?: Database["public"]["Enums"]["review_outcome_status"];
          submitter_email: string;
          submitter_name: string;
          updated_at?: string;
          website_url: string;
        };
        Update: {
          brand_name?: string;
          categories?: string[] | null;
          comments?: string | null;
          created_at?: string;
          description?: string | null;
          evidence_url?: string | null;
          id?: string;
          manufacturing_information?: string | null;
          relationship_to_brand?: string | null;
          status?: Database["public"]["Enums"]["review_outcome_status"];
          submitter_email?: string;
          submitter_name?: string;
          updated_at?: string;
          website_url?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          created_at: string;
          founded_year: number | null;
          founder_names: string | null;
          full_description: string | null;
          headquarters_city: string | null;
          headquarters_country: string;
          headquarters_state: string | null;
          hero_image_path: string | null;
          id: string;
          is_demo: boolean;
          is_featured: boolean;
          is_sponsored: boolean;
          last_reviewed_at: string | null;
          legal_name: string | null;
          logo_path: string | null;
          name: string;
          ownership_type: string | null;
          price_level: number | null;
          published_at: string | null;
          search_tsv: unknown;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          subscription_tier: Database["public"]["Enums"]["subscription_plan"];
          summary: string | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["review_outcome_status"];
          website_url: string | null;
        };
        Insert: {
          created_at?: string;
          founded_year?: number | null;
          founder_names?: string | null;
          full_description?: string | null;
          headquarters_city?: string | null;
          headquarters_country?: string;
          headquarters_state?: string | null;
          hero_image_path?: string | null;
          id?: string;
          is_demo?: boolean;
          is_featured?: boolean;
          is_sponsored?: boolean;
          last_reviewed_at?: string | null;
          legal_name?: string | null;
          logo_path?: string | null;
          name: string;
          ownership_type?: string | null;
          price_level?: number | null;
          published_at?: string | null;
          search_tsv?: unknown;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          subscription_tier?: Database["public"]["Enums"]["subscription_plan"];
          summary?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["review_outcome_status"];
          website_url?: string | null;
        };
        Update: {
          created_at?: string;
          founded_year?: number | null;
          founder_names?: string | null;
          full_description?: string | null;
          headquarters_city?: string | null;
          headquarters_country?: string;
          headquarters_state?: string | null;
          hero_image_path?: string | null;
          id?: string;
          is_demo?: boolean;
          is_featured?: boolean;
          is_sponsored?: boolean;
          last_reviewed_at?: string | null;
          legal_name?: string | null;
          logo_path?: string | null;
          name?: string;
          ownership_type?: string | null;
          price_level?: number | null;
          published_at?: string | null;
          search_tsv?: unknown;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          subscription_tier?: Database["public"]["Enums"]["subscription_plan"];
          summary?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["review_outcome_status"];
          website_url?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          image_path: string | null;
          is_active: boolean;
          is_demo: boolean;
          name: string;
          parent_category_id: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_path?: string | null;
          is_active?: boolean;
          is_demo?: boolean;
          name: string;
          parent_category_id?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          image_path?: string | null;
          is_active?: boolean;
          is_demo?: boolean;
          name?: string;
          parent_category_id?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey";
            columns: ["parent_category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      corrections: {
        Row: {
          brand_id: string | null;
          created_at: string;
          id: string;
          issue_description: string;
          page_url: string;
          product_id: string | null;
          proposed_correction: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["review_outcome_status"];
          submitter_email: string;
          supporting_source_url: string | null;
          updated_at: string;
        };
        Insert: {
          brand_id?: string | null;
          created_at?: string;
          id?: string;
          issue_description: string;
          page_url: string;
          product_id?: string | null;
          proposed_correction?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_outcome_status"];
          submitter_email: string;
          supporting_source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          brand_id?: string | null;
          created_at?: string;
          id?: string;
          issue_description?: string;
          page_url?: string;
          product_id?: string | null;
          proposed_correction?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["review_outcome_status"];
          submitter_email?: string;
          supporting_source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "corrections_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "corrections_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      manufacturing_evidence: {
        Row: {
          accessed_at: string | null;
          brand_id: string;
          classification: Database["public"]["Enums"]["manufacturing_classification"];
          confidence_score: number | null;
          created_at: string;
          dispute_status: Database["public"]["Enums"]["dispute_status"];
          evidence_note: string | null;
          evidence_type: Database["public"]["Enums"]["evidence_type"];
          id: string;
          internal_notes: string | null;
          last_verified_at: string | null;
          product_id: string | null;
          review_status: Database["public"]["Enums"]["evidence_review_status"];
          reviewed_at: string | null;
          reviewed_by: string | null;
          source_title: string | null;
          source_url: string | null;
          updated_at: string;
        };
        Insert: {
          accessed_at?: string | null;
          brand_id: string;
          classification: Database["public"]["Enums"]["manufacturing_classification"];
          confidence_score?: number | null;
          created_at?: string;
          dispute_status?: Database["public"]["Enums"]["dispute_status"];
          evidence_note?: string | null;
          evidence_type?: Database["public"]["Enums"]["evidence_type"];
          id?: string;
          internal_notes?: string | null;
          last_verified_at?: string | null;
          product_id?: string | null;
          review_status?: Database["public"]["Enums"]["evidence_review_status"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_title?: string | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          accessed_at?: string | null;
          brand_id?: string;
          classification?: Database["public"]["Enums"]["manufacturing_classification"];
          confidence_score?: number | null;
          created_at?: string;
          dispute_status?: Database["public"]["Enums"]["dispute_status"];
          evidence_note?: string | null;
          evidence_type?: Database["public"]["Enums"]["evidence_type"];
          id?: string;
          internal_notes?: string | null;
          last_verified_at?: string | null;
          product_id?: string | null;
          review_status?: Database["public"]["Enums"]["evidence_review_status"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_title?: string | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manufacturing_evidence_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "manufacturing_evidence_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      manufacturing_locations: {
        Row: {
          address: string | null;
          brand_id: string;
          city: string | null;
          country: string;
          created_at: string;
          facility_name: string | null;
          id: string;
          latitude: number | null;
          location_type: Database["public"]["Enums"]["location_type"];
          longitude: number | null;
          postal_code: string | null;
          source_url: string | null;
          state: string | null;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["review_outcome_status"];
        };
        Insert: {
          address?: string | null;
          brand_id: string;
          city?: string | null;
          country?: string;
          created_at?: string;
          facility_name?: string | null;
          id?: string;
          latitude?: number | null;
          location_type?: Database["public"]["Enums"]["location_type"];
          longitude?: number | null;
          postal_code?: string | null;
          source_url?: string | null;
          state?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["review_outcome_status"];
        };
        Update: {
          address?: string | null;
          brand_id?: string;
          city?: string | null;
          country?: string;
          created_at?: string;
          facility_name?: string | null;
          id?: string;
          latitude?: number | null;
          location_type?: Database["public"]["Enums"]["location_type"];
          longitude?: number | null;
          postal_code?: string | null;
          source_url?: string | null;
          state?: string | null;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["review_outcome_status"];
        };
        Relationships: [
          {
            foreignKeyName: "manufacturing_locations_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          consent_at: string;
          consent_source: string | null;
          created_at: string;
          email: string;
          first_name: string | null;
          id: string;
          status: Database["public"]["Enums"]["subscriber_status"];
          unsubscribed_at: string | null;
          updated_at: string;
        };
        Insert: {
          consent_at?: string;
          consent_source?: string | null;
          created_at?: string;
          email: string;
          first_name?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["subscriber_status"];
          unsubscribed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          consent_at?: string;
          consent_source?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string | null;
          id?: string;
          status?: Database["public"]["Enums"]["subscriber_status"];
          unsubscribed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          affiliate_disclosure_required: boolean;
          affiliate_network: string | null;
          affiliate_url: string | null;
          brand_id: string;
          category_id: string | null;
          created_at: string;
          description: string | null;
          direct_purchase_url: string | null;
          id: string;
          image_path: string | null;
          imported_components_note: string | null;
          is_demo: boolean;
          is_featured: boolean;
          is_sponsored: boolean;
          last_reviewed_at: string | null;
          manufacturing_city: string | null;
          manufacturing_classification: Database["public"]["Enums"]["manufacturing_classification"];
          manufacturing_country: string | null;
          manufacturing_state: string | null;
          materials: string | null;
          name: string;
          price_amount: number | null;
          price_currency: string;
          price_is_approximate: boolean;
          price_verified_at: string | null;
          published_at: string | null;
          search_tsv: unknown;
          shipping_summary: string | null;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          summary: string | null;
          updated_at: string;
          warranty_summary: string | null;
        };
        Insert: {
          affiliate_disclosure_required?: boolean;
          affiliate_network?: string | null;
          affiliate_url?: string | null;
          brand_id: string;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          direct_purchase_url?: string | null;
          id?: string;
          image_path?: string | null;
          imported_components_note?: string | null;
          is_demo?: boolean;
          is_featured?: boolean;
          is_sponsored?: boolean;
          last_reviewed_at?: string | null;
          manufacturing_city?: string | null;
          manufacturing_classification?: Database["public"]["Enums"]["manufacturing_classification"];
          manufacturing_country?: string | null;
          manufacturing_state?: string | null;
          materials?: string | null;
          name: string;
          price_amount?: number | null;
          price_currency?: string;
          price_is_approximate?: boolean;
          price_verified_at?: string | null;
          published_at?: string | null;
          search_tsv?: unknown;
          shipping_summary?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          updated_at?: string;
          warranty_summary?: string | null;
        };
        Update: {
          affiliate_disclosure_required?: boolean;
          affiliate_network?: string | null;
          affiliate_url?: string | null;
          brand_id?: string;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          direct_purchase_url?: string | null;
          id?: string;
          image_path?: string | null;
          imported_components_note?: string | null;
          is_demo?: boolean;
          is_featured?: boolean;
          is_sponsored?: boolean;
          last_reviewed_at?: string | null;
          manufacturing_city?: string | null;
          manufacturing_classification?: Database["public"]["Enums"]["manufacturing_classification"];
          manufacturing_country?: string | null;
          manufacturing_state?: string | null;
          materials?: string | null;
          name?: string;
          price_amount?: number | null;
          price_currency?: string;
          price_is_approximate?: boolean;
          price_verified_at?: string | null;
          published_at?: string | null;
          search_tsv?: unknown;
          shipping_summary?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          summary?: string | null;
          updated_at?: string;
          warranty_summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          job_title: string | null;
          organization: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          job_title?: string | null;
          organization?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          job_title?: string | null;
          organization?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      proposed_changes: {
        Row: {
          brand_id: string | null;
          change_type: string;
          created_at: string;
          id: string;
          product_id: string | null;
          proposed_data: Json;
          rationale: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          source_url: string | null;
          status: Database["public"]["Enums"]["review_outcome_status"];
          submitted_by: string;
          updated_at: string;
        };
        Insert: {
          brand_id?: string | null;
          change_type: string;
          created_at?: string;
          id?: string;
          product_id?: string | null;
          proposed_data: Json;
          rationale?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["review_outcome_status"];
          submitted_by: string;
          updated_at?: string;
        };
        Update: {
          brand_id?: string | null;
          change_type?: string;
          created_at?: string;
          id?: string;
          product_id?: string | null;
          proposed_data?: Json;
          rationale?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_url?: string | null;
          status?: Database["public"]["Enums"]["review_outcome_status"];
          submitted_by?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proposed_changes_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposed_changes_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limit_events: {
        Row: {
          bucket: string;
          id: string;
          key_hash: string;
          occurred_at: string;
        };
        Insert: {
          bucket: string;
          id?: string;
          key_hash: string;
          occurred_at?: string;
        };
        Update: {
          bucket?: string;
          id?: string;
          key_hash?: string;
          occurred_at?: string;
        };
        Relationships: [];
      };
      sponsorships: {
        Row: {
          amount: number | null;
          brand_id: string;
          created_at: string;
          disclosure_text: string | null;
          end_date: string | null;
          id: string;
          placement_location: string | null;
          placement_type: string;
          start_date: string;
          status: Database["public"]["Enums"]["sponsorship_status"];
          updated_at: string;
        };
        Insert: {
          amount?: number | null;
          brand_id: string;
          created_at?: string;
          disclosure_text?: string | null;
          end_date?: string | null;
          id?: string;
          placement_location?: string | null;
          placement_type: string;
          start_date: string;
          status?: Database["public"]["Enums"]["sponsorship_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number | null;
          brand_id?: string;
          created_at?: string;
          disclosure_text?: string | null;
          end_date?: string | null;
          id?: string;
          placement_location?: string | null;
          placement_type?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["sponsorship_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sponsorships_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_webhook_events: {
        Row: {
          event_type: string;
          id: string;
          received_at: string;
        };
        Insert: {
          event_type: string;
          id: string;
          received_at?: string;
        };
        Update: {
          event_type?: string;
          id?: string;
          received_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          brand_id: string;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          payment_provider: string;
          plan: Database["public"]["Enums"]["subscription_plan"];
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          brand_id: string;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          payment_provider?: string;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          brand_id?: string;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          payment_provider?: string;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_evidence: {
        Row: {
          accessed_at: string | null;
          brand_id: string | null;
          classification:
            Database["public"]["Enums"]["manufacturing_classification"] | null;
          confidence_score: number | null;
          dispute_status: Database["public"]["Enums"]["dispute_status"] | null;
          evidence_note: string | null;
          evidence_type: Database["public"]["Enums"]["evidence_type"] | null;
          id: string | null;
          last_verified_at: string | null;
          product_id: string | null;
          reviewed_at: string | null;
          source_title: string | null;
          source_url: string | null;
        };
        Insert: {
          accessed_at?: string | null;
          brand_id?: string | null;
          classification?:
            Database["public"]["Enums"]["manufacturing_classification"] | null;
          confidence_score?: number | null;
          dispute_status?: Database["public"]["Enums"]["dispute_status"] | null;
          evidence_note?: string | null;
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null;
          id?: string | null;
          last_verified_at?: string | null;
          product_id?: string | null;
          reviewed_at?: string | null;
          source_title?: string | null;
          source_url?: string | null;
        };
        Update: {
          accessed_at?: string | null;
          brand_id?: string | null;
          classification?:
            Database["public"]["Enums"]["manufacturing_classification"] | null;
          confidence_score?: number | null;
          dispute_status?: Database["public"]["Enums"]["dispute_status"] | null;
          evidence_note?: string | null;
          evidence_type?: Database["public"]["Enums"]["evidence_type"] | null;
          id?: string | null;
          last_verified_at?: string | null;
          product_id?: string | null;
          reviewed_at?: string | null;
          source_title?: string | null;
          source_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "manufacturing_evidence_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "manufacturing_evidence_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      current_app_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_admin: { Args: never; Returns: boolean };
      is_editor_or_admin: { Args: never; Returns: boolean };
      is_owner_of_brand: { Args: { target_brand: string }; Returns: boolean };
      prune_rate_limit_events: {
        Args: { older_than: string };
        Returns: undefined;
      };
      request_is_api: { Args: never; Returns: boolean };
    };
    Enums: {
      analytics_event_type:
        | "brand_view"
        | "product_view"
        | "article_view"
        | "affiliate_click"
        | "newsletter_signup"
        | "brand_submission"
        | "brand_claim";
      article_type:
        | "shopping_guide"
        | "brand_story"
        | "founder_story"
        | "factory_story"
        | "comparison"
        | "buying_guide"
        | "news";
      content_status:
        "draft" | "pending_review" | "published" | "rejected" | "archived";
      destination_type: "affiliate" | "direct";
      dispute_status: "none" | "disputed" | "resolved";
      evidence_review_status:
        "pending" | "approved" | "rejected" | "needs_more_information";
      evidence_type:
        | "brand_statement"
        | "product_page"
        | "factory_documentation"
        | "press_coverage"
        | "regulatory_filing"
        | "third_party_audit"
        | "direct_correspondence"
        | "other";
      location_type:
        | "factory"
        | "workshop"
        | "assembly_plant"
        | "headquarters"
        | "warehouse"
        | "other";
      manufacturing_classification:
        | "verified_made_in_usa"
        | "brand_reported_made_in_usa"
        | "made_in_usa_imported_components"
        | "assembled_in_usa"
        | "certain_products_made_in_usa"
        | "designed_in_usa_manufactured_elsewhere"
        | "us_owned_unconfirmed_manufacturing"
        | "unclear"
        | "awaiting_review";
      review_outcome_status: "pending" | "approved" | "rejected";
      sponsorship_status: "scheduled" | "active" | "completed" | "canceled";
      subscriber_status: "active" | "unsubscribed";
      subscription_plan: "basic" | "verified" | "featured";
      subscription_status:
        | "incomplete"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid";
      user_role: "visitor" | "brand_owner" | "editor" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
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
      analytics_event_type: [
        "brand_view",
        "product_view",
        "article_view",
        "affiliate_click",
        "newsletter_signup",
        "brand_submission",
        "brand_claim",
      ],
      article_type: [
        "shopping_guide",
        "brand_story",
        "founder_story",
        "factory_story",
        "comparison",
        "buying_guide",
        "news",
      ],
      content_status: [
        "draft",
        "pending_review",
        "published",
        "rejected",
        "archived",
      ],
      destination_type: ["affiliate", "direct"],
      dispute_status: ["none", "disputed", "resolved"],
      evidence_review_status: [
        "pending",
        "approved",
        "rejected",
        "needs_more_information",
      ],
      evidence_type: [
        "brand_statement",
        "product_page",
        "factory_documentation",
        "press_coverage",
        "regulatory_filing",
        "third_party_audit",
        "direct_correspondence",
        "other",
      ],
      location_type: [
        "factory",
        "workshop",
        "assembly_plant",
        "headquarters",
        "warehouse",
        "other",
      ],
      manufacturing_classification: [
        "verified_made_in_usa",
        "brand_reported_made_in_usa",
        "made_in_usa_imported_components",
        "assembled_in_usa",
        "certain_products_made_in_usa",
        "designed_in_usa_manufactured_elsewhere",
        "us_owned_unconfirmed_manufacturing",
        "unclear",
        "awaiting_review",
      ],
      review_outcome_status: ["pending", "approved", "rejected"],
      sponsorship_status: ["scheduled", "active", "completed", "canceled"],
      subscriber_status: ["active", "unsubscribed"],
      subscription_plan: ["basic", "verified", "featured"],
      subscription_status: [
        "incomplete",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
      ],
      user_role: ["visitor", "brand_owner", "editor", "admin"],
    },
  },
} as const;
