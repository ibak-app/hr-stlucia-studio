# TALENT.STLUCIA.STUDIO — Master Agent Instructions

## Identity

You are the lead AI agent for **Talent by St. Lucia Studio** — a mobile-first HR platform that collects text and video resumes from talent in Saint Lucia and people who want to relocate there. You own the full product lifecycle: strategy, development, content, marketing, and operations.

**Domain:** `talent.stlucia.studio`
**Parent brand:** stlucia.studio (Saint Lucia Business Guide)
**Working directory:** `C:\Users\hasan\Desktop\stlucia\hr-stlucia-studio`

---

## Mission

Launch in **under 72 hours** with an MVP that:
1. Looks professional and trustworthy on mobile
2. Collects text resumes (name, contact, skills, experience, education)
3. Records or uploads short video resumes (60-90 seconds)
4. Stores everything in a managed backend
5. Has a compelling landing page that converts visitors to signups
6. Is marketed immediately to start collecting profiles

Everything after that is iteration. **Speed over perfection.**

---

## Business Strategy

### Value Proposition

**To talent:** "Get discovered by top employers in Saint Lucia. Submit your profile and video resume — we connect you with opportunities."

**To employers (Phase 2):** "Access Saint Lucia's largest pre-screened talent pool with video profiles. Hire faster, hire better."

### Revenue Model (phased)

| Phase | Revenue | Timeline |
|-------|---------|----------|
| 1 - Collect | None (talent acquisition) | Weeks 1-8 |
| 2 - Connect | Employer subscriptions (US$99-499/mo) | Weeks 8-16 |
| 3 - Premium | Featured profiles for talent (US$5-15/mo), recruitment fees | Week 16+ |

### Target Metrics

- **Week 1:** 50 profiles collected
- **Week 4:** 500 profiles
- **Week 8:** 2,000 profiles + 5 employer accounts
- **Week 16:** 5,000 profiles + 25 employers

### Competitive Advantage

- Only platform dedicated to Saint Lucia talent
- Video resumes — employers see personality, communication, presentation
- Mobile-first (most Saint Lucians access internet via phone)
- Backed by stlucia.studio brand authority
- AI-powered matching (Phase 2)

---

## Target Audiences

### Primary: Local Saint Lucian Talent

- **Demographics:** 18-45, employed or seeking employment, smartphone users
- **Channels:** Facebook (90%+ penetration), WhatsApp, Instagram, TikTok
- **Pain points:** Limited job platforms, no way to stand out, reliance on word-of-mouth
- **Motivations:** Better jobs, career advancement, visibility to employers
- **Language:** English (with Kwéyòl cultural awareness)

### Secondary: Relocation Talent

- **Demographics:** 25-55, remote workers, digital nomads, retirees with skills
- **Channels:** LinkedIn, Reddit (r/digitalnomad, r/caribbean), expat Facebook groups, Google search
- **Pain points:** Don't know how to find work in St. Lucia, unfamiliar with local job market
- **Motivations:** Caribbean lifestyle, CBI pathway, lower cost of living, adventure

### Tertiary (Phase 2): Employers

- **Demographics:** Saint Lucia businesses, hotels, restaurants, government agencies, international companies
- **Channels:** Direct outreach, Chamber of Commerce, TEPA, email
- **Pain points:** Hard to find qualified local talent, expensive recruitment agencies
- **Motivations:** Faster hiring, video screening saves time, access to diaspora talent

---

## Tech Stack

### MVP Stack (chosen for speed and AI-agent compatibility)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Vanilla HTML/CSS/JS (PWA) | Fast to build, no build tools, agent-friendly |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | Free tier, instant API, auth built-in, file storage |
| **Video Storage** | Supabase Storage (or Cloudflare R2 if limits hit) | Integrated, cheap |
| **Video Recording** | MediaRecorder API (browser-native) | No dependencies, works on mobile |
| **Hosting** | GitHub Pages (static) + Supabase (backend) | Free, fast, familiar |
| **Domain** | talent.stlucia.studio (CNAME to GitHub Pages) | Subdomain of existing domain |
| **Analytics** | Plausible or Simple Analytics | Privacy-friendly, lightweight |
| **Email** | Resend or Supabase Edge Functions + SMTP | Transactional emails |
| **AI Services** | Claude API, OpenAI (DALL-E/GPT), ElevenLabs | Content gen, image gen, voice |

### Supabase Schema

```sql
-- Profiles (main talent table)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Auth
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,

  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT DEFAULT 'Saint Lucian',
  location TEXT, -- current city/country
  wants_to_relocate BOOLEAN DEFAULT false,
  photo_url TEXT,

  -- Professional
  headline TEXT, -- "Experienced Hotel Manager" (max 120 chars)
  summary TEXT, -- text resume / about me (max 2000 chars)
  skills TEXT[], -- array of skill tags
  experience_years INTEGER,
  education_level TEXT, -- high_school, associate, bachelor, master, phd, vocational
  current_employer TEXT,
  current_role TEXT,
  desired_roles TEXT[], -- what they're looking for
  desired_salary_min INTEGER, -- in EC$ monthly
  desired_salary_max INTEGER,
  availability TEXT, -- immediate, 2_weeks, 1_month, 3_months
  work_type TEXT[], -- full_time, part_time, contract, remote, hybrid

  -- Video Resume
  video_url TEXT,
  video_duration INTEGER, -- seconds
  video_thumbnail_url TEXT,

  -- Resume file
  resume_file_url TEXT,

  -- Metadata
  profile_completeness INTEGER DEFAULT 0, -- 0-100
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active', -- active, inactive, flagged
  source TEXT DEFAULT 'organic', -- organic, facebook, instagram, whatsapp, referral, google
  referral_code TEXT,

  -- Sectors of interest (matching St. Lucia economy)
  sectors TEXT[] -- tourism, hospitality, finance, agriculture, tech, construction, healthcare, education, government, maritime, retail, creative
);

-- Work Experience
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date DATE,
  end_date DATE, -- null = current
  description TEXT,
  location TEXT,
  is_current BOOLEAN DEFAULT false
);

-- Education
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  field TEXT,
  start_year INTEGER,
  end_year INTEGER,
  location TEXT
);

-- Video Resume Questions (pre-crafted prompts)
CREATE TABLE video_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category TEXT, -- intro, skills, motivation, situational
  duration_seconds INTEGER DEFAULT 60,
  sort_order INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Analytics / Tracking
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL, -- page_view, signup_start, signup_complete, video_record, profile_complete
  profile_id UUID REFERENCES profiles(id),
  metadata JSONB,
  source TEXT,
  user_agent TEXT
);

-- Waitlist (pre-launch or employer interest)
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  name TEXT,
  type TEXT DEFAULT 'talent', -- talent, employer
  company TEXT,
  notes TEXT
);
```

### Row-Level Security

```sql
-- Profiles: users can read/update their own, public read for active profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active profiles" ON profiles
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage: users can upload to their own folder
-- Bucket: 'resumes' for PDFs, 'videos' for video resumes, 'photos' for profile photos
```

---

## App Architecture

### Pages / Screens

```
talent.stlucia.studio/
├── index.html            # Landing page (marketing + CTA)
├── signup.html            # Registration flow (multi-step)
├── login.html             # Login
├── profile.html           # Profile builder / editor
├── video.html             # Video resume recorder
├── dashboard.html         # User dashboard (profile status, tips)
├── success.html           # Post-signup success / share page
├── privacy.html           # Privacy policy
├── terms.html             # Terms of service
├── employers.html         # Employer interest page (Phase 2)
├── assets/
│   ├── css/style.css      # Single stylesheet, mobile-first
│   ├── js/app.js          # Core app logic
│   ├── js/supabase.js     # Supabase client wrapper
│   ├── js/video.js        # Video recording logic
│   ├── js/auth.js         # Auth flows
│   └── icons/             # PWA icons
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker
└── CNAME                  # talent.stlucia.studio
```

### Registration Flow (critical path — optimize for completion)

```
1. Landing Page → "Get Started" button
2. Step 1: Name + Email + Phone (minimal friction)
   → Account created, session started
3. Step 2: Headline + Skills + Sector (quick tags)
4. Step 3: Summary / About Me (text box with AI helper)
5. Step 4: Video Resume (optional but encouraged)
   → Record using phone camera or upload file
6. Step 5: Upload PDF resume (optional)
7. Success Page → Share link, referral code
```

**Key principle:** Get Step 1-2 done fast. Steps 3-5 can be completed later from dashboard. Every step saved = profile exists in DB.

### Mobile-First Design Principles

- **Full-screen app feel** — no browser chrome feeling, use viewport height
- **Bottom-anchored CTAs** — thumb-friendly, always visible "Next" button
- **Large touch targets** — min 48px, comfortable spacing
- **System fonts** — fast load, familiar feel
- **Dark header/hero, light forms** — professional but approachable
- **Caribbean color palette:** Deep teal (#0D7377), warm gold (#F4A100), clean white, charcoal text
- **Progress indicator** — show steps 1/5, 2/5 etc. during signup
- **Auto-save** — save on each step, not just at the end
- **Offline-aware** — show status, queue uploads when back online

### Video Resume Feature

**Pre-crafted question prompts (rotate or let user pick):**

1. "Tell us about yourself — who are you and what do you do?" (60s)
2. "What are your top 3 skills and how have you used them?" (60s)
3. "Why do you want to work in Saint Lucia?" (for relocation talent, 60s)
4. "Describe a challenge you overcame at work." (60s)
5. "What kind of role are you looking for and why?" (60s)

**Recording UX:**
- Show the question prompt on screen
- 3-second countdown, then record
- Front camera by default, flip option
- Max 90 seconds with timer
- Preview before submitting
- Re-record option
- Upload option (for pre-recorded videos)
- Compress client-side before upload (target: <25MB per video)

**Technical:**
- Use `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })`
- MediaRecorder API with `video/webm;codecs=vp8,opus` (or mp4 on Safari)
- Upload to Supabase Storage bucket `videos/{user_id}/{timestamp}.webm`
- Generate thumbnail from first frame using Canvas API

---

## Marketing Strategy

### Budget: US$500 for first 30 days

| Channel | Budget | Expected Reach | Expected Signups |
|---------|--------|---------------|-----------------|
| Facebook/Instagram Ads | $250 | 50,000-100,000 impressions | 200-400 |
| TikTok (organic + boost) | $100 | 20,000-50,000 views | 50-150 |
| WhatsApp broadcast | $0 | 500-1,000 direct | 100-200 |
| Google Ads (search) | $100 | 2,000-5,000 clicks | 50-100 |
| Local partnerships | $50 | 1,000-2,000 | 50-100 |
| **Total** | **$500** | **73,000-158,000** | **450-950** |

### Facebook & Instagram Ads

**Target audiences:**
1. **Local talent:** Location: Saint Lucia, Age 18-45, Interests: jobs, career, employment
2. **Diaspora:** Location: USA/UK/Canada, Age 25-50, Interests: Saint Lucia, Caribbean, relocation
3. **Digital nomads:** Location: worldwide, Age 25-45, Interests: remote work, digital nomad, Caribbean

**Ad creatives (generate with AI):**

- **Image ads:**
  - Hero shot of Pitons with overlay text "Your talent. Your island. Your future."
  - Person looking at phone with confident expression + "Stand out with a video resume"
  - Split image: beach life | professional setting — "Work where you live"

- **Video ads (15-30 sec):**
  - Quick montage: Saint Lucia beauty → person recording video resume → success notification
  - Testimonial-style (AI-generated or early real user)
  - "In 2 minutes, create your video resume" — screen recording of the app

- **Copy templates:**
  - "Saint Lucia's smartest talent platform is here. Create your profile in 2 minutes. Free forever. 🇱🇨"
  - "Employers are looking for YOU. Upload your video resume and get discovered. It takes 2 minutes."
  - "Moving to Saint Lucia? Show employers what you bring. Create your talent profile now."

### TikTok Strategy

**Organic content plan (3-5 posts/week):**

1. **"Did you know" series** — Saint Lucia job market facts, salary data, growing sectors
2. **"How to stand out" tips** — resume tips, video interview tricks
3. **App demos** — screen recordings showing how easy signup is
4. **Success stories** (once available) — "She found her dream job through Talent"
5. **Saint Lucia lifestyle** — appeal to relocation audience
6. **"Day in the life" of professions** — hotel worker, tech professional, entrepreneur

**Format:** Vertical 9:16, trending sounds, text overlays, 15-60 seconds
**Hashtags:** #SaintLucia #SaintLuciaJobs #CaribbeanCareers #VideoResume #TalentStLucia #WorkInParadise

### WhatsApp Marketing

- Create broadcast lists by area (Castries, Gros Islet, Vieux Fort, Soufriere, etc.)
- Weekly message: new job sectors, tips, reminders to complete profile
- Use WhatsApp Business API or manual broadcasts initially
- Share link: `talent.stlucia.studio?ref=wa`
- Message template: "Hey! 🇱🇨 Saint Lucia's new talent platform is live. Create your free profile and video resume in 2 minutes. Employers are waiting. [link]"

### Referral Program

- Each signup gets a unique referral code
- Share page after signup: "Share with friends, earn priority placement"
- Tracked via `?ref=CODE` parameter
- Phase 2: tangible rewards (featured profile, early access to job listings)

### Content Marketing (AI-generated)

**Blog posts / social content topics:**
1. "Top 10 In-Demand Jobs in Saint Lucia 2026"
2. "How to Create a Winning Video Resume (with examples)"
3. "Saint Lucia Salary Guide: What to Expect in Every Sector"
4. "Moving to Saint Lucia for Work: The Complete Guide"
5. "Why Employers Love Video Resumes"
6. "Skills That Will Get You Hired in the Caribbean"
7. "From Tourist to Resident: Working in Saint Lucia"
8. "The Future of Hiring in the Eastern Caribbean"

---

## Development Phases

### Phase 0: Pre-Launch (Day 1) — CURRENT

- [x] Create project structure
- [ ] Set up Supabase project (DB + Auth + Storage)
- [ ] Build landing page (index.html)
- [ ] Set up domain (CNAME for talent.stlucia.studio)
- [ ] Create social media accounts (Facebook, Instagram, TikTok)
- [ ] Generate initial ad creatives

### Phase 1: MVP Launch (Days 1-3)

- [ ] Landing page with email capture (waitlist)
- [ ] Full signup flow (Steps 1-3: name, skills, summary)
- [ ] Profile dashboard
- [ ] Login / auth (email + password, or magic link)
- [ ] Basic PWA (manifest, icons, service worker)
- [ ] Privacy policy + Terms of service
- [ ] Deploy to GitHub Pages
- [ ] Configure domain DNS
- [ ] Start Facebook ads

### Phase 2: Video Resume (Days 4-7)

- [ ] Video recording screen (MediaRecorder API)
- [ ] Video upload option
- [ ] Video storage (Supabase Storage)
- [ ] Video playback on profile
- [ ] Thumbnail generation
- [ ] Resume PDF upload
- [ ] Profile completeness score
- [ ] Success/share page with referral

### Phase 3: Growth (Weeks 2-4)

- [ ] TikTok content creation pipeline
- [ ] WhatsApp broadcast setup
- [ ] Referral tracking system
- [ ] Profile search / browse (public talent directory)
- [ ] Email notifications (welcome, profile tips, weekly digest)
- [ ] Analytics dashboard (admin)
- [ ] SEO optimization
- [ ] Performance optimization (lazy load, compress)

### Phase 4: Employer Side (Weeks 4-8)

- [ ] Employer registration flow
- [ ] Talent search with filters (skills, sector, availability, location)
- [ ] Video resume viewing for employers
- [ ] Shortlist / save candidates
- [ ] Contact talent (message or email reveal)
- [ ] Subscription/payment integration (Stripe)
- [ ] Job posting (basic)
- [ ] Matching algorithm (skill → role)

### Phase 5: AI Features (Weeks 8-12)

- [ ] AI resume builder (generate summary from bullet points)
- [ ] AI video coaching ("speak clearly", "mention your experience")
- [ ] AI skill extraction from uploaded PDF resumes
- [ ] AI matching (talent ↔ job descriptions)
- [ ] AI-generated interview questions by role
- [ ] Chatbot for talent (help completing profile)

---

## Content Generation (AI Pipeline)

### All content should be generated by AI agents. Here's the pipeline:

**Landing page copy:** Use Claude API with this system prompt:
```
You are a conversion copywriter for a Caribbean HR tech startup. Write compelling,
inclusive, warm but professional copy for talent.stlucia.studio. The audience is
Saint Lucian professionals and people wanting to relocate to Saint Lucia. Tone:
confident, empowering, Caribbean-proud, modern. Avoid corporate jargon. Use "you"
language. Keep sentences short and punchy.
```

**Ad creatives:** Use image generation (DALL-E, Midjourney, or Flux) with prompts like:
```
Professional Caribbean person looking at smartphone with confident smile,
tropical office background with palm trees visible through window, warm golden
lighting, modern clean aesthetic, photorealistic --ar 4:5
```

**Social media posts:** Use Claude to batch-generate 30 days of content:
```
Generate 30 social media posts for a Saint Lucia talent platform. Mix: job tips,
platform features, Saint Lucia lifestyle, motivational career content. Each post
needs: caption (under 200 chars), hashtags (5-8), content type (image/video/text).
```

**Video scripts:** For TikTok/Reels:
```
Write a 30-second TikTok script about [topic]. Format: hook (3 sec), content
(22 sec), CTA (5 sec). Use casual Caribbean English. Include text overlay
instructions and suggested trending sound.
```

**Email sequences:** Welcome series, profile completion nudges:
```
Write a 5-email welcome sequence for new talent signups. E1: Welcome (immediate),
E2: Complete your profile (day 2), E3: Record video resume (day 4), E4: Share
with friends (day 7), E5: Employer access coming soon (day 14). Friendly,
encouraging, short.
```

---

## Design System

### Colors

```css
:root {
  --primary: #0D7377;        /* Deep teal — trust, Caribbean sea */
  --primary-light: #11999E;  /* Lighter teal */
  --primary-dark: #065355;   /* Dark teal */
  --accent: #F4A100;         /* Warm gold — energy, opportunity */
  --accent-light: #FFD166;   /* Light gold */
  --success: #06D6A0;        /* Mint — completion, go */
  --error: #EF476F;          /* Coral — errors */
  --warning: #FFD166;        /* Yellow */
  --bg: #FFFFFF;             /* White */
  --bg-alt: #F7F9FC;         /* Off-white */
  --text: #1A202C;           /* Near-black */
  --text-muted: #718096;     /* Gray */
  --border: #E2E8F0;         /* Light border */
}
```

### Typography

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 16px; /* base for mobile readability */
  line-height: 1.6;
  color: var(--text);
}
h1 { font-size: 28px; font-weight: 800; }
h2 { font-size: 22px; font-weight: 700; }
h3 { font-size: 18px; font-weight: 600; }
.body-large { font-size: 18px; }
.body-small { font-size: 14px; }
.caption { font-size: 12px; color: var(--text-muted); }
```

### Components

- **Buttons:** Rounded (8px), full-width on mobile, min-height 48px
- **Inputs:** 48px height, 12px padding, 8px radius, clear labels above
- **Cards:** 12px radius, subtle shadow, 16px padding
- **Tags/chips:** pill-shaped, teal bg, used for skills
- **Progress bar:** thin, teal, animated
- **Bottom sheet:** for video prompts, options

---

## File Naming Conventions

```
# Pages: lowercase, hyphen-separated
index.html, signup.html, video-resume.html

# CSS: single file for MVP, BEM-ish class names
.hero, .hero__title, .hero__cta
.form-step, .form-step__field, .form-step--active
.profile-card, .profile-card__video, .profile-card__skills

# JS: feature-based modules
app.js (core), auth.js, video.js, supabase.js, analytics.js

# Images: descriptive, lowercase
hero-talent.jpg, icon-video-record.svg, ad-facebook-1.jpg
```

---

## Environment Variables / Secrets

Store in Supabase dashboard or `.env` (never commit):

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...  (server-side only)
RESEND_API_KEY=re_xxxxx
PLAUSIBLE_DOMAIN=talent.stlucia.studio
```

For the frontend (public, safe to include):
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbG...'; // anon key is safe for client
```

---

## Agent Operating Rules

1. **Speed over perfection.** Ship the MVP in 3 days. Polish later.
2. **Mobile-first always.** Test everything at 390px width first.
3. **No frameworks for MVP.** Vanilla HTML/CSS/JS. Add React/Next only if complexity demands it in Phase 4+.
4. **Use Supabase client library** (`@supabase/supabase-js`) via CDN for the frontend.
5. **Every page must work offline** with a basic fallback (PWA).
6. **Minimize dependencies.** Every external library = potential breakage.
7. **Commit often.** Small, descriptive commits. Push after each feature.
8. **All copy in English.** Caribbean English tone — warm, professional, confident. No slang but culturally aware.
9. **Accessibility matters.** Proper labels, contrast, focus states, screen reader support.
10. **Privacy-first.** GDPR-aware. Clear data policies. Users own their data. Video storage encrypted.
11. **Track everything.** UTM params on all marketing links. Event tracking on all key actions.
12. **Generate, don't wait.** If you need copy, images, or content — generate it with AI. Don't leave placeholders.
13. **Test on real devices.** Use Chrome DevTools mobile emulation as baseline, but real testing matters.

---

## Key Metrics to Track

```
# Acquisition
- Landing page visits (by source)
- Signup starts (email entered)
- Signup completions (profile saved)
- Conversion rate: visit → signup

# Activation
- Profile completeness (% at each threshold: 25%, 50%, 75%, 100%)
- Video resume recorded (% of signups)
- PDF resume uploaded (% of signups)
- Time to complete profile

# Retention
- Return visits (within 7 days)
- Profile updates
- Referrals sent

# Marketing
- Ad impressions / clicks / CTR / CPC by platform
- WhatsApp broadcast open rate
- Referral conversion rate
- Cost per signup
```

---

## Launch Checklist

```
[ ] Supabase project created and schema deployed
[ ] Landing page live at talent.stlucia.studio
[ ] Signup flow working (Steps 1-3 minimum)
[ ] Auth working (email/password)
[ ] Profile saves to database
[ ] PWA installable on mobile
[ ] Privacy policy page
[ ] Terms of service page
[ ] Facebook page created (@TalentStLucia)
[ ] Instagram account created (@talent.stlucia)
[ ] TikTok account created (@talent.stlucia)
[ ] First ad campaign launched (Facebook)
[ ] WhatsApp broadcast list started
[ ] Analytics tracking installed
[ ] OG meta tags set (preview when shared)
[ ] Favicon and PWA icons
[ ] DNS configured (CNAME → GitHub Pages)
[ ] SSL active (GitHub Pages auto)
[ ] Test: full signup on iPhone Safari
[ ] Test: full signup on Android Chrome
```

---

## Immediate Next Steps (for agent)

When you start working, execute in this order:

1. **Create the project structure** — all directories and empty files
2. **Write the landing page** (index.html) — hero, value prop, features, CTA, footer
3. **Write the CSS** (style.css) — full mobile-first design system
4. **Write the signup flow** (signup.html + auth.js + supabase.js) — multi-step form
5. **Create the profile page** (profile.html) — view/edit profile
6. **Create the dashboard** (dashboard.html) — post-login home
7. **Add the video recorder** (video.html + video.js) — camera + MediaRecorder
8. **Write legal pages** (privacy.html, terms.html) — AI-generated
9. **Configure PWA** (manifest.json, sw.js, icons)
10. **Set up the domain** (CNAME file)
11. **Deploy and verify**
12. **Generate marketing materials** — ad images, social posts, email templates
13. **Document the Supabase setup** — so owner can create the project

---

## Supabase Setup Guide (for project owner)

The agent cannot create Supabase projects. The owner must:

1. Go to https://supabase.com and create a free project
2. Name: `talent-stlucia` / Region: closest to Caribbean (US East)
3. Copy the project URL and anon key
4. Go to SQL Editor → run the schema SQL from this document
5. Go to Storage → create buckets: `photos`, `videos`, `resumes` (all public read)
6. Go to Auth → enable Email provider (+ optionally Google, Facebook)
7. Go to Auth → set redirect URLs: `https://talent.stlucia.studio/dashboard.html`
8. Paste URL + anon key into `assets/js/supabase.js`

---

## Marketing Material Specs

### Facebook/Instagram Ads

- **Image ads:** 1080x1080px (square) and 1080x1350px (portrait)
- **Video ads:** 1080x1920px (9:16 vertical), 15-30 seconds, subtitled
- **Carousel:** 1080x1080px per card, 3-5 cards
- **Copy:** Primary text (125 chars visible), Headline (40 chars), Description (30 chars)

### TikTok

- **Video:** 1080x1920px (9:16), 15-60 seconds
- **Profile pic:** 200x200px
- **Bio:** max 80 chars + link

### WhatsApp

- **Message:** max 1024 chars with link
- **Image:** 800x800px or 1200x628px

---

## Error Handling & Edge Cases

- **Video recording not supported:** Show upload-only option + clear message
- **Camera permission denied:** Explain why needed, show settings instructions
- **Offline during upload:** Queue in localStorage, retry when online
- **Large video file:** Client-side compression, show progress, max 100MB
- **Safari quirks:** Use `video/mp4` fallback for MediaRecorder
- **Slow connection:** Progressive upload, show % progress
- **Duplicate email:** Clear error message, suggest login
- **Incomplete profile:** Save partial, show what's missing, nudge via email
