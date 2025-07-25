# Thrive App - Mobile-First Development Guidelines

## 🚨 ABSOLUTE CRITICAL RULES - VIOLATE THESE AND THE APP BREAKS

### 1. NO PIXELS EVER - ONLY VIEWPORT UNITS
**This is a MOBILE APP. We NEVER use pixel values. EVER.**
- ❌ FORBIDDEN: `w-96`, `p-6`, `text-2xl`, `max-w-md`, `h-[400px]`, `px-4`
- ✅ REQUIRED: `w-[80vw]`, `p-[4vw]`, `text-[min(5vw,1.25rem)]`, `max-w-[90vw]`
- **EVERY dimension MUST use vw/vh with max constraints**
- If you write ANY pixel value, the app will not scale properly on mobile devices

### 2. Touch Feedback is MANDATORY 
- NEVER use `<button>`, `<a>`, or `<div onClick>`
- ALWAYS use Button/TouchLink/Touchable components
- MUST include: springAnimation, gradientOverlay, cardGlow, haptic="medium"

### 3. AppLayout for ALL Pages
- NEVER create custom layouts
- ALWAYS use AppLayout component - it handles keyboard, safe areas, headers

### 4. Build & Test After EVERY Change
```bash
npm run build  # MUST pass before committing
npm test      # Run tests for modified components
```

## 📱 Project Architecture

### Multi-App Ecosystem
- **thrive-app** (this repo): Main web app (Next.js)
- **ThriveAppNative**: React Native wrapper that hosts web app in WebView
- **thrive-shop**: Separate shop app embedded via iframe (deployed to Cloud Run)
  - Embedded at `/shop` page using `EmbeddedShop` component
  - Communicates via postMessage API
  - Configured via `NEXT_PUBLIC_SHOP_URL` env var

### Navigation Structure
- **Home** (`/`): Dashboard with dynamic recommendation widgets
- **Discover** (`/discover`): Community posts with AI moderation (Firebase)
- **Shop** (`/shop`): Embedded supplement shop (iframe to thrive-shop)
- **Settings** (`/settings`): User preferences and app settings

## 🤖 Multi-Assistant Architecture

### Chat Assistant (`gpt-4.1-nano`)
**Purpose**: Initial wellness conversations and trust building
- Follows 5-stage flow: Trust → Educate → Recommend → Implement → Track
- ONLY asks questions on first health mention
- Drives users to routine creation for retention
- Returns structured JSON with quick_reply questions (never paragraphs)

### Routine Assistant (`gpt-4.1-mini`)
**Purpose**: Creates personalized wellness routines (thrivings)
- NEVER uses generic responses - everything personalized
- Creates smart journal templates with mobile inputs (sliders, emoji pickers)
- Handles: sleep, stress, pain, medication tracking
- Adjusts existing routines based on feedback

### Pantry Assistant (`gpt-4.1-nano`)
**Purpose**: Supplement recommendations and pantry management
- Evidence-based suggestions by category (sleep, stress, pain, energy, digestive)
- Tracks user's existing supplements
- Manages dosages, timing, interactions
- Quality and storage guidance

### Recommendation Assistant (`gpt-4.1-nano`)
**Purpose**: Dynamic home screen widgets
- Generates React.createElement code (NOT JSX)
- Analyzes journals, routines, chat history for personalization
- Widget types: actions, purchases, appointments, content, reminders, insights
- Updates based on time of day and user activity

## 📐 Viewport-First Development (MANDATORY)

### The Golden Rule
**EVERY dimension MUST use viewport units. NO EXCEPTIONS.**

```jsx
// ✅ CORRECT - This is the ONLY way
<div className="w-[90vw] max-w-[500px] p-[5vw] max-p-[2rem]">
  <h1 className="text-[min(6vw,1.5rem)] mb-[3vw]">Title</h1>
  <button className="px-[6vw] max-px-[2rem] py-[3vw] max-py-[1rem] min-h-[11vw] max-h-[2.75rem]">
    Click Me
  </button>
</div>

// ❌ WRONG - NEVER do this (NO PIXELS!)
<div className="w-96 p-6">
  <h1 className="text-2xl mb-4">Title</h1>
  <button className="px-6 py-3 h-11">Click Me</button>
</div>
```

### Universal Spacing System (USE THESE EXACT VALUES)
- Card padding: `p-[min(5vw,1.25rem)]`
- Container padding: `px-[min(4vw,1rem)]`
- Section spacing: `py-[min(8vw,2rem)]`
- Icon containers: `w-[min(11vw,2.75rem)] h-[min(11vw,2.75rem)]`
- Body text: `text-[min(3.75vw,0.9375rem)]`
- Touch targets: `min-h-[min(11vw,2.75rem)]` (44px mobile requirement)

### Modal Sizing
```jsx
// ALL modals MUST follow this pattern
<Modal className="w-[90vw] max-w-[500px] h-auto max-h-[85vh]">
  <div className="p-[5vw] max-p-[2rem]">
    {/* Content with viewport-based spacing */}
  </div>
</Modal>
```

## 🏗️ Page Layout Architecture

### AppLayout Component (MANDATORY)
```tsx
import { AppLayout } from '@/components/layout/AppLayout';

export default function MyPage() {
  return (
    <AppLayout
      header={{
        title: "Page Title",
        showBackButton: true,
        backHref: "/",
        rightElement: <MenuButton />
      }}
      stickyBottom={<ChatEditor />}  // Optional - for keyboard-aware inputs
    >
      {/* Your content - AppLayout handles all spacing/keyboard/safe areas */}
    </AppLayout>
  );
}
```

### CSS Classes (Handled by AppLayout)
- `.app-layout`: 100dvh flex container
- `.app-header`: Sticky top header
- `.app-content`: Scrollable area (gets padding-bottom from React Native)
- `.app-sticky-bottom`: Keyboard-aware bottom elements

## 🎨 Touch Feedback System

### Button Component (Primary Actions)
```jsx
import Button from '@/components/ui/Button';

<Button 
  variant="gradient"
  springAnimation      // REQUIRED - bouncy feel
  gradientOverlay      // REQUIRED - hover shimmer
  cardGlow            // REQUIRED - depth shadow
  haptic="medium"     // REQUIRED - vibration
  gradient={{
    from: 'rose',
    to: 'burgundy',
    activeFrom: 'rose/40',    // REQUIRED - pressed state
    activeTo: 'burgundy/30'
  }}
>
  Save Changes
</Button>
```

### Pre-configured Variants
```jsx
import { 
  MenuButton,          // Settings/menu icons
  CardButton,          // Prompt cards, tappable cards
  SoftButton,          // Secondary actions
  ConsultationButton,  // Expert CTAs
  IconButton,          // Icon-only buttons
  FAB                 // Floating action buttons
} from '@/components/ui/Button';
```

### TouchLink (Navigation)
```jsx
import { TouchLink } from '@/components/ui/TouchLink';

<TouchLink 
  href="/page"
  variant="icon"
  haptic="medium"
  cardGlow
  scale={0.9}         // Icon links need smaller scale
>
  <ArrowLeft className="w-5 h-5" />
</TouchLink>
```

## 💡 Core Business Logic

### Revenue Model
- **Monetization**: Supplement affiliate commissions (Amazon)
- **Retention**: Daily routine reminders = daily app opens
- **Trust**: "I already have it" option always appears first

### Chat Flow Strategy
1. **First health mention**: Questions ONLY (no solutions)
2. **After context**: Education + actionableItems  
3. **User takes action**: Immediately push routine creation
4. **Routine created**: Redirect to /thrivings
5. **No action**: Address their message, then offer alternatives

### Key Features

#### Authentication (Firebase Auth)
- **Phone Authentication** (Primary): SMS OTP verification
- **Google Sign-In**: Web popup & native bridge
- **Apple Sign-In**: OAuth provider & native bridge
- **Development Mode**: Auto-uses `demo-user-id` when Firebase not configured
- **Components**: `PhoneAuthModal`, `AuthContext`
- **Hooks**: `useAuth()`, `useRequireAuth()`
- **API Auth**: Bearer token in headers, verified server-side

#### Discovery (Community)
- Firebase Firestore for posts/interactions
- AI moderation via OpenAI assistant
- Anonymous or profile posting
- Real-time approval tracking
- `/api/discovery/` endpoints

#### Shop Integration
- Embedded iframe to thrive-shop app
- PostMessage for pantry data sharing
- Separate Cloud Run deployment
- Configured via NEXT_PUBLIC_SHOP_URL

#### Voice Input (Mobile)
- Web Speech API unreliable on mobile
- Solution: Prompt users to use keyboard voice button
- Special handling for iOS Safari dictation
- Debug mode: `?isDebug=true`

#### Supplement Flow
- Both options ALWAYS shown:
  1. "I already have [Supplement]" → PantryAddModal
  2. "Where to find [Supplement]" → Amazon search
- Client auto-generates missing options

#### Routine Adjustments
- `adjust_routine` action type
- Redirects to `/thrivings?id={id}&showAdjustment=true`
- Natural language adjustment instructions

## 🔐 Environment Variables

### Required
```bash
THRIVE_OPENAI_API_KEY=sk-...
OPENAI_API_KEY=sk-...               # Same as above (SDK requirement)
THRIVE_OPENAI_ASSISTANT_ID=asst_... 

# Multi-Assistant IDs
THRIVE_CHAT_ASSISTANT_ID=asst_...
THRIVE_ROUTINE_ASSISTANT_ID=asst_...
THRIVE_PANTRY_ASSISTANT_ID=asst_...
THRIVE_RECOMMENDATION_ASSISTANT_ID=asst_...

# Shop Integration
NEXT_PUBLIC_SHOP_URL=https://shop.example.com

# Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Deployment
```bash
./scripts/upload-secrets.sh  # Uploads to Google Cloud
```

### API Routes - CRITICAL
```typescript
// ✅ CORRECT - Access env vars inside handler
export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ❌ WRONG - Module level breaks build
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

## 📱 React Native WebView Integration

### Web App (Already Implemented)
- Viewport meta: `viewport-fit="cover"`
- CSS sticky positioning for keyboard
- Safe area insets: `env(safe-area-inset-*)`
- Pure CSS solution - no JS keyboard hacks

### ThriveAppNative Configuration
```xml
<!-- Android: MainActivity -->
android:windowSoftInputMode="adjustResize"

<!-- iOS: Info.plist -->
<key>KeyboardDisplayRequiresUserAction</key><false/>
```

### Keyboard Handling (Native Side)
```javascript
webView.injectJavaScript(`
  document.querySelector('.app-content').style.paddingBottom = '${keyboardHeight}px';
`);
```

## 📁 Key Component Locations

- **Touch System**: `/components/ui/Button.tsx`, `/components/ui/TouchLink.tsx`
- **Layout**: `/components/layout/AppLayout.tsx`
- **Assistants**: `/src/services/openai/assistant/team/`
- **Instructions**: `/src/assistants/instructions/`
- **Shop**: `/components/features/EmbeddedShop.tsx`
- **Discovery**: `/app/discover/`, `/app/api/discovery/`
- **Auth**: `/components/auth/PhoneAuthModal.tsx`, `/src/contexts/AuthContext.tsx`

## ✅ Development Checklist

### Before EVERY Commit
1. [ ] Run `npm run build` - MUST pass
2. [ ] Run `npm test` for modified components
3. [ ] Test on 375px width (iPhone SE)
4. [ ] Verify NO pixel values used
5. [ ] Check all buttons use touch components

### For New Features
1. [ ] Mobile-first design (320px base)
2. [ ] Viewport units for ALL dimensions
3. [ ] AppLayout for page structure
4. [ ] Touch feedback on interactions
5. [ ] Test with keyboard open

### For Modals
1. [ ] Use Modal component
2. [ ] Include TouchCloseButton
3. [ ] Viewport-based sizing
4. [ ] Test scroll behavior

## 🛠️ Common Patterns

### Full-Width Mobile Button
```jsx
<Button 
  className="w-full"
  springAnimation gradientOverlay cardGlow haptic="medium"
  gradient={{from: 'rose', to: 'burgundy', activeFrom: 'rose/40', activeTo: 'burgundy/30'}}
>
  Continue
</Button>
```

### Responsive Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-[min(4vw,1rem)]">
  {items.map(item => (
    <CardButton key={item.id} className="p-[min(5vw,1.25rem)]">
      {/* Card content */}
    </CardButton>
  ))}
</div>
```

### Mobile-First Form
```jsx
<form className="space-y-[min(4vw,1rem)]">
  <Input 
    label="Name"
    className="w-full min-h-[min(11vw,2.75rem)]"
  />
  <Textarea 
    label="Details"
    className="w-full min-h-[min(20vw,5rem)]"
  />
</form>
```

## 🔄 Recent Updates

### Discovery Feature (2025-07-20)
- Anonymous posting with AI moderation
- Firestore collections: discovery_posts, discovery_interactions
- Real-time approval tracking

### Assistant Structure (2025-07-17)
- Questions MUST use quick_reply JSON format
- NEVER embed questions in paragraphs
- All questions must be tappable options

### Touch Feedback (2025-07-14)
- Premium animations on ALL buttons
- IconButton scale increased to 0.93
- ActionBar enhanced with touch effects

### AppLayout Mandate (2025-07-14)
- Replaces all legacy patterns
- Consistent keyboard handling
- Required for ALL pages

### Enhanced Shop System (2025-07-24)
- Multi-vendor support (Thrive + affiliate partners)
- Admin dashboard at `/admin` for product/vendor management
- Conditional CTAs: "Add to Cart" for Thrive, "Buy from [Brand]" for affiliates
- Firestore collections: vendors, products, categories, affiliate_clicks
- Affiliate click tracking with conversion attribution
- Ready for Shopify Storefront API integration
- Mobile-first product cards with touch feedback