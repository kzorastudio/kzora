-- Add meta JSONB column to static_pages if missing
ALTER TABLE public.static_pages
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT NULL;

-- Delete the wrong slug
DELETE FROM public.static_pages WHERE slug = 'return-policy';

SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='static_pages' AND column_name='meta';
