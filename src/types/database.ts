// Types générés manuellement à partir de supabase/migrations/20260811120000_init_schema.sql
// (pas de projet Supabase live à introspecter pour l'instant). À régénérer avec
// `supabase gen types typescript` une fois le projet créé, pour rester en phase
// avec le schéma réel après d'éventuelles migrations futures.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRole = 'super_admin' | 'tournament_manager' | 'read_only';
export type TournamentStatus =
  | 'preparation'
  | 'registrations_open'
  | 'registrations_closed'
  | 'bracket_ready'
  | 'in_progress'
  | 'completed';
export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'needs_info'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'cancelled';
export type SportStatus =
  | 'registered'
  | 'present'
  | 'quarterfinalist'
  | 'semifinalist'
  | 'finalist'
  | 'winner'
  | 'eliminated'
  | 'forfeit';
export type MatchStatus = 'scheduled' | 'next_up' | 'in_progress' | 'completed' | 'cancelled' | 'forfeit';
export type ExpenseCategory =
  | 'terrain'
  | 'chasubles'
  | 'trophees'
  | 'medailles'
  | 'boissons'
  | 'restauration'
  | 'impressions'
  | 'communication'
  | 'autre';
export type ExpenseStatus = 'planned' | 'ordered' | 'paid' | 'cancelled';
export type CommunicationAssetType = 'flyer_general' | 'flyer_inscription' | 'other';
export type CommunicationAssetStatus = 'todo' | 'done' | 'published';

// Le client Supabase (postgrest-js) exige que chaque table déclare Relationships
// (utilisé pour typer les embeds `select('*, fk(...)')`). On n'encode pas les FK
// ici pour rester simple — [] suffit pour satisfaire le type GenericTable.
type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; role: ProfileRole; created_at: string };
        Insert: { id: string; full_name: string; role: ProfileRole; created_at?: string };
        Update: Partial<{ full_name: string; role: ProfileRole }>;
      } & NoRelationships;
      tournaments: {
        Row: {
          id: string;
          name: string;
          memorial_subtitle: string | null;
          description: string | null;
          event_date: string;
          start_time: string;
          end_time: string;
          venue_name: string;
          venue_city: string;
          max_teams: number;
          min_players_per_team: number;
          max_players_per_team: number;
          match_duration_minutes: number;
          transition_minutes: number;
          registration_opens_at: string | null;
          registration_closes_at: string | null;
          status: TournamentStatus;
          contact_name: string | null;
          contact_phone: string | null;
          father_name: string | null;
          father_photo_url: string | null;
          tournament_logo_url: string | null;
          field_price_per_hour: number | null;
          field_hours_booked: number | null;
          jersey_unit_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tournaments']['Row']> & {
          name: string;
          event_date: string;
          start_time: string;
          end_time: string;
          venue_name: string;
          venue_city: string;
        };
        Update: Partial<Database['public']['Tables']['tournaments']['Row']>;
      } & NoRelationships;
      team_applications: {
        Row: {
          id: string;
          tournament_id: string;
          reference: string;
          access_token: string;
          team_name: string;
          neighborhood: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          logo_url: string | null;
          comment: string | null;
          contact_first_name: string;
          contact_last_name: string;
          contact_whatsapp: string;
          contact_phone: string | null;
          contact_email: string | null;
          status: ApplicationStatus;
          review_notes: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['team_applications']['Row']> & {
          tournament_id: string;
          reference: string;
          team_name: string;
          contact_first_name: string;
          contact_last_name: string;
          contact_whatsapp: string;
        };
        Update: Partial<Database['public']['Tables']['team_applications']['Row']>;
      } & NoRelationships;
      application_players: {
        Row: {
          id: string;
          application_id: string;
          first_name: string;
          last_name: string;
          nickname: string | null;
          jersey_number: number | null;
          role: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['application_players']['Row']> & {
          application_id: string;
          first_name: string;
          last_name: string;
        };
        Update: Partial<Database['public']['Tables']['application_players']['Row']>;
      } & NoRelationships;
      teams: {
        Row: {
          id: string;
          tournament_id: string;
          application_id: string | null;
          name: string;
          neighborhood: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          logo_url: string | null;
          seed: number | null;
          checked_in: boolean;
          checked_in_at: string | null;
          sport_status: SportStatus;
          wins: number;
          losses: number;
          goals_for: number;
          goals_against: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['teams']['Row']> & {
          tournament_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['teams']['Row']>;
      } & NoRelationships;
      team_members: {
        Row: {
          id: string;
          team_id: string;
          first_name: string;
          last_name: string;
          nickname: string | null;
          jersey_number: number | null;
          role: string | null;
          present: boolean;
        };
        Insert: Partial<Database['public']['Tables']['team_members']['Row']> & {
          team_id: string;
          first_name: string;
          last_name: string;
        };
        Update: Partial<Database['public']['Tables']['team_members']['Row']>;
      } & NoRelationships;
      rounds: {
        Row: { id: string; tournament_id: string; round_number: number; name: string; created_at: string };
        Insert: { id?: string; tournament_id: string; round_number: number; name: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['rounds']['Row']>;
      } & NoRelationships;
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          round_id: string;
          slot: number;
          order_index: number;
          team1_id: string | null;
          team2_id: string | null;
          team1_score: number | null;
          team2_score: number | null;
          team1_penalties: number | null;
          team2_penalties: number | null;
          winner_id: string | null;
          scheduled_start: string | null;
          actual_start: string | null;
          venue_note: string | null;
          status: MatchStatus;
          forfeit_team_id: string | null;
          notes: string | null;
          next_match_id: string | null;
          next_match_slot: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['matches']['Row']> & {
          tournament_id: string;
          round_id: string;
          slot: number;
        };
        Update: Partial<Database['public']['Tables']['matches']['Row']>;
      } & NoRelationships;
      audit_logs: {
        Row: {
          id: string;
          tournament_id: string | null;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before: Json | null;
          after: Json | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']> & {
          action: string;
          entity_type: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
      } & NoRelationships;
      expenses: {
        Row: {
          id: string;
          tournament_id: string;
          category: ExpenseCategory;
          label: string;
          quantity: number;
          unit_price: number;
          planned_amount: number;
          actual_amount: number | null;
          responsible: string | null;
          status: ExpenseStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['expenses']['Row']> & {
          tournament_id: string;
          category: ExpenseCategory;
          label: string;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Row']>;
      } & NoRelationships;
      drink_options: {
        Row: {
          id: string;
          tournament_id: string;
          option_name: string;
          supplier: string | null;
          quantity: number | null;
          unit_price: number | null;
          extra_fees: number | null;
          notes: string | null;
          selected: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['drink_options']['Row']> & {
          tournament_id: string;
          option_name: string;
        };
        Update: Partial<Database['public']['Tables']['drink_options']['Row']>;
      } & NoRelationships;
      communication_assets: {
        Row: {
          id: string;
          tournament_id: string;
          name: string;
          type: CommunicationAssetType;
          status: CommunicationAssetStatus;
          responsible: string | null;
          due_date: string | null;
          file_url: string | null;
          external_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['communication_assets']['Row']> & {
          tournament_id: string;
          name: string;
          type: CommunicationAssetType;
        };
        Update: Partial<Database['public']['Tables']['communication_assets']['Row']>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: {
      create_application: { Args: { payload: Json }; Returns: Json };
      get_application_by_token: { Args: { p_token: string }; Returns: Json };
      update_application_by_token: { Args: { p_token: string; payload: Json }; Returns: Json };
    };
  };
}
