# Services, Stack & Systems Plan

## talent.stlucia.studio — Complete Infrastructure Map

Last updated: February 13, 2026

---

## Architecture Overview

```
                         talent.stlucia.studio
                                 |
                     +-----------+-----------+
                     |                       |
              [Static Frontend]       [Supabase Backend]
              GitHub Pages / CF       PostgreSQL + Auth
                     |                + Storage + Edge Fns
                     |                       |
              [Cloudflare CDN]        [Supabase Storage]
              DNS + SSL + Cache        photos / videos / resumes
                     |                       |
              [Browser APIs]          [Edge Functions]
              MediaRecorder            AI processing
              Camera / Mic             Email triggers
              Service Worker           Webhooks
                     |                       |
              [Analytics]             [Third-Party APIs]
              Plausible               Claude API
              FB Pixel                Stripe (Phase 2)
              Custom Events           Resend (email)
```

---

## 1. Hosting & Delivery

### Static Frontend Hosting

| Option | Cost | Pros | Cons | Decision |
|--------|------|------|------|----------|
| **GitHub Pages** | Free | Already configured, simple, custom domain support | No server-side rendering, 100GB/mo bandwidth, no redirects | **MVP (current)** |
| **Cloudflare Pages** | Free (unlimited bandwidth) | Faster global CDN, edge redirects, preview deploys, analytics built-in | Migration effort | **Phase 2 upgrade** |
| Vercel | Free tier → $20/mo | Edge functions, great DX | Overkill for static site | Not needed |
| Netlify | Free tier → $19/mo | Forms, functions, redirects | Similar to CF Pages but costs more at scale | Not needed |

**Plan:**
- **Now:** GitHub Pages (already deployed, zero cost)
- **Week 4+:** Migrate to Cloudflare Pages when traffic exceeds GitHub's 100GB/mo or when edge features are needed (redirects, A/B testing, headers)

### CDN & DNS

| Service | Purpose | Cost |
|---------|---------|------|
| **Cloudflare** (free plan) | DNS, SSL, CDN caching, DDoS protection, edge rules | Free |
| GitHub Pages SSL | Auto-provisioned via Let's Encrypt | Free |

**DNS Configuration:**
```
stlucia.studio           → Cloudflare nameservers
talent.stlucia.studio    → CNAME → ibak-app.github.io (now)
                         → CNAME → talent-sl.pages.dev (future CF Pages)
```

**Cloudflare Rules (set up now):**
- Cache static assets (CSS, JS, SVG, images): 30 days
- Cache HTML pages: 4 hours (with stale-while-revalidate)
- Force HTTPS redirect
- Add security headers (X-Frame-Options, CSP, HSTS)
- Enable Brotli compression

---

## 2. Backend — Supabase

### Why Supabase

Supabase provides the entire backend in one managed service: PostgreSQL database, authentication, file storage, edge functions, and real-time subscriptions. This eliminates the need to manage separate services for each concern.

### Supabase Project Setup

| Component | Configuration |
|-----------|--------------|
| **Project name** | `talent-stlucia` |
| **Region** | US East (us-east-1) — closest to Caribbean |
| **Plan** | Free tier (500MB database, 1GB storage, 50K auth users) |
| **Upgrade trigger** | When any of: >500MB DB, >1GB storage, >50K MAU, or need daily backups |

### Database (PostgreSQL)

**Tables (already designed):**
- `profiles` — main talent data (personal, professional, video, metadata)
- `experiences` — work history (linked to profiles)
- `education` — education history (linked to profiles)
- `video_questions` — pre-crafted recording prompts
- `events` — analytics/tracking events
- `waitlist` — pre-launch and employer interest capture

**Future tables (Phase 2+):**
- `employers` — employer accounts and company info
- `job_postings` — job listings by employers
- `shortlists` — employer saved/bookmarked candidates
- `messages` — employer-talent communication
- `subscriptions` — Stripe subscription records
- `invoices` — billing records

**Row-Level Security (RLS):**
- Profiles: public read for `status = 'active'`, users can only update/insert their own
- Storage: users can only upload to `{user_id}/` folders
- Employer data: only authenticated employers can access their own shortlists/messages

**Indexes needed:**
```sql
CREATE INDEX idx_profiles_skills ON profiles USING GIN (skills);
CREATE INDEX idx_profiles_sectors ON profiles USING GIN (sectors);
CREATE INDEX idx_profiles_status ON profiles (status);
CREATE INDEX idx_profiles_location ON profiles (location);
CREATE INDEX idx_events_type ON events (event_type, created_at);
```

**Database backups:**
- Free tier: weekly automated (Supabase managed)
- Pro tier ($25/mo): daily point-in-time recovery (upgrade when >100 profiles)

### Authentication

| Method | Phase | Provider |
|--------|-------|----------|
| Email + password | MVP (now) | Supabase Auth |
| Magic link (passwordless) | MVP (now) | Supabase Auth |
| Google OAuth | Phase 2 | Supabase Auth + Google Cloud Console |
| Facebook Login | Phase 2 | Supabase Auth + Meta for Developers |
| Phone OTP (SMS) | Phase 3 | Supabase Auth + Twilio (or MessageBird) |

**Auth configuration:**
- Email confirmation: disabled for MVP (reduce friction), enable at 1000+ users
- Password policy: minimum 6 characters
- Session duration: 7 days (refresh tokens enabled)
- Redirect URLs: `https://talent.stlucia.studio/dashboard.html`

### Edge Functions (Supabase Deno runtime)

| Function | Purpose | Phase |
|----------|---------|-------|
| `send-welcome-email` | Trigger on new signup → send via Resend | Week 2 |
| `profile-nudge` | Cron: find incomplete profiles → send email reminders | Week 3 |
| `ai-resume-builder` | Accept bullet points → Claude API → return polished summary | Phase 5 |
| `ai-skill-extract` | Accept PDF text → Claude API → return structured profile data | Phase 5 |
| `ai-match` | Accept job description → score against profiles → return ranked list | Phase 5 |
| `stripe-webhook` | Handle Stripe payment events → update subscription status | Phase 2 |
| `video-process` | Post-upload: generate thumbnail, validate duration, update profile | Phase 2 |

**Edge Function limits (free tier):**
- 500K invocations/month
- 2MB request body (fine for text, not for video — video goes direct to Storage)

### Realtime (future)

- Phase 2: employer notifications when new matching talent joins
- Phase 3: real-time messaging between employer and talent
- Uses Supabase Realtime (WebSocket-based, free tier included)

---

## 3. File Storage

### Storage Architecture

```
Supabase Storage
├── photos/          (profile photos)
│   └── {user_id}/photo.{ext}
├── videos/          (video resumes)
│   └── {user_id}/{timestamp}.{webm|mp4}
├── resumes/         (PDF resumes)
│   └── {user_id}/resume.pdf
└── thumbnails/      (video thumbnails — Phase 2)
    └── {user_id}/{video_id}.jpg
```

### Storage Policies

| Bucket | Public Read | Auth Upload | Max File Size |
|--------|------------|-------------|---------------|
| `photos` | Yes | Own folder only | 5MB |
| `videos` | Yes | Own folder only | 100MB |
| `resumes` | No (auth required) | Own folder only | 10MB |
| `thumbnails` | Yes | System only (Edge Function) | 500KB |

### Storage Limits & Scaling

| Tier | Storage | Bandwidth | Cost | Trigger |
|------|---------|-----------|------|---------|
| Free | 1GB | 2GB/mo | $0 | Start |
| Pro | 100GB | 250GB/mo | $25/mo | >500 videos or >1GB total |
| **Cloudflare R2** | 10GB free, $0.015/GB | Free egress | ~$0-5/mo | If Supabase bandwidth insufficient |

**Video storage math:**
- Average video: ~10MB (60s, 720p, VP8/WebM)
- 500 videos = 5GB → need Pro tier
- 2,000 videos = 20GB → Pro tier handles this
- 5,000 videos = 50GB → still within Pro

**Scaling plan:**
1. **Now:** Supabase Storage free tier (handles first ~100 videos)
2. **500 profiles:** Upgrade to Supabase Pro ($25/mo)
3. **2,000+ profiles:** Add Cloudflare R2 as CDN layer in front of Supabase Storage (free egress saves bandwidth costs)
4. **5,000+ profiles:** Consider dedicated video hosting (Mux or Cloudflare Stream) for transcoding and adaptive bitrate

### Client-Side Video Optimization

Built into the current `video.js`:
- Record at 720p max (not 1080p) to reduce file size
- Use VP8/WebM codec (smaller than H.264 for web)
- Target: <25MB per 90-second video

**Phase 2 enhancements:**
- Client-side compression with FFmpeg.wasm (reduce 25MB → 10MB)
- Chunked upload for large files (resumable)
- Generate thumbnail from first frame using Canvas API before upload

---

## 4. Email & Notifications

### Email Service: Resend

| Feature | Detail |
|---------|--------|
| **Provider** | [Resend](https://resend.com) |
| **Why** | Developer-friendly API, great deliverability, free tier (100 emails/day = 3,000/month) |
| **Domain** | Send from `talent@stlucia.studio` (configure DNS records) |
| **Upgrade** | $20/mo for 50K emails when growth demands it |

### Email Flows

| Email | Trigger | Phase |
|-------|---------|-------|
| Welcome | On signup_complete event | Week 2 |
| Complete your profile | 2 days after signup, profile <50% | Week 3 |
| Record video resume | 4 days after signup, no video | Week 3 |
| Share with friends | 7 days after signup | Week 3 |
| Employers are coming | 14 days after signup | Week 3 |
| Weekly digest | Every Monday, summary of new jobs/tips | Phase 2 |
| Job match alert | When a new job matches talent's skills | Phase 2 |
| Employer: new talent | When matching talent joins the platform | Phase 2 |

### Implementation

- **Phase 1 (now):** No emails (reduces setup time)
- **Phase 2 (Week 2):** Supabase Edge Function triggers Resend API on auth events
- **Phase 3 (Week 3):** Supabase pg_cron for scheduled nudge emails

**DNS records for Resend (add to Cloudflare):**
```
Type   Name                    Value
TXT    _resend.stlucia.studio  (provided by Resend)
MX     stlucia.studio          (if receiving email)
DKIM   (auto-configured by Resend)
```

---

## 5. Analytics & Tracking

### Multi-Layer Analytics

| Layer | Tool | Purpose | Cost |
|-------|------|---------|------|
| **Product analytics** | Custom events table (Supabase) | Track signup funnels, feature usage, profile completion | Free (in DB) |
| **Web analytics** | Plausible Analytics | Page views, referrers, geography, devices | $9/mo (or self-host free) |
| **Ad tracking** | Facebook Pixel | Conversion tracking for FB/IG ads, retargeting audiences | Free |
| **Ad tracking** | Google Ads tag | Conversion tracking for Google Search ads | Free |
| **Search console** | Google Search Console | SEO monitoring, indexing status, search queries | Free |

### Custom Event Tracking (already built)

The `events` table in Supabase captures:
```
event_type: signup_start | signup_complete | profile_complete | video_record |
            video_upload | resume_upload | share_click | employer_waitlist |
            login | page_view
profile_id: linked to user
metadata:   { step, method, duration, source, ... }
source:     organic | facebook | instagram | whatsapp | referral | google
user_agent: browser/device info
```

### Plausible Analytics Setup

```html
<!-- Add to all pages -->
<script defer data-domain="talent.stlucia.studio"
  src="https://plausible.io/js/script.js"></script>
```

- Track custom goals: `Signup`, `Video Record`, `Profile Complete`
- Track UTM parameters automatically
- No cookies, GDPR-compliant
- Dashboard: `plausible.io/talent.stlucia.studio`

### Facebook Pixel Setup

```html
<!-- Add to all pages -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

**Custom conversions to track:**
- `CompleteRegistration` — on signup complete
- `Lead` — on profile complete
- `ViewContent` — on video record

---

## 6. Payments — Stripe (Phase 2)

### Stripe Setup

| Item | Detail |
|------|--------|
| **Account** | Stripe Standard (supports Saint Lucia via international) |
| **Currency** | USD (primary), EC$ display for local users |
| **Products** | 3 employer subscription tiers |
| **Billing** | Monthly recurring, annual option at discount |
| **Integration** | Stripe Checkout (hosted page) + Webhooks to Supabase Edge Function |

### Subscription Tiers

| Tier | Monthly | Annual | Includes |
|------|---------|--------|----------|
| Starter | $99 | $999 ($83/mo) | Browse, 10 contacts/mo, 1 job post |
| Professional | $249 | $2,499 ($208/mo) | 50 contacts/mo, 5 job posts, shortlists |
| Enterprise | $499 | $4,999 ($416/mo) | Unlimited contacts, unlimited posts, priority |

### Stripe Architecture

```
Employer clicks "Subscribe" → Stripe Checkout (hosted) →
  Payment success → Stripe webhook → Supabase Edge Function →
    Create/update subscription record → Grant access
```

**Why Stripe Checkout (hosted page):**
- PCI compliant without any frontend payment code
- Handles 3D Secure, global payment methods
- Manages subscription lifecycle (renewals, cancellations, upgrades)

---

## 7. AI Services

### Service Map

| AI Service | Provider | Purpose | Phase | Cost Est. |
|------------|----------|---------|-------|-----------|
| Resume builder | Claude API (Sonnet 4.5) | Bullet points → polished summary | Phase 5 | ~$15-25/mo |
| Skill extraction | Claude API (Haiku 4.5) | PDF resume → structured profile data | Phase 5 | ~$5-10/mo |
| Talent matching | OpenAI Embeddings API | Profile ↔ job description similarity | Phase 5 | ~$5-15/mo |
| Content generation | Claude API (Sonnet 4.5) | Blog posts, social media, email copy | Ongoing | ~$5-10/mo |
| Image generation | Gemini/DALL-E 3 | Ad creatives, social graphics | Ongoing | ~$5-10/mo |
| Video coaching | Claude API + Whisper | Transcribe video → feedback on delivery | Phase 5+ | ~$10-20/mo |

### AI Integration Architecture

```
Browser → Supabase Edge Function → Claude/OpenAI API → Response → Browser
                                        ↓
                              (API keys stored in
                               Supabase Vault /
                               Edge Function env)
```

**Critical: API keys never in frontend code.** All AI calls go through Supabase Edge Functions which hold the secrets.

### AI Matching System (Phase 5)

```
1. On profile create/update:
   → Edge Function generates embedding (OpenAI text-embedding-3-small)
   → Store in profiles.embedding column (pgvector extension)

2. On job posting create:
   → Edge Function generates embedding from job description
   → Query: SELECT * FROM profiles
     ORDER BY embedding <=> job_embedding
     LIMIT 20;
   → Return ranked matches with cosine similarity score

3. Enable pgvector in Supabase:
   CREATE EXTENSION vector;
   ALTER TABLE profiles ADD COLUMN embedding vector(1536);
   CREATE INDEX ON profiles USING ivfflat (embedding vector_cosine_ops);
```

### Cost Control

- Use Haiku 4.5 ($0.25/1M input tokens) for high-volume tasks (skill extraction)
- Use Sonnet 4.5 ($3/1M input) for quality tasks (resume writing)
- Cache AI results in the database (don't regenerate for same input)
- Rate limit: max 5 AI requests per user per day (free tier)
- Monthly budget cap: $50 (alert at $40)

---

## 8. Marketing Infrastructure

### Advertising Platforms

| Platform | Purpose | Budget | Setup |
|----------|---------|--------|-------|
| **Facebook/Instagram Ads** | Primary paid acquisition (local + diaspora) | $250/mo | Meta Business Suite, Pixel installed |
| **Google Ads** | Search intent capture ("jobs saint lucia") | $100/mo | Google Ads account, conversion tag |
| **TikTok** | Organic + boosted content for youth audience | $100/mo | TikTok Business account |

### Social Media Accounts

| Platform | Handle | Purpose |
|----------|--------|---------|
| Facebook Page | @TalentStLucia | Primary community, ads, content |
| Instagram | @talent.stlucia | Visual content, reels, stories |
| TikTok | @talent.stlucia | Short-form video, career tips |
| LinkedIn | Talent by St. Lucia Studio | Employer outreach, professional content |
| WhatsApp Business | +1 758 XXX XXXX | Direct outreach, broadcast lists |

### Referral System (built-in)

```
User signs up → gets referral_code (e.g. "TL4K8MX2") →
  Share link: talent.stlucia.studio?ref=TL4K8MX2 →
    New visitor → ref stored in localStorage →
      On signup → ref saved to profiles.source →
        Track: referrals sent, referrals converted
```

### UTM Tracking Convention

```
?utm_source=facebook&utm_medium=paid&utm_campaign=launch_local
?utm_source=instagram&utm_medium=organic&utm_campaign=career_tips
?utm_source=whatsapp&utm_medium=broadcast&utm_campaign=week1
?utm_source=google&utm_medium=cpc&utm_campaign=jobs_stlucia
?utm_source=tiktok&utm_medium=organic&utm_campaign=video_tips
?ref=TL4K8MX2  (referral)
```

---

## 9. Security

### Current Security Measures

| Measure | Status | Implementation |
|---------|--------|----------------|
| HTTPS/TLS | Active | GitHub Pages auto-SSL + Cloudflare |
| Row-Level Security | Designed | Supabase RLS policies on all tables |
| Password hashing | Active | Supabase Auth (bcrypt) |
| CORS | Needs config | Supabase dashboard → allowed origins |
| Input validation | Client-side | HTML5 validation + JS validation |
| XSS prevention | Active | `escapeHtml()` in app.js, no `innerHTML` with user data |
| File type validation | Active | MIME type + extension checks before upload |

### Security Enhancements (Phase 2)

| Measure | Implementation |
|---------|----------------|
| **CSP headers** | Cloudflare rule: `Content-Security-Policy: default-src 'self' *.supabase.co; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net;` |
| **Rate limiting** | Supabase Edge Function: max 10 signups/IP/hour, max 5 video uploads/user/day |
| **Content moderation** | Edge Function: scan uploaded images/videos for inappropriate content (Phase 3, use AI) |
| **CORS whitelist** | Only allow `talent.stlucia.studio` to access Supabase API |
| **API key rotation** | Rotate Supabase anon key quarterly |
| **Server-side validation** | Edge Functions validate all profile data before DB write |
| **Audit log** | Log all admin actions, profile deletions, data exports |

### Data Protection

- **Encryption at rest:** Supabase encrypts all data at rest (AES-256)
- **Encryption in transit:** All connections over TLS 1.3
- **Data residency:** US East (AWS us-east-1)
- **Backup retention:** 7 days (Pro tier), weekly snapshots (free tier)
- **Data deletion:** On account delete, remove all profile data, videos, photos within 30 days
- **Data export:** Users can request JSON export of their profile data

---

## 10. Monitoring & Operations

### Uptime Monitoring

| Tool | Purpose | Cost |
|------|---------|------|
| **UptimeRobot** (free) | Ping talent.stlucia.studio every 5 min, alert on downtime | Free (50 monitors) |
| **Supabase Dashboard** | Database health, auth usage, storage usage, function invocations | Included |
| **Cloudflare Analytics** | Request volume, cache hit ratio, threat detection | Included |

### Error Tracking

| Option | Phase | Cost |
|--------|-------|------|
| **Browser `window.onerror`** → Supabase events table | Now (built-in) | Free |
| **Sentry** (free tier) | Phase 2 | Free (5K events/mo) |

**Minimal error tracking (implement now):**
```javascript
window.addEventListener('error', function(e) {
  DB.trackEvent('js_error', {
    message: e.message,
    filename: e.filename,
    line: e.lineno
  });
});
```

### Operational Alerts

| Alert | Trigger | Channel |
|-------|---------|---------|
| Site down | UptimeRobot 2 consecutive failures | Email + SMS |
| Database >80% storage | Supabase alert | Email |
| Storage >80% capacity | Supabase alert | Email |
| Edge Function failures | >10 errors in 1 hour | Email |
| Signups spike | >50 in 1 hour (ad campaign going viral) | Custom (Supabase → Resend) |

---

## 11. CI/CD & Deployment

### Current Deployment

```
Developer pushes to master → GitHub Pages auto-deploys → Live in ~2 min
```

### Enhanced Pipeline (Phase 2)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: HTML validation
        run: npx html-validate "*.html"
      - name: CSS lint
        run: npx stylelint "assets/css/**/*.css"
      - name: JS lint
        run: npx eslint "assets/js/**/*.js"
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: talent-stlucia
          directory: .
```

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production (auto-deploys) |
| `staging` | Preview deploys (Cloudflare Pages preview URL) |
| `feature/*` | Feature branches, PR to main |

---

## 12. Cost Summary

### Phase 1: MVP (Weeks 1-4) — $9-18/month

| Service | Monthly Cost |
|---------|-------------|
| GitHub Pages | $0 |
| Supabase (free tier) | $0 |
| Cloudflare (free plan) | $0 |
| Plausible Analytics | $9 |
| Resend (free tier) | $0 |
| Domain (already owned) | $0 |
| UptimeRobot (free) | $0 |
| **Total** | **$9/mo** |

### Phase 2: Growth (Weeks 5-8) — $60-80/month

| Service | Monthly Cost |
|---------|-------------|
| Cloudflare Pages (free) | $0 |
| Supabase Pro | $25 |
| Plausible Analytics | $9 |
| Resend (Starter) | $20 |
| Sentry (free tier) | $0 |
| AI services (Claude API) | $10-25 |
| **Total** | **$64-79/mo** |

### Phase 3: Monetization (Weeks 9-16) — $100-150/month

| Service | Monthly Cost |
|---------|-------------|
| Cloudflare Pages | $0 |
| Supabase Pro | $25 |
| Plausible Analytics | $9 |
| Resend (Starter) | $20 |
| Stripe | 2.9% + $0.30 per transaction |
| AI services | $25-50 |
| Sentry | $0 |
| **Total** | **$79-104/mo** + Stripe fees |

### Break-Even Analysis

```
Monthly costs (Phase 3): ~$100
Revenue per employer:    $99-499/mo

Break-even: 1-2 paying employers
Target (Week 16): 25 employers = $2,475-12,475/mo revenue
```

---

## 13. Service Account Checklist

### Accounts to Create

| Service | URL | Priority |
|---------|-----|----------|
| Supabase | supabase.com | Now |
| Cloudflare | cloudflare.com | Now |
| Plausible | plausible.io | Week 1 |
| Resend | resend.com | Week 2 |
| Facebook Business | business.facebook.com | Week 1 |
| Google Ads | ads.google.com | Week 1 |
| Google Search Console | search.google.com/search-console | Week 1 |
| TikTok Business | ads.tiktok.com | Week 1 |
| Anthropic (Claude API) | console.anthropic.com | Phase 5 |
| Stripe | stripe.com | Phase 2 |
| UptimeRobot | uptimerobot.com | Week 1 |
| Sentry | sentry.io | Phase 2 |

### API Keys to Manage

| Key | Storage Location | Rotation |
|-----|-----------------|----------|
| Supabase URL + anon key | Frontend JS (public, safe) | On project regeneration |
| Supabase service role key | Supabase Edge Function env | Quarterly |
| Resend API key | Supabase Edge Function env | Quarterly |
| Claude API key | Supabase Edge Function env | Quarterly |
| Stripe secret key | Supabase Edge Function env | Quarterly |
| Stripe webhook secret | Supabase Edge Function env | On endpoint change |
| Facebook Pixel ID | Frontend HTML (public) | Rarely |
| Google Ads tag ID | Frontend HTML (public) | Rarely |
| Plausible domain | Frontend HTML (public) | Never |

---

## 14. Migration & Scaling Decision Points

| Metric | Threshold | Action |
|--------|-----------|--------|
| Profiles | 100 | Enable email confirmation, add Resend |
| Profiles | 500 | Upgrade Supabase to Pro, add database indexes |
| Profiles | 2,000 | Add Cloudflare R2 for video CDN, add Sentry |
| Profiles | 5,000 | Consider dedicated video hosting (Mux), add pgvector |
| Employers | 1 | Integrate Stripe, build employer dashboard |
| Employers | 10 | Add AI matching, dedicated employer support |
| Monthly traffic | 100K pageviews | Migrate to Cloudflare Pages |
| Video storage | 50GB | Evaluate Cloudflare Stream ($1/1000 min stored) |
| AI requests | 1,000/month | Add caching layer, rate limiting |

---

## 15. Technology Decisions Not Yet Made

| Decision | Options | When to Decide |
|----------|---------|---------------|
| Video transcoding | Supabase Edge + FFmpeg.wasm vs. Cloudflare Stream vs. Mux | When video volume > 500 |
| Search engine | Supabase full-text search vs. Typesense vs. Algolia | When employer search ships |
| Mobile app | React Native vs. Capacitor wrapper vs. stay PWA | Quarter 2+ |
| Email marketing | Resend only vs. add Mailchimp/ConvertKit for campaigns | When >1000 users |
| Chat/messaging | Supabase Realtime vs. Stream Chat vs. custom | When employer messaging ships |
| Regional expansion | Same Supabase project vs. separate instances per island | Quarter 2+ |
