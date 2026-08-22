import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_ROLES } from "../utils/constants";
import campusBackground from "../assets/landingbg.jpg";
import engineeringLogo from "../assets/EngineeringLogo.jpg";

const HomePage = () => {
  const navigate = useNavigate();
  const [showInstitutionalAccess, setShowInstitutionalAccess] = useState(false);
  const institutionalMenuRef = useRef(null);

  const studentRole = AUTH_ROLES.student;
  const institutionalRoles = [AUTH_ROLES.staff, AUTH_ROLES.admin].filter(Boolean);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        institutionalMenuRef.current &&
        !institutionalMenuRef.current.contains(event.target)
      ) {
        setShowInstitutionalAccess(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const features = [
    {
      icon: "fas fa-chart-line",
      title: "Predictive Analytics",
      desc: "AI predictions that flag academic risk early.",
    },
    {
      icon: "fas fa-bell",
      title: "Early Alerts",
      desc: "Timely notices for fast interventions.",
    },
    {
      icon: "fas fa-clipboard-check",
      title: "Screening Tools",
      desc: "Diagnostic modules for engineering tracks.",
    },
    {
      icon: "fas fa-chart-pie",
      title: "Advanced Reports",
      desc: "Clear views of program-wide trends.",
    },
    {
      icon: "fas fa-lock",
      title: "Secure Access",
      desc: "Protected credentials and student data.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "var(--color-text-primary)",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        backgroundImage: `linear-gradient(rgba(139, 0, 0, 0.275), rgba(139, 0, 0, 0.275)), url(${campusBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header Navigation Bar */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          padding: "var(--space-lg) var(--space-2xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#800000",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
          }}
        >
          <img
            src={engineeringLogo}
            alt="WMSU College of Engineering Logo"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          />
          <div>
            <h1
              style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: "var(--font-weight-bold)",
                margin: 0,
                letterSpacing: "-0.01em",
                color: "#FFFFFF",
              }}
            >
              Engineering Hawks
            </h1>
          </div>
        </div>
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "rgba(255,255,255,0.85)",
            fontWeight: "var(--font-weight-medium)",
          }}
        >
          Student Success Predictor
        </div>
      </header>

      {/* Main Content Wrap */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 var(--space-2xl)",
        }}
      >
        {/* Hero Section */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "var(--space-3xl)",
            alignItems: "center",
            padding: "var(--space-3xl) 0",
          }}
        >
          {/* Left Column */}
          <div>
            <div
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.92)",
                color: "var(--color-brand-primary)",
                padding: "var(--space-xs) var(--space-md)",
                borderRadius: "20px",
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--space-lg)",
                letterSpacing: "0.5px",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              ✨ Predictive Analytics Platform
            </div>
            <h2
              style={{
                fontSize: "var(--font-size-4xl)",
                fontWeight: "var(--font-weight-bold)",
                lineHeight: "var(--line-height-tight)",
                color: "#FFFFFF",
                textShadow:
                  "0 2px 4px rgba(0,0,0,0.5), 0 4px 18px rgba(0,0,0,0.45)",
                margin: "0 0 var(--space-lg) 0",
                letterSpacing: "-0.02em",
              }}
            >
              Empowering Engineering Student Success
            </h2>
            <p
              style={{
                fontSize: "var(--font-size-lg)",
                color: "#FFFFFF",
                textShadow:
                  "0 1px 3px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.4)",
                lineHeight: "var(--line-height-relaxed)",
                margin: "0 0 var(--space-2xl) 0",
                maxWidth: "420px",
              }}
            >
              Leverage diagnostic evaluation data to intelligently identify
              academic risk, forecast curriculum performance, and deploy
              targeted support systems.
            </p>
            <button
              onClick={() =>
                navigate("/pre-enrollment", { state: { fromLanding: true } })
              }
              className="btn-primary"
              style={{
                fontSize: "var(--font-size-base)",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              <i
                className="fas fa-rocket"
                style={{ marginRight: "var(--space-sm)" }}
              ></i>
              Launch Pre-Enrollment Tool
            </button>
          </div>

          {/* Right Column: Student Portal */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(8px)",
              border: "1px solid var(--color-border-neutral)",
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-2xl)",
              boxShadow: "var(--shadow-lg)",
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
              Student Portal
            </h3>

            <p
              style={{
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-secondary)",
                margin: "0 0 var(--space-xl) 0",
                lineHeight: "var(--line-height-relaxed)",
              }}
            >
              Sign in to view your success prediction, track academic progress,
              and receive personalized guidance.
            </p>

            <button
              type="button"
              onClick={() => studentRole?.path && navigate(studentRole.path)}
              style={{
                width: "100%",
                background: "var(--color-bg-main)",
                border: "1px solid var(--color-border-neutral)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--color-brand-primary)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.backgroundColor =
                  "var(--color-brand-primary-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  "var(--color-border-neutral)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.backgroundColor = "var(--color-bg-main)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-lg)",
                }}
              >
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
                    flexShrink: 0,
                  }}
                >
                  <i className={studentRole?.icon || "fas fa-graduation-cap"}></i>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "var(--font-size-base)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Continue as Student
                  </div>
                  <div
                    style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-secondary)",
                      marginTop: "var(--space-xs)",
                    }}
                  >
                    {studentRole?.description}
                  </div>
                </div>
              </div>

              <div
                style={{
                  color: "var(--color-brand-primary)",
                  fontSize: "var(--font-size-base)",
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </div>
            </button>
          </div>
        </section>

        {/* Feature Showcase — modern glass rail */}
        <section
          style={{
            marginTop: "var(--space-xl)",
            marginBottom: "var(--space-3xl)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "1.25rem",
            }}
          >
            <p
              style={{
                margin: "0 0 0.4rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.85)",
                textShadow: "0 1px 4px rgba(0,0,0,0.35)",
              }}
            >
              Platform Capabilities
            </p>
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(1.25rem, 2.2vw, 1.65rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
              }}
            >
              Engineered for Student Success
            </h2>
          </div>

          <div
            className="capabilities-rail"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "0.75rem",
              padding: "0.85rem",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
              border: "1px solid rgba(255, 255, 255, 0.28)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            }}
          >
            {features.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.55rem",
                  padding: "1rem 0.9rem",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.92)",
                  border: "1px solid rgba(255, 255, 255, 0.65)",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  minHeight: "132px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 24px rgba(128, 0, 0, 0.12)";
                  e.currentTarget.style.borderColor = "rgba(128, 0, 0, 0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(15, 23, 42, 0.04)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.65)";
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(145deg, #800000 0%, #9b1c1c 100%)",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    boxShadow: "0 4px 10px rgba(128, 0, 0, 0.25)",
                  }}
                >
                  <i className={feature.icon} aria-hidden="true" />
                </div>

                <div>
                  <h4
                    style={{
                      margin: "0 0 0.3rem",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "#1e293b",
                      lineHeight: 1.25,
                    }}
                  >
                    {feature.title}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.76rem",
                      lineHeight: 1.45,
                      color: "#64748b",
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <style>
            {`
              @media (max-width: 900px) {
                .capabilities-rail {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
              }
              @media (max-width: 520px) {
                .capabilities-rail {
                  grid-template-columns: 1fr !important;
                }
              }
            `}
          </style>
        </section>
      </main>

      {/* Footer — institutional logins tucked behind a discreet control */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border-neutral)",
          padding: "var(--space-lg) var(--space-2xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-md)",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
          backgroundColor: "var(--color-bg-surface)",
          position: "relative",
        }}
      >
        <div>&copy; 2026 Western Mindanao State University</div>

        <div
          ref={institutionalMenuRef}
          style={{ position: "relative", display: "flex", alignItems: "center" }}
        >
          <button
            type="button"
            onClick={() => setShowInstitutionalAccess((open) => !open)}
            aria-label="Institutional access"
            aria-expanded={showInstitutionalAccess}
            aria-haspopup="menu"
            title="Institutional access"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              background: "transparent",
              border: "none",
              padding: "0.35rem 0.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-semibold)",
              transition: "color 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-brand-primary)";
              e.currentTarget.style.background = "rgba(128, 0, 0, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <i className="fas fa-lock" style={{ fontSize: "0.75rem" }} aria-hidden="true" />
            <span>Engineering Hawks</span>
          </button>

          {showInstitutionalAccess ? (
            <div
              role="menu"
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                right: 0,
                minWidth: "220px",
                background: "#ffffff",
                border: "1px solid var(--color-border-neutral)",
                borderRadius: "12px",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)",
                overflow: "hidden",
                zIndex: 40,
              }}
            >
              <div
                style={{
                  padding: "0.65rem 0.9rem",
                  fontSize: "0.72rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-text-secondary)",
                  fontWeight: "var(--font-weight-semibold)",
                  borderBottom: "1px solid var(--color-border-neutral)",
                  background: "var(--color-bg-surface)",
                }}
              >
                Institutional Access
              </div>
              {institutionalRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowInstitutionalAccess(false);
                    if (role.path) navigate(role.path);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.8rem 0.9rem",
                    background: "transparent",
                    border: "none",
                    borderTop: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--color-text-primary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-brand-primary-light)";
                    e.currentTarget.style.color = "var(--color-brand-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }}
                >
                  <i
                    className={role.icon || "fas fa-user"}
                    style={{ width: "1rem", textAlign: "center" }}
                    aria-hidden="true"
                  />
                  <span style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    {role.shortTitle} Login
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
};

export default HomePage;