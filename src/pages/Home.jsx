import { useNavigate } from "react-router-dom";
import { AUTH_ROLES } from "../utils/constants";

const HomePage = () => {
  const navigate = useNavigate();

  const roles = Object.values(AUTH_ROLES);

  const features = [
    {
      icon: "fas fa-chart-line",
      title: "Predictive Analytics",
      desc: "AI-powered student success predictions",
    },
    {
      icon: "fas fa-bell",
      title: "Early Alerts",
      desc: "Timely intervention notifications",
    },
    {
      icon: "fas fa-microscope",
      title: "What-If Simulator",
      desc: "Explore academic outcome scenarios",
    },
    {
      icon: "fas fa-clipboard-check",
      title: "Screening Tools",
      desc: "Comprehensive academic assessment",
    },
    {
      icon: "fas fa-chart-pie",
      title: "Advanced Reports",
      desc: "Detailed performance analytics",
    },
    {
      icon: "fas fa-lock",
      title: "Secure System",
      desc: "Enterprise-grade data protection",
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        minHeight: "100vh",
        color: "#F8FAFC",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Hero Section */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "60px",
            paddingTop: "40px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#F8FAFC",
              marginBottom: "12px",
            }}
          >
            Engineering Student Success Predictor
          </div>

          <div
            style={{
              fontSize: "20px",
              color: "#CBD5E1",
              marginBottom: "8px",
            }}
          >
            Predictive Analytics for Student Success
          </div>

          <div
            style={{
              color: "#94A3B8",
              fontSize: "16px",
            }}
          >
            Data-driven insights to identify at-risk students and enable timely
            interventions
          </div>
        </div>

        {/* Quick CTA: Degree Recommendation */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <button
            onClick={() => navigate("/pre-enrollment")}
            style={{
              background: "#10B981",
              color: "#FFFFFF",
              border: "none",
              padding: "12px 28px",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "16px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10B981";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Try Degree Recommendation
          </button>
        </div>

        {/* Role Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginBottom: "60px",
          }}
        >
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => navigate(role.path)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 15px 30px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "16px",
                  color: "#B91C1C",
                }}
              >
                <i className={role.icon}></i>
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#0F172A",
                  marginBottom: "12px",
                }}
              >
                {role.title}
              </div>

              <div
                style={{
                  color: "#64748B",
                  fontSize: "14px",
                  marginBottom: "24px",
                  lineHeight: "1.6",
                }}
              >
                {role.description}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(role.path);
                }}
                style={{
                  background: "#B91C1C",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  alignSelf: "center",
                  marginTop: "auto",
                  width: "160px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#DC2626";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#B91C1C";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div
          style={{
            background: "#1E293B",
            borderRadius: "16px",
            padding: "40px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#F8FAFC",
              marginBottom: "24px",
            }}
          >
            Key Features
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {features.map((feature, idx) => (
              <div key={idx} style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    fontSize: "24px",
                    minWidth: "24px",
                    color: "#EF4444",
                  }}
                >
                  <i className={feature.icon}></i>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "4px",
                      color: "#F8FAFC",
                    }}
                  >
                    {feature.title}
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#CBD5E1",
                    }}
                  >
                    {feature.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            color: "#94A3B8",
            fontSize: "12px",
            paddingBottom: "20px",
          }}
        >
          Engineering Hawks — WMSU Student Success Predictor v1.1.0
        </div>
      </div>
    </div>
  );
};

export default HomePage;
