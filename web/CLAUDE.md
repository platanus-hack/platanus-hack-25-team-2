# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RecordAI is a facial recognition system website built with React.js, Vite, and Tailwind CSS. The site features a 3D product showcase using Gaussian Splat rendering for smart glasses, with a distinctive terminal/technical aesthetic throughout. RecordAI provides real-time facial recognition and cognitive accessibility for social events, helping people remember faces, names, and context when memory fails. Target audience includes event attendees, professionals in networking scenarios, and those seeking cognitive assistance.

## Development Commands

### Setup
```bash
# Use correct Node.js version (v20 as specified in .nvmrc)
nvm use

# Install dependencies
npm install
```

### Development
```bash
# Start development server (runs on http://localhost:5173/)
npm run dev

# Alternative: Use the startup script
./start-dev.sh
```

### Build & Preview
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Linting
```bash
# Run ESLint
npm run lint
```

## Architecture

### Component Structure
The application follows a single-page architecture with section-based navigation:

- **App.jsx**: Root component that orchestrates the entire page layout
  - Wraps everything in `TerminalScreenWrapper` for consistent terminal styling
  - Manages loading state with `LoadingScreen` (1.5s delay)
  - Sections: home, product, about, team, testimonials, cross-platform

### Key Components

- **ProductShowcase.jsx**: Container for 3D viewer with technical UI frame
- **SplatViewer.jsx**: 3D renderer using React Three Fiber and Gaussian Splat format
  - Lazy loads when visible using IntersectionObserver
  - Handles WebGL context loss by remounting Canvas
  - Loads `/lentes_modelo3d.splat` from public directory
- **Team.jsx**: Displays 5 team members in a horizontal grid (lg:grid-cols-5)
  - Uses flexbox layout to align social icons at the same height across all cards
  - Team data imported from `src/data/team.js`
  - Modern LinkedIn/Instagram-style cards with profile images
  - Social media icons (LinkedIn, Instagram, Twitter/X, GitHub)
- **Testimonials.jsx**: Carousel-based testimonials with staggered animations
  - Data imported from `src/data/testimonials.js`
  - Auto-playing carousel (5s interval) showing 3 testimonials at a time
- **CrossPlatformSection.jsx**: Modern visual device grid showcasing cross-platform compatibility
  - 2x2 grid of device cards (Mobile, Desktop, Tablet, Cloud)
  - Central AR glasses hub with modern SVG icons
  - Replaced ASCII art with modern visual UI
- **TerminalScreenWrapper.jsx**: Provides terminal/CRT aesthetic to entire app
- **LoadingScreen.jsx**: Initial loading animation

### Data Layer
Structured data is separated into `src/data/` directory:
- **team.js**: Team member data (5 members with images, roles, bios, social links)
- **testimonials.js**: User testimonial data (6 testimonials with avatars, clearance levels)

### UI Components (src/components/ui/)
Custom reusable components built with Radix UI primitives:
- avatar.jsx, testimonial-card.jsx, testimonials-with-marquee.jsx

### Styling System

**Terminal Aesthetic Theme**:
The entire site maintains a consistent terminal/technical aesthetic:
- Black backgrounds with white/gray text
- Monospace fonts (Fira Code, VT323, Courier New)
- Technical labels and system info overlays
- Grid patterns and corner markers
- ASCII-style borders and frames

**Color Palette** (defined in tailwind.config.js):
- Brand colors: `brand-yellow`, `brand-lime`, `brand-green`, `brand-dark-green`
- Terminal colors: `terminal-black`, `terminal-phosphor`, `terminal-amber` with dim variants
- shadcn/ui color system using CSS variables

**Custom Utilities**:
- Text shadow glows: `.text-shadow-glow`, `.text-shadow-phosphor`, `.text-shadow-amber`
- Terminal shadows: `shadow-terminal`, `shadow-scanline`
- Custom animations: `animate-marquee` for testimonials, `fadeInUp` for staggered content

**Typography**:
- `font-mono`: Fira Code, VT323, Courier New
- `font-terminal`: VT323-first stack for authentic terminal look

### Path Aliases
- `@/` maps to `./src/` (configured in vite.config.js and jsconfig.json)

### 3D Model System
- Uses Gaussian Splatting format (.splat) for high-quality 3D rendering
- Model file: `public/lentes_modelo3d.splat` (456KB)
- React Three Fiber for WebGL rendering
- OrbitControls with auto-rotation enabled
- Intersection Observer for lazy loading (performance optimization)
- WebGL context loss recovery implemented

### Node Version Management
This project requires Node.js v20.x, managed via NVM. The `.nvmrc` file enforces this version. Always run `nvm use` before development.

## Common Development Patterns

### Adding New Team Members
Team data is centralized in `src/data/team.js`. To add a new member:
1. Add team member photo to `public/` directory
2. Add new member object to the `teamMembers` array in `src/data/team.js`
3. Include: name, role, id, clearance, bio, status, terminal_id, image path, and social links
4. Team component automatically renders all members in a 5-column grid on desktop

### Working with Testimonials
Testimonial data is in `src/data/testimonials.js`. Each testimonial includes:
- Author info (name, handle, id, clearance level, avatar URL)
- Testimonial text (uppercase for terminal aesthetic)
- Timestamp and verification status

### Adding New Sections
1. Create component in `src/components/`
2. Import and add section to App.jsx with unique id attribute
3. Update Navbar.jsx if navigation link needed
4. Follow terminal aesthetic with appropriate styling (see below)

### Working with 3D Models
- Models must be in .splat format (Gaussian Splat)
- Place in `public/` directory
- Reference with leading slash (e.g., `/model.splat`)
- Adjust camera position and controls in SplatViewer.jsx

### Styling Conventions
- **Maintain Terminal Aesthetic**: Use black backgrounds, white/gray text, monospace fonts
- Use Tailwind utility classes
- Apply terminal theme colors for consistency
- Use `font-mono` or `font-terminal` for text
- Add glow effects with custom text-shadow utilities
- Include technical labels (e.g., `[MODULE_01.exe]`, `STATUS: ACTIVE`)
- Use corner markers on important containers
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

### Button Styling
All primary buttons use a consistent sliding fill animation:
```jsx
className="group relative bg-transparent border-2 border-white text-white px-8 py-4 font-mono text-sm tracking-wider hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 uppercase overflow-hidden"
```
With inner animated div:
```jsx
<div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-10"></div>
```

### Component Layout Patterns

**Team Card Layout** (flexbox alignment pattern):
```jsx
// Card wrapper must be flex container
<div className="flex flex-col">
  <div className="aspect-square">{/* Image */}</div>
  <div className="flex flex-col flex-1">
    <div className="flex-grow">{/* Content that expands */}</div>
    <div className="mt-auto">{/* Content that sticks to bottom */}</div>
  </div>
</div>
```

This pattern ensures elements like social icons align at the same height across cards with varying content lengths.

### Component Organization
- Page-level components: `src/components/`
- Reusable UI primitives: `src/components/ui/`
- Data files: `src/data/`
- Utilities: `src/lib/utils.js`
- Assets: `src/assets/`
- Team member images: `public/` (with proper naming)

## Important Notes

- The terminal aesthetic is a core design element - maintain consistency across all new components
- 3D viewer uses performance optimizations (lazy loading, context recovery)
- Loading screen is intentionally delayed 1.5s for UX effect
- All components are functional (React hooks-based)
- ESLint configured to allow uppercase constants without unused-vars warnings
- Team section uses 5-column grid on desktop (lg:grid-cols-5) to display all members in one row
- Social icons must align at bottom of cards using flexbox patterns
- Modern visual UI with SVG icons preferred over ASCII art for device representations
- Data is separated into `src/data/` for easier content management
