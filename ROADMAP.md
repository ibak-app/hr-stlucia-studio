# Product Roadmap — Talent by St. Lucia Studio

## Now → Week 1: MVP (Get Live, Get Signups)

### Must Ship
- [ ] Landing page (hero, features, social proof, CTA)
- [ ] Signup flow (name, email, phone → headline, skills → summary)
- [ ] Auth (email/password via Supabase)
- [ ] Profile page (view + edit)
- [ ] Dashboard (post-login home with completion nudges)
- [ ] PWA basics (manifest, icons, service worker)
- [ ] Legal pages (privacy, terms — AI-generated)
- [ ] Domain + HTTPS live
- [ ] OG/meta tags for social sharing
- [ ] First Facebook ad campaign running

### Nice to Have
- [ ] Magic link auth (passwordless)
- [ ] Animated signup progress bar
- [ ] Confetti on profile completion

---

## Week 2: Video Resume + Polish

### Must Ship
- [ ] Video recording screen (front camera, timer, prompts)
- [ ] Video upload alternative
- [ ] Video storage to Supabase
- [ ] Video playback in profile
- [ ] Resume PDF upload
- [ ] Profile completeness score (0-100%)
- [ ] Success page with share/referral
- [ ] Email: welcome email on signup

### Nice to Have
- [ ] Thumbnail generation from video
- [ ] Video compression before upload
- [ ] Multiple video questions (pick prompt)
- [ ] Camera flip (front/back)

---

## Weeks 3-4: Growth Engine

### Must Ship
- [ ] Referral tracking (?ref= codes, attribution)
- [ ] Public talent directory (browse profiles, no contact info visible)
- [ ] TikTok content pipeline (5 videos queued)
- [ ] WhatsApp broadcast tool / templates
- [ ] Email: profile completion reminder (Day 2, Day 5)
- [ ] Basic analytics dashboard (admin-only)
- [ ] Retargeting pixel (Facebook, Google)

### Nice to Have
- [ ] Skill endorsements (other users can endorse)
- [ ] Leaderboard (most complete profiles)
- [ ] Weekly email digest to users

---

## Weeks 5-8: Employer Side (Monetization)

### Must Ship
- [ ] Employer registration page
- [ ] Employer dashboard
- [ ] Talent search with filters (skills, sector, location, availability)
- [ ] Video resume viewer for employers
- [ ] Shortlist / save candidates
- [ ] Contact reveal (paid action or subscription)
- [ ] Stripe payment integration
- [ ] Pricing page (3 tiers: Starter $99, Pro $249, Enterprise $499/mo)
- [ ] Job posting (basic: title, description, requirements, sector)

### Nice to Have
- [ ] Employer company profiles
- [ ] Application tracking (talent applies to job)
- [ ] Message inbox between employer ↔ talent
- [ ] Bulk download shortlisted profiles
- [ ] Invoice generation

---

## Weeks 9-12: AI Features + Scale

### Must Ship
- [ ] AI resume builder (input bullet points → polished summary)
- [ ] AI skill extraction from PDF resumes
- [ ] AI matching: rank talent for a given job description
- [ ] AI-powered search (natural language: "find me a hotel manager with 5+ years")
- [ ] Email: job match notifications to talent

### Nice to Have
- [ ] AI video coaching (feedback on presentation, clarity)
- [ ] AI-generated interview questions by role
- [ ] Chatbot assistant for profile building
- [ ] Auto-translate profiles (English ↔ Kwéyòl ↔ French ↔ Spanish)
- [ ] Voice-to-text profile builder (speak your experience)

---

## Quarter 2+: Platform Maturity

- [ ] Mobile app (React Native or Capacitor wrapper)
- [ ] Employer API (integrate with existing HR systems)
- [ ] Assessment tools (skills tests, personality quizzes)
- [ ] Training/upskilling recommendations (partner with SALCC, UWI)
- [ ] Regional expansion: Dominica, Grenada, St. Vincent
- [ ] Government integration (work permit verification, labor department)
- [ ] Premium talent tier (verified, endorsed, featured)
- [ ] Revenue from training providers (lead generation)
- [ ] Data insights product (labor market analytics for government/NGOs)

---

## Key Decisions Log

| Decision | Options Considered | Chosen | Why |
|----------|-------------------|--------|-----|
| Frontend | React, Next.js, Vanilla | Vanilla HTML/CSS/JS | Fastest to ship, agent-friendly, no build step |
| Backend | Firebase, Supabase, custom | Supabase | Free tier, PostgreSQL, auth+storage built-in |
| Auth | Custom, Auth0, Supabase | Supabase Auth | Already using Supabase, zero extra setup |
| Video | Mux, Cloudinary, native | MediaRecorder API + Supabase Storage | No cost, browser-native, good mobile support |
| Hosting | Vercel, Netlify, GitHub Pages | GitHub Pages | Free, familiar from parent project |
| Payments | Stripe, PayPal | Stripe | Best developer experience, Caribbean support |
| Analytics | Google Analytics, Plausible | Plausible | Privacy-friendly, simple, lightweight |
