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
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: "citizen" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          role?: "citizen" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          role?: "citizen" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          citizen_id: string | null;
          title: string;
          description: string;
          category:
            | "Pothole"
            | "Road Damage"
            | "Garbage"
            | "Streetlight"
            | "Water Leakage"
            | "Drainage"
            | "Other";
          severity: "Critical" | "High" | "Medium" | "Low";
          priority: "Critical" | "High" | "Medium" | "Low";
          department:
            | "Roads"
            | "Sanitation"
            | "Electricity"
            | "Water Supply"
            | "Drainage"
            | "Other";
          status: "Reported" | "In Progress" | "Resolved";
          latitude: number | null;
          longitude: number | null;
          location_text: string;
          image_path: string | null;
          ai_analysis: Json | null;
          resolution_image_path: string | null;
          resolution_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          citizen_id?: string | null;
          title: string;
          description: string;
          category:
            | "Pothole"
            | "Road Damage"
            | "Garbage"
            | "Streetlight"
            | "Water Leakage"
            | "Drainage"
            | "Other";
          severity?: "Critical" | "High" | "Medium" | "Low";
          priority?: "Critical" | "High" | "Medium" | "Low";
          department?:
            | "Roads"
            | "Sanitation"
            | "Electricity"
            | "Water Supply"
            | "Drainage"
            | "Other";
          status?: "Reported" | "In Progress" | "Resolved";
          latitude?: number | null;
          longitude?: number | null;
          location_text?: string;
          image_path?: string | null;
          ai_analysis?: Json | null;
          resolution_image_path?: string | null;
          resolution_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          citizen_id?: string | null;
          title?: string;
          description?: string;
          category?:
            | "Pothole"
            | "Road Damage"
            | "Garbage"
            | "Streetlight"
            | "Water Leakage"
            | "Drainage"
            | "Other";
          severity?: "Critical" | "High" | "Medium" | "Low";
          priority?: "Critical" | "High" | "Medium" | "Low";
          department?:
            | "Roads"
            | "Sanitation"
            | "Electricity"
            | "Water Supply"
            | "Drainage"
            | "Other";
          status?: "Reported" | "In Progress" | "Resolved";
          latitude?: number | null;
          longitude?: number | null;
          location_text?: string;
          image_path?: string | null;
          ai_analysis?: Json | null;
          resolution_image_path?: string | null;
          resolution_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issues_citizen_id_fkey";
            columns: ["citizen_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      issue_updates: {
        Row: {
          id: string;
          issue_id: string;
          updated_by: string | null;
          updated_by_name: string | null;
          old_status: "Reported" | "In Progress" | "Resolved" | null;
          new_status: "Reported" | "In Progress" | "Resolved";
          note: string | null;
          evidence_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          updated_by?: string | null;
          updated_by_name?: string | null;
          old_status?: "Reported" | "In Progress" | "Resolved" | null;
          new_status: "Reported" | "In Progress" | "Resolved";
          note?: string | null;
          evidence_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          updated_by?: string | null;
          updated_by_name?: string | null;
          old_status?: "Reported" | "In Progress" | "Resolved" | null;
          new_status?: "Reported" | "In Progress" | "Resolved";
          note?: string | null;
          evidence_path?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issue_updates_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      generate_issue_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_admin_dashboard_metrics: {
        Args: Record<PropertyKey, never>;
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
}
