-- Optional weekly push schedule. First create two Vault secrets:
--   duofit_weekly_push_url = https://<project-ref>.supabase.co/functions/v1/weekly-push
--   duofit_weekly_push_secret = same value as WEEKLY_PUSH_SECRET Edge Function secret
-- Enable pg_cron and pg_net in Supabase Database > Extensions before running.
select cron.schedule(
  'duofit-weekly-plan',
  '0 1 * * 1', -- Monday 01:00 UTC = Monday 09:00 Asia/Shanghai
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name='duofit_weekly_push_url' limit 1),
      headers := jsonb_build_object('Content-Type','application/json','x-weekly-push-secret',
        (select decrypted_secret from vault.decrypted_secrets where name='duofit_weekly_push_secret' limit 1)),
      body := '{}'::jsonb
    );
  $job$
);
