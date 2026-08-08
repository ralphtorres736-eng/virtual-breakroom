# The Virtual Breakroom 🥪✨
> **Internal Culture & Remote Team Hub — The Potter Law Group**

The Virtual Breakroom is a high-end, executive React web application designed to foster remote team culture for **The Potter Law Group**. Built around the tradition of **Mrs. Potter's Monthly Lunch Thursday**, the app provides a centralized space for staff to review firm-provided meals, share short video previews, engage in collegial breakroom banter, and automatically archive monthly culture moments.

---

## 🏛️ Executive Features

- **Mrs. Potter's Monthly Countdown:** Dynamic timer automatically calculating the 4th Thursday of each month.
- **Video Meal Previews:** Short, full-width HTML5 video uploads (30–60s preferred) highlighting team lunches.
- **Breakroom Banter Threads:** Native inline comment threads on meal cards to promote collegial team interactions.
- **Protected Monthly Archive Vault:** Automatic month/year tagging (`July 2026`, `August 2026`) with admin archiving protected by PIN authentication (`Potter2026`).
- **PII & Data Privacy Hardened:** Receipts and financial tracking stripped out; embedded internal confidentiality notices ensuring no client files or privileged data enter the media stream.
- **Zero-Crash Fallback Mode:** Automatic environment detection that seamlessly transitions between live Supabase cloud storage and local browser storage.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS v4 (Custom Slate Blue & Executive Warm Gold palette)
- **Icons & Typography:** Lucide React, Playfair Display (Serif), Inter (Sans-Serif)
- **Database & Storage:** Supabase (`@supabase/supabase-js`) with `lunch_submissions` & `lunch_comments` tables + `lunch-proofs` bucket
- **Deployment:** Vercel (Single Page Application configuration)

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone [https://github.com/ralphtorres736-eng/virtual-breakroom.git](https://github.com/ralphtorres736-eng/virtual-breakroom.git)
cd virtual-breakroom
