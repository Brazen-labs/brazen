# Design System

Extracted from the reference landing page ("Hyred" job-finder screenshot). We're reusing the *system* — layout patterns, spacing, color roles, component shapes — not the copy or literal assets. Applying it as-is with job-board copy would just look like a reskin; applying the same visual language to Brazen's own content is the goal.

## Color palette

| Role | Approx. value | Usage |
|---|---|---|
| Primary accent | `#F4623A` (warm orange/coral) | Logo mark, primary CTA button, active nav underline, badge icons |
| Ink / headline | `#0A0A0A` – `#111111` | Headlines, nav text, filled secondary button ("Sign in" style) background |
| Body text | `#6B7280` (mid gray) | Subheadline, paragraph copy |
| Badge/pill background | `#FDEDE7` (soft peach) | Small pill badges above the headline |
| Surface | `#FFFFFF` | Page background |
| Card border/outline | `#E5E7EB` (light gray) | Phone mockup frames, outline buttons |

## Typography

- Large, bold, tight-tracking sans-serif for the headline (geometric grotesk feel — Inter, General Sans, or similar) — two-line headline, centered, high contrast against white.
- Medium-weight nav links, regular-weight body copy in gray.
- Generous line-height on the subheadline paragraph; keep it to 1–2 sentences max, centered, narrow max-width (~600px) so it doesn't stretch full-width.

## Layout patterns to reuse

### Top nav
Logo + wordmark (left) — centered nav links — right-aligned "Sign in" (text link) + filled black "Get started" pill button.
**Brazen version:** logo + "Brazen" — nav: Home / How it Works / Roadmap / FAQ — right: "Docs" link + filled black "Bridge Now" pill.

### Hero
1. Small pill badge above the headline, icon + short label + arrow (e.g. "Fresh Opportunities →").
   **Brazen version:** "Live on Testnet →" or "AI-Routed · Gasless →"
2. Large centered two-line headline in black.
   **Brazen version:** "Move stablecoins across chains, gaslessly, in seconds."
3. One-paragraph gray subheadline, centered, narrow width.
   **Brazen version:** "Settlement infrastructure other agents can pay through — or bridge your own funds, no gas needed on either side."
4. Two CTA buttons: filled orange primary + white/outline secondary with a small icon.
   **Brazen version:** "Bridge Now →" (filled orange) + "How it Works +" (outline)

### Hero visual — triple phone mockup
Three angled phone frames, center one largest/frontmost, slightly overlapping, each showing a different product screen, small floating UI accents (icon chips) near the edges.
**Brazen version — three screens to show:**
1. Left phone: the bridge intent screen (amount input + "Bridge USDC → HSK" style chat/form)
2. Center (largest) phone: the live routing decision screen — gas price comparison, selected corridor highlighted, similar to how the reference shows a "Featured Jobs" list with one item highlighted in an orange outline
3. Right phone: the success/receipt screen — amount received, fee, both explorer links, styled like the reference's dark/orange "applicant" detail screen for visual contrast

## Sections to build elsewhere in the app, same visual language

- **Built for two kinds of payers** — a two-column section right under the hero, same card style as the phone mockups but flatter: left column "For people" (connect wallet, sign, bridge your own funds — links to `/bridge`), right column "For agents & builders" (a short `POST /pay` code snippet in a dark rounded card, matching the app's rounded-corner/border style but inverted to dark background for contrast, with the tagline "settlement infrastructure other agents can pay through"). This section is what turns the landing page from "another bridge" into "a payment rail with two front doors" at a glance.
- **How it Works** — 3–4 step horizontal or vertical sequence (sign → deposit → route → receive), icon + short label + one-line description per step
- **Live stats bar** — thin horizontal strip with a few live numbers (e.g. total bridged, average time, chains supported) — reinforces the "real, live" positioning
- **Roadmap timeline** — horizontal or vertical timeline using the four phases from `ROADMAP.md`, same pill/badge styling as the hero badge for phase labels
- **FAQ accordion** — plain white background, simple expand/collapse, addresses the trust-model question directly ("Is this custodial?") since judges and users will both ask
- **Footer** — logo, nav repeat, social/docs links, on a white or very light background, minimal

## Component notes for implementation

- Buttons: filled = black bg / white text (secondary "sign in"-style) or orange bg / white text (primary CTA); outline = white bg, thin gray border, black text, small leading icon.
- Cards/phone frames: rounded corners (~2xl/3xl radius), consistent thin border, drop shadow subtle not heavy.
- Spacing: generous vertical rhythm between hero, sections — don't compress this under time pressure, the reference design's whitespace is doing a lot of the "premium" feeling.
- Keep the palette to the 5 roles above across the whole app — don't introduce new accent colors per section, that's what makes the reference feel cohesive.
