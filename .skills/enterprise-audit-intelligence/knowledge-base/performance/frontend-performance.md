# Frontend Performance — Knowledge Base

> **Category**: Performance → Frontend
> **Mandatory Load**: Load for frontend and performance audit categories
> **Version**: v1.0

---

## FE-PERF-001: Unoptimised Bundle Size

**Confidence**: 88 | **Stability**: Evolving | **Frequency**: Very Common

### Detection Logic
- Single JavaScript bundle > 500KB parsed (not gzipped)
- No code splitting configured (entire app in one bundle)
- `import * as _ from 'lodash'` — importing full library for 1-2 functions
- No tree shaking in build config
- Large libraries imported without checking bundle impact (moment.js, etc.)
- `next.config.js` or `vite.config.js` with no bundle optimisation

### Root Cause Pattern
Development prioritises getting things working. Bundle size not measured. "It's fast on my machine" — developer is on gigabit fibre, user is on mobile 4G.

### Risk Pattern
- 3G mobile: 500KB JS = 10+ seconds before interactive
- Search ranking impact (Core Web Vitals — LCP, FID, CLS)
- High bounce rate on slow connections
- Battery drain on mobile (JS parsing is CPU-intensive)

### Detection Commands
```bash
# Next.js — bundle analysis
npm install @next/bundle-analyzer
ANALYZE=true npm run build

# Vite
npm install rollup-plugin-visualizer
# add to vite.config: visualizer({ open: true })

# General
npx source-map-explorer 'build/static/js/*.js'

# Check what you're importing from lodash
grep -rn "from 'lodash'" src/ --include="*.js" --include="*.ts"
```

### Prevention Checklist
- [ ] Bundle analyser in CI — alert if main bundle > 200KB parsed
- [ ] Route-based code splitting (each page is a separate chunk)
- [ ] Heavy libraries: import only what you use (named imports)
- [ ] Replace moment.js with date-fns or dayjs (3x smaller)
- [ ] Images served as WebP, sized correctly, lazy-loaded
- [ ] Third-party scripts (analytics, chat) loaded async, not blocking

### Remediation Strategy
```javascript
// BEFORE — imports entire lodash (~70KB)
import _ from 'lodash';
const result = _.groupBy(items, 'category');

// AFTER — imports only groupBy (~3KB)
import groupBy from 'lodash/groupBy';
const result = groupBy(items, 'category');

// Or use native:
const result = items.reduce((acc, item) => {
  (acc[item.category] ??= []).push(item);
  return acc;
}, {});

// Route-based code splitting (React)
import { lazy, Suspense } from 'react';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Each route loads its own chunk — users only download what they visit
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/analytics" element={<Analytics />} />
  </Routes>
</Suspense>
```

---

## FE-PERF-002: Render Performance Issues

**Confidence**: 85 | **Stability**: Evolving | **Frequency**: Very Common

### Detection Logic
- React components re-rendering on every parent render (no memoisation)
- Expensive calculations in render body (no `useMemo`)
- New object/array/function created in every render passed as prop
- List items rendered without stable `key` props
- Large lists rendered without virtualisation (100+ items in DOM)
- `useEffect` with no dependency array (runs on every render)

### Root Cause Pattern
React's rendering model misunderstood. Works fine with small datasets. Becomes visibly laggy with real data at scale.

### Risk Pattern
- 60fps drops to < 30fps → visible jank → user perceives app as broken
- CPU spike on each state update → battery drain on mobile
- 1000-item list renders 1000 DOM nodes → scroll jank

### Remediation Strategy
```javascript
// Memoised component — only re-renders if props change
const ProductCard = React.memo(({ product, onAddToCart }) => {
  return <div>...</div>;
});

// Stable callback reference — prevents child re-render
const handleAddToCart = useCallback((productId) => {
  dispatch(addToCart(productId));
}, [dispatch]); // only recreated if dispatch changes

// Expensive calculation — only recomputed when dependency changes
const filteredProducts = useMemo(
  () => products.filter(p => p.category === selectedCategory && p.price <= maxPrice),
  [products, selectedCategory, maxPrice]
);

// Virtualised list — only renders visible items (100k items, 10 in DOM)
import { FixedSizeList } from 'react-window';

const ProductList = ({ products }) => (
  <FixedSizeList
    height={600}
    itemCount={products.length}
    itemSize={80}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <ProductCard product={products[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

---

## FE-PERF-003: Waterfall API Requests

**Confidence**: 87 | **Stability**: Permanent | **Frequency**: High

### Detection Logic
- Sequential `await fetch()` calls that could be parallel
- `useEffect` that fetches user, then fetches user's orders in a second effect
- Page makes 8+ API calls on load
- API calls waiting for parent data that could be fetched in parallel
- No request deduplication (same endpoint called multiple times simultaneously)

### Root Cause Pattern
`async/await` makes sequential code look clean. Developers write naturally sequential code without considering parallelism. Each await adds its network round-trip time to page load.

### Risk Pattern
- 5 sequential 200ms calls = 1000ms minimum before page is usable
- Same 5 calls in parallel = 200ms (the slowest one)
- Mobile on poor network: 5× worse

### Remediation Strategy
```javascript
// BEFORE — sequential waterfall (1000ms+)
const user = await fetch('/api/user').then(r => r.json());
const orders = await fetch('/api/orders').then(r => r.json());
const notifications = await fetch('/api/notifications').then(r => r.json());
const preferences = await fetch('/api/preferences').then(r => r.json());

// AFTER — parallel (time of slowest single call)
const [user, orders, notifications, preferences] = await Promise.all([
  fetch('/api/user').then(r => r.json()),
  fetch('/api/orders').then(r => r.json()),
  fetch('/api/notifications').then(r => r.json()),
  fetch('/api/preferences').then(r => r.json()),
]);

// React Query — deduplication + caching + background refresh
import { useQuery } from '@tanstack/react-query';

// Called in 5 components simultaneously → only 1 actual HTTP request
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  staleTime: 5 * 60 * 1000, // consider fresh for 5 minutes
});
```

---

## FE-PERF-004: Images Not Optimised

**Confidence**: 84 | **Stability**: Evolving | **Frequency**: Extremely Common

### Detection Logic
- Images served as PNG/JPEG when WebP/AVIF available
- Images not sized for viewport (4000px image displayed at 400px)
- No `loading="lazy"` on below-the-fold images
- No `width` and `height` attributes (causes layout shift → poor CLS score)
- Images not served from CDN
- SVGs not optimised (exported from Figma with unnecessary metadata)

### Root Cause Pattern
Images treated as static assets. Optimisation not part of the content workflow. "It looks fine to me" — developer on fast machine with fast connection.

### Risk Pattern
- Largest Contentful Paint (LCP) failure → Google ranking impact
- Cumulative Layout Shift (CLS) failure from missing image dimensions
- Mobile data costs for users on metered connections
- 2× slower page load on mobile from unoptimised images

### Prevention Checklist
- [ ] All images served as WebP (or AVIF for modern browsers)
- [ ] Images sized to the maximum display size (not original dimensions)
- [ ] `loading="lazy"` on all below-the-fold images
- [ ] `width` and `height` always specified (prevents layout shift)
- [ ] Images served from CDN with appropriate cache headers
- [ ] Next.js: use `<Image />` component (handles all of above automatically)

### Remediation Strategy
```jsx
// BEFORE — raw img tag
<img src="/hero.png" alt="Hero" />

// AFTER — Next.js optimised image
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero banner"
  width={1200}
  height={600}
  priority          // preload for above-the-fold
  placeholder="blur"
/>

// Below the fold
<Image
  src="/product.jpg"
  alt="Product"
  width={400}
  height={300}
  loading="lazy"    // default in Next.js Image
/>
```

---

## FE-PERF-005: No Frontend Caching Strategy

**Confidence**: 82 | **Stability**: Evolving | **Frequency**: High

### Detection Logic
- API responses not cached client-side (same data fetched on every navigation)
- No service worker for offline capability or cache-first strategy
- Static assets (JS, CSS) not cache-busted on deploy (stale files served)
- `Cache-Control: no-cache` on all responses including static assets
- React Query / SWR not used (no stale-while-revalidate pattern)

### Prevention Checklist
- [ ] Static assets: `Cache-Control: public, max-age=31536000, immutable` (content-hashed filenames)
- [ ] API responses: `Cache-Control: private, max-age=0, must-revalidate`
- [ ] React Query / SWR for client-side data caching and revalidation
- [ ] Stale-while-revalidate for non-critical data (show cached, refresh in background)
- [ ] Service worker for critical assets offline caching (PWA if applicable)

```javascript
// React Query — stale-while-revalidate pattern
const { data: products, isLoading } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
  staleTime: 2 * 60 * 1000,    // show cached for 2 minutes without refetch
  gcTime: 10 * 60 * 1000,      // keep in cache for 10 minutes
  refetchOnWindowFocus: true,   // refresh when user returns to tab
});
```
