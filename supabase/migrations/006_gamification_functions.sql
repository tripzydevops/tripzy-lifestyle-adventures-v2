-- Function to award XP and handle leveling up
CREATE OR REPLACE FUNCTION public.award_xp(
  user_id UUID,
  xp_amount INTEGER
) RETURNS VOID AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current stats
  SELECT xp, level INTO current_xp, current_level
  FROM public.profiles
  WHERE id = user_id;

  -- Default nulls to 0/1
  current_xp := COALESCE(current_xp, 0);
  current_level := COALESCE(current_level, 1);

  -- Calculate new stats
  new_xp := current_xp + xp_amount;
  -- Simple formula: Level = floor(xp / 100) + 1  (or whatever logic we want)
  -- Let's stick to the service logic: Level N requires roughly N*100 XP?
  -- Actually, let's just keep the level calculation simple for now in the DB:
  -- Level increases every 1000 XP
  new_level := (new_xp / 1000) + 1;

  -- Update profile
  UPDATE public.profiles
  SET 
    xp = new_xp,
    level = new_level
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
