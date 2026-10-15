# MASTER PROMPT — BUILD VISIONTWIN PROFESSIONAL FRONTEND

You are a senior frontend engineer, UI/UX designer, creative web developer, and Three.js specialist.

Build a complete, highly professional, modern, responsive, interactive, and visually impressive frontend for my project named **VisionTwin**.

## 1. PROJECT OVERVIEW

VisionTwin is an AI-powered Digital Twin and Smart Energy Analysis web application.

Users can:
- Register and log in.
- Create and manage room or building projects.
- Upload room videos for AI-based appliance and electrical fitting detection.
- View AI analysis results, including detected appliances, switches, sockets, and other objects.
- View estimated appliance energy consumption and electricity costs.
- Explore an interactive 3D Digital Twin of their room.
- Simulate energy-saving scenarios.
- Receive AI-generated recommendations to reduce electricity consumption.
- Generate and download energy analysis reports.
- Configure electricity tariffs and user preferences.

The frontend must look and feel like a premium, professionally designed SaaS application.

## 2. MANDATORY TECHNOLOGY STACK

Use only the following technologies:

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Bootstrap 5
- Three.js for interactive 3D Digital Twin visualization
- Chart.js for interactive charts
- Lucide Icons or Bootstrap Icons
- CSS animations and transitions
- Intersection Observer API for scroll-triggered animations
- Fetch API for backend communication

Do NOT use React, Angular, Vue, Next.js, or another frontend framework.

Use modular JavaScript with ES modules, clean code, reusable components, and a maintainable folder structure.

## 3. DESIGN DIRECTION

Create a premium futuristic AI + Smart Energy + Digital Twin design.

Visual inspiration:
- Apple-level minimalism
- Linear's polished dashboard experience
- Vercel's clean layout
- Stripe's professional SaaS design
- Modern smart-home control dashboards
- Premium 3D technology product websites

### Color palette

Use a sophisticated dark theme as the primary design.

Suggested colors:
- Main background: #080D19
- Secondary background: #101827
- Card background: #151F30
- Primary accent: #6366F1
- Secondary accent: #06B6D4
- Energy accent: #10B981
- Primary text: #F8FAFC
- Secondary text: #94A3B8
- Border: #253247

Use subtle gradients, soft glows, elegant shadows, and carefully controlled glassmorphism.

Also implement a polished light theme with a working theme toggle.

Use CSS variables for all theme tokens.

### Typography

Use a modern, clean font such as Inter or Plus Jakarta Sans.

Create a consistent typography system with responsive headings, readable paragraphs, balanced line heights, and appropriate spacing.

### Design requirements

- Beautiful page layouts
- Professional spacing and alignment
- Rounded cards and buttons
- Subtle gradients
- Premium icons
- Elegant hover effects
- Animated statistics
- Interactive charts
- Skeleton loading states
- Toast notifications
- Modal dialogs
- Custom empty states
- Helpful error states
- Responsive tables
- Professional forms
- Smooth navigation
- Mobile-friendly menus
- Consistent design across every page

Avoid clutter, excessive gradients, distracting animations, and inconsistent styling.

## 4. EXACT FRONTEND FILE STRUCTURE

Use the following structure exactly. Do not rename, delete, or merge files.

frontend/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── projects.html
├── project-details.html
├── upload.html
├── analysis.html
├── devices.html
├── energy-analysis.html
├── digital-twin.html
├── recommendations.html
├── reports.html
├── settings.html
├── 404.html
│
├── partials/
│   ├── navbar.html
│   ├── sidebar.html
│   ├── footer.html
│   ├── loading.html
│   ├── modal.html
│   └── toast.html
│
├── assets/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── models/
│
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── upload.css
│   ├── analysis.css
│   ├── energy.css
│   ├── digital-twin.css
│   ├── recommendations.css
│   ├── reports.css
│   └── responsive.css
│
├── js/
│   ├── config/
│   │   └── app-config.js
│   ├── core/
│   │   ├── api-client.js
│   │   ├── auth.js
│   │   ├── route-guard.js
│   │   ├── error-handler.js
│   │   ├── validation.js
│   │   └── ui.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── project.service.js
│   │   ├── upload.service.js
│   │   ├── analysis.service.js
│   │   ├── device.service.js
│   │   ├── energy.service.js
│   │   ├── scenario.service.js
│   │   ├── recommendation.service.js
│   │   ├── report.service.js
│   │   ├── settings.service.js
│   │   └── digital-twin.service.js
│   ├── components/
│   │   ├── navbar.js
│   │   ├── sidebar.js
│   │   ├── device-card.js
│   │   ├── metric-card.js
│   │   ├── chart-renderer.js
│   │   ├── data-table.js
│   │   ├── status-badge.js
│   │   └── confirmation-dialog.js
│   ├── pages/
│   │   ├── login.page.js
│   │   ├── register.page.js
│   │   ├── dashboard.page.js
│   │   ├── projects.page.js
│   │   ├── project-details.page.js
│   │   ├── upload.page.js
│   │   ├── analysis.page.js
│   │   ├── devices.page.js
│   │   ├── energy-analysis.page.js
│   │   ├── recommendations.page.js
│   │   ├── reports.page.js
│   │   └── settings.page.js
│   ├── upload/
│   │   ├── video-validator.js
│   │   ├── video-preview.js
│   │   └── upload-progress.js
│   ├── analysis/
│   │   ├── job-poller.js
│   │   ├── detection-overlay.js
│   │   ├── result-normalizer.js
│   │   └── summary-renderer.js
│   ├── energy/
│   │   ├── energy-calculator.js
│   │   ├── energy-charts.js
│   │   └── unit-formatter.js
│   ├── digital-twin/
│   │   ├── scene-manager.js
│   │   ├── renderer.js
│   │   ├── camera-controls.js
│   │   ├── room-builder.js
│   │   ├── appliance-models.js
│   │   ├── appliance-placement.js
│   │   ├── lighting.js
│   │   ├── interaction.js
│   │   ├── scene-editor.js
│   │   ├── energy-visualization.js
│   │   └── scenario-view.js
│   └── utils/
│       ├── format-date.js
│       ├── format-number.js
│       ├── debounce.js
│       └── download.js
│
└── vendor/
    ├── bootstrap/
    ├── three/
    └── chart.js/

Vendor folders are optional storage locations for locally hosted libraries. If using CDNs, document that choice.

## 5. IMPLEMENT ALL 15 HTML PAGES

### index.html — Landing page

Create a stunning SaaS landing page.

Include:
- Transparent sticky navigation
- Professional VisionTwin logo
- Animated hero section
- Headline: "See Your Space. Understand Your Energy."
- Supporting product description
- Get Started and Explore Demo buttons
- Interactive room or Digital Twin preview
- Animated energy metrics
- How It Works section
- AI Detection feature section
- Digital Twin feature section
- Energy Analytics section
- AI Recommendations section
- Product dashboard preview
- FAQ section
- Professional footer

Add beautiful scroll-triggered animations and responsive layouts.

### login.html and register.html

Create premium authentication interfaces.

Include:
- Split-screen desktop layout
- Elegant branded illustration
- Floating-label inputs
- Password visibility toggle
- Real-time form validation
- Password strength indicator for registration
- Loading button states
- Clear validation errors
- Accessible labels and keyboard navigation
- Links between login and registration

Do not implement insecure fake authentication as production authentication.

### dashboard.html

Create a professional analytics dashboard.

Include:
- Collapsible sidebar
- Top navbar with search and profile menu
- Welcome section
- Total Projects card
- Detected Devices card
- Estimated Monthly Energy card
- Estimated Monthly Electricity Cost card
- Energy consumption chart
- Appliance usage chart
- Recent projects
- Recent AI analysis activity
- Energy-saving recommendations preview
- Quick action buttons

Use realistic, clearly labeled sample data in demo mode.

### projects.html

Include:
- Responsive project cards
- Grid and list views
- Search and filters
- Create project modal
- Edit project modal
- Delete confirmation
- Project status indicators
- Empty state
- Project details navigation

### project-details.html

Include:
- Project overview
- Room information
- Uploaded videos
- Analysis history
- Detected device summary
- Energy summary
- Open Digital Twin button
- Upload new video button
- Edit project details

### upload.html

Build a polished video upload interface.

Include:
- Drag-and-drop upload zone
- Browse files button
- Supported file format display
- File size validation
- Video preview
- Upload progress bar
- Cancel upload action where supported
- File metadata
- Upload success/error feedback
- Start Analysis button

Do not pretend an upload succeeded without a real backend response.

### analysis.html

Include:
- Analysis progress interface
- Job status indicator
- Detected object summary
- Detection results table
- Detection bounding-box preview when frame images and coordinates are available
- Appliance counts
- Switch and socket counts
- Confidence scores
- Low-confidence warning
- View Devices button
- View Energy Analysis button

Display real results when available, otherwise clearly labeled demo results.

### devices.html

Include:
- Appliance cards
- Device images or icons
- Device name
- Device category
- Estimated power rating
- Verification status
- Search and filtering
- Edit device modal
- Device details panel
- Bulk selection where appropriate

### energy-analysis.html

Create an advanced analytics dashboard.

Include:
- Estimated daily kWh
- Estimated monthly kWh
- Estimated monthly cost
- Carbon emissions estimate
- Appliance energy breakdown
- Interactive line chart
- Bar chart
- Doughnut chart
- Tariff configuration
- Runtime assumption editing
- Energy scenario comparison
- Potential savings indicators

Show calculation assumptions and units clearly.

### digital-twin.html

This is one of the most important pages.

Build a real interactive Three.js room visualization.

Include:
- 3D room with floor and walls
- Room dimensions
- Appliance models
- Camera rotation
- Zoom and pan
- Object selection
- Appliance information panel
- Device placement controls
- Room dimension editor
- Energy usage visualization
- Energy-saving scenario preview
- Reset camera button
- Save scene button

Use Three.js OrbitControls and appropriate WebGL rendering practices.

Create simple procedural appliance models when external models are unavailable.

Ensure the 3D scene is usable on desktop and mobile.

### recommendations.html

Include:
- AI recommendation cards
- Recommendation categories
- Priority labels
- Estimated savings
- Suggested actions
- Device associations
- Filters
- Feedback actions
- Apply-to-scenario button

Clearly distinguish generated recommendations from verified calculations.

### reports.html

Include:
- Reports listing
- Search and filters
- Report details
- Generate report button
- Download PDF action
- Download CSV action
- Report status
- Empty state

Connect downloads to actual backend files when available.

### settings.html

Include:
- Profile settings
- Electricity tariff configuration
- Currency and unit preferences
- Theme settings
- Notification preferences
- Password change interface
- Save and reset buttons
- Validation and confirmation feedback

### 404.html

Create a visually attractive custom error page with a return-home button.

## 6. ANIMATIONS AND TRANSITIONS

Use professional, smooth animations throughout the application.

Implement:
- Smooth page-entry animations
- Fade-in effects
- Slide-up animations
- Scroll reveal
- Staggered card animations
- Animated number counters
- Hover lift effects
- Button press feedback
- Subtle glowing borders
- Loading skeleton animations
- Modal transitions
- Sidebar slide transitions
- Dropdown animations
- Chart entrance animations
- Upload progress animations
- Smooth Digital Twin camera movement
- Toast entrance and exit animations

Suggested timings:
- Button interactions: 150–200ms
- Card hover: 200–300ms
- Modal transitions: 250–350ms
- Page content entrance: 350–500ms
- Scroll reveal: 400–650ms

Use transform and opacity where possible for performance.

Respect prefers-reduced-motion and disable nonessential animations for users who request reduced motion.

Avoid unnecessary animation libraries.

## 7. RESPONSIVE DESIGN

Ensure all pages work correctly on:
- Mobile phones
- Tablets
- Laptops
- Desktop monitors

Requirements:
- Mobile-first responsive design
- Collapsible mobile sidebar
- Responsive navigation
- Proper touch targets
- Responsive cards
- Mobile-friendly charts
- Scrollable data tables
- Responsive modals
- Proper form sizing
- Adaptive 3D viewer
- No horizontal overflow
- No overlapping elements

## 8. ACCESSIBILITY AND USER EXPERIENCE

Follow WCAG 2.2 AA principles.

Include:
- Semantic HTML
- Proper heading hierarchy
- Accessible form labels
- Visible keyboard focus
- Appropriate ARIA attributes
- Keyboard-operable navigation
- Sufficient color contrast
- Accessible modal focus management
- Loading and error announcements
- Helpful validation messages
- Reduced-motion support
- Meaningful empty states

## 9. BACKEND INTEGRATION ARCHITECTURE

The backend will be implemented separately using Node.js and Express.

Create a clean API service layer using the existing service filenames.

Centralize API configuration in:
js/config/app-config.js

Centralize fetch logic in:
js/core/api-client.js

Support:
- JSON requests
- FormData video uploads
- Authentication credentials
- Error handling
- Request timeouts
- AbortController cancellation
- Consistent API response parsing

Do not hardcode API endpoints across HTML pages.

Do not assume backend endpoint paths are finalized. Use configurable endpoint definitions and clearly document assumptions.

Support two application modes:
1. Demo mode with realistic sample data
2. Live mode using backend API responses

Clearly label demo data.

Never show fake AI analysis, completed uploads, generated PDFs, or saved records as real backend results.

## 10. CODE QUALITY REQUIREMENTS

- Follow the exact folder structure.
- Implement reusable UI components.
- Use JavaScript ES modules.
- Avoid duplicated logic.
- Use CSS variables and consistent design tokens.
- Keep HTML semantic.
- Use meaningful class names.
- Include error handling.
- Avoid console errors.
- Prevent broken navigation.
- Sanitize or safely render dynamic text.
- Avoid unsafe innerHTML for untrusted content.
- Avoid storing sensitive tokens insecurely.
- Ensure all buttons have meaningful actions.
- Use appropriate loading, empty, success, and failure states.

## 11. DEVELOPMENT AND TESTING

Build the application incrementally.

Phase 1: Folder structure, design system, shared components, and navigation.

Phase 2: Landing page, login, and registration.

Phase 3: Dashboard, projects, and project details.

Phase 4: Video upload and AI analysis interfaces.

Phase 5: Devices and energy analytics.

Phase 6: Three.js Digital Twin.

Phase 7: Recommendations, reports, and settings.

Phase 8: Responsive refinement, animations, accessibility, and testing.

After each phase:
- Verify file imports and paths.
- Verify navigation.
- Check browser console.
- Test interactive elements.
- Check mobile responsiveness.
- Fix visible errors.

Do not stop after generating empty files or placeholders.

## 12. FINAL EXPECTED RESULT

Deliver a complete, cohesive, visually impressive VisionTwin frontend.

The result should feel like a polished commercial SaaS product suitable for:
- College project demonstrations
- Hackathons
- Technical presentations
- Portfolio showcases
- Future backend integration

Prioritize usability, performance, clean architecture, and visual consistency over excessive decorative effects.

Start by inspecting the existing workspace, preserving useful existing code, creating any missing files, and implementing Phase 1.

Continue through the remaining phases while keeping the project functional.

At the end, provide:
- A summary of implemented files
- Features that work in demo mode
- Features requiring backend integration
- Instructions for running locally
- Any remaining limitations

Do not claim unimplemented functionality is complete.

