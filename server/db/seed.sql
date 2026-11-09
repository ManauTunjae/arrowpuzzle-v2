-- Two made-up companies with different themes. No real organisations.
INSERT INTO campaigns (slug, org_name, swish_number, goal_amount, is_active, theme, content) VALUES
(
  'granbacken',
  'Stiftelsen Granbacken',
  '1230000001',
  50000,
  1,
  '{"bg":"#FBF6EE","card":"#FFFDF8","line":"#EADFCF","primary":"#2F4A3A","gameBg":"#1F3329","accent":"#B5443B","glow":"#E8B04B","text":"#3B2F2A"}',
  '{"title":"Tänd ett ljus","intro":"Hjälp Granbacken att ge fler barn en varm jul.","donateText":"Varje gåva ger en varm julmåltid.","amounts":[20,50,100,200],"unlockMode":"open"}'
),
(
  'norrskenet',
  'Föreningen Norrskenet',
  '1230000002',
  30000,
  1,
  '{"bg":"#F3F6FB","card":"#FFFFFF","line":"#D9E1EF","primary":"#243B6B","gameBg":"#14213D","accent":"#C2410C","glow":"#F2C94C","text":"#1E2A44"}',
  '{"title":"Tänd ett ljus","intro":"Norrskenet samlar in till julklappar för ensamma äldre.","donateText":"Din gåva blir en julklapp.","amounts":[20,50,100,200],"unlockMode":"invite"}'
);
