# SVG Optimization Strategy for Mobile

## Current Situation
The SVG files in `/public/illustrations/` are large (2-4MB each) because they contain embedded PNG images as base64 data. This is not ideal for mobile performance on 4G connections.

## Implemented Solutions

### 1. Replaced PNG with SVG Files
- Updated all components to use `.svg` instead of `.png` files
- Updated service worker to cache SVG files
- Deleted original PNG files

### 2. Created OptimizedImage Component
Located at `/components/ui/OptimizedImage.tsx`, this component provides:
- **Lazy loading**: Images load only when near viewport (50px margin)
- **Loading states**: Shows skeleton placeholder while loading
- **Error handling**: Displays fallback icon if image fails to load
- **Priority loading**: First/critical images can bypass lazy loading
- **Size optimization**: Proper sizing hints for better performance

### 3. Performance Features
- Intersection Observer for efficient lazy loading
- Placeholder skeletons to prevent layout shifts
- Prioritized loading for above-the-fold content
- Responsive sizing with `sizes` attribute

## Usage Example
```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage';

<OptimizedImage
  src="/illustrations/companion.svg"
  alt="Wellness companion"
  width={400}
  height={400}
  priority={false} // Only true for above-fold images
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

## Further Optimization Recommendations

### 1. Convert SVGs to Proper Vector Format
The current SVGs contain embedded PNG data. For true optimization:
- Recreate illustrations as actual vector graphics
- Use SVG optimization tools like SVGO
- Target <50KB per illustration

### 2. Alternative Approaches
- **Progressive Loading**: Load low-quality placeholder first
- **WebP/AVIF**: Convert to modern image formats (50-80% smaller)
- **CSS Illustrations**: Use CSS for simple graphics
- **Sprite Sheets**: Combine multiple small icons
- **CDN**: Serve images from a CDN with automatic optimization

### 3. Mobile-Specific Optimizations
- Serve smaller images on mobile devices
- Use responsive images with `srcset`
- Implement bandwidth detection
- Cache aggressively with service worker

## Performance Impact
- Initial load: Images load on-demand, reducing initial bundle
- Subsequent loads: Service worker caches for offline access
- Memory usage: Only visible images are loaded into memory
- Network: Lazy loading reduces bandwidth usage

## Monitoring
Track performance with:
- Lighthouse scores
- Core Web Vitals (LCP, CLS)
- Real user monitoring
- Network waterfall analysis