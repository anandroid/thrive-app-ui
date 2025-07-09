# Thrive App - Mobile-First Development Guidelines

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
// Mobile-optimized card
<div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 
                md:rounded-2xl md:p-6 md:shadow-md">
  {/* Content */}
</div>
```

### Buttons
```jsx
// Touch-friendly button
<button className="min-h-[44px] px-6 rounded-full text-sm font-medium
                   md:text-base md:px-8">
  Tap Me
</button>
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

## 🎯 Component-Specific Mobile Guidelines

### SmartCardChat
- Full-screen height on mobile: `h-screen`
- Input fixed at bottom with safe area padding
- Messages scroll independently
- Virtual keyboard doesn't cover input

### RoutineCreationModal
- Full-screen modal on mobile
- Step indicator at top
- Large touch targets for navigation
- Number inputs with number pad

### Routines Page
- Single column card layout on mobile
- Horizontal scroll for routine cards
- Collapsible sections for details
- Sticky action buttons

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

## 📝 Code Review Checklist

- [ ] All new components follow mobile-first approach
- [ ] Touch targets meet 44px minimum
- [ ] Text is readable on small screens
- [ ] Images are optimized for mobile
- [ ] No desktop-only interactions
- [ ] Performance tested on slow connection
- [ ] Accessibility verified on mobile

## 🚨 Common Mobile Pitfalls to Avoid

1. **Fixed widths**: Never use fixed pixel widths
2. **Hover states**: Always provide touch alternatives
3. **Small text**: Keep minimum 14px on mobile
4. **Dense layouts**: Add breathing room for fingers
5. **Heavy animations**: Reduce or disable on mobile
6. **Horizontal scroll**: Avoid except for intentional carousels
7. **Pop-ups**: Use full-screen modals instead

Remember: **If it doesn't work perfectly on mobile, it doesn't ship!**

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