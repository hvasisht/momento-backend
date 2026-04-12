# Momento — Functional Specification
*Last updated: April 7 2026. Covers every screen, container, card, and button.*
*Items marked ⚠️ = unclear, incomplete, or not yet wired.*

---

## How to read this document

Each section follows this structure:
- **What it shows** — visible elements
- **Data it needs** — what powers the display
- **Actions** — every button/interaction and what it does next
- **Leads to** — next screen or state

---

## 1. OPENING PAGE (IntroOverlay)

### What it shows
- Full-screen dark background image (`opening page image.png`)
- Logo top-left (`logo-clean.png`, white/inverted)
- Hero tagline centered: **"Read moments worth sharing."** (animated, floats in)
- The word "moments" in the tagline has a dashed reveal box — shows the background image through it
- One button initially visible: **ENTER**

### Data it needs
- None. Static screen.

### Actions

#### ENTER button
- Fades out "ENTER"
- Splits into two buttons side by side:
  - **Continue Reading** (right side, white text)
  - **Become a Reader** (left side, gold text)

#### Continue Reading button
- Expands downward to show two sub-options:
  - **G — With Google** → calls `handleGoogleSignIn()` → Firebase `signInWithPopup` → if existing user: `requestLaunch()`; if new user (404): opens **Google Complete Profile overlay**
  - **With Readername** → opens **Sign In overlay**

#### Become a Reader button
- Expands downward to show two sub-options:
  - **G — With Google** → same `handleGoogleSignIn()` handler as above
  - **Create an Account** → opens **Create Account overlay**

---

## 2. SIGN IN OVERLAY (SignInOverlay)

### What it shows
- Readername input field
- Password input field
- **Sign In** button
- **G — Sign in with Google** button
- **Create an account** link
- Back arrow (top-left)

### Data it needs
- Firebase Auth (Email/Password + Google)

### Actions
- **Back arrow** → closes overlay, returns to opening page
- **Sign In button** → `firebase.auth().signInWithEmailAndPassword()` → checks `emailVerified`:
  - Not verified → shows **Email Verification overlay**
  - Verified, consent in localStorage → **Main App** (Read section)
  - Verified, no consent → **Consent Screen**
- **Sign in with Google button** → same `handleGoogleSignIn()` as IntroOverlay Google buttons
- **Create an account link** → closes Sign In → opens **Create Account overlay**

---

## 3. CREATE ACCOUNT OVERLAY (CreateAccountOverlay)

### What it shows
- First name + Last name inputs
- Email input
- Readername input (with ⓘ tooltip explaining what a Readername is; live availability check with debounce)
- Password input + confirm password input
- **Create Account** button (disabled until all fields valid, passwords match, readername available)
- Back arrow (top-left)
- On success: confirmation state with "check your spam" note and two options

### Data it needs
- Firebase Auth + backend API (`POST /users/me`)

### Actions
- **Back arrow** → closes overlay, returns to opening page
- **Create Account button** →
  1. `firebase.auth().createUserWithEmailAndPassword()` + `updateProfile({ displayName })`
  2. `apiPost("/users/me", { first_name, last_name, email, readername })`
  3. `sendEmailVerification()` (best-effort, does not block)
  4. Shows success state with two options:
     - **Guide** button → opens **Onboarding Overlay** (4-step guide)
     - **Skip** button → goes to consent check → **Consent Screen** → **Main App**
- If DB insert fails after Firebase user was created → Firebase user is deleted to keep state consistent

---

## 4. EMAIL VERIFICATION OVERLAY (EmailVerificationOverlay)

Shown when a returning email/password user signs in but has not yet verified their email.

### What it shows
- Heading: "Verify your email."
- Subheading with the user's email address
- Body: "Click the link in your inbox, then come back and tap below. Check your spam if you don't see it."
- **I've verified my email** button
- **Resend email** button (shows "✓ Sent!" for 4 seconds after click)
- **Sign out** button

### Data it needs
- `email` — passed from MomentApp
- `firebase.auth().currentUser` — to reload and check `emailVerified`

### Actions
- **I've verified my email** → `currentUser.reload()` → if `emailVerified === true`: calls `onVerified()` → proceeds to app; if still false: shows "Not verified yet — check your inbox." error
- **Resend email** → `currentUser.sendEmailVerification()` → shows "✓ Sent!" feedback
- **Sign out** → calls `onSignOut()` → Firebase sign-out + all state reset → returns to opening page

### Notes
- Google accounts bypass this overlay entirely (always `emailVerified = true`)
- New accounts see the app on their first session (verification not required at creation time); gate only applies on subsequent sign-ins

---

## 5. GOOGLE COMPLETE PROFILE OVERLAY (GoogleCompleteProfileOverlay)

Shown after Google Sign-In when the user does not yet have a Momento account (first-time Google sign-up).

### What it shows
- Google display name (auto-filled, read-only label)
- Google email (auto-filled, read-only label)
- Readername input (with live availability check, same debounce as CreateAccountOverlay)
- **Continue** button (disabled until readername is available)
- Back arrow

### Data it needs
- `googleUser` prop: `{ displayName, email }` from Firebase Google credential
- Backend API (`POST /users/me`)

### Actions
- **Continue** → `apiPost("/users/me", { first_name, last_name, email, readername })` → calls `onSubmit(profile)` → `requestLaunch()`
- **Back arrow** → signs out Firebase user → resets all overlay state → returns to opening page

---

## 6. CONSENT SCREEN (ConsentScreen)

### What it shows
- Dark full-screen overlay with warm amber radial glow
- Logo at top-left (white/faded)
- Scrollable text with the following sections, each separated by a divider:
  1. **Your interpretations and Google Gemini** — explains how interpretations are sent to Gemini for matching, anonymised by ID only
  2. **What other readers can see** — Momentos shared by choice; Closeness Signature visible in Worth
  3. **Your data rights** — GDPR/CCPA deletion rights, contact email `themomentofolio@gmail.com`, 30-day response
  4. **How we learn your preferences** — explains that behavioural signals (profile exploration, connections, engagement) are observed to refine Worth matches, linked to anonymous ID only, never to name or identity
  5. **Age** — must be 13 or older
- Closing statement: "By continuing you confirm you have read and understood this, and that you are 13 or older."
- **Continue** button (disabled for 5 seconds OR until scrolled to bottom — whichever comes first)
- **I do not agree** button (also disabled until ready)

### Data it needs
- None. Static content.
- Reads `localStorage.momento_consent_given` to skip if already accepted.

### Actions
- **Continue button** (once enabled) → sets `localStorage.momento_consent_given = '1'` → launches **Main App** (Read section, cube index 0)
- **I do not agree button** → opens a decline popup with two options:
  - **Home** → calls `onDecline()` → returns to opening page
  - **Review again** → closes popup, user can re-read and reconsider

---

## 7. ONBOARDING OVERLAY (ReaderOnboardingOverlay)

### What it shows
4-step guide, full-screen card overlay. HeroTagline stays visible in "top" mode during onboarding.

---

### Step 0 — Choose a book / Capture a moment

**Sub-state A: No book selected**
- Title: "Choose a book."
- 3 book covers shown: Pride and Prejudice, The Great Gatsby, Jane Eyre
- Each book card shows: cover image, title, author, one-line summary (appears on hover)
- Clicking a book → selects it, advances to sub-state B

**Sub-state B: Book selected, no passage chosen**
- Title: "Capture your **moment**."
- Detail: "Of the 3 passages snip the one that moves you."
- Shows 3 passages from the chosen book
- Each passage is a selectable card
- Clicking a passage → selects it → **Next** button becomes active → advances to Step 1

---

### Step 1 — Make it your momento

**What it shows**
- Title: "Make it your **momento**."
- Detail: "Write what you think and feel about the moment."
- The selected passage displayed in a moment card (italic serif, left amber line)
- Textarea below: "Write what you think and feel..."
- Character minimum: 12 characters before Next is enabled

**Actions**
- **Textarea** → user types their interpretation
- **Next button** (active when ≥12 chars typed) → advances to Step 2

---

### Step 2 — Find your close readers

**What it shows**
- Title: "Find your **close readers**."
- Detail: "Wave to the readers who feel nearest to your interpretation."
- The momento card (passage + interpretation written)
- User's reading signature glyph (t/f mark with R/C/D values: Think: Res 18, Con 58, Div 24 / Feel: Res 61, Con 21, Div 18) ⚠️ hardcoded demo values
- One demo close reader shown: **Sofia A.** with her signature glyph and note "They have captured the same moment as you did."
- **Wave** button next to Sofia

**Actions**
- **Wave button** → marks `closeReaderMade = true` → enables Next button, shows confirmation
- **Next button** (active after waving) → advances to Step 3

---

### Step 3 — Whisper when they wave back

**What it shows**
- Title: "Whisper when they wave back."
- Detail: "This is where reading turns into relation."
- Sofia's profile with a wave-back indicator
- **Whisper** button
- When whisper open: textarea to type a message + **Send** button
- After send: confirmation state

**Actions**
- **Whisper button** → opens whisper textarea
- **Send button** → marks `whisperSent = true`, shows sent confirmation
- **Finish / Done button** → calls `onComplete({ moment: tutorialMoment, closeReader: Sofia })`:
  - Saves the tutorial moment to `snippedMoments`
  - Sets `worthNotif = true`
  - Sets `worthMessage` to a welcome message mentioning Sofia
  - Goes to consent check → **Main App**

---

## 8. MAIN APP SHELL (MomentApp)

### Layout
- **TopChrome** — fixed header bar, 44px tall
- **Section panels** — 4 sections: Read (0), Moments (1), Worth (2), Sharing (3)
- **ProfileDrawer** — slides in from left
- **Drag ghost** — follows cursor when dragging a moment card
- **Drop overlays** — appear on valid drop targets while dragging

### Display modes
| Mode | Sections visible | Navigation |
|---|---|---|
| Solo | 1 section | Click tabs in TopChrome to switch |
| Pair | 2 adjacent sections (0+1 or 2+3) | Both panels visible side by side |
| Triple | 3 sections | Three panels |
| Quad | All 4 | Fixed, all panels visible |

### Navigation
- **Tab clicks** in TopChrome → switches active section
- **Drag and hold section tabs** (bottom of TopChrome) → opens multiple panels simultaneously
- **Close (×) on a section tab** (in multi-panel mode) → collapses that panel with fold animation
- Each section has a `data-section` attribute used for drag-drop targeting

### Hint tooltip (CubeHint)
- Appears on first hover over the navigation area
- Shows header: **"How to turn"**
- Two bullet points:
  - "Click the tabs at the top to navigate."
  - "Click and drag the section tabs below to open multiple tabs."

---

## 9. TOP CHROME (TopChrome)

### Always visible
- **Logo / profile button** (top-left) → opens **Profile Drawer**
- **Section tabs** — track of 4 labels: Read · Moments · Worth · Sharing
  - Each tab: click → navigates to that section
  - Active section tab shows amber underline indicator
  - Moments tab: shows saved-blink checkmark animation when a moment is snipped
  - Worth tab: shows `!` notification badge when `worthNotif = true`
  - Sharing tab: shows unread count badge (`sharingNotifCount`) when > 0

### Context-sensitive controls (change based on active section + mode)

**Read section (solo mode)**
- Search bar (expands from icon) → filters Gutenberg catalogue by title/author; also filters shelf books
- Quote button → opens quote input overlay ⚠️

**Moments section (solo mode)**
- Header shows: `X momentos across Y books`
- Layout menu button → toggles layout options panel:
  - **List all** / **Clip by books** toggle
  - **Passage first** / **Momento first** toggle
- These controls also appear inline in MomentsPanel when not solo

**Worth section (solo mode)**
- Worth message bar shown in header (dismissable)

**Sharing section (solo mode)**
- Close Circle icon/pill → opens Close Circle dropdown

---

## 10. PROFILE DRAWER (ProfileDrawer)

### What it shows
- Slides in from left, 280px wide
- Notebook binding strip at top
- Header area (220px): gradient background, username pill (shows `readerProfile.firstName` from account creation), stats pill
- Stats pill (4 cells):
  - **Books**: count from `SHELF_BOOKS.length`
  - **Moments**: total moments across all shelf books
  - **Momentos**: live count of moments that have an interpretation (`allMoments.filter(m=>!!m.interpretation).length`)
  - **Close**: count from `CLOSE_READERS` ⚠️ currently shows hardcoded `847`
- Menu items (scrollable):
  - **Notifications** (bell icon) ⚠️ no panel wired
  - **Privacy** (lock icon) ⚠️ no panel wired
  - **Settings** (sun/gear icon) ⚠️ no panel wired
- **Dark mode toggle** — switches between light and dark theme, animated slider
- **~ Sign out** button (bottom)

### Actions
- **Any menu row (Notifications / Privacy / Settings)** ⚠️ — no action wired
- **Dark mode toggle** → `setDarkMode(!darkMode)` → updates all color tokens across entire app
- **Sign out** → closes drawer + sets `introActive = true` → returns to **Opening Page**
- **Click outside drawer** → closes drawer

---

## 11. READ SECTION (ReadPanel)

### What it shows

**Shelf / Hero view (no book open):**
- Featured hero book (last captured book, or guide book, or Frankenstein as default)
- Shelf row: 5 pre-loaded fixed books + recently added books from catalogue
- "Books of the week" section
- "Moments of the week" section (passages from `MOMENTS_DATA`)
- Daily quote strip
- Library button → opens full Gutenberg catalogue search (1,000 books)

**Reading view (book open):**
- Top bar: **← Back** button, book title, optional **+ Add to shelf** button, **Contents** dropdown
- Snip mode toggle (scissors icon) — activates passage selection
- Highlight mode toggle (line icon) — activates line/word selection
- Full continuous scrollable text of all epub sections rendered as HTML
- **Amber left border markers** on specific paragraphs where moments have been captured for this book (matched by first 200 characters of the captured passage text)
- Chapter headings between sections
- Scroll position saved to `localStorage` per book (`momento_scrollTop_{gutId}`, `momento_pg_{gutId}`)

### Fixed Shelf Books (always pre-loaded, always available offline)
| Book | Author | Gutenberg ID |
|---|---|---|
| Frankenstein | Mary Shelley | 84 |
| Pride and Prejudice | Jane Austen | 1342 |
| The Great Gatsby | F. Scott Fitzgerald | 64317 |
| Jane Eyre | Charlotte Brontë | 1260 |
| The Adventures of Sherlock Holmes | Arthur Conan Doyle | 48320 |

All 5 are parsed from local `.epub` files in `vendor/books/`. Their titles are always stored using the FIXED_SHELF display name (not the epub's internal `dc:title` metadata, which may differ).

### Gutenberg Catalogue
- 1,000 most popular public domain books fetched from the Gutendex API at build time
- Stored in `src/books.catalog.js` (~292KB)
- Searchable by title and author from the Library view
- Adding a book from catalogue fetches its epub via CORS proxy and caches it in `localStorage`

### Data it needs
- `FIXED_SHELF` — 5 pre-loaded epub books (Frankenstein, Pride and Prejudice, The Great Gatsby, Jane Eyre, The Adventures of Sherlock Holmes)
- `SHELF_BOOKS` — 17 curated shelf books with covers and metadata (includes all 5 FIXED_SHELF titles so Worth book picker covers them)
- `FEATURED_BOOKS` — 5 books with highlighted passages
- `DAILY_QUOTES` — 7 literary quotes
- `MOST_FELT_PASSAGES` — 5 passages with feeling counts
- `allMoments` — all moments (used to show passage markers in reading view)
- `headerSearchExpanded` / `searchInputRef` — from parent for search bar
- `onBookOpen(book)` / `onBookClose()` — notifies parent which book is open (includes `gutId`)
- `initialOpenBook` — passed in from parent; if set, reopens the same book when panel remounts (e.g. switching from multi to single mode)
- `shelfOnly` — when 4 panels showing, shows shelf only
- `sectionCount` — adjusts layout and scroll behaviour on drop

### Actions
- **Book cover / title** → opens reading view, saves `openBookInRead` in parent
- **Back button** (in reading view) → closes book, clears `openBookInRead`
- **Snip passage** (drag-select or click-select) → calls `onSnip(moment)` where moment includes `{passage, book, chapter, pg, scrollTop}` → adds to `snippedMoments`, triggers saved-blink + worth notification
- **Library search** → filters 1,000-book catalogue by title/author
- **+ Add to shelf** → saves book to `localRecentShelf` (persisted in `localStorage`)
- **Contents dropdown** → lists all epub spine sections; clicking a chapter scrolls to it
- **Drop a moment card here** (from Moments section) → opens the matching fixed book and scrolls to the captured passage section (see Drag System §13)

### Shelf card behaviour
- **Hover** — book cover lifts upward (`translateY(-10px)`) with spring easing; the hovered cell gets `z-index:10` so it rises above adjacent books rather than behind them
- **"E" badge** — top-right corner of FIXED_SHELF books; italic "E" pill with tooltip "Exclusive book ready for you to read" on hover. Badge is rendered outside the `overflow:hidden` book container so the tooltip is never clipped.
- **Moment count badge** — bottom-right; shows how many moments the user has captured from that book
- **Title overlay** — appears on hover, centered over the cover

### Book stays open on mode switch
When switching from multi-panel to single-panel mode, the ReadPanel remounts. If a book was open, it is automatically restored using `initialOpenBook` prop + the EPUB cache (module-level, persists across remounts).

---

## 12. MOMENTS SECTION (MomentsPanel)

### What it shows
- Header row:
  - Count display: `X momentos · Y moments` (filtered by current book if one is open in Read)
  - Book filter dropdown: "All books" or specific book title
  - Layout controls (hidden in solo mode — controls are in TopChrome instead)
- Two layout modes:
  - **List all** — flat scrollable list of all moment cards, most recently captured first
  - **Clip by books** (default) — book stacks, each showing 3-card fan with book title + moment count

### Moment ordering
- Newly captured moments (`snippedMoments`) appear at the top, most recent first
- Pre-seeded demo moments (`MOMENTS_DATA`) follow below

### Data it needs
- `snippedMoments` (reversed, most recent first) + `MOMENTS_DATA` = `allMoments`
- If `openBookInRead` is set → filters to only that book's moments
- `momentsWithMomento` — count of moments that have an interpretation
- `momentsBookCount` — count of distinct books in the list
- `layoutMode` — "list-all" or "clip-by-books"
- `passageFirst` — whether to show passage or interpretation on top of cards
- `expandedMomentId` — which moment card to show expanded (from drop or onboarding)
- `sharingAssistMode` — whether opened alongside Sharing (for drag-to-share)

### Moment Card (MomentCard)

**Collapsed card shows:**
- Amber left accent line
- Book title (top-left, italic serif, amber)
- Chapter label (top-right, small)
- Primary content (top): interpretation in Kalam cursive (or passage in italic if passageFirst)
- Fold arrow (bottom of top section) — only if moment has interpretation
- Peek strip (bottom): first line of the secondary content (passage or interpretation)
- **Delete button** (small trash icon, top-right) — only shown for snipped moments that are eligible for deletion

**Card interactions:**
- **Drag card** → initiates moment drag. Ghost card follows cursor
  - Drop on **Moments section** → expands that moment card
  - Drop on **Read section** → opens the matching fixed book and scrolls to captured passage (see §13)
  - Drop on a **reader name in Sharing** → opens thread with that reader with moment attached
  - Drop on **Sharing section** (no specific reader) → attaches to current open thread (if any)
  - Drop on **Worth section** ⚠️ wired to show "Drop to explore" but sets `expandedMomentId` only, no worth-specific behavior
- **Click card (no drag)** → expands to `ExpandedMoment` view
- **Fold arrow click** → unfolds card to show full secondary content (3D page-fold animation, 520ms)

**Expanded card (ExpandedMoment) shows:**
- Full passage block
- Full interpretation block (editable)
- Close button (×, top-right)
- Delete button (trash, next to close) — only if moment is deletable
- Passage-first toggle applies here too
- Width: `calc(100% - 32px)`, max 480px — constrained to panel width in all modes

**Expanded card interactions:**
- **Click interpretation text** → enters edit mode (textarea)
- **Save button** (in edit mode) → exits edit mode, saves new text, propagates back to parent state
- **Close button (×)** → collapses card back to normal
- **Drag** → same drag behaviour as collapsed card

### Book Stack (BookBrowse / Clip-by-books mode)

- Each stack shows 3 fanned cards with book cover color + title + moment count
- Front card shows: passage excerpt or interpretation (depending on `passageFirst`) + moment count
- Paperclip graphic at top of stack
- **Click stack** → drills into that book, shows all its moments as a scrollable list
- **Back button** → returns to all-books view
- In drill-down view, moment cards fill the full panel width correctly in all display modes

---

## 13. WORTH SECTION (WorthPanel)

### What it shows
Two main containers stacked vertically.

---

### Top Container — Readers of current book

**Header row:**
- Status indicator dot + label:
  - **Green dot + "Currently reading"** — a book is currently open in the Read section
  - **Amber dot + "Last opened"** — no book is open, but one was opened earlier this session (persists after closing)
  - No dot — no book has been opened yet (defaults to Pride and Prejudice)
- Book title (clickable, opens book picker)
- **Book picker dropdown**: shows all 17 shelf books as cover images in a grid → select one to filter readers by that book
- **Label filter**: "Think" / "Feel" toggle → filters reader profiles to show only T or F dominant readers
- **R/C/D filter buttons**: Resonance / Connection / Divergence → filters by dominant type

**Reader cards (CardNavigator — horizontally scrollable):**
- Each profile card shows:
  - Reader initials / avatar
  - Name
  - Signature glyph (t/f mark with coloured R/C/D bars for Think + Feel)
  - Match bar (TFBars) — coloured segment bars showing Think and Feel composition
  - Compatibility teaser line (generated from RCD score templates in `getRCDTeaser()`)
  - **Momento icon** — clicking flips the card to show the top momento (passage + interpretation pair)
  - **Wave** button
  - **Whisper** button

**Card flip (top momento):**
- 3D `rotateX(180deg)` flip over 600ms
- Back face shows: the highest-confidence shared momento — passage + both users' interpretations
- Navigation arrows (up/down) to browse all shared momentos for that reader

**Data it needs:**
- `PROFILES` (large dataset in `worth/data.js`) — reader profiles with `rt/ct/dt/rf/cf/df` values ⚠️ all hardcoded mock data
- `snippedMoments` + `MOMENTS_DATA` — to know which book is active
- `openBookInRead` — if a book is open in Read, overrides book filter with that book (green dot)
- `lastOpenedBook` — last book opened in Read this session; used as default when no book is currently open (amber dot); persists after closing
- `wavedNames` — Set of names already waved to (to show wave state)
- `focusedMoment` — a moment dropped onto Worth section ⚠️ (drop-to-explore disabled in current code)

**Reinforcement Learning signals collected (future integration):**
- Momento icon click → interest signal
- Wave → positive match signal
- Profile seen but not waved → implicit negative signal (requires IntersectionObserver, not yet built)
- Whisper opened → strong positive signal
- Thread engagement duration → engagement depth signal
All signals linked to anonymous ID only.

**Actions:**
- **Wave button** → adds reader name to `wavedNames` → after 3 seconds, generates a "wave_back" feed entry in Sharing, increments `sharingNotifCount`
- **Whisper button** → calls `onOpenWhisper(name, moment)` → sets `whisperTarget` + `sharingActiveThread`, expands Sharing section
- **Book picker** → changes which book's readers are shown
- **Label / R/C/D filters** → filter the profile cards shown

---

### Bottom Container — Closest readers across all books

**What it shows:**
- "Across all your books" label
- **Close Circle Ring** (SVG) — shows R/C/D composition of close readers:
  - Top half (Think arc): R, C, D segments left to right
  - Bottom half (Feel arc): D, C, R segments left to right (mirrored)
  - Center text: reader count + "close readers"
- Horizontally scrollable row of closest reader profile cards (same card as above)

**Data it needs:**
- `CLOSE_READER_PROFILES` (3 profiles from `SharingPanel.jsx` data) ⚠️ hardcoded mock data
- Averages: `avg(rt)`, `avg(ct)`, `avg(dt)`, `avg(rf)`, `avg(cf)`, `avg(df)` across close readers

**Actions:**
- Same **Wave** / **Whisper** / **Momento icon** interactions as top container
- `onOpenMoments` → opens Moments panel alongside Worth (for drag-to-share workflow)

---

### Worth message bar
- Shown when `worthMessage` is set
- Displays message text (e.g. "Snip Moments to create Momentos and shape your circle.")
- **Dismiss (×)** → clears `worthMessage`, sets `worthNotif = false`

---

## 14. SHARING SECTION (SharingPanel)

### What it shows
Two main areas:

---

### Close Circle feed / header area

**Header:**
- "Close Circle Activity" title with "Close Circle" highlighted in amber
- `X signals` count (count of feed items)
- **Close circle pill button** → opens/closes **Close Circle Dropdown**

**Close Circle Dropdown:**
- **Close Circle Ring** (SVG, same as Worth bottom) — titled "Your Close Circle"
- List of close readers (CloseRow):
  - Initials avatar + name + last message preview + time
  - Unread count badge (if > 0)
  - Currently reading book label
  - **View** button → opens full **Profile Card overlay** (via ReactDOM portal, z-index 9999)
  - **Click row** → opens thread with that reader

**Profile Card overlay (from View button):**
- Rendered via `ReactDOM.createPortal` into `document.body` (escapes CSS transform stacking)
- Shows full reader profile with signature glyph, R/C/D bars, compatibility teaser
- Closes via × button or backdrop click
- Whisper button inside opens a thread with that reader

**Feed (CircleSignalCard items):**
- Each card shows a signal: `wave` / `wave_back` / `moment` / `whisper`
- **Wave back card**: shows **Wave back** button → adds reader to Close Circle, updates card state
- **Whisper/Reply card**: shows message preview → clicking opens that thread via `onOpenThread`
- **Dismiss**: animates out and removes from feed

**Data it needs:**
- `CLOSE_READERS` (3 demo readers: name, initials, last message, time, unread count, active book) ⚠️ hardcoded mock data
- `CLOSE_CIRCLE_FEED` (feed entries) + `feedAdditions` (new entries from waves in Worth)
- `CLOSE_READER_PROFILES` (full profiles for ring calculation) ⚠️ hardcoded mock data
- `sharingNotifCount` → reset to 0 when Sharing section is opened

---

### Whisper thread area

**What it shows (no active thread):**
- Prompt to select a reader or drop a moment

**What it shows (thread open):**
- Reader name header
- Thread view toggle: **Default** / **Momento list** / **Whispers only**
- Search bar within thread
- Thread stats: live counts of books/moments/momentos/whispers from actual thread data
- Scrollable message list (WhisperCard items):
  - Each card: passage quote + interpretation text + sender info + timestamp
  - Received cards: **Save moment** button + **Share** button (both wired)
  - Sent cards: read indicator ⚠️
- Bottom action bar:
  - **M icon** → opens Moments alongside Sharing for drag-to-share (`openMomentsAlongsideSharing`)
  - **Chat bubble** → opens compose whisper textarea
- If `pendingMoment` is set (from drag-drop): moment card pre-loaded in compose area

**Data it needs:**
- `activeThreadName` — which reader's thread is open
- `activeThreadPendingMoment` — moment pre-attached for sharing
- `whisperTarget` — set from Worth's Whisper button
- `openBookInRead` — for context
- `sharingAssistMode` — whether Moments is open alongside

**Actions:**
- **Reader row click / Close circle dropdown row** → `onOpenThread(name)` → opens that thread
- **Close thread** → `onCloseThread()` → clears thread state, also clears `sharingAssistMode`
- **M button** → `openMomentsAlongsideSharing()` → opens Moments (index 1) + Sharing (index 3) side by side
- **Send whisper** → ⚠️ send logic exists in UI but state persistence unclear
- **Save moment button** (on received card) → calls `onSnip` with the received moment
- **Resolve pending moment** → called after moment is inserted into thread

---

## 15. DRAG SYSTEM (cross-section)

### How dragging works
1. User mousedowns on a MomentCard (not on fold trigger or delete button)
2. `onDragStart(moment, x, y)` fires → sets `draggedMoment` + `ghostPos`
3. Ghost card appears at cursor position (rotated 2°, 220px wide, shows interpretation + book). Ghost has `pointerEvents:none` so it doesn't block drop target detection.
4. On mousemove: ghost follows cursor; `elementFromPoint` checks which `[data-section]` is under cursor → sets `dropTarget`
   - If over Sharing: also checks `[data-reader-name]` → sets `dropZone`
   - If over Read: shows "Drop to open passage" overlay on the Read panel
5. Active `dropTarget` section highlights with colored outline
6. On mouseup:
   - Drop on **Moments** → expands that moment card in Moments section
   - Drop on **Read** → finds matching FIXED_SHELF book (fuzzy title match), sets `readDropMoment`, calls `rotateTo(0)`, ReadPanel opens the book and scrolls to the captured passage section (`#read-section-{pg}`) + 110px extra offset in multi-panel mode
   - Drop on **Sharing + reader name** → opens thread with that reader, attaches moment
   - Drop on **Sharing** (no reader) → attaches moment to currently open thread (if any)
   - Drop on **Worth** → ⚠️ shows "Drop to explore" overlay but no worth-specific behavior wired
7. Ghost card disappears, `draggedMoment` cleared

### Drop on Read — detail
- Only works for the 5 FIXED_SHELF books (pre-loaded epubs)
- Title matching is fuzzy: checks if either title contains the other (case-insensitive) — handles epub metadata titles that differ from display titles (e.g. "Frankenstein; or, the modern prometheus" → "Frankenstein")
- Scroll restoration uses the `pg` (spine section index) saved at capture time — layout-independent, works in any panel width
- Extra scroll offset: +110px in multi-panel mode (2+ sections visible) so the passage sits visibly in the narrower panel

### Passage markers in reading view
- When a moment is captured, `pg` (section index) and `scrollTop` are saved alongside the passage text
- When reading a book that has captured moments, a `useEffect` runs after render to find `<p>` elements whose text contains the first 200 characters of each captured passage
- Matching paragraphs get an amber left border (`3px solid var(--amber)`) applied directly to the DOM element (via `data-moment-marker` attribute for cleanup)
- Markers update whenever `openGutBook` or `allMoments` changes

---

## 16. NOTIFICATION SYSTEM

| Notification | Where shown | Triggered by | Cleared by |
|---|---|---|---|
| Moments saved blink (✓) | Moments tab in TopChrome | Any `onSnip()` call | Auto after 1.5 seconds |
| Worth `!` badge | Worth tab in TopChrome | Snipping a moment with interpretation; onboarding complete | Clicking × on worth message bar |
| Sharing unread count | Sharing tab in TopChrome | Wave-back received (3 sec delay after waving in Worth) | Opening Sharing section |
| Worth message text | Worth header / TopChrome | Snipping moments (progressive messages); onboarding | × dismiss button |

---

## 17. DATA SUMMARY

| Dataset | Location | Contents | Count |
|---|---|---|---|
| `FIXED_SHELF` | `read/gutenberg.js` | 5 pre-loaded epub books with local file paths | 5 |
| `SHELF_BOOKS` | `data/library.js` | 17 books: title, author, cover, moment count, colors (includes all 5 FIXED_SHELF books) | 17 |
| `BOOKS` | `read/data.js` | 4 books with full text | 4 |
| `FEATURED_BOOKS` | `read/data.js` | 5 books with highlighted passages | 5 |
| `DAILY_QUOTES` | `read/data.js` | 7 literary quotes | 7 |
| `MOST_FELT_PASSAGES` | `read/data.js` | 5 passages + feeling counts | 5 |
| `MOMENTS_DATA` | `moments/data.js` | 6 pre-seeded moments (some with, some without interpretation) | 6 |
| `GUTENBERG_CATALOG` | `src/books.catalog.js` | 1,000 most popular public domain books from Gutendex | 1,000 |
| `PROFILES` | `worth/data.js` | Full reader profiles with rt/ct/dt/rf/cf/df values ⚠️ all mock | ~20 |
| `CLOSE_READERS` | `sharing/SharingPanel.jsx` | 3 demo close readers ⚠️ mock | 3 |
| `CLOSE_READER_PROFILES` | `sharing/SharingPanel.jsx` | 3 profiles for ring/Worth bottom ⚠️ mock | 3 |
| `CLOSE_CIRCLE_FEED` | `sharing/SharingPanel.jsx` | Feed entries (waves/whispers/moments) ⚠️ mock | ~6 |

---

## 18. ML / BACKEND INTEGRATION NOTES

### What the ML model outputs (per matched pair)
- **Think RCD scores** (`rt`, `ct`, `dt`) — book-level and profile-level
- **Feel RCD scores** (`rf`, `cf`, `df`) — book-level and profile-level
- **Confidence score** — per interpretation pair; highest confidence = top momento
- **Top momento** — the highest-confidence shared passage + both interpretations
- **Rationale** — text explanation for why this pair was top momento

### What needs to change when ML is ready
| Area | Current | What's needed |
|---|---|---|
| Profiles | 20 hardcoded in `worth/data.js` | API endpoint returning real matched profiles |
| Confidence score | Not in profile object | Add `confidence` field per momento pair |
| Top momento | First item in `moments[]` | Highest-confidence pair from ML |
| Rationale | Not present | Add `rationale` string to momento object, show on card back |
| Book-level vs profile-level | No distinction in UI | May need label/toggle to show which level the score is at |
| Photos | Base64 hardcoded | URL references to CDN/storage |
| Whisper threads | Mock `DEFAULT_THREAD` | Real message store |

### Reinforcement learning signals (future)
All signals linked to anonymous user ID only, never name or identity:
- `onCardFlip(profileId)` → interest signal
- `onWave(profileId)` → positive match signal
- `onProfileSeen(profileId)` + no wave → implicit negative signal *(requires IntersectionObserver, not yet built)*
- `onWhisperOpen(profileId)` → strong positive signal
- `onThreadEngagement(profileId, durationMs)` → engagement depth

No UI changes required to collect these — all hookable to existing interaction callbacks.

---

## 19. ITEMS MARKED ⚠️ (unresolved / unclear / not wired)

### Still Open ⚠️

1. **Profile Drawer menu items** — Notifications, Privacy, Settings rows have no action wired. Clicking does nothing.
4. **Close readers count in Profile Drawer** — shows hardcoded `847`, not wired to real data.
13. **Search in Read section** — Search bar filters the Gutenberg catalogue (1,000 books) by title/author. Shelf filtering within the reading view is separate and not fully traced.
14. **Quote button in Read** — Present in TopChrome in read mode. Opens a quote input overlay — behavior not fully traced.
18. **Worth PROFILES data** — All ~20 profiles in `worth/data.js` are hardcoded mock data. No real ML output connected.
19. **Sharing CLOSE_READERS / CLOSE_CIRCLE_FEED** — All demo data. No real user connections or messages.
20. **Thread send persistence** — Sending a whisper updates local UI state but is not persisted to any backend.
21. **Profile-seen signal for RL** — No IntersectionObserver implemented yet to detect which Worth profiles were actually viewed.

### Resolved ✅

1. **Google sign-in buttons** — both "With Google" buttons on the opening page are now wired to `handleGoogleSignIn()`. Works for both sign-up (new user → `GoogleCompleteProfileOverlay`) and sign-in (existing user → `requestLaunch()`).
2. **Sign In auth** — now uses real Firebase `signInWithEmailAndPassword`. Checks `emailVerified`; shows `EmailVerificationOverlay` for unverified users.
3. **Create Account auth** — now creates a real Firebase account + DB record via `POST /users/me`. Sends verification email. Rolls back Firebase user if DB insert fails.
4. **Email verification gate** — `EmailVerificationOverlay` shown on return sign-in if `emailVerified === false`. Reload + check on "I've verified" button. Resend email supported.
5. **Consent shown every login** — fixed. Consent is stored in DB (`consent_logs`) and cached in `localStorage`. Cache NOT cleared on sign-out. Only cleared when a new account is created.
6. **Profile Drawer stats** — Momentos count now uses live `allMoments.filter(m=>!!m.interpretation).length`. Profile name shows `readerProfile.firstName` from account creation.
4. ~~**Worth drag-drop**~~ — Removed; intentionally not in current scope.
5. ~~**Sharing split drop-zone**~~ — Removed; intentionally not in current scope.
6. **Book picker filtering in Worth** — Working. Now covers all 5 FIXED_SHELF books (Frankenstein and Sherlock Holmes added to SHELF_BOOKS and have profile moments). "Currently reading" (green) and "Last opened" (amber) labels track READ state correctly.
7. **CompatibilityTeaser** — Now uses local `getRCDTeaser()` template function; no live API call.
8. **Expanded moment interpretation save** — Edits propagate back to parent state correctly.
9. **WhisperCard send / Save moment** — Both handlers wired and functioning.
10. **Thread stats** — Now reflect live counts from actual thread data.
11. **Close Circle "View" button** — Opens full ProfileCard overlay via ReactDOM portal. Closes via × or backdrop.
12. **Feed signal cards** — Wave back, Whisper/Reply, and Dismiss all working.
15. **Consent check on "Skip guide"** — Routes correctly to Consent Screen. "I do not agree" popup with Home/Review again added.
16. **`openBookInRead` filtering in Moments** — Working correctly.
17. **Drag to Read** — Dropping a moment card onto the Read section opens the matching fixed book and scrolls to the captured passage section.
