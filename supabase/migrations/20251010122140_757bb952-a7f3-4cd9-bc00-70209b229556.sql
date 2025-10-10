-- Move extensions to extensions schema instead of public
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop from public and recreate in extensions schema
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS pg_net;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;