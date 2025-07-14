# Unified Layout Structure for Keyboard Handling

## Problem
Different pages have different layout structures, making it difficult to handle keyboard animations consistently in the React Native WebView.

## Current Issues
1. Home page uses custom header and `chat-simple-layout` class
2. Chat page manages its own layout entirely
3. Different content area selectors across pages
4. Inconsistent keyboard handling approaches

## Proposed Solution

### 1. Standardize All Pages to Use AppLayout

All pages should use the same AppLayout structure:

```tsx
<AppLayout 
  header={{ 
    title: "Page Title",
    showBackButton: true 
  }}
  stickyBottom={inputComponent} // Optional
>
  <div className="page-content">
    {/* Page specific content */}
  </div>
</AppLayout>
```

### 2. Consistent CSS Structure

Every page will have:
```
.app-layout (flex container, 100dvh)
  ├── .app-header (sticky top, stays in place)
  └── .app-content (flex-1, scrollable)
       ├── .page-content (actual page content)
       └── .app-sticky-bottom (optional, for inputs)
```

### 3. Keyboard Handling Strategy

The React Native WebView will:
1. Add padding-bottom to `.app-content` when keyboard shows
2. This pushes content up while header stays fixed
3. Works consistently across all pages

### 4. Required Changes

#### Home Page (app/page.tsx)
- Remove custom header, use standard AppLayout header prop
- Remove `chat-simple-layout` class
- Structure content properly within AppLayout

#### Chat Page (app/chat/[threadId]/page.tsx)  
- Wrap SmartCardChat in AppLayout
- Let AppLayout handle the header
- Ensure chat content uses `.app-content` class

#### React Native (App.tsx)
Simplify to just:
```javascript
// On keyboard show
document.querySelector('.app-content').style.paddingBottom = `${keyboardHeight}px`;

// On keyboard hide  
document.querySelector('.app-content').style.paddingBottom = '0px';
```

### 5. Benefits

1. **Consistency**: All pages behave the same way
2. **Simplicity**: One solution for all pages
3. **Performance**: CSS transitions handle animations smoothly
4. **Maintainability**: New pages automatically work correctly
5. **Scalability**: Easy to add new pages with proper keyboard handling

### 6. Migration Steps

1. Update home page to use standard AppLayout header
2. Wrap chat page in AppLayout
3. Ensure all pages use `.app-content` for scrollable area
4. Simplify React Native keyboard handling code
5. Test across all pages

### 7. CSS Classes to Standardize

```css
/* Required on all pages */
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  /* Header stays in place */
}

.app-content {
  flex: 1;
  overflow-y: auto;
  /* This gets padding-bottom for keyboard */
  transition: padding-bottom 250ms cubic-bezier(0.25, 0.1, 0.25, 1);
}

.app-sticky-bottom {
  position: sticky;
  bottom: 0;
  /* Input areas stick to keyboard */
}
```

This unified approach ensures that:
- Headers always stay at the top
- Content scrolls properly
- Keyboard pushes only the content area
- Consistent behavior across all pages