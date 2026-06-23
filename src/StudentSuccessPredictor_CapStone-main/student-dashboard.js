/* ═══════════════════════════════════
   STUDENT DASHBOARD LOGIC
═══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function(){
  initializeStudent();
  initDashboard();
});

function initializeStudent(){
  var userName = sessionStorage.getItem('userName') || 'Juan Dela Cruz';
  var initials = userName.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase();
  document.getElementById('nav-uname').textContent = userName;
  document.getElementById('nav-urole').textContent = 'Engineering Student · 3rd Year';
  document.getElementById('nav-avatar').textContent = initials;
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('profile-name').textContent = userName;
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
  buildGpaTrendChart();
  buildMyAlerts();
  buildSimSliders();
  updateSim();
}

/* MY GPA TREND */
function buildGpaTrendChart(){
  var ctx = document.getElementById('gpa-trend-chart');
  if(!ctx || ctx._ch) return;
  ctx._ch = new Chart(ctx, {
    type:'line',
    data:{
      labels:['1st Sem Y1','2nd Sem Y1','1st Sem Y2','2nd Sem Y2','1st Sem Y3','2nd Sem Y3 ▸'],
      datasets:[
        {
          label:'My GPA',
          data:[3.2,3.15,2.95,2.90,2.85,null],
          borderColor:'#d47000',
          backgroundColor:'rgba(212,112,0,0.08)',
          pointBackgroundColor:'#d47000',
          tension:.4,
          fill:true,
          borderWidth:2.5
        },
        {
          label:'Target GPA',
          data:[3.0,3.0,3.0,3.0,3.0,3.0],
          borderColor:'#2d7a4f',
          borderDash:[5,4],
          tension:.4,
          borderWidth:2
        }
      ]
    },
    options:{
      plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10,padding:12}}},
      scales:{
        y:{min:2.0,max:4.0,grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:10}}},
        x:{grid:{display:false},ticks:{font:{size:10}}}
      },
      elements:{point:{radius:4}}
    }
  });
}

/* MY ALERTS */
var MY_ALERTS = [
  {desc:'Your Design Studio grade is C+. Recommended: Schedule tutoring to improve to B-level.',sev:'high',icon:'<i class="fas fa-exclamation-triangle"></i>'},
  {desc:'Your predicted graduation GPA is 2.72. Keep up with your current study plan to maintain status.',sev:'medium',icon:'<i class="fas fa-thumbtack"></i>'},
];

function buildMyAlerts(){
  var el = document.getElementById('my-alerts-list');
  if(!el) return;
  el.innerHTML = MY_ALERTS.map(function(a,i){
    return '<div class="alert-item '+a.sev+'" style="margin-bottom:'+(i<MY_ALERTS.length-1?'0':'0px')+';border-bottom:'+(i<MY_ALERTS.length-1?'1px solid rgba(0,0,0,0.05)':'0')+';">'
      +'<div class="alert-icon '+a.sev+'" style="margin-top:0;">'+a.icon+'</div>'
      +'<div style="flex:1;">'
      +'<div class="alert-desc" style="margin-top:0;">'+a.desc+'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  var elFull = document.getElementById('my-alerts-full');
  if(elFull){
    elFull.innerHTML = MY_ALERTS.map(function(a,i){
      return '<div class="alert-item '+a.sev+'" style="margin-bottom:'+(i<MY_ALERTS.length-1?'0':'0px')+';border-bottom:'+(i<MY_ALERTS.length-1?'1px solid rgba(0,0,0,0.05)':'0')+';">'
        +'<div class="alert-icon '+a.sev+'">'+a.icon+'</div>'
        +'<div style="flex:1;">'
        +'<div class="alert-desc">'+a.desc+'</div>'
        +'</div>'
        +'<button class="btn-sm btn-outline-sm" style="margin-left:12px;font-size:10px;flex-shrink:0;">Acknowledge</button>'
        +'</div>';
    }).join('');
  }
}

/* WHAT-IF SIMULATOR */
var simVals = [2.3,3.0,4.0,2.7,3.7];
var courseNames = ['Design Studio III','Structures II','Building Tech','History & Theory','Professional Practice'];

function buildSimSliders(){
  // Sliders already in HTML
}

function simChange(idx, val){
  simVals[idx] = parseFloat(val);
  document.getElementById('sv-'+idx).textContent = parseFloat(val).toFixed(1);
  updateSim();
}

function updateSim(){
  var avg = simVals.reduce(function(a,b){return a+b;},0)/simVals.length;
  var base = 2.85;
  var pred = Math.min(4.0, Math.max(1.0, (base*0.4 + avg*0.6)));
  var delta = (pred-base).toFixed(2);
  var risk = pred>=3?'Low':pred>=2.5?'Medium':pred>=2.0?'High':'Critical';
  
  document.getElementById('sim-gpa').textContent = pred.toFixed(2);
  document.getElementById('sim-gpa-d').textContent = (delta>=0?'+':'') + delta + ' from current';
  document.getElementById('sim-gpa-d').className = 'sim-result-delta' + (delta<0?' neg':'');
  document.getElementById('sim-risk').textContent = risk;
  document.getElementById('sim-risk-d').textContent = (pred<2.85?'↓':'↑') + ' Risk: '+risk;
  document.getElementById('sim-conf').textContent = Math.round(80+avg*2)+'%';
  
  var insight = '';
  if(avg<2.5)insight = 'Your grades are too low. Urgent: Meet with your advisor for academic intervention.';
  else if(avg<2.85)insight = 'You\'re below your current average. Focus on courses with lower grades first.';
  else if(avg<3.0)insight = 'You\'re on track! With consistent effort, you can reach Medium risk tier.';
  else if(avg<3.2)insight = 'Great progress! A little more focus will move you to Low risk tier.';
  else insight = 'Excellent! Keep this pace and you\'ll graduate with a strong GPA and Low risk status.';
  
  document.getElementById('sim-insight').textContent = insight;
}
