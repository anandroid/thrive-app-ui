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

## 🔐 Environment Variables & Google Cloud Secrets

### 🚨 CRITICAL: Two-Project Architecture
Thrive uses TWO separate ecosystems for development and production:

#### Google Cloud Projects:
- **Development**: `thrive-dev-465922`
- **Production**: `thrive-465618`

#### OpenAI Projects:
- **Development**: `thrive-dev`
- **Production**: `thrive`

**IMPORTANT**: Each project has its own secrets with DIFFERENT values, but uses the SAME environment variable names

### 📋 Complete List of Secrets

#### Core API Keys (Required in BOTH projects)
```bash
# OpenAI
THRIVE_OPENAI_API_KEY               # Main API key for assistants
OPENAI_API_KEY                      # Same as above (SDK requirement)
THRIVE_GEMINI_API_KEY               # Google Gemini API

# Shopify
THRIVE_SHOPIFY_API_KEY
THRIVE_SHOPIFY_API_SECRET_KEY
THRIVE_SHOPIFY_STOREFRONT_API_TOKEN
THRIVE_SHOPIFY_STORE_DOMAIN
```

#### Assistant IDs (Different values per environment!)
```bash
# Multi-Assistant IDs (ALL have different values between dev/prod)
THRIVE_CHAT_ASSISTANT_ID            # Chat wellness assistant
THRIVE_ROUTINE_ASSISTANT_ID         # Routine creation assistant
THRIVE_PANTRY_ASSISTANT_ID          # Pantry/supplement assistant
THRIVE_RECOMMENDATION_ASSISTANT_ID  # Home screen widget assistant
THRIVE_FEED_ASSISTANT_ID            # Community feed moderator

# Legacy (being phased out)
THRIVE_OPENAI_ASSISTANT_ID          # Original single assistant
THRIVE_DISCOVERY_ASSISTANT_ID       # Old discovery assistant (if still exists)
```

#### Public Environment Variables
```bash
# App URLs
NEXT_PUBLIC_APP_URL                 # Main app URL
NEXT_PUBLIC_SHOP_URL                # Shop iframe URL

# Feature Flags
NEXT_PUBLIC_ENABLE_ASSISTANT_FUNCTIONS
NEXT_PUBLIC_ENABLE_EXPERT_CONSULTATION
ENABLE_ASSISTANT_FUNCTIONS
NODE_ENV

# Shopify Public
NEXT_PUBLIC_THRIVE_SHOPIFY_STORE_DOMAIN
```

#### Firebase Configuration (Production Only)
```bash
# Firebase Admin SDK
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```

### 🔄 Secret Management Rules

#### When Adding New Secrets:
1. **ALWAYS add to BOTH projects** (dev and prod) with environment-specific values
2. **Use consistent naming** across both environments
3. **Document in this file immediately**
4. **Update upload-secrets.sh if needed**

#### Creating/Updating Secrets:
```bash
# Add to DEV
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME --data-file=- --project=thrive-dev-465922

# Add to PROD
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME --data-file=- --project=thrive-465618

# Update existing secret
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=- --project=PROJECT_ID
```

### 🤖 OpenAI Assistant Management

#### Two OpenAI Projects:
- **thrive-dev**: Development assistants (use dev API key)
- **thrive**: Production assistants (use prod API key)

#### Creating/Updating Assistants:
```bash
# Development assistants
npm run create-assistants

# Production assistants
npm run create-assistants:prod
```

#### Assistant ID Rules:
1. **NEVER share assistant IDs between environments**
2. **Each environment has 5 separate assistants**
3. **All assistants use the same env var names across environments**
4. **The assistant ID values are different between dev and prod**

### 📝 Deployment
```bash
# Upload all secrets from .env.local to current project
./scripts/upload-secrets.sh

# Deploy to dev
gcloud config set project thrive-dev-465922
gcloud run deploy thrive-app --region=us-central1

# Deploy to prod
gcloud config set project thrive-465618
gcloud run deploy thrive-app --region=us-central1
```

### ✅ Verification Commands
```bash
# List all secrets in dev
gcloud secrets list --project=thrive-dev-465922

# List all secrets in prod
gcloud secrets list --project=thrive-465618

# Compare assistant IDs
for secret in THRIVE_CHAT_ASSISTANT_ID THRIVE_ROUTINE_ASSISTANT_ID THRIVE_PANTRY_ASSISTANT_ID THRIVE_RECOMMENDATION_ASSISTANT_ID; do
  echo "=== $secret ==="
  echo -n "Dev: " && gcloud secrets versions access latest --secret=$secret --project=thrive-dev-465922 2>/dev/null | head -c 20
  echo
  echo -n "Prod: " && gcloud secrets versions access latest --secret=$secret --project=thrive-465618 2>/dev/null | head -c 20
  echo
  echo
done
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

## 🏭 Production Code Standards

### Error Handling Patterns
```typescript
// ✅ CORRECT - Production-ready error handling
export async function POST(request: Request) {
  const traceId = crypto.randomUUID();
  
  try {
    // Validate request
    const body = await request.json().catch(() => {
      throw new Error('Invalid JSON body');
    });
    
    // Log request (without sensitive data)
    console.log(`[${traceId}] API request received`, {
      endpoint: request.url,
      timestamp: new Date().toISOString()
    });
    
    // Business logic with proper error context
    const result = await processRequest(body);
    
    return NextResponse.json(result);
  } catch (error) {
    // Log full error internally
    console.error(`[${traceId}] API error:`, error);
    
    // Return sanitized error to client
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 
      ? 'Internal server error' 
      : error.message;
      
    return NextResponse.json(
      { error: message, traceId },
      { status: statusCode }
    );
  }
}
```

### Environment-Specific Configuration
```typescript
// ✅ CORRECT - Environment-aware configuration
import { getEnvConfig } from '@/lib/config';

const config = getEnvConfig();

// Use environment-specific values
const assistantId = config.isDev 
  ? process.env.THRIVE_DEV_FEED_ASSISTANT_ID
  : process.env.THRIVE_FEED_ASSISTANT_ID;

// API URLs change per environment
const apiUrl = config.isDev
  ? 'https://api-dev.thrive.com'
  : 'https://api.thrive.com';

// Feature flags per environment
if (config.features.enableBetaFeatures) {
  // Beta features only in dev
}
```

### Secret Management Workflow
```bash
# BEFORE making any secret changes:
# 1. Document the secret purpose
# 2. Add to BOTH dev and prod
# 3. Update Claude.md immediately
# 4. Test in dev first

# Safe secret update pattern
./scripts/backup-secrets.sh          # Backup current secrets
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=- --project=thrive-dev-465922
./scripts/test-secret.sh SECRET_NAME # Verify it works
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=- --project=thrive-465618
```

## 🧪 Testing Requirements

### Test File Structure
```typescript
// Every feature MUST have tests
// Location: __tests__/[feature-path].test.ts

// Example: src/services/openai/assistant/chatService.ts
// Test: __tests__/services/openai/assistant/chatService.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ChatService } from '@/services/openai/assistant/chatService';

describe('ChatService', () => {
  let service: ChatService;
  
  beforeEach(() => {
    // Mock external dependencies
    jest.mock('openai');
    service = new ChatService();
  });
  
  describe('production scenarios', () => {
    it('handles API rate limits gracefully', async () => {
      // Test rate limit handling
    });
    
    it('falls back when primary service fails', async () => {
      // Test fallback mechanisms
    });
    
    it('sanitizes user input for security', async () => {
      // Test XSS/injection prevention
    });
  });
});
```

### Component Testing Pattern
```typescript
// Mobile-first component tests
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('provides haptic feedback on mobile', () => {
    const hapticMock = jest.fn();
    window.navigator.vibrate = hapticMock;
    
    render(<Button haptic="medium">Test</Button>);
    fireEvent.click(screen.getByText('Test'));
    
    expect(hapticMock).toHaveBeenCalledWith(10);
  });
  
  it('scales correctly on different viewports', () => {
    // Test viewport-based sizing
  });
});
```

## 🔄 Reusable Component Framework

### Component Creation Checklist
```typescript
// When creating ANY new component:
// 1. Check if similar component exists
// 2. Use composition over duplication
// 3. Follow mobile-first viewport pattern
// 4. Add to component library
// 5. Document props and usage

// Pattern: components/ui/[ComponentName]/
// ├── index.tsx          (main component)
// ├── [ComponentName].test.tsx
// ├── [ComponentName].stories.tsx (if applicable)
// └── README.md          (auto-generated)
```

### Composition Pattern
```typescript
// ✅ CORRECT - Composable components
import { BaseCard } from '@/components/ui/BaseCard';
import { TouchFeedback } from '@/components/ui/TouchFeedback';

export const InteractiveCard = ({ children, ...props }) => (
  <TouchFeedback haptic="medium" scale={0.98}>
    <BaseCard {...props}>
      {children}
    </BaseCard>
  </TouchFeedback>
);

// ❌ WRONG - Duplicating functionality
export const MySpecialCard = () => {
  // Re-implementing touch feedback and card styles
};
```

## 📝 Automatic Documentation

### Feature Documentation Workflow
```bash
# After implementing any feature:
# 1. Auto-generate docs from code
npm run generate-docs

# 2. Update features manifest
# Location: docs/features/manifest.json
{
  "features": [
    {
      "name": "Pantry Management",
      "implemented": "2025-07-24",
      "files": [
        "src/services/pantry/",
        "components/pantry/"
      ],
      "description": "User supplement tracking and recommendations",
      "assistants": ["pantry"],
      "endpoints": ["/api/pantry/*"]
    }
  ]
}
```

### Code Annotation for Auto-docs
```typescript
/**
 * @feature Pantry Management
 * @description Manages user's supplement inventory
 * @assistant pantry
 * @endpoint /api/pantry/items
 */
export class PantryService {
  // Implementation
}
```

## 🧹 Code Cleanup Procedures

### Module Deprecation Pattern
```typescript
// Step 1: Mark as deprecated
/**
 * @deprecated Since v2.0 - Use MultiAssistantService instead
 * @removeBy 2025-08-01
 */
export class OldAssistantService {
  constructor() {
    console.warn('OldAssistantService is deprecated');
  }
}

// Step 2: Track in deprecation log
// Location: docs/deprecations.md
```

### Cleanup Checklist
```bash
# Run weekly cleanup check
npm run cleanup:check

# This will:
# 1. Find unused exports
# 2. Identify deprecated code past removal date
# 3. Find orphaned test files
# 4. Detect duplicate implementations

# Safe removal process
npm run cleanup:analyze [file/module]
# Shows all dependencies and usage
```

## 🔐 Production Deployment Checklist

### Pre-deployment Verification
```bash
# MANDATORY before ANY production deployment:

# 1. Run full test suite
npm run test:all

# 2. Check environment variables
npm run verify:env

# 3. Verify assistant IDs are different
npm run verify:assistants

# 4. Security audit
npm audit

# 5. Build verification
npm run build:prod

# 6. Lighthouse mobile test
npm run lighthouse:mobile
```

### Post-deployment Monitoring
```typescript
// All production errors MUST include:
// 1. Trace ID for debugging
// 2. User context (anonymized)
// 3. Environment info
// 4. Performance metrics

// Monitoring dashboard: https://console.cloud.google.com/monitoring
```

## 🎯 Development Priorities

### When implementing features, ALWAYS:
1. **Think Mobile-First**: Every feature starts at 320px
2. **Consider Both Environments**: Dev behavior might differ from prod
3. **Write Tests First**: TDD for complex logic
4. **Use Existing Patterns**: Check for similar implementations
5. **Document Changes**: Update relevant docs immediately
6. **Clean As You Go**: Remove old code when replacing

### Performance Standards
- Page load: < 2s on 3G
- Interaction delay: < 100ms
- Bundle size increase: < 10KB per feature
- Memory usage: Monitor for leaks in long sessions