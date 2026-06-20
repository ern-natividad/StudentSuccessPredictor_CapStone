/* ═══════════════════════════════════
   DASHBOARD LOGIC
═══════════════════════════════════ */

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function(){
  initializeUser();
  initDashboard();
});

function initializeUser(){
  // Get user info from session storage
  var userName = sessionStorage.getItem('userName') || 'Juan Dela Cruz';
  var userRole = sessionStorage.getItem('userRole') || 'student';
  
  var initials = userName.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase();
  document.getElementById('nav-uname').textContent = userName;
  document.getElementById('nav-urole').textContent = 'Architecture ' + capitalize(userRole) + ' · 3rd Year';
  document.getElementById('nav-avatar').textContent = initials;
}

function capitalize(s){
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function doLogout(){
  sessionStorage.clear();
  window.location.href = 'auth.html';
}

/* ═══════════════════════════════════
   NAVIGATION
═══════════════════════════════════ */
function showPage(id){
  document.querySelectorAll('.page-view').forEach(function(v){v.classList.remove('active');});
  document.querySelectorAll('.nav-item,.sidebar-item').forEach(function(b){b.classList.remove('active');});
  var pg = document.getElementById('pg-'+id);
  if(pg) pg.classList.add('active');
  
  // Set active nav items
  var navItem = document.querySelector('[onclick*="showPage(\''+id+'\')"]');
  if(navItem) navItem.classList.add('active');
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

/* ═══════════════════════════════════
   DASHBOARD INIT
═══════════════════════════════════ */
function initDashboard(){
  buildRiskChart();
  buildGpaTrendChart();
  buildRecentAlerts();
  buildStudentTable();
  buildAlertsList();
  buildRubric();
  buildSimSliders();
  buildSimChart();
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

/* GPA TREND */
function buildGpaTrendChart(){
  var ctx = document.getElementById('gpa-trend-chart');
  if(!ctx || ctx._ch) return;
  ctx._ch = new Chart(ctx, {
    type:'line',
    data:{
      labels:['1st Sem Y1','2nd Sem Y1','1st Sem Y2','2nd Sem Y2','1st Sem Y3','2nd Sem Y3 ▸'],
      datasets:[
        {
          label:'Cohort Average',
          data:[2.9,3.0,3.05,3.1,3.08,null],
          borderColor:'#C9A200',
          backgroundColor:'rgba(197,162,0,0.08)',
          pointBackgroundColor:'#C9A200',
          tension:.4,
          fill:true,
          borderWidth:2.5
        },
        {
          label:'Predicted',
          data:[null,null,null,null,3.08,3.14],
          borderColor:'#8B6F00',
          borderDash:[5,4],
          pointStyle:'circle',
          pointBorderColor:'#8B6F00',
          pointBackgroundColor:'#fff',
          tension:.4,
          borderWidth:2
        }
      ]
    },
    options:{
      plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10,padding:12}}},
      scales:{
        y:{min:2.5,max:4.0,grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:10}}},
        x:{grid:{display:false},ticks:{font:{size:10}}}
      },
      elements:{point:{radius:4}}
    }
  });
}

/* RECENT ALERTS */
var ALERTS_DATA = [
  {name:'Juan Dela Cruz',desc:'Predicted GPA below 2.5 — academic risk detected',sev:'critical',time:'2h ago'},
  {name:'Pedro Santos',desc:'Current semester GPA dropped to 1.8 — probation risk',sev:'critical',time:'4h ago'},
  {name:'Rosa Manalang',desc:'Graduation delay probability exceeded 20%',sev:'high',time:'1d ago'},
  {name:'Marco Tan',desc:'3 consecutive semesters below 3.0 GPA',sev:'high',time:'2d ago'},
  {name:'Luz Ramos',desc:'Missing prerequisite subjects for thesis enrollment',sev:'medium',time:'3d ago'},
];
var ALERT_ICONS = {critical:'<i class="fas fa-exclamation-triangle"></i>',high:'<i class="fas fa-bell"></i>',medium:'<i class="fas fa-thumbtack"></i>',low:'<i class="fas fa-info-circle"></i>'};

function buildRecentAlerts(){
  var el = document.getElementById('recent-alerts-list');
  if(!el) return;
  el.innerHTML = ALERTS_DATA.slice(0,4).map(function(a){
    return '<div class="alert-item '+a.sev+'" onclick="showPage(\'alerts\')">'
      +'<div class="alert-icon '+a.sev+'">'+ALERT_ICONS[a.sev]+'</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div class="alert-name">'+a.name+'</div>'
      +'<div class="alert-desc" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+a.desc+'</div>'
      +'</div>'
      +'<div style="font-size:10px;color:var(--sand);flex-shrink:0;margin-left:8px;">'+a.time+'</div>'
      +'</div>';
  }).join('');
}

/* ALERTS LIST */
function buildAlertsList(){
  var el = document.getElementById('alerts-list');
  if(!el) return;
  el.innerHTML = ALERTS_DATA.map(function(a){
    return '<div class="alert-item '+a.sev+'">'
      +'<div class="alert-icon '+a.sev+'">'+ALERT_ICONS[a.sev]+'</div>'
      +'<div style="flex:1;">'
      +'<div class="alert-name">'+a.name+'</div>'
      +'<div class="alert-desc">'+a.desc+'</div>'
      +'<div class="alert-time">'+a.time+'</div>'
      +'</div>'
      +'<div class="alert-meta">'
      +'<span class="risk-badge risk-'+a.sev+'">'+a.sev+'</span><br/>'
      +'<button class="btn-sm btn-outline-sm" style="margin-top:8px;font-size:10px;">Acknowledge</button>'
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

/* RUBRIC SCORING */
var ARCH_RUBRIC = [
  {name:'Spatial Reasoning',weight:'25%',wt:0.25},
  {name:'Design Communication',weight:'25%',wt:0.25},
  {name:'Technical Aptitude',weight:'30%',wt:0.30},
  {name:'Creativity & Innovation',weight:'20%',wt:0.20},
];
var scores = {};

function buildRubric(){
  var el = document.getElementById('rubric-criteria');
  if(!el) return;
  ARCH_RUBRIC.forEach(function(c,i){
    scores[i] = 0;
    var stars = '';
    for(var s=1;s<=5;s++){
      stars += '<span class="star" data-crit="'+i+'" data-val="'+s+'" onclick="setScore('+i+','+s+')">★</span>';
    }
    el.innerHTML += '<div class="screening-crit">'
      +'<div class="screening-crit-head"><span class="screening-crit-name">'+c.name+'</span><span class="screening-crit-weight">'+c.weight+'</span></div>'
      +'<div class="star-rating" id="stars-'+i+'">'+stars+'</div>'
      +'</div>';
  });
  updateRubricResult();
}

function setScore(crit, val){
  scores[crit] = val;
  var container = document.getElementById('stars-'+crit);
  container.querySelectorAll('.star').forEach(function(s,i){
    s.classList.toggle('filled',i<val);
  });
  updateRubricResult();
}

function updateRubricResult(){
  var total = ARCH_RUBRIC.reduce(function(sum,c,i){return sum+(scores[i]||0)*c.wt;},0);
  var el = document.getElementById('rubric-result');
  if(!el) return;
  var rec='', cls='', icon='';
  if(total>=4){rec='Recommended';cls='recommended';icon='✓';}
  else if(total>=3){rec='Possible';cls='possible';icon='?';}
  else{rec='Not Recommended';cls='not-recommended';icon='✗';}
  var scoreDisp = total>0?total.toFixed(2):'—';
  el.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
    +'<span style="font-size:12px;color:var(--stone);">Baseline readiness score</span>'
    +'<span style="font-size:22px;font-weight:700;color:var(--ink)">'+scoreDisp+' <span style="font-size:12px;font-weight:400;color:var(--sand)">/5.0</span></span>'
    +'</div>'
    +(total>0?'<div class="rec-box '+cls+'"><span class="rec-icon">'+icon+'</span>'+rec+'</div>':'');
}

function saveScreening(){
  alert('Evaluation saved successfully!');
}

/* WHAT-IF SIMULATOR */
var SIM_SEMS = ['Sem 3 Y2','Sem 1 Y3','Sem 2 Y3','Sem 1 Y4','Sem 2 Y4','Sem 1 Y5'];
var simVals = [2.85,2.9,2.95,3.0,3.05,3.1];

function buildSimSliders(){
  var el = document.getElementById('sim-sliders');
  if(!el) return;
  el.innerHTML = '';
  SIM_SEMS.forEach(function(sem,i){
    el.innerHTML += '<div class="sim-slider-group">'
      +'<div class="sim-slider-head"><span class="sim-slider-label">'+sem+'</span><span class="sim-slider-val" id="sv-'+i+'">'+simVals[i].toFixed(2)+'</span></div>'
      +'<input type="range" min="1.0" max="4.0" step="0.05" value="'+simVals[i]+'" oninput="simChange('+i+',this.value)"/>'
      +'</div>';
  });
}

function simChange(idx, val){
  simVals[idx] = parseFloat(val);
  document.getElementById('sv-'+idx).textContent = parseFloat(val).toFixed(2);
  updateSim();
}

function updateSim(){
  var avg = simVals.reduce(function(a,b){return a+b;},0)/simVals.length;
  var pred = Math.min(4.0, Math.max(1.0, (2.85*0.4 + avg*0.6)));
  var base = 2.85;
  var delta = (pred-base).toFixed(2);
  var risk = pred>=3?'Low':pred>=2.5?'Medium':pred>=2.0?'High':'Critical';
  document.getElementById('sim-gpa').textContent = pred.toFixed(2);
  document.getElementById('sim-gpa-d').textContent = (delta>=0?'+':'') + delta + ' from baseline';
  document.getElementById('sim-gpa-d').className = 'sim-result-delta' + (delta<0?' neg':'');
  document.getElementById('sim-risk').textContent = risk;
  document.getElementById('sim-risk-d').textContent = risk==='Low'?'↑ from High':'Current: '+risk;
  document.getElementById('sim-conf').textContent = Math.round(80+avg*2)+'%';
  var insight = 'Maintaining a '+avg.toFixed(1)+'+ average puts this student in the '+risk+' risk tier. ';
  if(avg<2.5)insight += 'Immediate academic intervention is recommended.';
  else if(avg<3.0)insight += 'Consider tutoring in Design Studio and Architectural Theory for GPA improvement.';
  else insight += 'Student is on track for a successful graduation. Keep monitoring.';
  document.getElementById('sim-insight').textContent = insight;
  updateSimChart(pred, base);
}

var simChartInst = null;
function buildSimChart(){
  var ctx = document.getElementById('sim-chart');
  if(!ctx) return;
  var base = 2.85;
  simChartInst = new Chart(ctx, {
    type:'line',
    data:{
      labels:['Now'].concat(SIM_SEMS),
      datasets:[
        {
          label:'Baseline',
          data:[base,2.85,2.88,2.90,2.92,2.93,2.95],
          borderColor:'rgba(0,0,0,0.2)',
          borderDash:[4,3],
          tension:.4,
          pointRadius:3,
          borderWidth:1.5
        },
        {
          label:'Simulated',
          data:[base].concat(simVals),
          borderColor:'#C9A200',
          backgroundColor:'rgba(197,162,0,0.07)',
          tension:.4,
          fill:true,
          pointRadius:4,
          pointBackgroundColor:'#C9A200',
          borderWidth:2.5
        }
      ]
    },
    options:{
      plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10}}},
      scales:{y:{min:1.5,max:4.0,ticks:{font:{size:10}}},x:{ticks:{font:{size:10}},grid:{display:false}}},
      elements:{point:{radius:3}}
    }
  });
}

function updateSimChart(pred, base){
  if(!simChartInst) return;
  simChartInst.data.datasets[1].data = [base].concat(simVals);
  simChartInst.update('none');
}
