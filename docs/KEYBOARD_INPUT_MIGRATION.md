# Migrating to Keyboard-Aware Inputs

We've created common Input and Textarea components that automatically handle keyboard behavior in WebView. Here's how to migrate your existing forms:

## The New Components

### Input Component
```tsx
import { Input } from '@/components/ui/form-inputs';

<Input 
  label="Item Name"
  placeholder="Enter item name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={errors.name}
  helperText="This will be displayed in your pantry"
/>
```

### Textarea Component
```tsx
import { Textarea } from '@/components/ui/form-inputs';

<Textarea 
  label="Notes"
  placeholder="Add any notes..."
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={4}
  error={errors.notes}
/>
```

## Migration Examples

### Before (Regular input):
```tsx
<input
  type="text"
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  placeholder="e.g., Vitamin D3"
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose/30"
/>
```

### After (Keyboard-aware Input):
```tsx
import { Input } from '@/components/ui/form-inputs';

<Input
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  placeholder="e.g., Vitamin D3"
/>
```

### Before (Regular textarea):
```tsx
<textarea
  value={formData.notes}
  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
  placeholder="Add notes..."
  rows={3}
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose/30 resize-none"
/>
```

### After (Keyboard-aware Textarea):
```tsx
import { Textarea } from '@/components/ui/form-inputs';

<Textarea
  value={formData.notes}
  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
  placeholder="Add notes..."
  rows={3}
/>
```

## Features

1. **Automatic Keyboard Handling**: Focuses and scrolls input into view in WebView
2. **Consistent Styling**: Uses viewport units for mobile-first design
3. **Built-in Validation**: Error and helper text support
4. **Accessibility**: Proper labels and ARIA attributes
5. **Type Safety**: Full TypeScript support with proper prop types

## Customization

You can still pass custom classes and all standard input/textarea props:

```tsx
<Input
  type="email"
  required
  autoComplete="email"
  className="mt-2" // Additional classes
  style={{ backgroundColor: '#f5f5f5' }} // Custom styles
/>
```

## Where to Use

Replace ALL instances of:
- `<input type="text" />`
- `<input type="email" />`
- `<input type="password" />`
- `<input type="number" />`
- `<input type="tel" />`
- `<textarea />`

With the new components in:
- Modal forms (PantryAddModal, RoutineCreationModal, etc.)
- Page forms (Settings, Profile, etc.)
- Search inputs
- Chat inputs (except specialized ones like ChatEditor)
- Any other text input fields

## Benefits

1. **No More Keyboard Issues**: Automatically handles WebView keyboard problems
2. **Consistent UX**: All inputs behave the same way
3. **Less Code**: No need to add keyboard handling to each input
4. **Mobile-First**: Proper viewport-based sizing
5. **Maintainable**: Single source of truth for input behavior