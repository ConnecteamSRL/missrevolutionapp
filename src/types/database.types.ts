export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          feature_flags: Json | null;
          id: number;
          latest_version: string;
          maintenance_message: string | null;
          maintenance_mode: boolean | null;
          min_supported_version: string;
          privacy_policy_html: string | null;
          privacy_policy_url: string | null;
          store_url_android: string | null;
          store_url_ios: string | null;
          support_email: string | null;
          updated_at: string | null;
        };
        Insert: {
          feature_flags?: Json | null;
          id?: number;
          latest_version?: string;
          maintenance_message?: string | null;
          maintenance_mode?: boolean | null;
          min_supported_version?: string;
          privacy_policy_html?: string | null;
          privacy_policy_url?: string | null;
          store_url_android?: string | null;
          store_url_ios?: string | null;
          support_email?: string | null;
          updated_at?: string | null;
        };
        Update: {
          feature_flags?: Json | null;
          id?: number;
          latest_version?: string;
          maintenance_message?: string | null;
          maintenance_mode?: boolean | null;
          min_supported_version?: string;
          privacy_policy_html?: string | null;
          privacy_policy_url?: string | null;
          store_url_android?: string | null;
          store_url_ios?: string | null;
          support_email?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      app_users: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          app_role: Database['public']['Enums']['app_role'];
          avatar_key: string | null;
          birth_date: string | null;
          city: string | null;
          coach_id: string | null;
          commercial_id: string | null;
          created_at: string;
          cura_started_at: string | null;
          current_objective: Database['public']['Enums']['fitness_objective'] | null;
          first_name: string | null;
          flow_deadline_at: string | null;
          flow_status: Database['public']['Enums']['flow_status_enum'];
          gender: Database['public']['Enums']['gender_enum'] | null;
          gym_id: string | null;
          id: string;
          is_active: boolean;
          last_checkup_at: string | null;
          last_name: string | null;
          phone_number: string | null;
          postal_code: string | null;
          primary_email: string;
          program_status: Database['public']['Enums']['user_program_status'];
          region: string | null;
          training_started_at: string | null;
          updated_at: string;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          app_role?: Database['public']['Enums']['app_role'];
          avatar_key?: string | null;
          birth_date?: string | null;
          city?: string | null;
          coach_id?: string | null;
          commercial_id?: string | null;
          created_at?: string;
          cura_started_at?: string | null;
          current_objective?: Database['public']['Enums']['fitness_objective'] | null;
          first_name?: string | null;
          flow_deadline_at?: string | null;
          flow_status?: Database['public']['Enums']['flow_status_enum'];
          gender?: Database['public']['Enums']['gender_enum'] | null;
          gym_id?: string | null;
          id: string;
          is_active?: boolean;
          last_checkup_at?: string | null;
          last_name?: string | null;
          phone_number?: string | null;
          postal_code?: string | null;
          primary_email: string;
          program_status?: Database['public']['Enums']['user_program_status'];
          region?: string | null;
          training_started_at?: string | null;
          updated_at?: string;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          app_role?: Database['public']['Enums']['app_role'];
          avatar_key?: string | null;
          birth_date?: string | null;
          city?: string | null;
          coach_id?: string | null;
          commercial_id?: string | null;
          created_at?: string;
          cura_started_at?: string | null;
          current_objective?: Database['public']['Enums']['fitness_objective'] | null;
          first_name?: string | null;
          flow_deadline_at?: string | null;
          flow_status?: Database['public']['Enums']['flow_status_enum'];
          gender?: Database['public']['Enums']['gender_enum'] | null;
          gym_id?: string | null;
          id?: string;
          is_active?: boolean;
          last_checkup_at?: string | null;
          last_name?: string | null;
          phone_number?: string | null;
          postal_code?: string | null;
          primary_email?: string;
          program_status?: Database['public']['Enums']['user_program_status'];
          region?: string | null;
          training_started_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'app_users_coach_id_fkey';
            columns: ['coach_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_users_coach_id_fkey';
            columns: ['coach_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_users_coach_id_fkey';
            columns: ['coach_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'app_users_commercial_id_fkey';
            columns: ['commercial_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_users_commercial_id_fkey';
            columns: ['commercial_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_users_commercial_id_fkey';
            columns: ['commercial_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'app_users_gym_fk';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_conversations: {
        Row: {
          created_at: string;
          gym_id: string;
          id: string;
          last_message_at: string;
          last_message_preview: string | null;
          status: Database['public']['Enums']['conversation_status'];
          updated_at: string;
          user_avatar_key: string | null;
          user_email: string | null;
          user_first_name: string | null;
          user_id: string;
          user_last_name: string | null;
        };
        Insert: {
          created_at?: string;
          gym_id: string;
          id?: string;
          last_message_at?: string;
          last_message_preview?: string | null;
          status?: Database['public']['Enums']['conversation_status'];
          updated_at?: string;
          user_avatar_key?: string | null;
          user_email?: string | null;
          user_first_name?: string | null;
          user_id: string;
          user_last_name?: string | null;
        };
        Update: {
          created_at?: string;
          gym_id?: string;
          id?: string;
          last_message_at?: string;
          last_message_preview?: string | null;
          status?: Database['public']['Enums']['conversation_status'];
          updated_at?: string;
          user_avatar_key?: string | null;
          user_email?: string | null;
          user_first_name?: string | null;
          user_id?: string;
          user_last_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_conversations_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_conversations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
        ];
      };
      chat_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string | null;
          sender_type: Database['public']['Enums']['chat_sender_type'];
          updated_at: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string | null;
          sender_type: Database['public']['Enums']['chat_sender_type'];
          updated_at?: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string | null;
          sender_type?: Database['public']['Enums']['chat_sender_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'chat_conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
        ];
      };
      diet_plans: {
        Row: {
          created_at: string;
          description: string | null;
          gym_id: string | null;
          html_content: string;
          id: string;
          is_active: boolean;
          objective: Database['public']['Enums']['fitness_objective'];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          gym_id?: string | null;
          html_content: string;
          id?: string;
          is_active?: boolean;
          objective: Database['public']['Enums']['fitness_objective'];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          gym_id?: string | null;
          html_content?: string;
          id?: string;
          is_active?: boolean;
          objective?: Database['public']['Enums']['fitness_objective'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'diet_plans_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      faq_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          position: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          position?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          position?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          category_id: string;
          created_at: string;
          id: string;
          is_active: boolean;
          position: number;
          question: string;
          updated_at: string;
          video_link: string | null;
        };
        Insert: {
          answer: string;
          category_id: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          position?: number;
          question: string;
          updated_at?: string;
          video_link?: string | null;
        };
        Update: {
          answer?: string;
          category_id?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          position?: number;
          question?: string;
          updated_at?: string;
          video_link?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'faqs_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'faq_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      fitness_rules: {
        Row: {
          created_at: string;
          max_carbs_100g: number | null;
          max_fat_100g: number | null;
          max_sugar_100g: number | null;
          min_protein_100g: number | null;
          objective: Database['public']['Enums']['fitness_objective'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          max_carbs_100g?: number | null;
          max_fat_100g?: number | null;
          max_sugar_100g?: number | null;
          min_protein_100g?: number | null;
          objective: Database['public']['Enums']['fitness_objective'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          max_carbs_100g?: number | null;
          max_fat_100g?: number | null;
          max_sugar_100g?: number | null;
          min_protein_100g?: number | null;
          objective?: Database['public']['Enums']['fitness_objective'];
          updated_at?: string;
        };
        Relationships: [];
      };
      gym_editorial_configs: {
        Row: {
          banner_key: string | null;
          created_at: string;
          gym_id: string;
          updated_at: string;
        };
        Insert: {
          banner_key?: string | null;
          created_at?: string;
          gym_id: string;
          updated_at?: string;
        };
        Update: {
          banner_key?: string | null;
          created_at?: string;
          gym_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gym_editorial_configs_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: true;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      gyms: {
        Row: {
          addr_line1: string | null;
          addr_line2: string | null;
          city: string | null;
          country_code: string | null;
          created_at: string;
          description: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          postal_code: string | null;
          province: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          addr_line1?: string | null;
          addr_line2?: string | null;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          postal_code?: string | null;
          province?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          addr_line1?: string | null;
          addr_line2?: string | null;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          postal_code?: string | null;
          province?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medical_anamnesis: {
        Row: {
          allergies_intolerances: string | null;
          availability_schedule: string | null;
          birth_place: string | null;
          created_at: string;
          current_medications: string | null;
          diseases: string | null;
          frequent_aliments: string | null;
          hard_fat_loss_body_area: string | null;
          height_cm: number | null;
          id: string;
          menstrual_cycle: Database['public']['Enums']['menstrual_cycle_enum'] | null;
          note: string | null;
          physical_issues: string | null;
          sport_experience: string | null;
          thyroid_issues: string | null;
          updated_at: string;
          user_id: string;
          weight_at_20_kg: number | null;
          weight_kg: number | null;
        };
        Insert: {
          allergies_intolerances?: string | null;
          availability_schedule?: string | null;
          birth_place?: string | null;
          created_at?: string;
          current_medications?: string | null;
          diseases?: string | null;
          frequent_aliments?: string | null;
          hard_fat_loss_body_area?: string | null;
          height_cm?: number | null;
          id?: string;
          menstrual_cycle?: Database['public']['Enums']['menstrual_cycle_enum'] | null;
          note?: string | null;
          physical_issues?: string | null;
          sport_experience?: string | null;
          thyroid_issues?: string | null;
          updated_at?: string;
          user_id: string;
          weight_at_20_kg?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          allergies_intolerances?: string | null;
          availability_schedule?: string | null;
          birth_place?: string | null;
          created_at?: string;
          current_medications?: string | null;
          diseases?: string | null;
          frequent_aliments?: string | null;
          hard_fat_loss_body_area?: string | null;
          height_cm?: number | null;
          id?: string;
          menstrual_cycle?: Database['public']['Enums']['menstrual_cycle_enum'] | null;
          note?: string | null;
          physical_issues?: string | null;
          sport_experience?: string | null;
          thyroid_issues?: string | null;
          updated_at?: string;
          user_id?: string;
          weight_at_20_kg?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'medical_anamnesis_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_anamnesis_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'medical_anamnesis_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          description: string | null;
          gym_id: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          gym_id: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          gym_id?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memberships_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          data: Json;
          error_message: string | null;
          gym_id: string | null;
          id: string;
          recipient_ids: string[];
          retry_count: number | null;
          scheduled_at: string | null;
          sent_at: string | null;
          status: Database['public']['Enums']['notification_status'];
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          data?: Json;
          error_message?: string | null;
          gym_id?: string | null;
          id?: string;
          recipient_ids?: string[];
          retry_count?: number | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: Database['public']['Enums']['notification_status'];
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          data?: Json;
          error_message?: string | null;
          gym_id?: string | null;
          id?: string;
          recipient_ids?: string[];
          retry_count?: number | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: Database['public']['Enums']['notification_status'];
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      recipes: {
        Row: {
          created_at: string;
          description: string | null;
          gym_id: string | null;
          html_content: string;
          id: string;
          is_active: boolean;
          objective: Database['public']['Enums']['fitness_objective'];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          gym_id?: string | null;
          html_content: string;
          id?: string;
          is_active?: boolean;
          objective: Database['public']['Enums']['fitness_objective'];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          gym_id?: string | null;
          html_content?: string;
          id?: string;
          is_active?: boolean;
          objective?: Database['public']['Enums']['fitness_objective'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recipes_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      role_user_permissions: {
        Row: {
          description: string | null;
          permissions: Database['public']['Enums']['user_permission'][];
          priority: number;
          role: Database['public']['Enums']['app_role'];
        };
        Insert: {
          description?: string | null;
          permissions: Database['public']['Enums']['user_permission'][];
          priority?: number;
          role: Database['public']['Enums']['app_role'];
        };
        Update: {
          description?: string | null;
          permissions?: Database['public']['Enums']['user_permission'][];
          priority?: number;
          role?: Database['public']['Enums']['app_role'];
        };
        Relationships: [];
      };
      survey_answers: {
        Row: {
          assignment_id: string;
          created_at: string;
          id: string;
          question_id: string;
          response_text: string | null;
          selected_option_id: string | null;
          updated_at: string;
        };
        Insert: {
          assignment_id: string;
          created_at?: string;
          id?: string;
          question_id: string;
          response_text?: string | null;
          selected_option_id?: string | null;
          updated_at?: string;
        };
        Update: {
          assignment_id?: string;
          created_at?: string;
          id?: string;
          question_id?: string;
          response_text?: string | null;
          selected_option_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_answers_assignment_id_fkey';
            columns: ['assignment_id'];
            isOneToOne: false;
            referencedRelation: 'survey_assignments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'survey_answers_assignment_id_fkey';
            columns: ['assignment_id'];
            isOneToOne: false;
            referencedRelation: 'survey_assignments_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'survey_answers_assignment_id_fkey';
            columns: ['assignment_id'];
            isOneToOne: false;
            referencedRelation: 'v_my_survey_assignments';
            referencedColumns: ['assignment_id'];
          },
          {
            foreignKeyName: 'survey_answers_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'survey_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'survey_answers_selected_option_id_fkey';
            columns: ['selected_option_id'];
            isOneToOne: false;
            referencedRelation: 'survey_question_options';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_assignments: {
        Row: {
          assigned_at: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          status: Database['public']['Enums']['survey_assignment_status'];
          survey_id: string;
          updated_at: string;
          user_id: string;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          assigned_at?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          status?: Database['public']['Enums']['survey_assignment_status'];
          survey_id: string;
          updated_at?: string;
          user_id: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          assigned_at?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          status?: Database['public']['Enums']['survey_assignment_status'];
          survey_id?: string;
          updated_at?: string;
          user_id?: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_assignments_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_question_options: {
        Row: {
          id: string;
          option_text: string;
          question_id: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          option_text: string;
          question_id: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          option_text?: string;
          question_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_question_options_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'survey_questions';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_questions: {
        Row: {
          id: string;
          question_text: string;
          question_type: string;
          sort_order: number;
          survey_id: string;
        };
        Insert: {
          id?: string;
          question_text: string;
          question_type: string;
          sort_order?: number;
          survey_id: string;
        };
        Update: {
          id?: string;
          question_text?: string;
          question_type?: string;
          sort_order?: number;
          survey_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_questions_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
      surveys: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          gym_id: string | null;
          id: string;
          is_active: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          gym_id?: string | null;
          id?: string;
          is_active?: boolean;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          gym_id?: string | null;
          id?: string;
          is_active?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'surveys_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      user_checkup_photos: {
        Row: {
          checkup_id: string;
          created_at: string;
          id: string;
          pose_type: string | null;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          checkup_id: string;
          created_at?: string;
          id?: string;
          pose_type?: string | null;
          storage_path: string;
          user_id: string;
        };
        Update: {
          checkup_id?: string;
          created_at?: string;
          id?: string;
          pose_type?: string | null;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_checkup_photos_checkup_id_fkey';
            columns: ['checkup_id'];
            isOneToOne: false;
            referencedRelation: 'user_checkups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_checkup_photos_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_checkup_photos_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_checkup_photos_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_checkups: {
        Row: {
          created_at: string;
          created_by: string | null;
          fat_mass_kg: number | null;
          id: string;
          lean_mass_kg: number | null;
          notes: string | null;
          updated_at: string;
          user_id: string;
          visceral_fat_level: number | null;
          weight_kg: number | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          fat_mass_kg?: number | null;
          id?: string;
          lean_mass_kg?: number | null;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
          visceral_fat_level?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          fat_mass_kg?: number | null;
          id?: string;
          lean_mass_kg?: number | null;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
          visceral_fat_level?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_checkups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_checkups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_checkups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_checkups_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_checkups_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_checkups_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_diet_assignments: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          created_at: string;
          diet_id: string;
          id: string;
          is_active: boolean;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          diet_id: string;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          diet_id?: string;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_diet_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_diet_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_diet_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_diet_assignments_diet_id_fkey';
            columns: ['diet_id'];
            isOneToOne: false;
            referencedRelation: 'diet_plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_diet_assignments_diet_id_fkey';
            columns: ['diet_id'];
            isOneToOne: false;
            referencedRelation: 'v_my_diets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_diet_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_diet_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_diet_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_memberships: {
        Row: {
          created_at: string;
          end_date: string | null;
          gym_id: string;
          id: string;
          membership_id: string;
          start_date: string;
          status: Database['public']['Enums']['membership_status'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          gym_id: string;
          id?: string;
          membership_id: string;
          start_date?: string;
          status?: Database['public']['Enums']['membership_status'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          gym_id?: string;
          id?: string;
          membership_id?: string;
          start_date?: string;
          status?: Database['public']['Enums']['membership_status'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_memberships_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_memberships_membership_id_fkey';
            columns: ['membership_id'];
            isOneToOne: false;
            referencedRelation: 'memberships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_memberships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_memberships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_memberships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_notifications: {
        Row: {
          created_at: string;
          notification_id: string;
          read_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          notification_id: string;
          read_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          notification_id?: string;
          read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_notifications_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'app_user_notifications_view';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_notifications_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
        ];
      };
      user_recipe_assignments: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          notes: string | null;
          recipe_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          recipe_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          recipe_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_recipe_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recipe_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recipe_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_recipe_assignments_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recipe_assignments_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_my_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recipe_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recipe_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_recipe_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_workout_assignments: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          notes: string | null;
          updated_at: string;
          user_id: string;
          workout_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
          user_id: string;
          workout_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_workout_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_workout_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_workout_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_workout_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_workout_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_workout_assignments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_workout_assignments_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'v_my_workouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_workout_assignments_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workout_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      video_allowed_memberships: {
        Row: {
          created_at: string | null;
          membership_id: string;
          video_id: string;
        };
        Insert: {
          created_at?: string | null;
          membership_id: string;
          video_id: string;
        };
        Update: {
          created_at?: string | null;
          membership_id?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'video_allowed_memberships_membership_id_fkey';
            columns: ['membership_id'];
            isOneToOne: false;
            referencedRelation: 'memberships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_allowed_memberships_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
        ];
      };
      video_categories: {
        Row: {
          created_at: string;
          description: string | null;
          gym_id: string;
          id: string;
          name: string;
          parent_id: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          gym_id: string;
          id?: string;
          name: string;
          parent_id?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          gym_id?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'video_categories_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'video_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      videos: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          duration_seconds: number | null;
          free: boolean;
          gym_id: string;
          id: string;
          is_active: boolean;
          published_at: string | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          vimeo_id: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          duration_seconds?: number | null;
          free?: boolean;
          gym_id: string;
          id?: string;
          is_active?: boolean;
          published_at?: string | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          vimeo_id: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          duration_seconds?: number | null;
          free?: boolean;
          gym_id?: string;
          id?: string;
          is_active?: boolean;
          published_at?: string | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          vimeo_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'videos_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'video_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'videos_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_plans: {
        Row: {
          created_at: string;
          description: string | null;
          external_url: string | null;
          gym_id: string | null;
          html_content: string;
          id: string;
          is_active: boolean;
          objective: Database['public']['Enums']['fitness_objective'];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          gym_id?: string | null;
          html_content: string;
          id?: string;
          is_active?: boolean;
          objective: Database['public']['Enums']['fitness_objective'];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          external_url?: string | null;
          gym_id?: string | null;
          html_content?: string;
          id?: string;
          is_active?: boolean;
          objective?: Database['public']['Enums']['fitness_objective'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_plans_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      youtube_live_events: {
        Row: {
          cover_url: string | null;
          created_at: string;
          description: string | null;
          ends_at: string | null;
          gym_id: string;
          id: string;
          starts_at: string;
          status: Database['public']['Enums']['youtube_live_status'];
          title: string;
          updated_at: string;
          youtube_url: string;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          gym_id: string;
          id?: string;
          starts_at: string;
          status?: Database['public']['Enums']['youtube_live_status'];
          title: string;
          updated_at?: string;
          youtube_url: string;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          gym_id?: string;
          id?: string;
          starts_at?: string;
          status?: Database['public']['Enums']['youtube_live_status'];
          title?: string;
          updated_at?: string;
          youtube_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'youtube_live_events_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      app_config_public: {
        Row: {
          id: number | null;
          latest_version: string | null;
          maintenance_message: string | null;
          maintenance_mode: boolean | null;
          min_supported_version: string | null;
          store_url_android: string | null;
          store_url_ios: string | null;
          support_email: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number | null;
          latest_version?: string | null;
          maintenance_message?: string | null;
          maintenance_mode?: boolean | null;
          min_supported_version?: string | null;
          store_url_android?: string | null;
          store_url_ios?: string | null;
          support_email?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number | null;
          latest_version?: string | null;
          maintenance_message?: string | null;
          maintenance_mode?: boolean | null;
          min_supported_version?: string | null;
          store_url_android?: string | null;
          store_url_ios?: string | null;
          support_email?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      app_user_notifications_view: {
        Row: {
          data: Json | null;
          description: string | null;
          id: string | null;
          is_read: boolean | null;
          read_at: string | null;
          sent_at: string | null;
          title: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      survey_assignments_view: {
        Row: {
          created_at: string | null;
          first_name: string | null;
          gym_id: string | null;
          id: string | null;
          last_name: string | null;
          primary_email: string | null;
          status: Database['public']['Enums']['survey_assignment_status'] | null;
          survey_id: string | null;
          survey_title: string | null;
          updated_at: string | null;
          user_id: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_assignments_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'surveys_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      v_app_users_list: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          app_role: Database['public']['Enums']['app_role'] | null;
          birth_date: string | null;
          city: string | null;
          coach_full_name: string | null;
          coach_id: string | null;
          commercial_full_name: string | null;
          commercial_id: string | null;
          created_at: string | null;
          cura_started_at: string | null;
          first_name: string | null;
          flow_deadline_at: string | null;
          flow_status: Database['public']['Enums']['flow_status_enum'] | null;
          gender: Database['public']['Enums']['gender_enum'] | null;
          gym_id: string | null;
          id: string | null;
          is_active: boolean | null;
          last_checkup_at: string | null;
          last_name: string | null;
          phone_number: string | null;
          postal_code: string | null;
          primary_email: string | null;
          program_status: Database['public']['Enums']['user_program_status'] | null;
          region: string | null;
          training_started_at: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'app_users_coach_id_fkey';
            columns: ['coach_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_users_coach_id_fkey';
            columns: ['coach_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_users_coach_id_fkey';
            columns: ['coach_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'app_users_commercial_id_fkey';
            columns: ['commercial_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_users_commercial_id_fkey';
            columns: ['commercial_id'];
            isOneToOne: false;
            referencedRelation: 'v_app_users_list';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_users_commercial_id_fkey';
            columns: ['commercial_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_anamnesis';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'app_users_gym_fk';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      v_my_diets: {
        Row: {
          created_at: string | null;
          description: string | null;
          gym_id: string | null;
          html_content: string | null;
          id: string | null;
          is_active: boolean | null;
          objective: Database['public']['Enums']['fitness_objective'] | null;
          title: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'diet_plans_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      v_my_recipes: {
        Row: {
          created_at: string | null;
          description: string | null;
          gym_id: string | null;
          html_content: string | null;
          id: string | null;
          is_active: boolean | null;
          objective: Database['public']['Enums']['fitness_objective'] | null;
          title: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipes_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      v_my_survey_assignments: {
        Row: {
          assigned_at: string | null;
          assignment_id: string | null;
          assignment_status: Database['public']['Enums']['survey_assignment_status'] | null;
          question_count: number | null;
          survey_id: string | null;
          survey_title: string | null;
          user_id: string | null;
          valid_until: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_assignments_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
      v_my_workouts: {
        Row: {
          created_at: string | null;
          description: string | null;
          external_url: string | null;
          gym_id: string | null;
          html_content: string | null;
          id: string | null;
          is_active: boolean | null;
          objective: Database['public']['Enums']['fitness_objective'] | null;
          title: string | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_plans_gym_id_fkey';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
      v_user_anamnesis: {
        Row: {
          allergies_intolerances: string | null;
          anamnesis_id: string | null;
          birth_date: string | null;
          birth_place: string | null;
          created_at: string | null;
          current_medications: string | null;
          diseases: string | null;
          first_name: string | null;
          frequent_aliments: string | null;
          gym_id: string | null;
          hard_fat_loss_body_area: string | null;
          height_cm: number | null;
          last_name: string | null;
          menstrual_cycle: Database['public']['Enums']['menstrual_cycle_enum'] | null;
          note: string | null;
          phone_number: string | null;
          thyroid_issues: string | null;
          updated_at: string | null;
          user_id: string | null;
          weight_at_20_kg: number | null;
          weight_kg: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'app_users_gym_fk';
            columns: ['gym_id'];
            isOneToOne: false;
            referencedRelation: 'gyms';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      _faq_categories_last_position: { Args: never; Returns: number };
      _faqs_last_position: { Args: { p_category: string }; Returns: number };
      _get_default_gym_id: { Args: never; Returns: string };
      _job_sync_user_flow_out_of_flow: { Args: never; Returns: undefined };
      _storage_can_access_checkup_files: {
        Args: { mode: string; object_name: string };
        Returns: boolean;
      };
      assign_survey_to_gym_roles: {
        Args: {
          p_gym_id: string;
          p_roles: Database['public']['Enums']['app_role'][];
          p_survey_id: string;
          p_valid_from?: string;
          p_valid_until?: string;
        };
        Returns: number;
      };
      bootstrap_current_user: { Args: never; Returns: undefined };
      custom_access_token_hook: { Args: { event: Json }; Returns: Json };
      expire_overdue_surveys: { Args: never; Returns: undefined };
      faq_categories_resequence: { Args: never; Returns: Json };
      faqs_resequence: { Args: { p_category_id?: string }; Returns: Json };
      get_gym_active_videos_by_category: {
        Args: { p_gym_id: string };
        Returns: Json;
      };
      get_survey_stats: { Args: { p_survey_id: string }; Returns: Json };
      get_user_fitness_overview: {
        Args: {
          _include_inactive?: boolean;
          _objective: Database['public']['Enums']['fitness_objective'];
          _user_id: string;
        };
        Returns: Json;
      };
      get_user_survey_details: {
        Args: { p_survey_id: string; p_user_id: string };
        Returns: Json;
      };
      list_objects_gym: {
        Args: {
          bucketid: string;
          gym: string;
          limits?: number;
          offsets?: number;
          prefix?: string;
          q?: string;
        };
        Returns: {
          created_at: string;
          id: string;
          last_accessed_at: string;
          metadata: Json;
          name: string;
          updated_at: string;
        }[];
      };
      me: { Args: never; Returns: Json };
      me_detailed: { Args: never; Returns: Json };
      rbac_roles: {
        Args: never;
        Returns: {
          description: string;
          priority: number;
          role: Database['public']['Enums']['app_role'];
        }[];
      };
      set_avatar_key: {
        Args: { p_key: string; p_user_id: string };
        Returns: undefined;
      };
      set_user_role: {
        Args: {
          p_new_role: Database['public']['Enums']['app_role'];
          p_user_id: string;
        };
        Returns: undefined;
      };
      stats_dashboard: {
        Args: { p_gym_id?: string; p_months?: number };
        Returns: Json;
      };
      submit_survey_assignment: {
        Args: { p_assignment_id: string };
        Returns: boolean;
      };
      sync_all_user_member_roles: { Args: never; Returns: undefined };
      sync_auth_ban_from_app_users: { Args: never; Returns: undefined };
      sync_user_member_role: { Args: { p_user_id: string }; Returns: undefined };
      update_youtube_live_statuses: { Args: never; Returns: undefined };
      user_has_active_membership: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role:
        | 'developer'
        | 'super_admin'
        | 'group_admin'
        | 'medical_admin'
        | 'operator'
        | 'member'
        | 'user';
      chat_sender_type: 'user' | 'operator' | 'bot';
      conversation_status: 'active' | 'waiting_operator' | 'archived';
      fitness_objective: 'dimagrimento' | 'massa_muscolare' | 'mantenimento';
      flow_status_enum: 'in_flow' | 'out_of_flow' | 'no_checkup';
      gender_enum: 'maschio' | 'femmina' | 'non_binario' | 'altro' | 'non_dichiarato';
      membership_status: 'pending' | 'active' | 'expired';
      menstrual_cycle_enum: 'regolare' | 'irregolare' | 'non_applicabile' | 'non_dichiarato';
      notification_status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
      survey_assignment_status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
      user_notification_delivery_status: 'pending' | 'sent' | 'error';
      user_notification_read_status: 'unread' | 'read';
      user_permission:
        | 'USER:READ:ALL'
        | 'USER:READ:GYM'
        | 'USER:READ:OWN'
        | 'USER:WRITE:ALL'
        | 'USER:WRITE:GYM'
        | 'USER:WRITE:OWN'
        | 'USER:DELETE:ALL'
        | 'USER:DELETE:GYM'
        | 'USER:DELETE:OWN'
        | 'GYM:READ:ALL'
        | 'GYM:READ:OWN'
        | 'GYM:WRITE:ALL'
        | 'GYM:WRITE:OWN'
        | 'GYM:DELETE:ALL'
        | 'GYM:DELETE:OWN'
        | 'MEMBERSHIP:READ:ALL'
        | 'MEMBERSHIP:READ:OWN'
        | 'MEMBERSHIP:READ:GYM'
        | 'MEMBERSHIP:WRITE:ALL'
        | 'MEMBERSHIP:WRITE:OWN'
        | 'MEMBERSHIP:WRITE:GYM'
        | 'MEMBERSHIP:DELETE:ALL'
        | 'MEMBERSHIP:DELETE:OWN'
        | 'MEMBERSHIP:DELETE:GYM'
        | 'VIDEO:READ:ALL'
        | 'VIDEO:WRITE:ALL'
        | 'VIDEO:DELETE:ALL'
        | 'VIDEO_CATEGORY:READ:ALL'
        | 'VIDEO_CATEGORY:WRITE:ALL'
        | 'VIDEO_CATEGORY:DELETE:ALL'
        | 'FAQ:READ:ALL'
        | 'FAQ:WRITE:ALL'
        | 'FAQ:DELETE:ALL'
        | 'FAQ_CATEGORY:READ:ALL'
        | 'FAQ_CATEGORY:WRITE:ALL'
        | 'FAQ_CATEGORY:DELETE:ALL'
        | 'WORKOUT:READ:ALL'
        | 'WORKOUT:READ:GYM'
        | 'WORKOUT:WRITE:ALL'
        | 'WORKOUT:WRITE:GYM'
        | 'WORKOUT:DELETE:ALL'
        | 'WORKOUT:DELETE:GYM'
        | 'DIET:READ:ALL'
        | 'DIET:READ:GYM'
        | 'DIET:WRITE:ALL'
        | 'DIET:WRITE:GYM'
        | 'DIET:DELETE:ALL'
        | 'DIET:DELETE:GYM'
        | 'RECIPE:READ:ALL'
        | 'RECIPE:READ:GYM'
        | 'RECIPE:WRITE:ALL'
        | 'RECIPE:WRITE:GYM'
        | 'RECIPE:DELETE:ALL'
        | 'RECIPE:DELETE:GYM'
        | 'VIDEO:READ:GYM'
        | 'VIDEO:WRITE:GYM'
        | 'VIDEO:DELETE:GYM'
        | 'VIDEO_CATEGORY:READ:GYM'
        | 'VIDEO_CATEGORY:WRITE:GYM'
        | 'VIDEO_CATEGORY:DELETE:GYM'
        | 'CONTENT_IMAGE:READ:ALL'
        | 'CONTENT_IMAGE:WRITE:ALL'
        | 'CONTENT_IMAGE:DELETE:ALL'
        | 'CONTENT_IMAGE:READ:GYM'
        | 'CONTENT_IMAGE:WRITE:GYM'
        | 'CONTENT_IMAGE:DELETE:GYM'
        | 'NOTIFICATION:READ:ALL'
        | 'NOTIFICATION:WRITE:ALL'
        | 'NOTIFICATION:DELETE:ALL'
        | 'SURVEY:READ:ALL'
        | 'SURVEY:WRITE:ALL'
        | 'SURVEY:DELETE:ALL'
        | 'NOTIFICATION:READ:GYM'
        | 'NOTIFICATION:WRITE:GYM'
        | 'NOTIFICATION:DELETE:GYM'
        | 'SURVEY:READ:GYM'
        | 'SURVEY:WRITE:GYM'
        | 'SURVEY:DELETE:GYM'
        | 'CHECKUP:READ:ALL'
        | 'CHECKUP:READ:OWN'
        | 'CHECKUP:READ:GYM'
        | 'CHECKUP:WRITE:ALL'
        | 'CHECKUP:WRITE:GYM'
        | 'CHECKUP:DELETE:ALL'
        | 'CHECKUP:DELETE:GYM'
        | 'EDITORIAL:READ:ALL'
        | 'EDITORIAL:WRITE:ALL'
        | 'EDITORIAL:WRITE:GYM'
        | 'FITNESS_RULES:WRITE';
      user_program_status: 'in_cura' | 'iniziato' | 'registrato';
      youtube_live_status: 'scheduled' | 'live' | 'ended' | 'canceled';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        'developer',
        'super_admin',
        'group_admin',
        'medical_admin',
        'operator',
        'member',
        'user',
      ],
      chat_sender_type: ['user', 'operator', 'bot'],
      conversation_status: ['active', 'waiting_operator', 'archived'],
      fitness_objective: ['dimagrimento', 'massa_muscolare', 'mantenimento'],
      flow_status_enum: ['in_flow', 'out_of_flow', 'no_checkup'],
      gender_enum: ['maschio', 'femmina', 'non_binario', 'altro', 'non_dichiarato'],
      membership_status: ['pending', 'active', 'expired'],
      menstrual_cycle_enum: ['regolare', 'irregolare', 'non_applicabile', 'non_dichiarato'],
      notification_status: ['draft', 'scheduled', 'sent', 'cancelled'],
      survey_assignment_status: ['PENDING', 'COMPLETED', 'EXPIRED'],
      user_notification_delivery_status: ['pending', 'sent', 'error'],
      user_notification_read_status: ['unread', 'read'],
      user_permission: [
        'USER:READ:ALL',
        'USER:READ:GYM',
        'USER:READ:OWN',
        'USER:WRITE:ALL',
        'USER:WRITE:GYM',
        'USER:WRITE:OWN',
        'USER:DELETE:ALL',
        'USER:DELETE:GYM',
        'USER:DELETE:OWN',
        'GYM:READ:ALL',
        'GYM:READ:OWN',
        'GYM:WRITE:ALL',
        'GYM:WRITE:OWN',
        'GYM:DELETE:ALL',
        'GYM:DELETE:OWN',
        'MEMBERSHIP:READ:ALL',
        'MEMBERSHIP:READ:OWN',
        'MEMBERSHIP:READ:GYM',
        'MEMBERSHIP:WRITE:ALL',
        'MEMBERSHIP:WRITE:OWN',
        'MEMBERSHIP:WRITE:GYM',
        'MEMBERSHIP:DELETE:ALL',
        'MEMBERSHIP:DELETE:OWN',
        'MEMBERSHIP:DELETE:GYM',
        'VIDEO:READ:ALL',
        'VIDEO:WRITE:ALL',
        'VIDEO:DELETE:ALL',
        'VIDEO_CATEGORY:READ:ALL',
        'VIDEO_CATEGORY:WRITE:ALL',
        'VIDEO_CATEGORY:DELETE:ALL',
        'FAQ:READ:ALL',
        'FAQ:WRITE:ALL',
        'FAQ:DELETE:ALL',
        'FAQ_CATEGORY:READ:ALL',
        'FAQ_CATEGORY:WRITE:ALL',
        'FAQ_CATEGORY:DELETE:ALL',
        'WORKOUT:READ:ALL',
        'WORKOUT:READ:GYM',
        'WORKOUT:WRITE:ALL',
        'WORKOUT:WRITE:GYM',
        'WORKOUT:DELETE:ALL',
        'WORKOUT:DELETE:GYM',
        'DIET:READ:ALL',
        'DIET:READ:GYM',
        'DIET:WRITE:ALL',
        'DIET:WRITE:GYM',
        'DIET:DELETE:ALL',
        'DIET:DELETE:GYM',
        'RECIPE:READ:ALL',
        'RECIPE:READ:GYM',
        'RECIPE:WRITE:ALL',
        'RECIPE:WRITE:GYM',
        'RECIPE:DELETE:ALL',
        'RECIPE:DELETE:GYM',
        'VIDEO:READ:GYM',
        'VIDEO:WRITE:GYM',
        'VIDEO:DELETE:GYM',
        'VIDEO_CATEGORY:READ:GYM',
        'VIDEO_CATEGORY:WRITE:GYM',
        'VIDEO_CATEGORY:DELETE:GYM',
        'CONTENT_IMAGE:READ:ALL',
        'CONTENT_IMAGE:WRITE:ALL',
        'CONTENT_IMAGE:DELETE:ALL',
        'CONTENT_IMAGE:READ:GYM',
        'CONTENT_IMAGE:WRITE:GYM',
        'CONTENT_IMAGE:DELETE:GYM',
        'NOTIFICATION:READ:ALL',
        'NOTIFICATION:WRITE:ALL',
        'NOTIFICATION:DELETE:ALL',
        'SURVEY:READ:ALL',
        'SURVEY:WRITE:ALL',
        'SURVEY:DELETE:ALL',
        'NOTIFICATION:READ:GYM',
        'NOTIFICATION:WRITE:GYM',
        'NOTIFICATION:DELETE:GYM',
        'SURVEY:READ:GYM',
        'SURVEY:WRITE:GYM',
        'SURVEY:DELETE:GYM',
        'CHECKUP:READ:ALL',
        'CHECKUP:READ:OWN',
        'CHECKUP:READ:GYM',
        'CHECKUP:WRITE:ALL',
        'CHECKUP:WRITE:GYM',
        'CHECKUP:DELETE:ALL',
        'CHECKUP:DELETE:GYM',
        'EDITORIAL:READ:ALL',
        'EDITORIAL:WRITE:ALL',
        'EDITORIAL:WRITE:GYM',
        'FITNESS_RULES:WRITE',
      ],
      user_program_status: ['in_cura', 'iniziato', 'registrato'],
      youtube_live_status: ['scheduled', 'live', 'ended', 'canceled'],
    },
  },
} as const;
