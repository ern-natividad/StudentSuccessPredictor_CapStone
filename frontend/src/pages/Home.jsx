import { useNavigate } from "react-router-dom";
import { AUTH_ROLES } from "../utils/constants";

const HomePage = () => {
  const navigate = useNavigate();
  const roles = Object.values(AUTH_ROLES);

  const features = [
    {
      icon: "fas fa-chart-line",
      title: "Predictive Analytics",
      desc: "AI-powered student success predictions to detect academic risks early.",
    },
    {
      icon: "fas fa-bell",
      title: "Early Alerts",
      desc: "Automated notification triggers enabling fast administrative interventions.",
    },
    {
      icon: "fas fa-microscope",
      title: "What-If Simulator",
      desc: "Interactive testing sandbox to explore diverse academic outcome scenarios.",
    },
    {
      icon: "fas fa-clipboard-check",
      title: "Screening Tools",
      desc: "Comprehensive diagnostic assessment modules built for engineering tracks.",
    },
    {
      icon: "fas fa-chart-pie",
      title: "Advanced Reports",
      desc: "Granular administrative dashboards displaying program-wide trends.",
    },
    {
      icon: "fas fa-lock",
      title: "Secure Infrastructure",
      desc: "Enterprise-grade credential validation ensuring data privacy protection.",
    },
  ];

  return (
    <div
      style={{
        background: "var(--color-bg-surface)",
        minHeight: "100vh",
        color: "var(--color-text-primary)",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* 1. Header Navigation Bar */}
      <header
        style={{
          borderBottom: "1px solid var(--color-border-neutral)",
          padding: "var(--space-lg) var(--space-2xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--color-bg-main)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <div
            style={{
              background: "var(--color-brand-primary)",
              color: "var(--color-text-inverse)",
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "var(--font-weight-bold)",
              fontSize: "var(--font-size-lg)",
            }}
          >
            EH
          </div>
          <div>
            <h1 style={{ fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-bold)", margin: 0, letterSpacing: "-0.01em" }}>
              Engineering Hawks
            </h1>
          </div>
        </div>
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", fontWeight: "var(--font-weight-medium)" }}>
          Student Success Predictor
        </div>
      </header>

      {/* Main Content Wrap */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 var(--space-2xl)" }}>
        
        {/* 2. Hero Section */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "var(--space-3xl)",
            alignItems: "center",
            padding: "var(--space-3xl) 0",
          }}
        >
          {/* Left Column: Value Proposition */}
          <div>
            <div
              style={{
                display: "inline-block",
                background: "var(--color-brand-primary-light)",
                color: "var(--color-brand-primary)",
                padding: "var(--space-xs) var(--space-md)",
                borderRadius: "20px",
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--space-lg)",
                letterSpacing: "0.5px",
              }}
            >
              ✨ Predictive Analytics Platform
            </div>
            <h2
              style={{
                fontSize: "var(--font-size-4xl)",
                fontWeight: "var(--font-weight-bold)",
                lineHeight: "var(--line-height-tight)",
                color: "var(--color-text-primary)",
                margin: "0 0 var(--space-lg) 0",
                letterSpacing: "-0.02em",
              }}
            >
              Empowering Engineering Student Success
            </h2>
            <p
              style={{
                fontSize: "var(--font-size-lg)",
                color: "var(--color-text-secondary)",
                lineHeight: "var(--line-height-relaxed)",
                margin: "0 0 var(--space-2xl) 0",
                maxWidth: "420px",
              }}
            >
              Leverage diagnostic evaluation data to intelligently identify academic risk, forecast curriculum performance, and deploy targeted support systems.
            </p>
            <button
              onClick={() => navigate("/pre-enrollment")}
              className="btn-primary"
              style={{
                fontSize: "var(--font-size-base)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              <i className="fas fa-rocket" style={{ marginRight: "var(--space-sm)" }}></i>
              Launch Pre-Enrollment Tool
            </button>
          </div>

          {/* Right Column: Portal Gateway */}
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-neutral)",
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-2xl)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-bold)",
                margin: "0 0 var(--space-sm) 0",
                color: "var(--color-text-primary)",
              }}
            >
              Account Portals
            </h3>
            <p style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-secondary)", margin: "0 0 var(--space-lg) 0" }}>
              Select your role to access personalized dashboards
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => navigate(role.path)}
                  style={{
                    background: "var(--color-bg-main)",
                    border: "1px solid var(--color-border-neutral)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-lg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-brand-primary)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.backgroundColor = "var(--color-brand-primary-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border-neutral)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.backgroundColor = "var(--color-bg-main)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
                    <div
                      style={{
                        background: "var(--color-brand-primary-light)",
                        color: "var(--color-brand-primary)",
                        width: "48px",
                        height: "48px",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--font-size-xl)",
                      }}
                    >
                      <i className={role.icon}></i>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: "var(--font-weight-semibold)", fontSize: "var(--font-size-base)", color: "var(--color-text-primary)" }}>
                        {role.title} Portal
                      </div>
                      <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-xs)" }}>
                        Access your dashboard
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "var(--color-brand-primary)", fontSize: "var(--font-size-base)" }}>
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Feature Showcase Section */}
        <section style={{ padding: "var(--space-3xl) 0", borderTop: "1px solid var(--color-border-neutral)" }}>
          <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
            <h2 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "var(--font-weight-bold)", margin: "0 0 var(--space-lg) 0", color: "var(--color-text-primary)" }}>
              Engineered Capabilities
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-base)", maxWidth: "600px", margin: "0 auto", lineHeight: "var(--line-height-relaxed)" }}>
              A comprehensive platform designed for engineering programs to monitor, predict, and enhance student success outcomes.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "var(--space-xl)",
            }}
          >
            {features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: "var(--space-xl)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border-neutral)",
                  backgroundColor: "var(--color-bg-main)",
                  transition: "all var(--transition-base)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "var(--color-brand-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--color-border-neutral)";
                }}
              >
                <div
                  style={{
                    fontSize: "var(--font-size-2xl)",
                    color: "var(--color-brand-primary)",
                    marginBottom: "var(--space-lg)",
                    background: "var(--color-brand-primary-light)",
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className={feature.icon}></i>
                </div>
                <h4
                  style={{
                    fontWeight: "var(--font-weight-semibold)",
                    fontSize: "var(--font-size-lg)",
                    margin: "0 0 var(--space-md) 0",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {feature.title}
                </h4>
                <p style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-secondary)", margin: 0, lineHeight: "var(--line-height-normal)" }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 4. Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border-neutral)",
          padding: "var(--space-lg) var(--space-2xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
          backgroundColor: "var(--color-bg-surface)",
        }}
      >
        <div>&copy; 2026 Western Mindanao State University</div>
        <div style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>Engineering Hawks</div>
      </footer>
    </div>
  );
};

export default HomePage;