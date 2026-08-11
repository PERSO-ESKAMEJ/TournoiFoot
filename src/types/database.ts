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
          logo_url: string | null;
          comment: string | null;
          contact_name: string;
          contact_whatsapp: string;
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
          contact_name: string;
          contact_whatsapp: string;
        };
        Update: Partial<Database['public']['Tables']['team_applications']['Row']>;
      } & NoRelationships;
      application_players: {
        Row: {
          id: string;
          application_id: string;
          name: string;
          role: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['application_players']['Row']> & {
          application_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['application_players']['Row']>;
      } & NoRelationships;
      teams: {
        Row: {
          id: string;
          tournament_id: string;
          application_id: string | null;
          name: string;
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
          name: string;
          role: string | null;
          present: boolean;
        };
        Insert: Partial<Database['public']['Tables']['team_members']['Row']> & {
          team_id: string;
          name: string;
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
    };
    Views: Record<string, never>;
    Functions: {
      create_application: { Args: { payload: Json }; Returns: Json };
      get_application_by_token: { Args: { p_token: string }; Returns: Json };
      update_application_by_token: { Args: { p_token: string; payload: Json }; Returns: Json };
    };
  };
}
