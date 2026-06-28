/* ═══════════════════════════════════
   SCREENING MODULE LOGIC
═══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function(){
  initScreening();
});

function initScreening(){
  buildApplicantsList();
  buildReadinessChart();
}

/* APPLICANTS DATA */
var APPLICANTS = [
  {id:'APP001',name:'Maria Santos',dept:'CCS',cet:92,gwa:3.85,status:'completed',readiness:4.9,rec:'RECOMMENDED'},
  {id:'APP002',name:'Juan Reyes',dept:'COE',cet:88,gwa:3.72,status:'completed',readiness:4.8,rec:'RECOMMENDED'},
  {id:'APP003',name:'Ana Garcia',dept:'CAS',cet:85,gwa:3.65,status:'completed',readiness:4.5,rec:'POSSIBLE'},
  {id:'APP004',name:'Carlos Mendoza',dept:'CCS',cet:91,gwa:3.81,status:'completed',readiness:4.7,rec:'RECOMMENDED'},
  {id:'APP005',name:'Rosa Lim',dept:'COE',cet:79,gwa:3.45,status:'pending',readiness:null,rec:null},
  {id:'APP006',name:'Pedro Cruz',dept:'CAS',cet:84,gwa:3.62,status:'pending',readiness:null,rec:null},
];

var RUBRICS = {
  'CCS': {
    criteria: [
      {name:'Communication Skills',weight:0.20},
      {name:'Technical Aptitude',weight:0.30},
      {name:'Problem Solving',weight:0.25},
      {name:'Teamwork',weight:0.25}
    ]
  },
  'COE': {
    criteria: [
      {name:'Technical Foundation',weight:0.35},
      {name:'Design Thinking',weight:0.25},
      {name:'Lab Safety Knowledge',weight:0.20},
      {name:'Project Implementation',weight:0.20}
    ]
  },
  'CAS': {
    criteria: [
      {name:'Critical Thinking',weight:0.30},
      {name:'Communication',weight:0.25},
      {name:'Research Skills',weight:0.25},
      {name:'Collaboration',weight:0.20}
    ]
  }
};

var currentApplicant = null;
var evaluationScores = {};

function buildApplicantsList(){
  var list = document.getElementById('applicants-list');
  if(!list) return;
  list.innerHTML = APPLICANTS.map(function(a){
    var readinessDisplay = a.readiness ? a.readiness.toFixed(1) : '—';
    var recDisplay = a.rec ? a.rec : '—';
    var statusClass = a.status === 'completed' ? 'risk-low' : 'risk-medium';
    return '<tr>'
      +'<td class="muted">'+a.id+'</td>'
      +'<td>'+a.name+'</td>'
      +'<td class="muted">'+a.dept+'</td>'
      +'<td><span style="font-weight:600;color:var(--gold);">'+a.cet+'</span></td>'
      +'<td><span style="font-weight:600;">'+a.gwa.toFixed(2)+'</span></td>'
      +'<td><span class="risk-badge '+statusClass+'">'+(a.status==='completed'?'✓ Completed':'⏳ Pending')+'</span></td>'
      +'<td><span style="font-weight:600;">'+readinessDisplay+'</span></td>'
      +'<td><button class="btn-sm btn-outline-sm" onclick="loadApplicant(\''+a.id+'\')">Evaluate</button></td>'
      +'</tr>';
  }).join('');
}

function loadApplicant(appId){
  currentApplicant = APPLICANTS.find(function(a){return a.id===appId;});
  if(!currentApplicant) return;
  
  showPage('screening');
  
  document.getElementById('sc-name').textContent = currentApplicant.name;
  document.getElementById('sc-id').textContent = currentApplicant.id;
  document.getElementById('sc-dept').textContent = currentApplicant.dept;
  document.getElementById('sc-cet').textContent = currentApplicant.cet;
  document.getElementById('sc-gwa').textContent = currentApplicant.gwa.toFixed(2);
  
  buildEvaluationRubric();
  
  document.getElementById('screening-content').style.display = 'block';
  document.getElementById('no-screening').style.display = 'none';
}

function buildEvaluationRubric(){
  var rubric = RUBRICS[currentApplicant.dept];
  if(!rubric) return;
  
  var container = document.getElementById('rubric-criteria');
  if(!container) return;
  
  evaluationScores = {};
  
  container.innerHTML = rubric.criteria.map(function(c,i){
    evaluationScores[i] = 0;
    var stars = '';
    for(var s=1;s<=5;s++){
      stars += '<span class="star" onclick="setScore('+i+','+s+')" data-value="'+s+'">★</span>';
    }
    return '<div class="rubric-card">'
      +'<div style="font-weight:600;margin-bottom:8px;">'+c.name+'</div>'
      +'<div style="display:flex;align-items:center;justify-content:space-between;">'
      +'<div class="star-rating" id="stars-'+i+'">'+stars+'</div>'
      +'<div style="font-weight:600;color:var(--gold);" id="score-'+i+'>0</div>'
      +'</div>'
      +'</div>';
  }).join('');
}

function setScore(criterionIdx, score){
  evaluationScores[criterionIdx] = score;
  document.getElementById('score-'+criterionIdx).textContent = score;
  
  var stars = document.querySelectorAll('#stars-'+criterionIdx+' .star');
  stars.forEach(function(s,i){
    if(i+1<=score) s.classList.add('active');
    else s.classList.remove('active');
  });
  
  calculateWeightedScore();
}

function calculateWeightedScore(){
  var rubric = RUBRICS[currentApplicant.dept];
  var weightedSum = 0;
  
  for(var i=0;i<rubric.criteria.length;i++){
    var score = evaluationScores[i] || 0;
    weightedSum += score * rubric.criteria[i].weight;
  }
  
  document.getElementById('weighted-score').textContent = weightedSum.toFixed(2);
  
  var rec = '';
  if(weightedSum >= 4.0) rec = '<span style="color:var(--green);">✓ RECOMMENDED</span>';
  else if(weightedSum >= 3.0) rec = '<span style="color:var(--orange);">? POSSIBLE</span>';
  else rec = '<span style="color:var(--red);">✗ NOT RECOMMENDED</span>';
  
  document.getElementById('recommendation').innerHTML = rec;
}

function submitEvaluation(){
  var notes = document.getElementById('eval-notes').value;
  var rubric = RUBRICS[currentApplicant.dept];
  var weightedSum = 0;
  
  for(var i=0;i<rubric.criteria.length;i++){
    var score = evaluationScores[i] || 0;
    weightedSum += score * rubric.criteria[i].weight;
  }
  
  var rec = weightedSum >= 4.0 ? 'RECOMMENDED' : weightedSum >= 3.0 ? 'POSSIBLE' : 'NOT RECOMMENDED';
  
  currentApplicant.status = 'completed';
  currentApplicant.readiness = weightedSum;
  currentApplicant.rec = rec;
  
  alert('Evaluation saved for '+currentApplicant.name);
  buildApplicantsList();
  showPage('applicants');
}

function cancelEvaluation(){
  currentApplicant = null;
  document.getElementById('eval-notes').value = '';
  document.getElementById('screening-content').style.display = 'none';
  document.getElementById('no-screening').style.display = 'block';
}

function showPage(id){
  document.querySelectorAll('.page-view').forEach(function(v){v.classList.remove('active');});
  document.querySelectorAll('.nav-item,.sidebar-item').forEach(function(b){b.classList.remove('active');});
  var pg = document.getElementById('pg-'+id);
  if(pg) pg.classList.add('active');
  var navItem = document.querySelector('[onclick*="showPage(\''+id+'\')"]');
  if(navItem) navItem.classList.add('active');
}

function buildReadinessChart(){
  var ctx = document.getElementById('readiness-chart');
  if(!ctx || ctx._ch) return;
  ctx._ch = new Chart(ctx, {
    type:'bar',
    data:{
      labels:['Recommended\n(≥4.0)','Possible\n(3.0-3.99)','Not Recommended\n(<3.0)'],
      datasets:[{
        label:'Applicants',
        data:[87,76,24],
        backgroundColor:['#2d7a4f','#C9A200','#d47000'],
        borderWidth:0
      }]
    },
    options:{
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:function(c){return c.raw+' applicants';}}}
      },
      scales:{
        y:{beginAtZero:true}
      }
    }
  });
}
