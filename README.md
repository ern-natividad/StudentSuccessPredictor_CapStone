# WMSU Student Success Predictor - React Application

> **Status**: ✅ Successfully converted from Vanilla HTML/CSS/JS to React Framework

## 📋 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit: `http://localhost:5173/`

## 📚 Documentation

- **[Setup Guide](./SETUP_GUIDE.md)** - Installation and quick start
- **[React Migration Guide](./REACT_MIGRATION_GUIDE.md)** - Complete conversion details
- **[Original Docs](./src/StudentSuccessPredictor_CapStone-main/)** - Legacy HTML/JS documentation

## 🎯 What's New

### From Vanilla JS to React ✨

- ✅ Component-based architecture
- ✅ Client-side routing with React Router
- ✅ State management with Context API
- ✅ CSS Modules for scoped styling
- ✅ Modern React hooks and functional components
- ✅ Protected routes for authentication
- ✅ Responsive design system

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Dashboard pages
│   ├── AdminDashboard/ # Admin features
│   ├── Common/         # Shared components
│   └── ProtectedRoute.jsx
├── contexts/           # State management (Auth, Dashboard)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── styles/             # CSS Modules
├── utils/              # Helper functions
├── App.jsx             # Main app with routing
└── main.jsx            # React entry point
```

## 🔐 Test Credentials

| Role    | Email                        | Password   |
| ------- | ---------------------------- | ---------- |
| Admin   | admin@wmsu.edu.ph or `admin` | admin123   |
| Staff   | staff@wmsu.edu.ph or `staff` | staff123   |
| Student | student                      | student123 |

## 📱 Features

### Authentication

- Login/Signup with validation
- Session management
- Role-based access control

### Dashboard Pages

- **Overview** - Key metrics and charts
- **Students** - Searchable student list with filters
- **Alerts** - Risk alerts management
- **Screening** - Academic assessment rubric
- **What-If Simulator** - GPA prediction simulator
- **Reports** - Data export options

### Admin Features

- Model management
- Audit logs
- System overview

## 🛠️ Technologies Used

- **React 19** - UI framework
- **React Router 6** - Client-side routing
- **Vite** - Fast build tool
- **Chart.js** - Data visualization
- **CSS Modules** - Scoped styling
- **Font Awesome** - Icons

## 📖 Development

### Adding New Components

1. Create component in `src/components/[Category]/`
2. Create corresponding CSS module
3. Use hooks for state management
4. Export and use in pages

### Using Context

```jsx
// Authentication
const { user, login, logout } = useAuth();

// Dashboard State
const { students, alerts, currentPage } = useDashboard();
```

### Creating New Routes

Add to `src/App.jsx`:

```jsx
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <YourComponent />
    </ProtectedRoute>
  }
/>
```

## 🎨 Design System

- **Colors**: Gold (#F5C200), Charcoal (#1c1a13), Cream (#faf6ec)
- **Typography**: Inter (body), Playfair Display (headings)
- **Components**: Cards, buttons, tables, badges, alerts
- **Design Tokens**: Defined in `src/styles/globals.css`

## 📦 Build & Deploy

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

Output in `dist/` folder ready for deployment.

## 🔍 Linting

```bash
npm run lint
```

## 📝 Key Improvements

| Aspect      | Before           | After              |
| ----------- | ---------------- | ------------------ |
| Structure   | Flat HTML files  | Modular components |
| Navigation  | Page reloads     | SPA routing        |
| State       | DOM manipulation | Context API        |
| Styling     | Global CSS       | CSS Modules        |
| Development | Manual updates   | HMR (hot reload)   |
| Maintenance | Hard to scale    | Easy to extend     |

## 🚀 Performance

- **Code Splitting**: Routes are auto-split
- **Lazy Loading**: Components load on demand
- **Efficient Re-renders**: React optimization
- **Fast Build**: Vite provides instant HMR

## 📚 Learn More

- [React Documentation](https://react.dev)
- [React Router Guide](https://reactrouter.com)
- [Vite Documentation](https://vite.dev)
- [CSS Modules Spec](https://github.com/css-modules/css-modules)

## 🤝 Contributing

Follow these patterns when adding code:

- Use functional components with hooks
- Use Context API for shared state
- Use CSS Modules for styling
- Follow existing component structure
- Document complex logic with comments

## 📄 License

This is an academic project for WMSU.

---

**Architecture Titans** — WMSU Student Success Predictor
**Version**: 1.3.0 (React Edition)

Successfully migrated from Vanilla JS to React Framework! 🎉
