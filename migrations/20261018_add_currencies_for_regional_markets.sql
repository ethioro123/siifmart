-- Add the ISO currencies used by the configured East African country profiles.
INSERT INTO public.currencies (code, name, symbol, decimals)
VALUES
  ('UGX', 'Ugandan Shilling', 'USh', 0),
  ('RWF', 'Rwandan Franc', 'RF', 0),
  ('TZS', 'Tanzanian Shilling', 'TSh', 2)
ON CONFLICT (code) DO NOTHING;
