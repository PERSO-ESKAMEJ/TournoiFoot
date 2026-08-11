-- ============================================================
-- Retire le suivi budget/logistique/supports de communication de
-- l'application (fonctionnalités non souhaitées) — garde uniquement le
-- QR code d'inscription (généré côté client, aucune table associée).
-- ============================================================

drop table if exists expenses;
drop table if exists drink_options;
drop table if exists communication_assets;

-- Champs terrain/chasubles devenus orphelins (n'étaient utilisés que par
-- la page Logistique, supprimée).
alter table tournaments drop column if exists field_price_per_hour;
alter table tournaments drop column if exists field_hours_booked;
alter table tournaments drop column if exists jersey_unit_price;
