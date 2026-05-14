-- Table rate limiting par utilisateur / route / fenêtre temporelle
CREATE TABLE IF NOT EXISTS api_rate_limits (
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  route        text NOT NULL,
  window_start timestamptz NOT NULL,
  count        int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, route, window_start)
);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Lecture : chaque utilisateur voit uniquement ses propres lignes
CREATE POLICY "Users can read own rate limits"
  ON api_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Écriture via service role uniquement (pas de policy INSERT/UPDATE pour les users)

-- Fonction atomique d'incrément (SECURITY DEFINER = s'exécute avec les droits owner)
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id     uuid,
  p_route       text,
  p_window_start timestamptz
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count int;
BEGIN
  INSERT INTO api_rate_limits (user_id, route, window_start, count)
  VALUES (p_user_id, p_route, p_window_start, 1)
  ON CONFLICT (user_id, route, window_start)
  DO UPDATE SET count = api_rate_limits.count + 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;
