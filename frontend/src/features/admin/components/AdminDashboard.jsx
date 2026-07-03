import React, { useState } from 'react';
import styles from '../../../styles/Dashboard.module.css'; 

const AdminDashboard = () => {
  const [metrics] = useState({
    totalStudents: 1240,
    modelsActive: 3,
    criticalAlerts: 14,
    systemAccuracy: "94.2%"
  });

  const [recentLogs] = useState([
    { id: 1, action: "Retrained Risk Model v1.3", user: "Admin (You)", time: "10 mins ago", status: "Success" },
    { id: 2, action: "Database sync with Student Registry", user: "System System", time: "1 hr ago", status: "Success" },
    { id: 3, action: "Configuration Update: Port thresholds", user: "Admin (You)", time: "4 hrs ago", status: "Updated" }
  ]);

  return (
    <div className={styles.studentPredictionPage}>
      {/* Upper Analytics Banner */}
      <div className={styles.resultBanner}>
        <div className={styles.resultPct}>{metrics.systemAccuracy}</div>
        <div>
          <div className={styles.resultPctLabel}>Prediction Accuracy</div>
        </div>
        <div className={styles.resultDivider}></div>
        <div>
          <div className={styles.resultProgram}>System Administration Control</div>
          <div className={styles.resultSub}>
            Overviewing student predictive indices, model health configurations, and secure access tokens.
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className={styles.scoreGrid}>
        <div className={styles.scoreTile}>
          <div className={styles.scoreLabel}>Total Monitored Students</div>
          <div className={styles.scoreValue}>{metrics.totalStudents}</div>
          <div className={styles.scoreNote}>Active Sync</div>
        </div>
        <div className={styles.scoreTile}>
          <div className={styles.scoreLabel}>Active Predictor Models</div>
          <div className={styles.scoreValue}>{metrics.modelsActive}</div>
          <div className={styles.scoreNote}>RandomForest, XGBoost</div>
        </div>
        <div className={styles.scoreTile}>
          <div className={styles.scoreLabel}>Critical System Alerts</div>
          <div className={styles.scoreValue} style={{ color: '#ff4444' }}>{metrics.criticalAlerts}</div>
          <div className={styles.scoreNote}>Requires Review</div>
        </div>
      </div>

      {/* Main Content Area split into cards */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span>🛠️ Model Management & Configurations</span>
        </div>
        <div className={styles.programGrid}>
          <div className={`${styles.programCard} ${styles.programCardActive}`}>
            <div className={styles.programPercent}>v1.3.0</div>
            <div className={styles.programName}>Primary Success Predictor</div>
            <div className={styles.programBarBg}>
              <div className={styles.programBar} style={{ width: '94%' }}></div>
            </div>
            <span className={styles.programBadge}>Active Production</span>
          </div>

          <div className={styles.programCard}>
            <div className={styles.programPercent} style={{ color: '#777' }}>v1.2.9</div>
            <div className={styles.programName}>Legacy Analytical Model</div>
            <div className={styles.programBarBg}>
              <div className={styles.programBar} style={{ width: '89%', backgroundColor: '#777' }}></div>
            </div>
            <span className={styles.programBadge} style={{ backgroundColor: '#f0f0f0', color: '#555', borderColor: '#ccc' }}>Archived</span>
          </div>
        </div>
      </div>

      {/* System Audit Trail logs matching dashboard patterns */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span>📋 Recent System Activity Logs</span>
        </div>
        <div>
          {recentLogs.map(log => (
            <div key={log.id} className={styles.alertItem}>
              <div className={`${styles.alertIcon} ${log.status === 'Success' ? styles.low : styles.high}`}>
                {log.status === 'Success' ? '✅' : '⚙️'}
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.alertName}>{log.action}</div>
                <div className={styles.alertDesc}>Triggered by {log.user}</div>
                <div className={styles.alertTime}>{log.time}</div>
              </div>
              <div className={styles.alertMeta}>
                <span className={`${styles.riskBadge} ${log.status === 'Success' ? styles.riskLow : styles.riskMedium}`}>
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;