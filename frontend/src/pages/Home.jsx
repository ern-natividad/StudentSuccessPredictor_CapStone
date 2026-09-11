import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_ROLES } from "../utils/constants";
import campusBackground from "../assets/landingbg.jpg";
import engineeringLogo from "../assets/EngineeringLogo.jpg";
import HomeAnnouncementModal from "../components/Home/HomeAnnouncementModal";

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

  const [flippedCapability, setFlippedCapability] = useState(null);

  const features = [
    {
      icon: "fas fa-chart-line",
      title: "Predictive Analytics",
      desc: "AI predictions that flag academic risk early.",
      detail:
        "Model student trajectories from grades and diagnostics so advisers can act before risk becomes failure.",
    },
    {
      icon: "fas fa-bell",
      title: "Early Alerts",
      desc: "Timely notices for fast interventions.",
      detail:
        "Escalate at-risk learners to staff and admins, then track acknowledgement and intervention progress.",
    },
    {
      icon: "fas fa-clipboard-check",
      title: "Screening Tools",
      desc: "Diagnostic modules for engineering tracks.",
      detail:
        "Support pre-enrollment and program-fit screening with CET-aligned inputs and clear recommendations.",
    },
    {
      icon: "fas fa-chart-pie",
      title: "Advanced Reports",
      desc: "Clear views of program-wide trends.",
      detail:
        "Export polished academic reports and monitor cohort performance with consistent risk indicators.",
    },
    {
      icon: "fas fa-lock",
      title: "Secure Access",
      desc: "Protected credentials and student data.",
      detail:
        "Role-based portals, MFA-ready authentication, and guarded academic records for campus use.",
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
      <HomeAnnouncementModal />
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
            marginTop: "0.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "0.75rem",
            }}
          >
            <p
              style={{
                margin: "0 0 0.25rem",
                fontSize: "0.68rem",
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
                fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
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
              gap: "0.55rem",
              padding: "0.55rem",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
              border: "1px solid rgba(255, 255, 255, 0.28)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            }}
          >
            {features.map((feature, idx) => {
              const isFlipped = flippedCapability === idx;
              return (
                <button
                  key={feature.title}
                  type="button"
                  className={`capability-flip${isFlipped ? " is-flipped" : ""}`}
                  aria-pressed={isFlipped}
                  aria-label={`${feature.title}. ${isFlipped ? feature.detail : feature.desc}. Activate to flip.`}
                  onClick={() =>
                    setFlippedCapability((current) =>
                      current === idx ? null : idx,
                    )
                  }
                >
                  <div className="capability-flip-inner">
                    <div className="capability-flip-face capability-flip-front">
                      <div className="capability-flip-icon">
                        <i className={feature.icon} aria-hidden="true" />
                      </div>
                      <h4>{feature.title}</h4>
                      <p>{feature.desc}</p>
                      <span className="capability-flip-hint">
                        Tap to flip
                      </span>
                    </div>
                    <div className="capability-flip-face capability-flip-back">
                      <div className="capability-flip-icon capability-flip-icon-light">
                        <i className={feature.icon} aria-hidden="true" />
                      </div>
                      <h4>{feature.title}</h4>
                      <p>{feature.detail}</p>
                      <span className="capability-flip-hint">
                        Tap to flip back
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <style>
            {`
              .capability-flip {
                appearance: none;
                border: none;
                background: transparent;
                padding: 0;
                margin: 0;
                width: 100%;
                min-height: 118px;
                perspective: 1000px;
                cursor: pointer;
                text-align: left;
                font: inherit;
                color: inherit;
              }

              .capability-flip-inner {
                position: relative;
                width: 100%;
                height: 100%;
                min-height: 118px;
                transform-style: preserve-3d;
                transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
              }

              .capability-flip:hover .capability-flip-inner,
              .capability-flip:focus-visible .capability-flip-inner,
              .capability-flip.is-flipped .capability-flip-inner {
                transform: rotateY(180deg);
              }

              .capability-flip:focus-visible {
                outline: 2px solid rgba(255, 255, 255, 0.85);
                outline-offset: 2px;
                border-radius: 12px;
              }

              .capability-flip-face {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 0.35rem;
                padding: 0.7rem 0.7rem 0.55rem;
                border-radius: 12px;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
              }

              .capability-flip-front {
                background: rgba(255, 255, 255, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.7);
              }

              .capability-flip-back {
                background: linear-gradient(155deg, #800000 0%, #5c0000 100%);
                border: 1px solid rgba(255, 255, 255, 0.18);
                color: #ffffff;
                transform: rotateY(180deg);
              }

              .capability-flip-icon {
                width: 30px;
                height: 30px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(145deg, #800000 0%, #9b1c1c 100%);
                color: #ffffff;
                font-size: 0.78rem;
                box-shadow: 0 3px 8px rgba(128, 0, 0, 0.22);
                flex-shrink: 0;
              }

              .capability-flip-icon-light {
                background: rgba(255, 255, 255, 0.16);
                box-shadow: none;
              }

              .capability-flip-face h4 {
                margin: 0;
                font-size: 0.8rem;
                font-weight: 700;
                letter-spacing: -0.01em;
                line-height: 1.2;
                color: #1e293b;
              }

              .capability-flip-back h4 {
                color: #ffffff;
              }

              .capability-flip-face p {
                margin: 0;
                font-size: 0.7rem;
                line-height: 1.35;
                color: #64748b;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }

              .capability-flip-back p {
                color: rgba(255, 255, 255, 0.9);
                -webkit-line-clamp: 4;
              }

              .capability-flip-hint {
                margin-top: 0.15rem;
                font-size: 0.6rem;
                font-weight: 650;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: #94a3b8;
              }

              .capability-flip-back .capability-flip-hint {
                color: rgba(255, 255, 255, 0.72);
              }

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

              @media (hover: none) {
                .capability-flip:hover .capability-flip-inner {
                  transform: none;
                }
                .capability-flip.is-flipped .capability-flip-inner {
                  transform: rotateY(180deg);
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