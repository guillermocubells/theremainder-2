-- Añade el rol 'superadmin' al enum app_role.
--
-- Va en su propia migración a propósito: Postgres permite ALTER TYPE ... ADD VALUE
-- dentro de una transacción, pero NO permite usar ese valor nuevo en la misma
-- transacción. La migración siguiente (20260828120100) es la que lo usa.
-- Mismo patrón que se siguió al añadir 'moderator' (20260228010457 → 20260228010507).

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
