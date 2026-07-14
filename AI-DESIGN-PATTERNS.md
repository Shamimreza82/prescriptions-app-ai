# AI Design Pattern Reference — MedicLoude

Use this file for **all future UI implementations** so new code visually matches the existing app without re-exploring.

---

## 1. CSS Utility Classes (from `globals.css`)

| Class | What it does |
|-------|-------------|
| `premium-card` | White card, border, soft shadow, hover shadow |
| `premium-card-static` | Same as premium-card but no hover effect |
| `gradient-primary` | Blue → Indigo gradient (buttons, avatars, headers) |
| `gradient-success` | Emerald gradient |
| `gradient-warning` | Amber → Orange gradient |
| `gradient-danger` | Rose → Red gradient |
| `gradient-info` | Violet → Purple gradient |
| `text-gradient` | Blue → Indigo text gradient |
| `premium-input` | Styled input with focus ring |
| `shadow-soft` / `shadow-medium` / `shadow-strong` / `shadow-glow` | Shadow sizes |
| `animate-fade-in` / `animate-slide-up` / `animate-scale-in` | Animations |
| `glass` / `glass-strong` | Frosted glass effect |
| `badge-gradient-blue` / `-green` / `-purple` | Colored badge pills |

---

## 2. Info Card Pattern (use EVERYWHERE)

**This is the most common pattern in the app.** Copy-paste this structure:

```tsx
<div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  </div>
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
  </div>
</div>
```

**Grid container:** `grid grid-cols-2 gap-3` (or `grid-cols-3`)
**When mapping:** Use a flat array of `{ icon, label, value }` objects and `.map()`.

---

## 3. Typography Conventions

| Purpose | Classes |
|---------|---------|
| Page title | `text-2xl font-bold text-gray-900 dark:text-white` |
| Section heading | `text-base font-semibold text-gray-900 dark:text-white` (in CardTitle) |
| Card label | `text-xs text-muted-foreground` |
| Card value | `text-sm font-medium text-gray-900 dark:text-white` |
| Patient/ID text | `text-sm text-muted-foreground font-mono` |
| Tiny uppercase label | `text-[10px] font-bold text-gray-400 uppercase` (used in prescription form) |
| Body text in cards | `text-sm text-gray-700 dark:text-gray-300` |

---

## 4. Reusable Components (in `@/components/ui/`)

| Component | Import | Notes |
|-----------|--------|-------|
| Button | `@/components/ui/button` | Variants: `default`, `ghost`, `outline`, `destructive`; sizes: `sm`, `icon`, `lg` |
| Card | `@/components/ui/card` | Use `Card`, `CardHeader`, `CardTitle`, `CardContent` |
| Badge | `@/components/ui/badge` | Variants: `default`, `secondary`, `destructive` |
| Dialog | `@/components/ui/dialog` | Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` |
| Table | `@/components/ui/table` | For data tables |
| Pagination | `@/components/ui/pagination` | With page/totalPages/total/onPageChange props |
| Input | `@/components/ui/input` | Styled input |
| Select | `@/components/ui/select` | Styled select |
| Label | `@/components/ui/label` | Form label |
| FilterSelect | `@/components/ui/filter-select` | Filter dropdown |
| MultiSelect | `@/components/ui/multi-select` | Multi-selection |

---

## 5. Component Usage Patterns

### Button
```tsx
// Primary CTA — use gradient-primary
<Button className="h-10 rounded-xl gradient-primary hover:opacity-90 text-white shadow-glow">
  <Plus className="h-4 w-4 mr-2" />New Prescription
</Button>

// Ghost (back button, icon actions)
<Button variant="ghost" size="icon" className="rounded-xl">
  <ArrowLeft className="h-5 w-5" />
</Button>

// Outline
<Button variant="outline" size="sm" className="rounded-lg">
  <Plus className="h-4 w-4 mr-1" /> New
</Button>
```

### Dialog
```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 animate-fade-in">
      {/* content */}
    </div>
  </DialogContent>
</Dialog>
```

### Avatar Initial
```tsx
<div className="w-10 h-10 rounded-xl gradient-primary shadow-glow flex items-center justify-center text-white font-bold text-lg">
  {name.charAt(0)}
</div>
```
Use `rounded-full` for circular avatars, `rounded-xl` for rectangular. Size: `w-10` (header), `w-16` (dialog).

### Badge
```tsx
<Badge variant="destructive" className="rounded-lg">Allergy text</Badge>
```

### Loading / Empty / Error States
```tsx
// Loading skeleton
<div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />

// Loading spinner
<div className="flex justify-center py-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
</div>

// Empty state
<div className="text-center py-12 px-6">
  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
    <FileText className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No data yet</p>
  <p className="text-xs text-muted-foreground">Description</p>
</div>
```

### Premium Table
```tsx
<div className="overflow-x-auto">
  <table className="premium-table">
    <thead>
      <tr>
        <th>Column</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id}>
          <td>value</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 6. Layout Patterns

### Page Wrapper
```tsx
<div className="space-y-6 animate-fade-in">
```

### Header Row
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
```

### Two-Column Grid (with sidebar)
```tsx
<div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
  <div className="col-span-12 lg:col-span-6">
    {/* main content */}
  </div>
  <div className="col-span-12 lg:col-span-6">
    {/* sidebar */}
  </div>
</div>
```

### Info Cards Grid (patient info, stats)
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
  {/* use the info card pattern above */}
</div>
```

### Premium Card Container
```tsx
<Card className="premium-card">
  <CardHeader><CardTitle className="text-base">Section Title</CardTitle></CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

---

## 7. Common Class Combinations (at a glance)

| Use case | Classes |
|----------|---------|
| Info card container | `rounded-xl bg-gray-50 dark:bg-gray-900/50` |
| Icon wrapper inside info card | `p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30` |
| Primary gradient button | `gradient-primary hover:opacity-90 text-white shadow-glow` |
| Inline page header | `flex flex-col sm:flex-row sm:items-center justify-between gap-4` |
| Card hover effect | `transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-blue-950/20` |
| Back button | `variant="ghost" size="icon" className="rounded-xl"` |
| Small outline | `variant="outline" size="sm" className="rounded-lg"` |
| Muted helper text | `text-xs text-muted-foreground` |
| Font mono for IDs | `font-mono text-sm text-muted-foreground` |

---

## 8. API Response Format

```ts
// Success
{ success: true, data: ... }
// Success (paginated)
{ success: true, data: [...], total: number, page: number, limit: number }
// Error
{ success: false, message: "..." }
```

---

## 9. Dark Mode

Every component must support dark mode. Standard dark variants:
- `dark:bg-gray-900` or `dark:bg-gray-950` for cards
- `dark:bg-gray-900/50` or `dark:bg-gray-800/50` for card backgrounds
- `dark:border-gray-800` or `dark:border-gray-700` for borders
- `dark:text-white` / `dark:text-gray-300` for text
- `dark:bg-blue-950/30` / `dark:bg-blue-950/20` for icon wrappers
- `dark:text-blue-400` / `dark:text-blue-300` for icon colors
