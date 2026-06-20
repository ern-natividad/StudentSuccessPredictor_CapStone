# Code Comparison: Before & After React Conversion

## Authentication Example

### ❌ BEFORE: Vanilla JavaScript

```javascript
// auth.js
function doLogin() {
  var email = document.getElementById("l-email").value.trim();
  var pass = document.getElementById("l-pass").value;
  var err = document.getElementById("login-err");
  var msg = document.getElementById("login-err-msg");

  if (!email || !pass) {
    msg.textContent = "Please fill in all fields.";
    err.classList.remove("hidden");
    return;
  }

  var emailLower = email.toLowerCase();
  if (!VALID_CREDS[emailLower] || VALID_CREDS[emailLower] !== pass) {
    msg.textContent = "Invalid email or password.";
    err.classList.remove("hidden");
    return;
  }

  err.classList.add("hidden");
  var role = getRole(emailLower);
  var name = emailLower
    .split("@")[0]
    .replace(".", " ")
    .replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });

  launchDashboard(name, role);
}

function launchDashboard(name, role) {
  sessionStorage.setItem("userName", name);
  sessionStorage.setItem("userRole", role);

  if (role === "admin" || role === "staff") {
    window.location.href = "admin-dashboard.html";
  } else {
    window.location.href = "student-dashboard.html";
  }
}
```

### ✅ AFTER: React Hooks

```jsx
// LoginForm.jsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/Auth.module.css";

const LoginForm = ({ onSwitch }) => {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className={styles.errorBox}>{error}</div>}

      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
      />

      <input
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
        }}
      />

      <button type="submit">Sign In</button>
    </form>
  );
};
```

**Improvements:**

- Cleaner component structure
- React state management with hooks
- No DOM manipulation
- Type-safe event handlers
- Better error handling
- Reusable component

---

## Dashboard Navigation Example

### ❌ BEFORE: DOM Manipulation

```javascript
// dashboard.js
function showPage(id) {
  document.querySelectorAll(".page-view").forEach(function (v) {
    v.classList.remove("active");
  });
  document.querySelectorAll(".nav-item,.sidebar-item").forEach(function (b) {
    b.classList.remove("active");
  });

  var pg = document.getElementById("pg-" + id);
  if (pg) pg.classList.add("active");

  var navItem = document.querySelector("[onclick*=\"showPage('" + id + "')\"]");
  if (navItem) navItem.classList.add("active");
}

function toggleNotif() {
  var p = document.getElementById("notif-panel");
  p.classList.toggle("open");
}
```

### ✅ AFTER: React State

```jsx
// DashboardContext.jsx
const [currentPage, setCurrentPage] = useState("dashboard");
const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);

const showPage = useCallback((pageId) => {
  setCurrentPage(pageId);
}, []);

const toggleNotificationsPanel = useCallback(() => {
  setNotificationsPanelOpen((prev) => !prev);
}, []);

// Usage in DashboardLayout.jsx
const renderPage = () => {
  switch (currentPage) {
    case "dashboard":
      return <DashboardOverview />;
    case "students":
      return <StudentsList />;
    case "alerts":
      return <AlertsList />;
    // ...
  }
};
```

**Improvements:**

- No DOM queries
- Declarative approach
- State-driven rendering
- Easy to debug
- Reusable throughout app

---

## Chart Rendering Example

### ❌ BEFORE: Direct DOM Manipulation

```javascript
// dashboard.js
function buildRiskChart(){
  var ctx = document.getElementById('risk-chart');
  if(!ctx || ctx._ch) return;

  ctx._ch = new Chart(ctx, {
    type:'doughnut',
    data:{
      labels:['Low','Medium','High','Critical'],
      datasets:[{
        data:[218,65,35,12],
        backgroundColor:['#2d7a4f','#C9A200','#d47000','#c0392b'],
        borderWidth:3,
        borderColor:'#fff'
      }]
    },
    options:{
      cutout:'72%',
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:function(c){...}}}
      },
      responsive:false
    }
  });
}
```

### ✅ AFTER: React Component

```jsx
// DashboardOverview.jsx
import { Doughnut } from 'react-chartjs-2';
import { useDashboard } from '../../hooks/useDashboard';

const DashboardOverview = () => {
  const { students } = useDashboard();

  const riskCounts = {
    Low: students.filter(s => s.risk === 'Low').length,
    Medium: students.filter(s => s.risk === 'Medium').length,
    High: students.filter(s => s.risk === 'High').length,
    Critical: students.filter(s => s.risk === 'Critical').length
  };

  const riskChartData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [{
      data: [riskCounts.Low, riskCounts.Medium, riskCounts.High, riskCounts.Critical],
      backgroundColor: ['#2d7a4f', '#C9A200', '#d47000', '#c0392b'],
      borderWidth: 3,
      borderColor: '#fff'
    }]
  };

  return (
    <div style={{ height: '160px' }}>
      <Doughnut
        data={riskChartData}
        options={{ cutout: '72%', ... }}
      />
    </div>
  );
};
```

**Improvements:**

- Component-based
- Reusable chart component
- Data flows from state
- No manual DOM management
- Responsive by default

---

## Styling Example

### ❌ BEFORE: Global CSS

```css
/* styles.css - Global, prone to conflicts */
.auth-card {
  display: flex;
  width: 860px;
  min-height: 560px;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.btn-gold {
  background: var(--gold);
  border: none;
  border-radius: var(--radius-sm);
}

/* Later in file... multiple classes with same name possible */
.btn-gold {
  /* Another definition? Conflict! */
}
```

### ✅ AFTER: CSS Modules

```css
/* Auth.module.css - Scoped to this component */
.authCard {
  display: flex;
  width: 860px;
  min-height: 560px;
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.btnGold {
  background: var(--gold);
  border: none;
  border-radius: var(--radius-sm);
}
/* No conflicts - scoped to module */
```

```jsx
// AuthPage.jsx
import styles from "../../styles/Auth.module.css";

const AuthPage = () => (
  <div className={styles.authCard}>
    <button className={styles.btnGold}>Login</button>
  </div>
);
```

**Improvements:**

- No global conflicts
- Scoped to component
- Better maintainability
- Clear dependencies
- Easy to refactor

---

## Table Rendering Example

### ❌ BEFORE: String Concatenation

```javascript
// dashboard.js
function buildStudentTable(filter) {
  var el = document.getElementById("student-table");
  if (!el) return;

  var html = "<table><thead><tr>";
  html += "<th>ID</th><th>Name</th><th>GPA</th>";
  html += "</tr></thead><tbody>";

  STUDENTS.forEach(function (s) {
    html += "<tr>";
    html += "<td>" + s.id + "</td>";
    html += "<td>" + s.name + "</td>";
    html += "<td>" + s.gpa.toFixed(2) + "</td>";
    html += "</tr>";
  });

  html += "</tbody></table>";
  el.innerHTML = html;
}
```

### ✅ AFTER: Component Rendering

```jsx
// StudentsList.jsx
const StudentsList = () => {
  const { students, getFilteredStudents } = useDashboard();
  const filteredStudents = getFilteredStudents();

  return (
    <table className={commonStyles.table}>
      <thead className={commonStyles.tableHead}>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>GPA</th>
        </tr>
      </thead>
      <tbody>
        {filteredStudents.map((student) => (
          <tr key={student.id}>
            <td>{student.id}</td>
            <td>{student.name}</td>
            <td>{student.gpa.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

**Improvements:**

- JSX is cleaner and safer
- No XSS vulnerabilities
- Reusable map function
- Easy to add conditional rendering
- Better performance with keys

---

## State Management Example

### ❌ BEFORE: SessionStorage & Global Variables

```javascript
// Global scope pollution
var STUDENTS = [...];
var ALERTS_DATA = [...];
var ROLE_MAP = {...};

function launchDashboard(name, role){
  sessionStorage.setItem('userName', name);
  sessionStorage.setItem('userRole', role);
  // Hard page navigation
  window.location.href = 'dashboard.html';
}

function initializeUser(){
  var userName = sessionStorage.getItem('userName');
  var userRole = sessionStorage.getItem('userRole');
  // Manual DOM updates
  document.getElementById('nav-uname').textContent = userName;
}
```

### ✅ AFTER: Context API

```jsx
// AuthContext.jsx
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: session.userName,
    role: session.userRole,
    isAuthenticated: !!session.userName,
  });

  const login = useCallback((email, password) => {
    if (validateCredentials(email, password)) {
      storeUserSession(name, role);
      setUser({ name, role, isAuthenticated: true });
      return true;
    }
    return false;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
};

// Usage anywhere in app
const MyComponent = () => {
  const { user } = useAuth();
  return <div>{user.name}</div>;
};
```

**Improvements:**

- No global variables
- Proper encapsulation
- Easy to test
- Reactive updates
- Single source of truth

---

## Error Handling Example

### ❌ BEFORE: Inline Error Checking

```javascript
function doSignup() {
  if (!fn || !ln || !email || !uid || !yr || !pass || !conf) {
    alert("Please complete all fields.");
    return;
  }
  if (pass !== conf) {
    alert("Passwords do not match.");
    return;
  }
  if (!terms) {
    alert("Please accept the Terms of Service.");
    return;
  }
  // ...
}
```

### ✅ AFTER: Context + Component State

```jsx
// AuthContext.jsx
const signup = useCallback((firstName, lastName, email, ...) => {
  setError('');

  if (!firstName || !lastName || !email || ...) {
    setError('Please complete all fields.');
    return false;
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match.');
    return false;
  }

  if (!termsAccepted) {
    setError('Please accept the Terms of Service.');
    return false;
  }

  return true;
}, []);

// SignupForm.jsx
const { signup, error } = useAuth();

return (
  <form onSubmit={handleSubmit}>
    {error && <div className={styles.errorBox}>{error}</div>}
    {/* Form fields */}
  </form>
);
```

**Improvements:**

- Centralized error logic
- Better UX (no alert boxes)
- Reusable error handling
- Clear error display

---

## Summary of Improvements

| Aspect             | Before                   | After                | Benefit                 |
| ------------------ | ------------------------ | -------------------- | ----------------------- |
| **Structure**      | Flat files               | Modular components   | Easier to navigate      |
| **State**          | SessionStorage + globals | Context API          | Single source of truth  |
| **DOM**            | Direct manipulation      | Declarative JSX      | Less bugs, cleaner code |
| **Navigation**     | Page reloads             | Client-side routing  | Instant transitions     |
| **Styling**        | Global CSS               | CSS Modules          | No conflicts            |
| **Charts**         | Manual Canvas            | React components     | More maintainable       |
| **Error Handling** | Alert boxes              | Error state          | Better UX               |
| **Testing**        | Difficult                | Easy                 | Better quality          |
| **Scaling**        | Hard to extend           | Easy to add features | Future-proof            |

---

**The conversion provides a modern, maintainable, and scalable application! 🚀**
