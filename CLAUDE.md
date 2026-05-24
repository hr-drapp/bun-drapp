# clicknic — Business Context

This file gives you the full picture of what we're building, who it's for,
and why. Read this before writing any feature, suggesting anything, or making
any product decision.

---

## What clicknic is

clicknic is a **white-label clinic management SaaS** built for mid-size clinics
in India — especially Tier 2 and Tier 3 cities like Jaipur, Lucknow, Kota,
and Jodhpur.

The core idea is simple: a clinic gets fully branded software under their own
name, logo, and domain — powered by clicknic under the hood. Patients and clinic
staff never see "clicknic." They see the clinic's own brand.

We are not a patient marketplace like Practo. We don't send patients to
clinics. We sell the operating system that runs the clinic itself.

---

## The problem we're solving

Most mid-size clinics in India still run on a mix of:

- Paper registers for patient records
- WhatsApp groups for appointment coordination
- Excel sheets for billing
- A receptionist's memory for everything else

This breaks down fast as a clinic grows beyond one doctor. Appointments get
double-booked. Bills get lost. Patient history lives nowhere accessible.
The clinic owner has no idea what their daily revenue is without counting cash
manually at the end of the day.

Existing software (Practo Ray, Halemind, etc.) either targets large hospitals
and is too complex, or is too expensive and bloated for a 3–8 doctor clinic in
a Tier 2 city. Nobody is building the right thing for this segment with the
right price and simplicity.

That's the gap clicknic fills.

---

## Who we're building for

### Primary market

**Mid-size clinics in India** — 2 to 10 doctors, single or multi-specialty,
operating in Tier 2 and Tier 3 cities. These clinics see 30–150 patients a day,
have 2–6 staff members, and are owned by a doctor or a small family. They are
actively looking to go digital but find existing tools too complicated or too
expensive.

### Who we are NOT building for (right now)

- Solo doctors (single-doctor practice) — too small, won't pay enough
- Large hospitals (100+ beds) — different product, different sales cycle
- Metro clinics already on Practo — they have a solution and won't switch easily

---

## The three people who use clicknic every day

Every feature we build is used by one of these three people. Always think about
them before building anything.

**1. The Receptionist (most important)**
She is the primary user. Typically a woman in her 20s–30s, not very tech-savvy,
using a Windows desktop or Android phone. She handles 30–80 patients a day,
is constantly interrupted, types fast, makes typos, and is under pressure.
She books appointments, registers patients, and generates bills. If she finds
the software confusing or slow, the clinic stops using it.
Everything we build should be fast, forgiving of mistakes, and require minimum
training.

**2. The Doctor**
Uses the software between patients — quickly looks up a patient's history,
records what happened in the consultation, writes a prescription, and moves on.
Has very low patience for clicks. Wants information fast and wants to get back
to patients. Not interested in settings, reports, or management features.

**3. The Clinic Owner / Admin**
Usually the senior doctor or a family member managing the business side.
Checks daily revenue, how many patients came, which bills are unpaid, and how
the clinic is performing overall. Cares about money, accuracy, and not being
surprised. Logs in at the end of the day or when something feels off.

---

## How a clinic's day actually runs (the core flow)

This is the spine of the product. Every feature maps to one of these steps.
If something doesn't fit here, it's low priority.

```
Patient arrives or calls
  → Receptionist registers them (if new) or finds their record (if returning)
  → Books an appointment with the right doctor and time slot
  → System sends a WhatsApp confirmation to the patient

Patient is seen
  → Doctor opens the appointment, starts the consultation
  → Records vitals, notes, diagnosis
  → Writes a prescription
  → Marks consultation done

Billing and payment
  → Bill is generated (consultation fee + any procedures/tests)
  → Receptionist collects payment (cash, UPI, card)
  → Receipt is shared with patient

End of day
  → Owner checks the daily report: how many patients, how much revenue,
    which bills are still unpaid
```

That's the whole loop. Everything else (inventory, telemedicine, staff payroll,
insurance claims) comes after this loop works perfectly.

---

## Business model

clicknic charges clinics a monthly subscription. There are four tiers:

| Tier       | Monthly price  | Who it's for                                   |
| ---------- | -------------- | ---------------------------------------------- |
| Starter    | ₹999/mo        | 1–2 doctor clinic just going digital           |
| Growth     | ₹1,999/mo      | 3–8 doctor clinic, wants WhatsApp + reports    |
| Pro        | ₹3,499/mo      | Multi-doctor, multi-branch, wants full control |
| Enterprise | Custom pricing | Clinic chains, resellers, white-label at scale |

Beyond the subscription, we also earn a small cut on payments processed through
clicknic (targeting below Practo's 1.8% rate), and a one-time setup fee per clinic.

The white-label angle is key for the Enterprise tier — a clinic chain or a
local healthcare brand can resell clicknic as their own product. This is the B2B2B
play that gives us scale without having to sell to every clinic individually.

---

## Competitive landscape

The market is fragmented. Nobody dominates the mid-size Tier 2/3 segment cleanly.

- **Practo Ray** — the biggest name, but expensive, tied to their patient
  marketplace, and built for metros. Clinics feel dependent on Practo's platform
  and don't own their patient relationships.
- **Halemind** — strong on EMR/clinical side, good for mid-size practices,
  but weak on marketing and patient communication features.
- **Doccure** — closest to our white-label angle. Shows the model is valid.
- **Healthray, KareXpert** — enterprise/hospital focused, overkill for our segment.

Our edge: simpler, more affordable, genuinely white-label (clinic owns their
brand), built for the receptionist who isn't tech-savvy, and designed for the
realities of Tier 2/3 India (WhatsApp-first communication, UPI payments, Hindi
language support eventually).

---

## What success looks like (near term)

1. One real clinic in Jaipur using clicknic daily without needing hand-holding.
2. That clinic's receptionist finding it easier than their current setup.
3. The clinic owner seeing their daily revenue report without opening Excel.
4. A second clinic onboarded from word of mouth.

We are not trying to onboard 1,000 clinics right now. We are trying to build
something one clinic genuinely loves. That's the entire focus until further notice.

---

## What to keep in mind when building any feature

- **The receptionist is always the customer.** If she finds it confusing, the
  feature has failed no matter how technically correct it is.
- **WhatsApp is the communication layer for everything in India.** Reminders,
  confirmations, reports — assume WhatsApp, not email.
- **Clinics in Tier 2/3 cities have inconsistent internet.** Features should
  be forgiving of slow connections, not assume broadband.
- **Keep it simple before making it powerful.** A clinic that uses 5 features
  well is more valuable than one that uses 15 features poorly.
- **We are early.** Don't over-engineer for scale we don't have yet. Build for
  the one clinic in front of us, then generalize.
