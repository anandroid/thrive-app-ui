# Thrive App - Mobile-First Development Guidelines

## 🎯 CRITICAL UPDATE (2025-07-14): Premium Touch Feedback is NOW IMPLEMENTED EVERYWHERE
All buttons and interactive elements throughout the app now have premium touch feedback with:
- Spring animation (bouncy cubic-bezier curves)
- Active state gradient transitions (activeFrom/activeTo)
- Card glow effects for depth
- Haptic feedback integration
- Gradient overlays for shimmer effects
- Enhanced shadow transitions

### ActionBar Improvements:
- ActionBar back buttons now use IconButton with premium effects
- IconButton default scale increased from 0.85 to 0.93 for better feedback
- IconButton has springAnimation, cardGlow, and gradientOverlay enabled by default
- MenuButton enhanced with premium defaults
- All action buttons now have consistent touch experience

## 🤖 AI AGENT MANDATORY RULES - READ FIRST!

### RULE #1: Touch Feedback is NOT Optional
**EVERY clickable element MUST use our premium touch components with ALL features enabled:**

```jsx
// ❌ NEVER create buttons like this:
<button>Click</button>

// ✅ ALWAYS create buttons like this:
<Button springAnimation gradientOverlay cardGlow haptic="medium">
  Click
</Button>
```

### RULE #2: Pre-configured Components Have Premium Features Built-in
Use these components - they already include all premium effects:
- `MenuButton` - For settings/menu buttons
- `CardButton` - For card-style interactive elements  
- `SoftButton` - For subtle gradient buttons
- `ConsultationButton` - For CTA buttons
- `IconButton` - For icon-only buttons

### RULE #3: Copy These Templates
```jsx
// Primary action button
<Button 
  variant="gradient"
  springAnimation
  gradientOverlay
  cardGlow
  haptic="medium"
  gradient={{
    from: 'rose', to: 'burgundy',
    activeFrom: 'rose/40', activeTo: 'burgundy/30'
  }}
>
  Save
</Button>

// Navigation link
<TouchLink href="/page" variant="icon" haptic="medium" cardGlow scale={0.9}>
  <Icon />
</TouchLink>

// Card interaction
<CardButton onClick={...}>{content}</CardButton>
```

**Remember: Premium touch feedback is MANDATORY, not optional!**

## 🏗️ Page Layout Architecture (MANDATORY)

### ALL page.tsx files MUST use AppLayout
Every page in the app MUST use the standardized AppLayout component for consistency:

```tsx
// ✅ CORRECT - All pages must follow this pattern
import { AppLayout } from '@/components/layout/AppLayout';

export default function MyPage() {
  return (
    <AppLayout
      header={{
        title: "Page Title",
        showBackButton: true,
        backHref: "/",
        rightElement: <CustomButton />
      }}
    >
      {/* Your page content */}
    </AppLayout>
  );
}

// ❌ WRONG - Never use these patterns
<div className="app-screen">...</div>  // Legacy pattern
<PageLayout>...</PageLayout>           // Removed component
Custom layout structures               // Not allowed
```

### AppLayout Features
- **Sticky header** that scrolls with content then sticks at top
- **Natural scroll behavior** - no complex CSS transforms
- **Automatic safe area handling** for notch devices
- **Consistent spacing** across all pages
- **Mobile-first architecture**

### 🚨 CRITICAL: Header Positioning Framework (2025-07-14)
**ALL headers use STICKY positioning, NOT fixed!**

#### Why Sticky Over Fixed:
1. **Natural keyboard handling** - Browser handles keyboard adjustments automatically
2. **No padding calculations** - Header stays in document flow, no need for padding-top
3. **Consistent behavior** - All pages behave the same way
4. **Simpler CSS** - Less complexity, fewer edge cases

#### Implementation Rules:
- `.app-header` uses `position: sticky` with `top: 0`
- `.app-content` has NO padding-top (header takes natural space)
- ActionBar inside app-header is `position: relative` (parent handles stickiness)
- NEVER mix fixed and sticky positioning strategies

#### Common Mistakes to Avoid:
- ❌ Using `position: fixed` for headers
- ❌ Adding `padding-top` to content when using sticky
- ❌ Creating custom header implementations
- ❌ Using ActionBar directly without AppLayout

### Exception: Pages with Special Requirements
Only these pages may use custom layouts:
- **Home page** (`/page.tsx`) - Has drawer navigation
- **Chat** (`/chat/[threadId]/page.tsx`) - Uses SmartCardChat component
- Pages that directly use **ActionBar** with legacy `app-screen` pattern (being phased out)

### CSS Classes Provided
The AppLayout automatically applies these classes:
- `.app-layout` - Main container
- `.app-header` - Fixed header container
- `.app-content` - Scrollable content area

### Important Notes
1. The ActionBar inside AppLayout has `padding-top: 0` to prevent double padding
2. Content area automatically has proper `padding-top` for the fixed header
3. No manual keyboard handling needed - browser handles it naturally
4. Always test on mobile devices to ensure proper scrolling behavior

## 🎯 Keyboard Handling Solution (Sticky Bottom Pattern)

### The Problem
Mobile keyboards can cover input fields, causing poor UX where users can't see what they're typing. Traditional JavaScript solutions are unreliable and cause flicker.

### The Solution: CSS Sticky Bottom Pattern
We use a pure CSS approach with sticky positioning that lets the browser handle keyboard appearance naturally.

#### How It Works:
```
AppLayout (100dvh flex container)
  ├── Header (sticky top - always visible)
  └── Content (flex: 1, scrollable)
       ├── Main content area
       └── Sticky bottom (inputs/buttons - sticks to keyboard)
```

#### Implementation:
```tsx
// For pages with bottom inputs
<AppLayout
  header={{ title: "My Page" }}
  stickyBottom={
    <div className="chat-input-container">
      <ChatEditor />
    </div>
  }
>
  {/* Your scrollable content */}
</AppLayout>

// For regular forms
import { Input, Textarea } from '@/components/ui/form-inputs';

<Input 
  value={value} 
  onChange={(e) => setValue(e.target.value)}
  label="Name"
/>
```

#### Key Benefits:
- **Zero JavaScript** - Browser handles everything natively
- **No flicker** - Instant response to keyboard
- **Cross-platform** - Works identically everywhere
- **Performance** - No DOM manipulation or timers

#### CSS Classes:
- `.app-sticky-bottom` - Applied to sticky bottom content
- `.chat-input-container` - For chat-style inputs
- Content automatically has padding-bottom to prevent overlap

## 🔐 Environment Variables

### Required Environment Variables
```bash
# OpenAI Configuration
THRIVE_OPENAI_API_KEY=sk-...        # Your OpenAI API key
OPENAI_API_KEY=sk-...               # Same value as above (required by OpenAI SDK)
THRIVE_OPENAI_ASSISTANT_ID=asst_... # Main assistant ID

# Optional Multi-Assistant Configuration
THRIVE_CHAT_ASSISTANT_ID=asst_...    # Chat-specific assistant
THRIVE_ROUTINE_ASSISTANT_ID=asst_... # Routine creation assistant
THRIVE_PANTRY_ASSISTANT_ID=asst_...  # Pantry analysis assistant
```

### Local Development
1. Copy `.env.example` to `.env.local`
2. Add your API keys to `.env.local`
3. Set `OPENAI_API_KEY` to the same value as `THRIVE_OPENAI_API_KEY`

### Deployment to Google Cloud
```bash
# Upload all secrets from .env.local
./scripts/upload-secrets.sh

# The script automatically:
# - Uploads THRIVE_* prefixed variables
# - Uploads OPENAI_API_KEY without prefix (for SDK compatibility)
# - Grants Cloud Run service access to all secrets
```

### Important: API Route Environment Variables
When using environment variables in Next.js API routes, **NEVER** access them at module level:

```typescript
// ❌ BAD - This will fail during build
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  // ...
}

// ✅ GOOD - Initialize inside the handler
export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // ...
}
```

Environment variables are not available during the build process, only at runtime.

## 🚨 CRITICAL: NO PIXEL THINKING - ONLY VIEWPORT UNITS!

### NEVER TALK OR THINK IN PIXELS!
This is a MOBILE-FIRST app. We NEVER use or reference pixel values. ALWAYS use viewport-relative units.

### ❌ FORBIDDEN (Never use or mention):
- "20px padding" 
- "16px spacing"
- "44px touch target"
- Any fixed pixel references

### ✅ REQUIRED (Always use):
- "5vw padding with 1.25rem max"
- "4vw spacing with 1rem max"
- "11vw touch target with 2.75rem max"
- Viewport-first thinking

## 📐 UNIVERSAL SPACING SYSTEM (MANDATORY FOR ALL COMPONENTS)

### Consistent Spacing Units
Use these EXACT spacing values throughout the app for perfect alignment:

**Padding:**
- Card padding: `p-[min(5vw,1.25rem)]`
- Container padding: `px-[min(4vw,1rem)]`
- Small padding: `p-[min(3vw,0.75rem)]`

**Spacing:**
- Between elements: `space-x-[min(4vw,1rem)]`
- Small gaps: `gap-[min(3vw,0.75rem)]`
- Large gaps: `gap-[min(5vw,1.25rem)]`

**Icon Sizes:**
- Standard icon container: `w-[min(11vw,2.75rem)] h-[min(11vw,2.75rem)]`
- Small icon container: `w-[min(10vw,2.5rem)] h-[min(10vw,2.5rem)]`
- Icon inset: `inset-[min(2vw,0.5rem)]`

**Text Sizes:**
- Body text: `text-[min(3.75vw,0.9375rem)]`
- Small text: `text-[min(3.5vw,0.875rem)]`
- Title text: `text-[min(4.5vw,1.125rem)]`

**Border Radius:**
- Cards: `rounded-2xl`
- Buttons: `rounded-xl`
- Small elements: `rounded-lg`

## 🚨 CRITICAL: VIEWPORT-FIRST DEVELOPMENT RULE - MANDATORY FOR ALL COMPONENTS
**THIS IS A MOBILE APP - ABSOLUTELY NO HARDCODED PIXEL VALUES ALLOWED!**

### ⛔ VIOLATIONS THAT MUST BE FIXED IMMEDIATELY:
- Fixed widths like `w-96`, `max-w-[340px]`, `w-64`
- Fixed heights like `h-96`, `h-[400px]`
- Fixed text sizes like `text-2xl`, `text-lg` without viewport scaling
- Fixed paddings/margins like `p-6`, `m-4` without viewport units
- Modal widths using `max-w-md`, `max-w-lg` without viewport units

### ✅ MANDATORY VIEWPORT APPROACH:
EVERY component, modal, button, text, and spacing MUST use viewport units (vw, vh, dvh) with appropriate max constraints. This ensures perfect scaling on ALL devices from iPhone SE to tablets.

## Universal Mobile Voice Input Solution (2025-07-12)

### ✅ Mobile Voice Input Strategy
- **Issue**: Web Speech API is unreliable on mobile browsers (Chrome stops after 200ms, iOS Safari has duplicate text bugs)
- **Root Cause**: Mobile browsers have various implementation issues with the Web Speech API
- **Solution**: Universal approach - recommend native keyboard voice input for ALL mobile devices
- **Implementation**:
  1. **Mobile Detection** (All mobile browsers):
     - Detects any mobile device (iOS or Android)
     - Shows helpful toast: "Use the keyboard mic button 🎤"
     - iOS Safari gets special message: "Tap the mic on your keyboard - iOS dictation works best"
     - Focuses hidden input field to trigger keyboard appearance
  2. **Platform-Specific Handling**:
     - **iOS Safari**: Disabled interim results (prevents duplicate text bug)
     - **Chrome Mobile**: Auto-restart on timeout (workaround for 200ms bug)
     - **Other Mobile**: Falls back to standard Web Speech API with mobile optimizations
  3. **Desktop**: Uses standard Web Speech API without modifications
- **Why This Works**: 
  - Mobile keyboard voice input uses native OS speech recognition (not Web Speech API)
  - iOS uses Siri dictation, Android uses Google voice typing
  - Much more reliable than browser-based speech recognition
- **Limitations**: Cannot programmatically trigger keyboard dictation on iOS (Apple restriction)
- **Testing**: Use `?isDebug=true` to see debug components

## Recent Performance & AI Improvements (2025-07-10)

### ✅ Hybrid Context Approach for Performance
- **Basic Context Extraction** - Client sends pantry count, routine count, and types to reduce function calls
- **Optimized Instructions** - Assistant skips unnecessary function calls when basic context is sufficient
- **Reduced Latency** - Significantly faster responses for common queries about empty pantry or no routines
- **Smart Function Calling** - Only calls functions when specific details are needed

### ✅ Fixed Assistant Behavior
- **Routine Recommendations** - Assistant now consistently recommends routines after function calls
- **Buy/Add to Pantry Actions** - Properly suggests buying supplements and adding to pantry
- **Medication Management** - Immediately suggests routine creation for medication management
- **Multiple Function Calls** - Fixed handling of parallel function calls in submit-tool-outputs
- **Supplement Options Auto-Fix** - Client-side logic automatically generates "I already have it" options when assistant only provides "buy" options

### ✅ TypeScript Types Added
- **BasicContext Interface** - Properly typed context passing from client to server
- **Type Safety** - All context passing is now type-safe with proper interfaces

### ✅ Supplement Recommendation Flow
- **Dual Options Required** - For each supplement, both "I already have it" and "Where to find it" options should be shown
- **Client-Side Workaround** - parseAssistantResponse and parsePartialAssistantResponse automatically generate missing "already_have" options
- **Non-Pushy Design** - "I already have it" option appears first, followed by "Where to find it" for convenience
- **Pantry Integration** - "I already have it" opens PantryAddModal with contextMessage about personalization


## Recent Mobile UX Improvements (2025-07-09)

### ✅ Thriving Tutorial Overlay
- **First-Time Tutorial** - When users first see a routine or journey suggestion in chat, an overlay tutorial appears
- **Visual Guide** - Shows both routine and journey illustrations to explain what "thrivings" are
- **Interactive Arrow** - Animated arrow points to the actionable item they should tap
- **Auto-Show on Mobile** - Tutorial appears automatically after 2 seconds on mobile devices
- **One-Time Display** - Shows only once per user, tracked in localStorage

### ✅ Companion Welcome Screen
- **Removed from Onboarding** - Companion illustration no longer appears in onboarding flow
- **Added to Chat Empty State** - Companion image now appears when opening chat with no messages
- **Smooth Transitions** - Welcome screen fades out smoothly when first message is sent or received
- **Mobile Optimized** - Responsive design with proper spacing and touch-friendly layout

### ✅ Routine Progress Display Fix
- **Fixed "0 more steps" Issue** - When all steps for today are completed, now shows "✓ All done for today!" instead of "0 more steps"
- **Improved Next Step Display** - When no more steps today, shows "Tomorrow: [time]" for the next step
- **Better Pluralization** - Shows "1 more step" vs "2 more steps" correctly
- **Enhanced User Feedback** - Clearer indication of daily progress completion

## Recent Mobile UX Improvements (2025-07-08)

### ✅ Fixed Issues
1. **Vertical Scrolling on Illustrations** - Onboarding now properly scrolls on small devices
2. **Swipe Gestures** - Added left/right swipe navigation on onboarding screens
3. **Touch Feedback** - All interactive elements now have proper touch feedback animations
4. **Page Transitions** - Smooth fade/scale transitions between onboarding and main app
5. **PWA Preloading** - Critical assets are now preloaded during onboarding for better performance

### 🎯 New Features Added
- **Touch Feedback System** (`/styles/touch-feedback.css`)
  - Active state animations for all buttons
  - Haptic feedback support (when available)
  - Native-like press effects
  - Ripple animations (optional)
  
- **Custom Touch Components**
  - `useTouchFeedback` hook for haptic feedback
  - `TouchButton` component with built-in touch optimizations
  - Utility functions for touch class management

- **Improved Onboarding Experience**
  - Swipe between slides (with visual hint)
  - Proper scroll handling for long content
  - Asset preloading during onboarding
  - Smooth transition to main app (no blanking)

## 🚀 Major Feature Implementations (2025-07-08)

### 1. **Offline-First PWA Architecture**
- **Service Worker** (`/public/service-worker.js`)
  - Full offline functionality with intelligent caching
  - Network-first for API calls, cache-first for assets
  - Automatic cache updates in background
  - Offline page fallback
  
- **IndexedDB Migration** (`/src/lib/db/`)
  - Migrated from localStorage to IndexedDB for better performance
  - Automatic data migration on first load
  - Sync queue for offline actions
  - Type-safe database operations with Dexie

- **Background Sync**
  - Queue offline changes (thrivings, pantry, journals)
  - Automatic sync when connection restored
  - Conflict resolution support

### 2. **Enhanced Mobile UX**
- **Smart Keyboard Handling**
  - Automatic scroll to input on focus
  - Keyboard height detection
  - Input stays visible above keyboard
  - Optimized for both iOS and Android

- **Skeleton Loading States**
  - Custom skeleton components for all views
  - Smooth loading transitions
  - Better perceived performance

- **Offline Indicator**
  - Clear visual feedback when offline
  - Automatic sync status updates
  - Non-intrusive notification style

### 3. **Performance Optimizations**
- **Optimistic UI Updates**
  - Instant feedback for user actions
  - Background sync for data consistency
  - No loading states for local operations

- **Touch Feedback System**
  - Haptic feedback support (when available)
  - Visual feedback for all interactions
  - Native-like button press effects
  - Reduced perceived latency

### 4. **Data Management**
- **Privacy-First Storage**
  - All data stored locally on device
  - No automatic cloud sync
  - Export/import ready architecture
  - Clear data management options

### 5. **Fixed Issues**
- Pantry modal now fully scrollable on all devices
- Keyboard no longer covers input fields
- Smooth transitions between all screens
- Better error handling for offline scenarios

## 🎯 Core Principle: Mobile-First Always

This app is designed as a **mobile-first** application. All development must start with mobile design and progressively enhance for larger screens.

## 📱 Mobile Design Requirements

### Viewport & Breakpoints
- **Mobile**: 320px - 767px (default/base styles)
- **Tablet**: 768px - 1023px (md: prefix)
- **Desktop**: 1024px+ (lg: prefix)
- Always test on iPhone SE (375px) as minimum viable width

### Mobile-First CSS Approach
```css
/* Base styles (mobile) */
.element {
  padding: 1rem;
  font-size: 14px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .element {
    padding: 1.5rem;
    font-size: 16px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .element {
    padding: 2rem;
    font-size: 18px;
  }
}
```

### Tailwind Mobile-First Classes
```jsx
// ✅ CORRECT: Mobile-first approach
<div className="p-4 md:p-6 lg:p-8">
<div className="text-sm md:text-base lg:text-lg">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// ❌ WRONG: Desktop-first approach
<div className="p-8 md:p-6 sm:p-4">
```

## 📏 Mobile Design Guidelines

### Touch Targets
- Minimum touch target size: **44x44px** (Apple HIG)
- Buttons: `min-h-[44px] min-w-[44px]`
- Interactive elements must have adequate spacing: `space-y-3` minimum

### Typography
- Base font size mobile: **14px** minimum
- Line height mobile: **1.5-1.6** for readability
- Heading hierarchy:
  - H1: `text-2xl md:text-3xl lg:text-4xl`
  - H2: `text-xl md:text-2xl lg:text-3xl`
  - H3: `text-lg md:text-xl lg:text-2xl`
  - Body: `text-sm md:text-base`

### Spacing & Padding
- Mobile padding: `p-4` (16px) standard
- Section spacing: `py-8 md:py-12 lg:py-16`
- Card padding: `p-4 md:p-6`
- Never use padding less than `p-3` on mobile

### 🚨 VIEWPORT UNITS ARE MANDATORY - NOT OPTIONAL!
**Every single UI element MUST use viewport units. This is not a suggestion - it's a requirement!**

#### COMMON VIOLATIONS TO FIX:
- Modal popup using `max-w-md` → Use `w-[90vw] max-w-[500px]`
- Button with `px-6` → Use `px-[4vw] max-px-6`
- Text with `text-lg` → Use `text-[min(5vw,1.125rem)]`
- Card with `p-4` → Use `p-[4vw] max-p-4`
- Fixed container widths → Always use `w-[Xvw] max-w-[Ypx]`

#### ❌ ABSOLUTELY FORBIDDEN - These patterns must NEVER appear in code:
```jsx
// VIOLATIONS - DO NOT USE ANY OF THESE:
<div className="w-96 h-96" />  // NO fixed widths/heights
<div className="max-w-md" />  // NO Tailwind size classes without viewport units
<div className="text-2xl" />  // NO fixed text sizes
<div className="p-6" />  // NO fixed padding
<div className="rounded-2xl" />  // Even border radius should scale!
<Modal className="max-w-lg" />  // NO fixed modal widths
<button className="px-4 py-2" />  // NO fixed button padding
```

#### ✅ MANDATORY - Every component MUST follow this pattern:
```jsx
// REQUIRED approach for ALL components:
<div className="w-[80vw] max-w-[400px] h-[40vh] max-h-[300px]" />
<div className="text-[min(4.5vw,1.125rem)]" />  // Scale with viewport
<div className="p-[4vw] max-p-[1.5rem]" />  // Viewport padding
<div className="rounded-[2vw] max-rounded-[1rem]" />  // Even border radius!
<Modal className="w-[90vw] max-w-[500px] h-[80vh] max-h-[600px]" />
<button className="px-[5vw] max-px-[2rem] py-[3vw] max-py-[1rem] text-[min(4vw,1rem)]" />

// Modals MUST be viewport-based:
<div className="fixed inset-0 flex items-center justify-center p-[4vw]">
  <div className="w-[90vw] max-w-[500px] h-auto max-h-[85vh] overflow-y-auto">
    <div className="p-[5vw] max-p-[2rem]">
      <!-- Modal content -->
    </div>
  </div>
</div>
```

#### Viewport Unit Guidelines:
1. **Width**: Use `vw` (viewport width)
   - `w-[80vw]` = 80% of viewport width
   - Always add max constraints: `w-[80vw] max-w-md`

2. **Height**: Use `vh` (viewport height) 
   - `h-[50vh]` = 50% of viewport height
   - Consider dynamic viewport height: `h-[100dvh]`

3. **Text Sizing**: Use `min()` function
   - `text-[min(6vw,2rem)]` = 6% of viewport or 2rem max
   - Ensures readability on all devices

4. **Spacing**: Combine viewport units with max values
   - `p-[5vw] max-p-8` = 5% viewport padding, 2rem max
   - `space-y-[2vh]` = 2% viewport vertical spacing

5. **Safe Boundaries**:
   - Mobile text: `min(4vw, 1rem)` to `min(8vw, 2rem)`
   - Padding: `min(5vw, 2rem)` max
   - Margins: `min(3vh, 1.5rem)` for vertical rhythm

### Navigation
- Mobile menu: Full-screen overlay or slide-out drawer
- Sticky header height: `h-14` on mobile, `h-16` on desktop
- Back buttons prominently placed top-left
- Bottom navigation for primary actions when applicable

### Forms & Inputs
- Full-width inputs on mobile: `w-full`
- Input height: `min-h-[44px]` for easy tapping
- Labels above inputs, not inline
- Show/hide password toggles for password fields
- Number inputs with proper `inputmode` attribute

### Images & Media
- Responsive images: `w-full h-auto`
- Aspect ratios: Use `aspect-video` or `aspect-square`
- Lazy loading: `loading="lazy"` for below-fold images
- Optimize images: Max 100KB for mobile

### Performance
- Code split by route
- Lazy load heavy components
- Minimize JavaScript bundle
- Use CSS transforms for animations
- Avoid heavy shadows on mobile (performance)

## 🎨 Mobile-Specific UI Patterns

### Cards
```jsx
// Mobile-optimized card with viewport units
<div className="rounded-xl bg-white p-[4vw] max-p-6 shadow-sm border border-gray-100 
                md:rounded-2xl md:p-6 md:shadow-md">
  {/* Content */}
</div>
```

### Buttons
```jsx
// Touch-friendly button with viewport-based sizing
<button className="min-h-[44px] px-[6vw] max-px-8 rounded-full 
                   text-[min(4vw,0.875rem)] md:text-base font-medium">
  Tap Me
</button>
```

### Full-Screen Layouts
```jsx
// Proper viewport-based full-screen layout
<div className="h-[100vh] h-[100dvh] w-screen flex flex-col">
  <header className="h-[8vh] min-h-[3.5rem]" />
  <main className="flex-1 overflow-y-auto p-[5vw]" />
  <footer className="h-[10vh] min-h-[4rem]" />
</div>
```

### Responsive Images
```jsx
// Viewport-based image sizing
<div className="relative w-[80vw] h-[40vh] max-w-md max-h-64">
  <Image fill className="object-contain" />
</div>
```

### Modals
- Full-screen on mobile, centered on desktop
- Close button in top-right corner
- Swipe-to-close gesture support
- Maximum height with internal scroll

### Lists
- Single column on mobile
- Adequate spacing between items: `space-y-3`
- Swipe actions for delete/edit
- Pull-to-refresh where applicable

## 🚀 Performance Optimizations

### Critical CSS
- Inline critical CSS for above-fold content
- Defer non-critical styles

### Viewport Meta
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
```

### Touch Optimizations
- Disable touch delays: `touch-action: manipulation`
- Hardware acceleration: `transform: translateZ(0)`
- Smooth scrolling: `-webkit-overflow-scrolling: touch`

## ✅ Mobile Testing Checklist

Before committing any changes:

1. **Responsive Design**
   - [ ] Test on 375px width (iPhone SE)
   - [ ] Test on 390px width (iPhone 12/13/14)
   - [ ] Test on tablet (768px)
   - [ ] Test landscape orientation

2. **Touch Interactions**
   - [ ] All buttons/links have 44px minimum touch target
   - [ ] No hover-only interactions
   - [ ] Swipe gestures work smoothly
   - [ ] Form inputs are easily tappable

3. **Performance**
   - [ ] Page loads under 3 seconds on 3G
   - [ ] Smooth scrolling (60 FPS)
   - [ ] Images optimized and lazy loaded
   - [ ] No layout shifts during load

4. **Accessibility**
   - [ ] Text readable without zooming
   - [ ] Sufficient color contrast
   - [ ] Focus indicators visible
   - [ ] Screen reader compatible

## 🎯 Component-Specific VIEWPORT Requirements

### ALL MODALS (RoutineEditModal, PantryAddModal, etc.)
```jsx
// ❌ WRONG - Current implementation with fixed sizes
<div className="max-w-md">

// ✅ CORRECT - Viewport-based modal
<div className="w-[90vw] max-w-[500px] h-auto max-h-[85vh]">
  <div className="p-[5vw] max-p-[2rem]">
    <h2 className="text-[min(6vw,1.5rem)] mb-[3vw]">
    <button className="w-[12vw] h-[12vw] max-w-[3rem] max-h-[3rem]">
```

### SmartCardChat
- Full-screen: `h-[100vh] h-[100dvh]`
- Input padding: `p-[4vw] max-p-[1rem]`
- Message text: `text-[min(4vw,1rem)]`
- Button padding: `px-[5vw] max-px-[1.5rem]`

### RoutineCreationModal & ALL Form Modals
- Modal width: `w-[95vw] max-w-[600px]`
- Modal padding: `p-[5vw] max-p-[2rem]`
- Input height: `h-[12vw] max-h-[3rem] min-h-[44px]`
- Label text: `text-[min(3.5vw,0.875rem)]`
- Button text: `text-[min(4vw,1rem)]`

### Thrivings/Routines Page
- Card width: `w-[90vw] max-w-[400px]`
- Card padding: `p-[4vw] max-p-[1.5rem]`
- Title text: `text-[min(5vw,1.25rem)]`
- Body text: `text-[min(3.5vw,0.875rem)]`
- Step items: `min-h-[12vw] max-h-[3rem]`

## 🔧 Development Workflow

1. **Start with Mobile**
   - Design and implement for 375px width first
   - Test thoroughly on mobile before adding breakpoints
   - Add tablet/desktop styles progressively

2. **Use Mobile Emulation**
   - Chrome DevTools device emulation
   - Test touch events and gestures
   - Throttle network to 3G for realistic testing

3. **Real Device Testing**
   - Test on actual iOS and Android devices
   - Use BrowserStack for cross-device testing
   - Pay attention to safe areas (notch, home indicator)

## 📝 MANDATORY Code Review Checklist

### VIEWPORT COMPLIANCE (MUST PASS ALL):
- [ ] **NO fixed pixel values** - Every width, height, padding uses viewport units
- [ ] **ALL text uses viewport scaling** - `text-[min(Xvw,Yrem)]` pattern
- [ ] **Modals use viewport dimensions** - `w-[90vw] max-w-[Xpx]`
- [ ] **Buttons/inputs use viewport padding** - `px-[Xvw] py-[Yvw]`
- [ ] **Cards/containers viewport-based** - No `max-w-md`, use `w-[Xvw]`
- [ ] **Even border-radius scales** - `rounded-[Xvw] max-rounded-[Yrem]`

### Additional Requirements:
- [ ] Touch targets meet 44px minimum with viewport units
- [ ] Text readable at `min(3.5vw, 0.875rem)` minimum
- [ ] No desktop-only interactions
- [ ] Tested on 320px-768px viewports

## 🚨 CRITICAL VIOLATIONS - FIX IMMEDIATELY IF FOUND

### VIEWPORT VIOLATIONS (HIGHEST PRIORITY):
1. **ANY fixed width class**: `w-64`, `max-w-md`, `max-w-lg` → MUST use `w-[Xvw] max-w-[Ypx]`
2. **ANY fixed text size**: `text-lg`, `text-xl` → MUST use `text-[min(Xvw,Yrem)]`
3. **ANY fixed padding**: `p-4`, `px-6` → MUST use `p-[Xvw] max-p-[Yrem]`
4. **Modal with Tailwind sizes**: `max-w-md` → MUST use `w-[90vw] max-w-[500px]`
5. **Button without viewport**: `px-4 py-2` → MUST use `px-[4vw] py-[2vw]`

### Other Critical Issues:
6. **Hover-only interactions**: Provide touch alternatives
7. **Text below min(3.5vw, 0.875rem)**: Too small for mobile
8. **Dense touch targets**: Use viewport spacing `space-y-[3vw]`
9. **Non-viewport modals**: ALL modals must scale with viewport

### THE GOLDEN RULE:
**EVERY SINGLE DIMENSION, SPACING, AND TEXT SIZE MUST USE VIEWPORT UNITS!**

Remember: **If it uses fixed pixels, it MUST be refactored before shipping!**

## 🔨 Build Process Instructions

After making any code changes, ALWAYS follow these steps:

1. **Clear npm cache** (to avoid stale dependencies):
   ```bash
   npm cache clean --force
   ```

2. **Run production build** (to catch type and compilation errors):
   ```bash
   npm run build
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

This ensures:
- All TypeScript errors are caught
- Build optimizations are tested
- No runtime errors in production
- Clean dependency resolution

**Important**: Never skip the build step after making changes!

## 🛍️ "I Already Have It" Flow

### Overview
When the assistant recommends supplements, it provides both options to avoid pushing purchases:
- **"I already have [Supplement]"** - Opens pantry modal with pre-filled data
- **"Where to find [Supplement]"** - Opens Amazon search if needed

### Implementation Details
- Assistant returns both `already_have` and `buy` action types for each supplement
- `already_have` buttons appear first (non-commercial approach)
- Context message shows in pantry modal: "Great! Tracking this helps me personalize your wellness routines"
- Pre-fills supplement name, dosage, and timing information

### User Experience
1. User asks about health concern (e.g., "I want to sleep better")
2. Assistant shows supplements with BOTH options
3. If user clicks "I already have it":
   - PantryAddModal opens with pre-filled data
   - Shows helpful context message
   - Saves to pantry for routine personalization
4. If user clicks "Where to find it":
   - Opens Amazon search in new tab
   - No pressure to purchase

### Key Files
- `SmartCardChat.tsx` - Handles `already_have` action type
- `PantryAddModal.tsx` - Shows `contextMessage` prop
- `assistantInstructions.ts` - Updated to provide both options

## 🔄 Routine Adjustment Flow

### Overview
When users have existing routines (thrivings) and mention related health concerns, the assistant suggests adjustments instead of creating new routines.

### Implementation
- Assistant returns `adjust_routine` action type
- Clicking redirects to `/thrivings?id={routineId}&showAdjustment=true`
- Thrivings page auto-opens adjustment editor with pre-filled instructions
- Uses existing `/api/routine/adjust` endpoint

### User Experience
1. User has a sleep routine but says "I still can't sleep well"
2. Assistant suggests: "Adjust Your Sleep Wellness Routine"
3. Click opens thrivings page with adjustment modal
4. Natural language instructions are pre-filled
5. Click "Apply Adjustments" to update routine

## 🔄 Loading Button Component

### Overview
A reusable loading button component (`/components/ui/LoadingButton.tsx`) that provides dynamic loading messages and smooth animations during async operations.

### Features
- **Rotating spinner animation** - Smooth CSS animation that rotates continuously
- **Dynamic loading messages** - Cycles through different messages after 2 seconds
- **Customizable messages** - Pass your own array of loading messages
- **Consistent button size** - Prevents layout shifts during loading
- **Mobile-optimized** - Minimum 44px touch targets, text truncation for small screens

### Usage Example
```jsx
import { LoadingButton } from '@/components/ui/LoadingButton';

<LoadingButton
  onClick={handleCreate}
  isLoading={isCreating}
  className="px-6 py-3 rounded-full bg-primary-text text-white"
  loadingMessages={[
    'Creating...',
    'Analyzing your needs...',
    'Personalizing routine...',
    'Adding wellness wisdom...',
    'Almost ready...'
  ]}
  messageInterval={2500} // Change message every 2.5 seconds
>
  Create Routine
</LoadingButton>
```

### Implementation Details
- Messages start cycling after 2 seconds to avoid flashing for quick operations
- Text is truncated with max-width to prevent button expansion
- Spinner uses `animate-spin` CSS class defined in globals.css
- Button maintains disabled state during loading
- Supports custom spinner colors via `spinnerClassName`

### Used In
- **RoutineCreationModal** - Creating wellness routines with personalized messages
- **JourneyCreationModal** - Creating thriving journals with context-aware messages

## 🔄 TouchCloseButton Component

### Overview
A mobile-optimized close button component (`/components/ui/TouchCloseButton.tsx`) that provides proper touch feedback, haptic feedback, and mobile-first interactions for all modal close actions.

### Features
- **Mobile-First Touch Targets** - Minimum 44x44px touch areas per Apple HIG
- **Haptic Feedback** - Subtle vibration on tap for mobile devices
- **Proper Event Handling** - Includes `stopPropagation()` and `preventDefault()`
- **Responsive Sizing** - Three sizes (sm, md, lg) with viewport-based constraints
- **Multiple Variants** - Default, dark, light variants for different backgrounds
- **Touch Optimizations** - Hardware acceleration, touch-action manipulation
- **Accessibility** - Proper ARIA labels and focus indicators

### Usage Example
```jsx
import { TouchCloseButton } from '@/components/ui/TouchCloseButton';

// Basic usage
<TouchCloseButton onClose={onClose} />

// With size and variant options
<TouchCloseButton 
  onClose={onClose} 
  size="sm"           // sm, md (default), lg
  variant="light"     // default, dark, light
  className="custom-styles"
/>
```

### MANDATORY: Use in ALL Modals
**NEVER create custom close buttons in modals.** Always use TouchCloseButton for:
- Consistent mobile touch experience
- Proper event handling (stopPropagation, preventDefault)
- Haptic feedback on mobile devices
- Accessibility compliance
- Touch target size compliance (min 44px)

### Implementation Pattern
```jsx
// ✅ CORRECT - Always use TouchCloseButton
<div className="absolute top-4 right-4">
  <TouchCloseButton onClose={onClose} size="sm" />
</div>

// ❌ WRONG - Never create custom close buttons
<button onClick={onClose} className="...">
  <X className="w-5 h-5" />
</button>
```

### Size Guidelines
- **sm** (40x40px): Use in compact modals, notification modals
- **md** (44x44px): Default size, use in most modals  
- **lg** (48x48px): Use in large modals, important actions

### Variant Guidelines
- **default**: Use on white/light backgrounds
- **light**: Use on gradient/colored backgrounds
- **dark**: Use on dark backgrounds

### Applied To
- **DynamicJournalModal** - Smart journal modal
- **PantryAddModal** - Add to pantry modal
- **RoutineCreationModal** - Routine creation flow
- **JourneyCreationModal** - Journey creation flow
- **HealthConnectModal** - Health data connection
- **NotificationPermissionModal** - Permission requests

### New Modal Requirements
When creating new modals, ALWAYS:
1. Import TouchCloseButton: `import { TouchCloseButton } from '@/components/ui/TouchCloseButton'`
2. Position absolutely: `<div className="absolute top-4 right-4">`
3. Choose appropriate size and variant
4. Never create custom close buttons

## 🎯 Standardized Modal Component

### Overview
A standardized modal component (`/components/ui/Modal.tsx`) that ALL modals in the app MUST use for consistency, accessibility, and mobile optimization.

### Features
- **Consistent UX** - All modals have the same behavior and styling
- **Built-in Accessibility** - Escape key handling, ARIA attributes, focus management
- **Body Scroll Prevention** - Automatically prevents body scroll when open
- **TouchCloseButton Integration** - Built-in support for mobile-optimized close button
- **Flexible Layout** - Supports custom header and footer components
- **Size Variants** - sm, md, lg, xl, full sizes available
- **Smooth Animations** - Consistent fade-in and scale animations
- **Proper Centering** - Uses flexbox for perfect centering across all devices

### MANDATORY: All New Modals MUST Use This Component
**NEVER create custom modal implementations.** Always use the Modal component:

```jsx
import { Modal } from '@/components/ui/Modal';

// Basic usage
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
>
  {/* Modal content */}
</Modal>

// With custom header and footer
<Modal
  isOpen={isOpen}
  onClose={onClose}
  header={customHeaderComponent}
  footer={customFooterComponent}
  size="lg"
  className="max-w-lg"
>
  {/* Modal content */}
</Modal>
```

### Size Guidelines
- **sm**: Max width 384px - Use for simple confirmations, small forms
- **md**: Max width 448px (default) - Use for most modals
- **lg**: Max width 512px - Use for complex forms, multi-step flows
- **xl**: Max width 576px - Use for large content areas
- **full**: Max width 95vw - Use for full-screen experiences

### Implementation Pattern
```jsx
// ✅ CORRECT - Always use Modal component
import { Modal } from '@/components/ui/Modal';

export function MyNewModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Modal"
      size="md"
    >
      <div className="space-y-4">
        {/* Your modal content */}
      </div>
    </Modal>
  );
}

// ❌ WRONG - Never create custom modal structure
export function MyNewModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="bg-black/50" onClick={onClose} />
      <div className="modal-content">
        {/* Custom implementation */}
      </div>
    </div>
  );
}
```

### Props
- `isOpen` (required): Boolean to control modal visibility
- `onClose` (required): Function called when modal should close
- `title`: String title for the modal header
- `children`: Modal content
- `header`: Custom ReactNode for header (overrides title)
- `footer`: Custom ReactNode for footer
- `size`: Size variant (sm, md, lg, xl, full)
- `className`: Additional CSS classes
- `showCloseButton`: Whether to show close button (default: true)
- `closeOnBackdrop`: Whether clicking backdrop closes modal (default: true)

### Applied To (All Modals Updated)
- **HealthConnectModal** - Health data connection flow
- **JourneyCreationModal** - Journey creation with custom header/footer
- **PantryAddModal** - Pantry item addition
- **RoutineCreationModal** - Multi-step routine creation
- **DynamicJournalModal** - Smart journal with progress bar
- **NotificationPermissionModal** - Permission request flow
- **NotificationSettingsModal** - Settings management

### Benefits
1. **Consistency** - Users get the same experience across all modals
2. **Accessibility** - Built-in keyboard navigation and screen reader support
3. **Performance** - Single implementation to optimize
4. **Maintenance** - Fix bugs or add features in one place
5. **Mobile-First** - Designed for touch interactions from the start

### localStorage and SSR Considerations
When using localStorage in modals, always check if window is defined:
```jsx
useEffect(() => {
  if (typeof window !== 'undefined') {
    const value = localStorage.getItem('key');
    // Use value
  }
}, []);
```

Never access localStorage during render or at module level to avoid SSR errors.

## 📱 Universal Touch Feedback System (REQUIRED FOR ALL INTERACTIVE ELEMENTS)

### 🤖 ATTENTION AI AGENTS - READ THIS FIRST!
**When creating ANY button, link, or clickable element, you MUST:**
1. Use our touch components (Button, TouchLink, Touchable) - NEVER raw HTML
2. Enable `springAnimation` for bouncy feel (0.93 scale)
3. Enable `gradientOverlay` for hover shimmer effects  
4. Enable `cardGlow` for soft shadow depth
5. Include active gradient states (`activeFrom`/`activeTo`)
6. Set `haptic="medium"` for tactile feedback

**Example - EVERY button should look like this:**
```jsx
<Button 
  springAnimation
  gradientOverlay
  cardGlow
  haptic="medium"
  gradient={{
    from: 'rose',
    to: 'burgundy', 
    activeFrom: 'rose/40',
    activeTo: 'burgundy/30'
  }}
>
  Click Me
</Button>
```

### Overview
A comprehensive touch feedback system that provides native app-like interactions with haptic feedback, smooth animations, and proper debouncing. **ALL clickable elements in the app MUST use one of these components** to ensure consistent, premium touch experience.

### THE UNIVERSAL RULE:
**"I still wish we have one component that any click throughout the app can experience that"** - This has been achieved! Use these components for EVERY interactive element.

### Core Components (USE THESE, NOT RAW HTML ELEMENTS)

#### 1. **Button Component** - For ALL button actions
```jsx
import Button, { 
  MenuButton,    // Settings/menu buttons
  CardButton,    // Card-style buttons (prompt templates)
  NativeButton,  // Native app feel buttons
  ConsultationButton, // Expert consultation CTAs
  SoftButton,    // Soft gradient buttons (journal)
  IconButton,    // Icon-only buttons
  FAB           // Floating action buttons
} from '@/components/ui/Button';

// Basic button with all premium features
<Button 
  variant="primary"    // primary, secondary, ghost, danger, gradient, soft, outline
  haptic="medium"      // light, medium, heavy
  cardGlow              // Soft glow effect
  nativePress           // Native app press effect
  gradientOverlay       // Gradient shine on hover
  hoverScale={1.02}     // Scale on hover
  shadow="lg"          // none, sm, md, lg, xl
>
  Click Me
</Button>

// Pre-configured variants
<MenuButton>Settings</MenuButton>
<CardButton>Prompt Template</CardButton>
<NativeButton>Native Feel</NativeButton>
```

#### 2. **TouchLink Component** - For ALL navigation links
```jsx
import { TouchLink } from '@/components/ui/TouchLink';

// Navigation with haptic feedback
<TouchLink 
  href="/page"
  variant="icon"       // default, subtle, icon, button, card
  haptic="medium"      // light, medium, heavy
  cardGlow             // Soft glow effect
  shadow="md"          // boolean or sm, md, lg, xl
  hoverScale={1.02}    // Scale on hover
  nativePress          // Native press effect
>
  <ArrowLeft className="w-5 h-5" />
</TouchLink>
```

#### 3. **Touchable Component** - For custom touchable wrappers
```jsx
import { Touchable } from '@/components/ui/Touchable';

// Make custom elements touchable
<Touchable
  variant="card"      // default, subtle, icon, card, gradient
  haptic="medium"     // light, medium, heavy
  gradient={{          // Optional gradient
    from: 'rose',
    to: 'burgundy'
  }}
  shadow="lg"         // none, sm, md, lg, xl
  scale={0.98}        // Active scale
  onClick={handleClick}
>
  {/* Any content */}
</Touchable>
```

#### 4. **TouchCloseButton Component**
Specialized close button for modals with built-in haptic feedback.

#### 5. **useTouchFeedback Hook**
Low-level hook for custom touch interactions:
```jsx
import { useTouchFeedback } from '@/hooks/useTouchFeedback';

const { touchHandlers, triggerHaptic } = useTouchFeedback({
  hapticStyle: 'medium',
  preventDoubleTap: true
});

<div {...touchHandlers} onClick={triggerHaptic}>
  Custom Touch Element
</div>
```

### Premium Features (Available in ALL Components)
- **Haptic Feedback** - Native vibration on supported devices
- **iOS Haptics API** - Uses native iOS haptic engine when available
- **Double-Tap Prevention** - Prevents accidental zoom on mobile
- **60 FPS Animations** - Hardware-accelerated transforms
- **Natural Debouncing** - Prevents accidental double-clicks
- **Spring Physics** - iOS-style bounce animations
- **Card Glow Effect** - Soft shadow glow (`cardGlow` prop)
- **Gradient Overlay** - Shimmer effect on hover (`gradientOverlay` prop)
- **Native Press** - iOS/Android native button feel (`nativePress` prop)
- **Hover Scale** - Smooth scale on hover (`hoverScale` prop)
- **Touch Ripple** - Material Design ripple (`ripple` prop)

### 🚨 MANDATORY Usage Guidelines for AI Agents

#### CRITICAL RULE FOR ALL AI AGENTS:
When creating ANY interactive element (button, link, clickable div), you MUST use our touch feedback components with ALL premium features enabled. This is NOT optional - it's a core requirement for consistent user experience.

#### ❌ NEVER use raw HTML elements:
```jsx
// WRONG - Never do this!
<button onClick={...}>Click</button>
<a href="...">Link</a>
<div onClick={...}>Clickable</div>
```

#### ✅ ALWAYS use touch components with premium features:
```jsx
// CORRECT - Always include these premium features!
<Button 
  onClick={...}
  springAnimation     // MANDATORY for bouncy feel
  gradientOverlay     // MANDATORY for hover effects
  cardGlow           // MANDATORY for soft glow
>
  Click Me
</Button>

<TouchLink 
  href="..."
  variant="icon"
  haptic="medium"    // MANDATORY haptic feedback
  cardGlow           // MANDATORY for premium feel
  scale={0.9}        // Appropriate scale for the variant
>
  Navigate
</TouchLink>
```

#### Component Selection Guide with MANDATORY Premium Features:

##### For Primary Actions (Submit, Save, Create):
```jsx
<Button 
  variant="gradient"
  springAnimation
  gradientOverlay
  gradient={{
    from: 'rose',
    to: 'burgundy',
    hoverFrom: 'burgundy',
    hoverTo: 'burgundy',
    activeFrom: 'rose/40',      // Active state gradients
    activeTo: 'burgundy/30'
  }}
>
  Save Changes
</Button>
```

##### For Cards and Prompt Templates:
```jsx
<CardButton 
  onClick={handleClick}
  className="p-5"
  // CardButton already includes:
  // - springAnimation ✓
  // - gradientOverlay ✓ 
  // - cardGlow ✓
  // - hoverScale={1.01} ✓
>
  {content}
</CardButton>
```

##### For Navigation Links:
```jsx
<TouchLink 
  href="/page"
  variant="icon"      // or "card" for card-like links
  haptic="medium"
  cardGlow
  shadow="sm"
  scale={0.9}         // Icon buttons need smaller scale
>
  <ArrowLeft className="w-5 h-5" />
</TouchLink>
```

##### For Secondary Actions (Cancel, Back):
```jsx
<SoftButton
  onClick={handleCancel}
  fullWidth
  // SoftButton includes spring animation and gradients
>
  Cancel
</SoftButton>
```

##### For Settings/Menu Buttons:
```jsx
<MenuButton
  onClick={() => router.push('/settings')}
  className="w-11 h-11"
  // MenuButton includes all premium effects
>
  <Menu className="w-5 h-5" />
</MenuButton>
```

### Implementation Guidelines

1. **Always use touch components for primary interactions**
   - Navigation: TouchLink
   - Actions: TouchButton
   - Close/Dismiss: TouchCloseButton

2. **Choose appropriate haptic level**
   - `light`: Subtle interactions, frequent taps
   - `medium`: Standard buttons, navigation (default)
   - `heavy`: Important actions, confirmations

3. **Use correct variant**
   - `touch-feedback`: Standard buttons
   - `touch-feedback-icon`: Icon-only buttons
   - `touch-feedback-subtle`: Secondary elements
   - `native-press`: Primary CTAs

4. **Combine with visual feedback**
   - Always include hover states
   - Use focus indicators for accessibility
   - Consider loading states for async actions

### Example: Updated ActionBar
```jsx
// Now uses TouchLink for haptic feedback
<TouchLink 
  href={backHref}
  onClick={handleBackClick}
  className="action-bar-button"
  variant="icon"
  haptic="medium"
>
  <ArrowLeft className="w-5 h-5" />
</TouchLink>
```

### 🎯 AI Agent Implementation Checklist

When creating ANY new interactive element, ensure:

1. **✓ Spring Animation**: Add `springAnimation` prop for bouncy feel
2. **✓ Gradient Overlay**: Add `gradientOverlay` for hover shimmer
3. **✓ Card Glow**: Add `cardGlow` for soft shadow effects
4. **✓ Active Gradients**: Include `activeFrom/activeTo` in gradient config
5. **✓ Haptic Feedback**: Set appropriate `haptic` level (light/medium/heavy)
6. **✓ Proper Scale**: Use variant-appropriate scale (0.93 for spring, 0.98 default)
7. **✓ Shadow Transitions**: Include shadow prop for depth

### Default Props AI Agents Should ALWAYS Use:

```jsx
// For ANY new button:
<Button
  springAnimation      // ALWAYS include
  gradientOverlay      // ALWAYS include
  cardGlow            // ALWAYS include for premium feel
  haptic="medium"     // Default to medium
  shadow="md"         // Default shadow
  gradient={{         // If using gradient variant
    from: 'color1',
    to: 'color2',
    hoverFrom: 'color1-dark',
    hoverTo: 'color2-dark',
    activeFrom: 'color1/40',   // MUST include active states
    activeTo: 'color2/30'
  }}
>
  Button Text
</Button>

// For ANY new link:
<TouchLink
  haptic="medium"     // ALWAYS include
  cardGlow            // ALWAYS include
  variant="..."       // Choose appropriate variant
  scale={...}         // Variant-specific scale
>
  Link Content
</TouchLink>
```

### Real-World Implementation Examples

#### Settings Menu Button (from home page):
```jsx
<MenuButton
  onClick={() => router.push('/settings')}
  className="w-11 h-11"
>
  <Menu className="w-5 h-5 text-burgundy" />
</MenuButton>
```

#### Prompt Template Cards:
```jsx
<CardButton
  onClick={() => handlePromptClick(template.text)}
  className="p-5"
>
  <div className="flex items-center space-x-4">
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose to-burgundy">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <span className="text-gray-800">{template.text}</span>
  </div>
</CardButton>
```

#### ActionBar Back Button:
```jsx
<TouchLink 
  href={backHref}
  onClick={handleBackClick}
  variant="icon"
  haptic="medium"
  scale={0.9}
  shadow="sm"
  cardGlow
>
  <ArrowLeft className="w-5 h-5" />
</TouchLink>
```

#### Expert Consultation CTA:
```jsx
<ConsultationButton
  onClick={handleBookConsultation}
  className="w-full"
>
  Book Free Consultation
</ConsultationButton>
```

### Performance Notes
- CSS transforms are GPU-accelerated
- Haptic feedback is non-blocking
- Animations use `will-change` for optimization
- Touch events are properly throttled
- All components include `touch-manipulation` to eliminate tap delay
- Spring animations use optimal cubic-bezier curves for 60fps

### 🤖 AI Agent Quick Reference

**EVERY button/link you create MUST have:**
1. Touch feedback component (Button/TouchLink/Touchable)
2. Spring animation or native press effect
3. Gradient overlay for shimmer
4. Card glow for depth
5. Haptic feedback (default: medium)
6. Active state gradients for color changes
7. Proper shadow transitions

**Copy-paste templates for common scenarios:**
```jsx
// Primary CTA
<Button variant="gradient" springAnimation gradientOverlay cardGlow haptic="medium" shadow="lg">

// Secondary button  
<SoftButton fullWidth icon={<Icon />}>

// Navigation
<TouchLink href="..." variant="icon" haptic="medium" cardGlow scale={0.9}>

// Card interaction
<CardButton onClick={...} className="p-5">
```

**Remember: If it's clickable, it MUST have premium touch feedback!**

## 💡 Core Business Model & Chat Assistant Workflow (2025-07-12)

### Business Model Overview
**Revenue**: Supplement affiliate commissions (Amazon)
**Retention**: Daily routine reminders bring users back
**Trust**: Non-pushy approach with "I already have it" option first

### Chat Assistant Conversation Flow
The chat assistant follows a 5-stage progression to maximize both user value and business outcomes:

1. **Build Trust** → Ask questions, understand needs (NO solutions yet)
2. **Educate** → Explain why their issue happens  
3. **Recommend** → Offer supplements AND/OR routines based on preference
4. **Implement** → Drive routine creation immediately after any action
5. **Track** → Follow up on effectiveness

### Key Principles for AI Implementation

#### Stage-Based Responses
- **First mention of health concern**: Questions ONLY, no actionableItems
- **After context gathered**: Education + solutions (supplements/routines)
- **After any user action**: Push routine creation for retention
- **No action but continued chat**: Address their message first, then alternatives

#### Post-Action Strategies
- **Pantry Addition**: "Perfect! Let's create a routine with optimal timing for daily reminders"
- **Buy Click**: "While that ships, here's techniques you can try tonight + routine"
- **Routine Created**: User redirected to /thrivings page (no follow-up needed)
- **Journey Created**: User redirected to journal page (no follow-up needed)

#### Routine-First Mindset
Remember: **Supplements are the hook, but routines are the retention engine**
- Every conversation path should lead to routine creation
- Routines work with OR without supplements
- Daily reminder notifications = daily app opens = retention

#### Smart Adaptations
- User anti-supplement? → Technique-based routine
- User overwhelmed? → Simple 5-minute routine  
- User cost-conscious? → Zero-cost routine
- User ignores suggestions? → Address their actual message first

#### Question Strategy by Context
- **With supplement recommendations**: Experience/preference questions
- **After pantry addition**: Skip questions, go straight to routine
- **After buy click**: "What would help most right now?"
- **No action taken**: "What would you prefer to try first?"

### Implementation Notes
- Assistant uses `supplement_choice` type which auto-generates both buttons
- Response parser ensures "I already have it" always appears first
- Post-action messages are supplement-specific (see postActionMessages.ts)
- Routines handle all timing/scheduling (don't ask about it in chat)