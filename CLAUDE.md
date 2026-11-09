# CLAUDE.md – arrowpuzzle (Tänd ett ljus, julkampanj med pilpussel)

Den här filen läser Claude Code i början av varje session. Den beskriver projektet, reglerna och hur vi jobbar.

## Om mig (utvecklaren)

- Jag heter Manau och är nybörjare. Svenska är inte mitt modersmål.
- Förklara på **enkel svenska**, med korta meningar och små steg.
- Påminn mig om **fallgropar** (saker som lätt blir fel).
- När något ska testas: ge **steg-för-steg-instruktioner för Postman** (metod, URL, headers, body, förväntat svar).
- Kod, variabelnamn, kommentarer i koden och commit-meddelanden skrivs på **engelska**.

## Projektet

Ett 30-sekunders julspel som leder till en simulerad gåvokampanj för en ideell organisation.

- Spelaren klickar på **tändstickor** på ett bräde (som Arrows-pusslet). Den röda knoppen visar riktningen.
- Är vägen fri glider stickan ut och tänder ett av **4 adventsljus** runt brädet (upp, höger, ner, vänster).
- Krock = −1 hjärta (3 hjärtan). 3 nivåer. Nedräkning 30 sekunder.
- Efter spelet: resultat + topplista → ge en gåva (Swish QR / Öppna Swish) → utmana en vän via SMS → tack.
- **White label:** varje kund (företag) har en egen kampanj med eget tema (färger, bilder) och egna texter i databasen.
- **Allt är simulerat:** påhittad organisation, påhittat Swish-nummer, inga riktiga betalningar eller SMS.
- **Fas 2 (senare, inte nu):** lås upp nivå 2 och 3 genom att bjuda in vänner. Databasen förbereds redan nu.

Planen finns i dokumentet "Tänd ett ljus – plan v3". Wireframes finns på canvasen "Pilpussel – wireframes".

## Stack (inget frontend-ramverk)

| Del | Teknik |
|---|---|
| Frontend | Vanlig **HTML + CSS + JavaScript**. ES modules (`<script type="module">`). Ingen build, ingen bundler. |
| Backend | **Node.js + Express**. Express serverar också filerna i `client/`. |
| Databas | **SQLite** i en fil. Paket: `better-sqlite3`. Tabeller i vanlig SQL (`schema.sql`). |
| Tester | Nodes inbyggda `node --test` |
| Animationer | CSS (`transition`, `@keyframes`) + Web Animations API (`element.animate()`) + SVG |

**Använd inte:** React, Next.js, Vue, Tailwind, TypeScript, Supabase, ORM. Fråga mig innan du lägger till ett nytt npm-paket.

## Mappstruktur

```
arrowpuzzle/
├── client/
│   ├── index.html  name.html  how.html  play.html  result.html
│   ├── invite.html  donate.html  sms.html  thanks.html  admin.html
│   ├── css/        # base.css, components.css, game.css
│   ├── js/
│   │   ├── api.js        # alla fetch-anrop
│   │   ├── theme.js      # hämtar kampanj, sätter CSS-variabler
│   │   ├── player.js     # token + smeknamn i localStorage
│   │   ├── game/         # rules.js, levels.js, board.js, countdown.js, game.js
│   │   └── pages/        # en fil per sida: start.js, result.js ...
│   └── assets/
├── server/
│   ├── server.js
│   ├── routes/       # campaigns, players, sessions, invites, donations, leads, admin
│   ├── services/     # scoreCheck.js, swishQr.js, inviteCode.js
│   ├── db/           # db.js, schema.sql, seed.sql
│   ├── data/         # arrowpuzzle.db  (finns INTE på GitHub)
│   └── validators.js
├── tests/            # rules.test.js
├── package.json
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

Håll filerna små. En sida = en HTML-fil + en JS-fil i `js/pages/`. Ingen jättestor `app.js`.

## Kommandon

```bash
npm install
npm run dev        # node --watch server/server.js  → http://localhost:3000
npm run db:reset   # tar bort DB-filen, kör schema.sql + seed.sql
npm test           # node --test tests/
```

Skapa scripten i `package.json` om de saknas. Använd `"type": "module"` i `package.json`.

## Miljövariabler

- `.env`: `PORT=3000`, `DB_PATH=server/data/arrowpuzzle.db`, `ADMIN_PASSWORD=`
- **Lägg aldrig `.env` eller `server/data/` på GitHub.** Bara `.env.example`.

## Databas (SQLite)

SQLite har inga `boolean` eller `jsonb`: sant/falskt = `INTEGER` 0/1, JSON = `TEXT`, datum = `TEXT` (ISO).

| Tabell | Kolumner |
|---|---|
| `campaigns` | id INTEGER PK, slug TEXT UNIQUE, org_name, swish_number, goal_amount, is_active, theme (JSON), content (JSON), created_at, updated_at |
| `players` | id, campaign_id, token TEXT UNIQUE, nickname, unlocked_level DEFAULT 1, invited_by_code, created_at |
| `game_sessions` | id, campaign_id, player_id, level, score, candles_lit, levels_cleared, hearts_left, started_at, finished_at |
| `invites` | id, campaign_id, inviter_player_id, code TEXT UNIQUE, clicks DEFAULT 0, invited_player_id, completed_at, created_at |
| `donation_intents` | id, campaign_id, session_id, amount, method (`qr`/`swish_link`), status (`shown`/`clicked`/`simulated_paid`), created_at |
| `sms_leads` | id, campaign_id, player_id, phone, consent, created_at |

- Slå på foreign keys: `db.pragma('foreign_keys = ON')`.
- Seed: 2 påhittade företag med olika tema.
- **Alltid parametrar:** `db.prepare('SELECT * FROM players WHERE token = ?').get(token)`. Sätt aldrig ihop SQL med `+` eller `${}`.

## API (Express)

| Metod | Route | Vad |
|---|---|---|
| GET | `/api/campaigns/:slug` | Kampanj + tema + texter |
| POST | `/api/players` | Skapa spelare (smeknamn) → `token` |
| GET | `/api/players/me` | Spelare via header `X-Player-Token` + `unlockedLevel` |
| POST | `/api/sessions` | Starta spel, servern sparar `started_at` |
| PATCH | `/api/sessions/:id` | Spara poäng – servern kontrollerar |
| GET | `/api/campaigns/:slug/leaderboard` | Topp 10 |
| POST | `/api/invites` | Skapa inbjudningskod |
| GET | `/i/:code` | Räkna klick, redirect till kampanjen |
| POST | `/api/donations` | Spara valt belopp / klick |
| GET | `/api/donations/:id/qr` | Swish QR-kod (simulerad) |
| POST | `/api/leads` | Telefon + samtycke |
| GET | `/api/campaigns/:slug/stats` | Statistik (admin) |
| PATCH | `/api/admin/campaigns/:id` | Ändra tema och texter (admin) |

Alla svar är JSON. Fel: `{ "error": "..." }` med rätt statuskod (400, 401, 404, 500).

## Spelets regler (`client/js/game/rules.js`)

- En tändsticka: `{ id, x, y, length, dir: 'up' | 'down' | 'left' | 'right' }`. Den är **rak**. Knoppen sitter i `dir`-änden.
- `canExit(match, matches, size)`: gå från knoppen ruta för ruta åt `dir` till kanten. Annan sticka i vägen → `false`.
- Ett ljus tänds när **den sista stickan som pekar åt ljusets håll** har åkt ut (`up` → ljus 1, `right` → 2, `down` → 3, `left` → 4). Ljusen börjar om varje nivå. Lågan växer för varje sticka som åker ut åt det hållet.
- Poäng: +1 per sticka som åker ut, +2 extra när ett ljus tänds, +3 extra per klar nivå. Krock = −1 hjärta, ingen minuspoäng.
- Spelet slutar när timern når 0 eller hjärtan är 0.
- Nivåer görs **för hand** i `levels.js` (5×5, 6×6, 7×7). Slumpa inte nivåer.
- `rules.js` ska vara **rena funktioner** utan DOM. Då kan `tests/rules.test.js` testa dem med `node --test`.

## Viktiga regler

- **Timer:** räkna med `performance.now()` (starttid minus nu), inte bara `setInterval`.
- **Fusk:** lita aldrig på poäng från webbläsaren. Servern kontrollerar att tiden är ca 30 sek och att poängen inte är högre än max möjligt.
- **Spelare utan konto:** servern skapar en slumpad `token` (`crypto.randomUUID()`). Webbläsaren sparar den i `localStorage` och skickar den i headern `X-Player-Token`.
- **Utmana en vän:** Web Share API (`navigator.share`), reserv `sms:`-länk. **Läs aldrig kontakter och spara aldrig vännens nummer.**
- **GDPR:** smeknamn räcker för att spela. Telefonnummer bara med samtycke (rutan är inte förkryssad).
- **Swish:** mobil = knappen "Öppna Swish", dator = QR-kod. Påhittat nummer och knappen "Simulera betalning".
- **Tema:** `theme.js` sätter färgerna från `theme` som CSS-variabler på `:root`. All CSS använder `var(--color-...)`.
- **Data:** bara påhittade namn. Ingen riktig organisations namn eller logga.
- **Säkerhet i HTML:** visa användartext (smeknamn) med `textContent`, aldrig `innerHTML`.
- **Prestanda:** riktig 3D (`<spline-viewer>`) bara på startsidan. I spelet används bilder (PNG/WebP).
- **Tillgänglighet:** riktiga `<button>` och `<label>`. Färg får inte vara enda skillnaden.
- **Responsivt:** mobil först, sedan `@media (min-width: 768px)` för dator.

## Design (julen, mjukt och varmt)

| Namn | CSS-variabel | Hex |
|---|---|---|
| Krämvit (bakgrund) | `--color-bg` | `#FBF6EE` |
| Varm vit (kort) | `--color-card` | `#FFFDF8` |
| Sand (linjer) | `--color-line` | `#EADFCF` |
| Granbarr (primär) | `--color-primary` | `#2F4A3A` |
| Natt-gran (spelbakgrund) | `--color-game-bg` | `#1F3329` |
| Lingon (accent) | `--color-accent` | `#B5443B` |
| Ljuslåga (glöd) | `--color-glow` | `#E8B04B` – bara glöd/ikoner, inte text på ljus bakgrund |
| Text | `--color-text` | `#3B2F2A` |

Typsnitt: Inter (Google Fonts).

## Så jobbar vi (Git)

- Branches: `main` → `development` → `feat/<namn>`.
- **En feature = en branch + en PR** till `development`.
- Små steg. Commit efter varje fungerande del, med tydligt meddelande på engelska (t.ex. `feat: add canExit rule`).
- **Fråga mig innan du pushar eller skapar en PR.** Säg till när en branch är klar att pusha.
- Arbeta aldrig direkt på `main`.

## Ordning (10 dagar + fas 2)

1. Design (Spline-ljus, Canva, nivåer på papper) – ingen kod
2. `feat/project-setup` – mappar, `package.json`, Express serverar `client/`, SQLite + schema + seed
3. `feat/api-campaigns-players` – kampanj, spelare (token), `api.js`, `theme.js`
4. `feat/game-logic` – `rules.js`, `levels.js`, `countdown.js` + tester
5. `feat/game-animations` – SVG-bräde + animationer
6. `feat/pages-theme` – start, smeknamn, instruktion + julstämning
7. `feat/sessions-result` – sessions, fuskkontroll, resultat, topplista
8. `feat/donation-swish` – gåvosida + QR
9. `feat/invite-friends` – utmana en vän + SMS-formulär + tack
10. `feat/admin-deploy` – admin, README, deploy

Fas 2: `feat/level-unlock` – när en inbjuden vän har spelat klart sätts `invites.completed_at`, och den som bjöd in får `unlocked_level + 1` (max 3). Kunden väljer i `content.unlockMode`: `"open"` eller `"invite"`.

## När du är klar med ett steg

1. Kör projektet (`npm run dev`) och tester (`npm test`). Kontrollera att inget är trasigt.
2. Förklara kort på enkel svenska vad du gjorde och varför.
3. Ge Postman-steg för nya routes.
4. Nämn fallgropar.
5. Föreslå nästa lilla steg.
