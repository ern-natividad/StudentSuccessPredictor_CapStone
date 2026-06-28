/* ═══════════════════════════════════
   ADMIN DASHBOARD LOGIC
═══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function(){
  initializeAdmin();
  initDashboard();
});

function initializeAdmin(){
  var userName = sessionStorage.getItem('userName') || 'Admin User';
  var initials = userName.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase();
  document.getElementById('nav-uname').textContent = userName;
  document.getElementById('nav-avatar').textContent = initials;
}

function doLogout(){
  sessionStorage.clear();
  window.location.href = 'login.html';
}

function toggleNotif(){
  var p = document.getElementById('notif-panel');
  p.classList.toggle('open');
}

document.addEventListener('click', function(e){
  var p = document.getElementById('notif-panel');
  if(p && p.classList.contains('open') && !e.target.closest('.nav-bell') && !e.target.closest('.notif-panel')){
    p.classList.remove('open');
  }
});

function showPage(id){
  document.querySelectorAll('.page-view').forEach(function(v){v.classList.remove('active');});
  document.querySelectorAll('.nav-item,.sidebar-item').forEach(function(b){b.classList.remove('active');});
  var pg = document.getElementById('pg-'+id);
  if(pg) pg.classList.add('active');
  var navItem = document.querySelector('[onclick*="showPage(\''+id+'\')"]');
  if(navItem) navItem.classList.add('active');
}

/* ═══════════════════════════════════
   DASHBOARD INIT
═══════════════════════════════════ */
function initDashboard(){
  buildRiskChart();
  buildActivityChart();
  buildRecentActivity();
  buildStudentTable();
  buildAuditLogs();
  buildAlertsList();
}

/* RISK DONUT */
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
        tooltip:{callbacks:{label:function(c){return ' '+c.label+': '+c.raw+' students';}}}
      },
      responsive:false
    }
  });
}

/* SYSTEM ACTIVITY */
function buildActivityChart(){
  var ctx = document.getElementById('activity-chart');
  if(!ctx || ctx._ch) return;
  ctx._ch = new Chart(ctx, {
    type:'line',
    data:{
      labels:['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6'],
      datasets:[
        {
          label:'Logins',
          data:[145,168,152,189,201,178],
          borderColor:'#C9A200',
          backgroundColor:'rgba(197,162,0,0.08)',
          tension:.4,
          fill:true,
          borderWidth:2.5
        },
        {
          label:'Predictions Run',
          data:[34,42,38,51,58,45],
          borderColor:'#8B6F00',
          borderDash:[5,4],
          tension:.4,
          borderWidth:2
        }
      ]
    },
    options:{
      plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10,padding:12}}},
      scales:{
        y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:10}}},
        x:{grid:{display:false},ticks:{font:{size:10}}}
      }
    }
  });
}

/* RECENT ACTIVITY */
var ACTIVITY_DATA = [
  {user:'Admin (Self)',action:'Generated Student Report',entity:'Juan Dela Cruz',time:'30 min ago',status:'success'},
  {user:'System',action:'Model Retrain Completed',entity:'Architecture v1.3.0',time:'2 hours ago',status:'success'},
  {user:'Dr. Santos',action:'Acknowledged Alert',entity:'Critical Alert #234',time:'3 hours ago',status:'success'},
  {user:'Admin',action:'Updated System Settings',entity:'Audit Log Retention',time:'1 day ago',status:'success'},
  {user:'System',action:'Backup Completed',entity:'Full Database Backup',time:'1 day ago',status:'success'},
];

function buildRecentActivity(){
  var el = document.getElementById('recent-activity-list');
  if(!el) return;
  el.innerHTML = ACTIVITY_DATA.slice(0,5).map(function(a,i){
    return '<div style="padding:12px 14px;border-bottom:1px solid rgba(0,0,0,0.04);display:flex;align-items:center;justify-content:space-between;font-size:12px;">'
      +'<div style="flex:1;"><div style="font-weight:600;color:var(--ink);">'+a.action+'</div><div style="color:var(--sand);font-size:11px;">'+a.user+' · '+a.entity+'</div></div>'
      +'<div style="text-align:right;flex-shrink:0;">'
      +'<div style="color:var(--sand);font-size:10px;">'+a.time+'</div>'
      +'<div style="margin-top:4px;"><span class="risk-badge risk-low">✓ '+(a.status==='success'?'Success':'Failed')+'</span></div>'
      +'</div>'
      +'</div>';
  }).join('');
}

/* STUDENT TABLE */
var STUDENTS = [
  {id:'202301-01-001',name:'Maria Santos',year:'3rd',gpa:3.72,pred:3.95,conf:92,risk:'Low'},
  {id:'202301-01-002',name:'Jose Reyes',year:'3rd',gpa:3.50,pred:3.88,conf:89,risk:'Low'},
  {id:'202301-01-003',name:'Juan Dela Cruz',year:'3rd',gpa:2.85,pred:2.72,conf:84,risk:'High'},
  {id:'202301-01-004',name:'Ana Lim',year:'2nd',gpa:3.40,pred:3.82,conf:91,risk:'Low'},
  {id:'202301-01-005',name:'Carlos Mendoza',year:'4th',gpa:3.20,pred:3.74,conf:88,risk:'Low'},
  {id:'202301-01-006',name:'Sofia Garcia',year:'2nd',gpa:3.10,pred:3.71,conf:86,risk:'Medium'},
  {id:'202301-01-007',name:'Pedro Santos',year:'3rd',gpa:1.80,pred:2.10,conf:78,risk:'Critical'},
  {id:'202301-01-008',name:'Rosa Manalang',year:'4th',gpa:2.50,pred:2.65,conf:80,risk:'High'},
  {id:'202301-01-009',name:'Marco Tan',year:'3rd',gpa:2.70,pred:2.80,conf:82,risk:'High'},
  {id:'202301-01-010',name:'Luz Ramos',year:'5th',gpa:2.95,pred:3.05,conf:85,risk:'Medium'},
];
var RISK_CLASS = {Low:'risk-low',Medium:'risk-medium',High:'risk-high',Critical:'risk-critical'};

function buildStudentTable(filter){
  var tbody = document.getElementById('students-tbody');
  if(!tbody) return;
  var data = filter?STUDENTS.filter(function(s){return s.name.toLowerCase().includes(filter.toLowerCase()) || s.id.includes(filter);}):STUDENTS;
  tbody.innerHTML = data.map(function(s){
    return '<tr>'
      +'<td class="muted">'+s.id+'</td>'
      +'<td style="font-weight:500;">'+s.name+'</td>'
      +'<td class="muted">'+s.year+'</td>'
      +'<td><span style="font-weight:600;color:'+(s.gpa>=3?'var(--green)':s.gpa>=2.5?'var(--gold-deeper)':'var(--crit-risk)')+'">'+s.gpa.toFixed(2)+'</span></td>'
      +'<td style="font-weight:600;">'+s.pred.toFixed(2)+'</td>'
      +'<td class="muted">'+s.conf+'%</td>'
      +'<td><span class="risk-badge '+RISK_CLASS[s.risk]+'">'+s.risk+'</span></td>'
      +'</tr>';
  }).join('');
}

function filterStudents(val){
  buildStudentTable(val||'');
}

/* AUDIT LOGS */
var AUDIT_LOGS = [
  {time:'2025-06-18 15:12',user:'System',action:'RISK_ALERT',entity:'Juan Dela Cruz (201-001)',details:'Failure risk detected: GPA 2.45, declining trend',status:'warning'},
  {time:'2025-06-18 14:35',user:'Dr. Santos',action:'VIEW_REPORT',entity:'Student Report',details:'Generated comprehensive risk report for 7 students',status:'success'},
  {time:'2025-06-18 13:47',user:'Admin',action:'INTERVENTION_SCHEDULED',entity:'Pedro Santos (201-150)',details:'Academic counseling intervention scheduled for 6/20',status:'success'},
  {time:'2025-06-18 13:22',user:'Admin',action:'UPDATE_SETTINGS',entity:'System Configuration',details:'Changed alert threshold to 2.5 GPA minimum',status:'success'},
  {time:'2025-06-18 12:10',user:'System',action:'RUN_PREDICTION',entity:'Prediction Model',details:'Batch prediction run: 342 students, 18 high-risk identified',status:'success'},
  {time:'2025-06-18 11:45',user:'Dr. Santos',action:'ACKNOWLEDGE_ALERT',entity:'Critical Alert #234',details:'Acknowledged at-risk alert for Carlos Bautista',status:'success'},
  {time:'2025-06-18 10:30',user:'Admin',action:'EXPORT_DATA',entity:'At-Risk Report',details:'Exported critical alerts list (7 students, 89% avg risk)',status:'success'},
  {time:'2025-06-18 09:15',user:'System',action:'BACKUP_DB',entity:'Database',details:'Automatic backup completed with student data - 2.4 GB',status:'success'},
  {time:'2025-06-17 16:42',user:'Admin',action:'ADD_INTERVENTION',entity:'Tutoring Program',details:'Enrolled Rosa Manalang in remedial math tutoring',status:'success'},
  {time:'2025-06-17 14:20',user:'Dr. Santos',action:'ASSIGN_MENTOR',entity:'Student Mentor',details:'Assigned mentor to Ana Reyes for academic support',status:'success'},
];

function buildAuditLogs(){
  var tbody = document.getElementById('audit-tbody');
  if(!tbody) return;
  tbody.innerHTML = AUDIT_LOGS.map(function(l){
    var actionLabel = l.action.replace(/_/g,' ');
    var badgeClass = l.status === 'warning' ? 'risk-high' : 'risk-low';
    return '<tr>'
      +'<td class="muted" style="font-size:11px;">'+l.time+'</td>'
      +'<td>'+l.user+'</td>'
      +'<td><span style="font-family:monospace;font-size:11px;background:rgba(0,0,0,0.04);padding:4px 8px;border-radius:4px;">'+l.action+'</span></td>'
      +'<td class="muted">'+l.entity+'</td>'
      +'<td style="font-size:11px;">'+l.details+'</td>'
      +'<td><span class="risk-badge '+badgeClass+'">'+l.status+'</span></td>'
      +'</tr>';
  }).join('');
}

/* ALERTS */
var ALERTS_DATA = [
  {name:'Juan Dela Cruz',id:'202301-001-003',gpa:2.45,desc:'<i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i> CRITICAL: Predicted GPA 2.45 — HIGH FAILURE RISK',sev:'critical',time:'2h ago',risk:'85%'},
  {name:'Pedro Santos',id:'202301-002-150',gpa:1.8,desc:'<i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i> CRITICAL: GPA dropped to 1.8 — PROBATION & FAILURE RISK',sev:'critical',time:'4h ago',risk:'92%'},
  {name:'Rosa Manalang',id:'202301-003-087',gpa:2.15,desc:'<i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i> CRITICAL: Low GPA 2.15 — Graduation delay + failure risk',sev:'critical',time:'1h ago',risk:'78%'},
  {name:'Marco Tan',id:'202301-004-065',gpa:2.62,desc:'<i class="fas fa-bell" style="color:#f59e0b;"></i> HIGH: 3 semesters below 3.0 — trajectory declining',sev:'high',time:'6h ago',risk:'68%'},
  {name:'Ana Reyes',id:'202301-005-112',gpa:2.55,desc:'<i class="fas fa-bell" style="color:#f59e0b;"></i> HIGH: Attendance dropped 35% this semester',sev:'high',time:'8h ago',risk:'71%'},
  {name:'Luz Ramos',id:'202301-006-234',gpa:2.8,desc:'<i class="fas fa-thumbtack" style="color:#fbbf24;"></i> MEDIUM: Missing 2 prerequisites for advanced courses',sev:'medium',time:'1d ago',risk:'45%'},
  {name:'Carlos Bautista',id:'202301-007-098',gpa:2.35,desc:'<i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i> CRITICAL: Failing 2 current subjects — intervention needed',sev:'critical',time:'2d ago',risk:'89%'},
];
var ALERT_ICONS = {critical:'<i class="fas fa-exclamation-triangle"></i>',high:'<i class="fas fa-bell"></i>',medium:'<i class="fas fa-thumbtack"></i>',low:'<i class="fas fa-info-circle"></i>'};

function buildAlertsList(){
  var el = document.getElementById('alerts-list');
  if(!el) return;
  el.innerHTML = ALERTS_DATA.map(function(a){
    return '<div class="alert-item '+a.sev+'">'
      +'<div class="alert-icon '+a.sev+'">'+ALERT_ICONS[a.sev]+'</div>'
      +'<div style="flex:1;">'
      +'<div class="alert-name">'+a.name+' <span style="color:#666;font-size:11px;font-weight:400;">('+a.id+')</span></div>'
      +'<div class="alert-desc">'+a.desc+'</div>'
      +'<div style="display:flex;gap:16px;margin-top:6px;font-size:12px;">'
      +'<span><i class="fas fa-chart-bar"></i> GPA: <strong>'+a.gpa+'</strong></span>'
      +'<span><i class="fas fa-bolt"></i> Failure Risk: <strong style="color:'+[a.sev=='critical'?'#dc2626':'a.sev==\'high\'?\'#f59e0b\':\'#10b981\''][0]+'">'+a.risk+'</strong></span>'
      +'</div>'
      +'<div class="alert-time">'+a.time+'</div>'
      +'</div>'
      +'<div class="alert-meta">'
      +'<span class="risk-badge risk-'+a.sev+'">'+a.sev+'</span><br/>'
      +'<button class="btn-sm btn-outline-sm" style="margin-top:8px;font-size:10px;" onclick="alert(\'Intervention scheduled for '+a.name+'\');">Intervene</button>'
      +'</div>'
      +'</div>';
  }).join('');
}
