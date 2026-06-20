# Architecture Titans — WMSU Student Success Predictor

## Project Structure

The application has been separated into modular files for better organization and maintainability.

### Files

#### 1. **auth.html** - Authentication Page
- Login and sign-up forms
- Brand panel with helmet SVG logo
- Tab switching between login and signup
- References external CSS and JavaScript

#### 2. **auth.js** - Authentication Logic
- Login/signup form validation
- Password requirement checking
- Eye toggle for password visibility
- Session storage management
- Redirect to dashboard on successful login/signup

#### 3. **dashboard.html** - Main Dashboard
- Complete student success predictor interface
- Navigation bar with user info
- Sidebar with quick navigation
- Multiple pages: Dashboard, Students, Alerts, Screening, What-If Simulator, Reports
- Charts, tables, and interactive components
- References external CSS and JavaScript

#### 4. **dashboard.js** - Dashboard Logic
- User initialization from session storage
- Navigation and page switching
- Dashboard data initialization
- Chart.js implementations:
  - Risk distribution donut chart
  - GPA trend line chart
  - What-If simulator chart
- Student table management
- Screening rubric functionality
- Alert handling

#### 5. **styles.css** - Global Styles
All CSS styling organized by section:
- Design tokens (colors, spacing, shadows)
- Auth screen styling
- Dashboard layout (top nav, sidebar, content area)
- Component styles (cards, buttons, tables, badges, etc.)
- Utility classes
- SVG icon styling

---

## Getting Started

### Step 1: Start with Auth Page
Open **auth.html** in your browser to access the login/signup page.

### Step 2: Login
- Use any email to login (e.g., `user@wmsu.edu.ph`)
- Any password works for demo purposes
- Or create a new account by switching to the Sign Up tab

### Step 3: Access Dashboard
After successful authentication, you'll be redirected to **dashboard.html** with your user information displayed.

---

## Features

### Authentication
- Email and password validation
- Password strength requirements (8+ chars, uppercase, number, special char)
- Terms of Service acceptance
- Remember me option

### Dashboard
- **Overview**: Key metrics (total students, critical alerts, predictions, at-risk students)
- **Risk Distribution**: Donut chart showing student risk levels
- **GPA Trends**: Line chart tracking cohort average GPA progression
- **Recent Alerts**: Quick view of critical academic alerts
- **Top Performers**: Table of high-performing students

### Students
- Student list with search and filter
- Display of current GPA, predicted GPA, and risk levels
- Sortable columns

### Early Alerts
- List of active alerts by severity
- Alert icons and descriptions
- Acknowledgment functionality

### Pre-Admission Screening
- Applicant information entry
- Rubric-based evaluation (5-star rating system)
- Automatic recommendation calculation
- Criteria: Spatial Reasoning, Design Communication, Technical Aptitude, Creativity & Innovation

### What-If Simulator
- Interactive sliders for semester grade adjustments
- Real-time prediction updates
- Risk tier changes based on simulated grades
- Confidence percentage display
- Actionable insights

### Reports
- Individual student reports
- Cohort analysis
- Risk summaries
- Export options (PDF, Excel, CSV)

---

## Design System

### Colors
- **Gold**: `#F5C200` (primary accent)
- **Gold Dark**: `#C9A200` (hover/active)
- **Black**: `#0f0d08` (background)
- **Cream**: `#faf6ec` (light background)
- **Risk Colors**:
  - Low: `#2d7a4f` (green)
  - Medium: `#c9a200` (gold)
  - High: `#d47000` (orange)
  - Critical: `#c0392b` (red)

### Typography
- **Font Family**: Inter (sans-serif)
- **Display**: Playfair Display (serif for headings)
- **Sizes**: 10px to 26px (semantic sizing)

### Spacing
- Radius: 6px (sm), 10px (md), 16px (lg), 24px (xl)
- Shadows: Subtle card shadow, lift shadow for modals
- Gap/Padding: 8px to 28px increments

---

## Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables
- **JavaScript (Vanilla)** - No frameworks
- **Chart.js** - Data visualization library
- **Google Fonts** - Typography (Inter, Playfair Display)

---

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Modern browsers supporting CSS Grid, Flexbox, and CSS Variables

---

## Future Enhancements

- Backend API integration
- Real database for student data
- PDF report generation
- Email notifications
- Mobile responsive improvements
- Dark mode toggle
- Advanced filtering and search

---

## File Size Summary

- **auth.html**: ~12 KB
- **auth.js**: ~3 KB
- **dashboard.html**: ~35 KB
- **dashboard.js**: ~18 KB
- **styles.css**: ~27 KB

**Total**: ~95 KB (highly optimized for web)

---

## Notes

- Session data is stored in `sessionStorage` (cleared on browser close)
- All data is currently mock data for demonstration
- Charts use Chart.js library loaded from CDN
- Fonts loaded from Google Fonts CDN

Enjoy using the Architecture Titans Student Success Predictor!
