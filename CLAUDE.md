# Thrive App - Mobile-First Development Guidelines

## 🎯 WebView Keyboard Handling Solution

### The Problem
WebView environments (React Native WebView) have persistent issues with keyboard handling where:
- Input fields get covered by the keyboard
- Standard solutions like `visualViewport` API don't work reliably
- CSS viewport units behave differently
- Each platform (iOS/Android) has different quirks

### The Solution: Use Our Custom Input Components
We've created keyboard-aware Input and Textarea components that automatically handle all keyboard issues in WebView.

#### For ALL Text Inputs in the App:
```typescript
// ❌ DON'T use regular inputs
<input type="text" value={value} onChange={...} />
<textarea value={value} onChange={...} />

// ✅ DO use our keyboard-aware components
import { Input, Textarea } from '@/components/ui/form-inputs';

<Input 
  value={value} 
  onChange={(e) => setValue(e.target.value)}
  label="Name"
  placeholder="Enter name..."
  error={errors.name}
/>

<Textarea 
  value={notes} 
  onChange={(e) => setNotes(e.target.value)}
  label="Notes"
  rows={4}
/>
```

#### Features:
- **Automatic keyboard handling** - Works in both WebView and regular browsers
- **Consistent styling** - Uses viewport units for mobile-first design
- **Built-in validation** - Error and helper text support
- **Type safety** - Full TypeScript support
- **No manual setup** - Just import and use

#### Creating New Forms:
When creating new forms or modals with text inputs:
1. Always import from `@/components/ui/form-inputs`
2. Use `Input` for single-line text fields
3. Use `Textarea` for multi-line text fields
4. These components handle ALL keyboard issues automatically

#### For Special Cases (Chat, Editors):
If you need custom input behavior (like ChatEditor), use the hook directly:
```typescript
import { useKeyboardAwareInput } from '@/hooks/useKeyboardAwareInput';

const { handleFocus } = useKeyboardAwareInput();

<input onFocus={handleFocus} />
```

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