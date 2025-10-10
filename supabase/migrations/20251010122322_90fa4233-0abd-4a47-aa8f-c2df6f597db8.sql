-- Schedule the auto-publish job to run every 5 minutes
SELECT cron.schedule(
  'auto-publish-books-job',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://dmrfbokchkxjzslfzeps.supabase.co/functions/v1/auto-publish-books',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcmZib2tjaGt4anpzbGZ6ZXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTc4NTksImV4cCI6MjA3NDk3Mzg1OX0.c6FlbkKl16DCeKBiTBJgxGaB22Ege2RvssMMhlLEKlo'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);