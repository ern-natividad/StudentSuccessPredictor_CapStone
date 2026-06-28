/* ═══════════════════════════════════
   INTERVENTION TRACKING LOGIC
═══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function(){
  initIntervention();
});

function initIntervention(){
  buildInterventionChart();
  buildImpactChart();
}

function buildInterventionChart(){
  var ctx = document.getElementById('intervention-chart');
  if(!ctx || ctx._ch) return;
  ctx._ch = new Chart(ctx, {
    type:'doughnut',
    data:{
      labels:['Academic Tutoring','Career Guidance','Counseling','Academic Advising','Financial Aid'],
      datasets:[{
        data:[45,28,18,12,8],
        backgroundColor:['#C9A200','#2d7a4f','#d47000','#4a90a4','#8B5BA4'],
        borderWidth:3,
        borderColor:'#fff'
      }]
    },
    options:{
      cutout:'65%',
      plugins:{
        legend:{position:'bottom',labels:{font:{size:9},boxWidth:8,padding:8}},
        tooltip:{callbacks:{label:function(c){return c.label+': '+c.raw+' sessions';}}}
      }
    }
  });
}

function buildImpactChart(){
  var ctx = document.getElementById('impact-chart');
  if(!ctx || ctx._ch) return;
  ctx._ch = new Chart(ctx, {
    type:'bar',
    data:{
      labels:['Before','After'],
      datasets:[{
        label:'Average GPA',
        data:[2.65,2.94],
        backgroundColor:['#c0c0c0','var(--green)'],
        borderWidth:0
      }]
    },
    options:{
      indexAxis:'y',
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:function(c){return 'GPA: '+c.raw.toFixed(2);}}}
      },
      scales:{
        x:{beginAtZero:true,max:4.0}
      }
    }
  });
}

function showPage(id){
  document.querySelectorAll('.page-view').forEach(function(v){v.classList.remove('active');});
  document.querySelectorAll('.nav-item,.sidebar-item').forEach(function(b){b.classList.remove('active');});
  var pg = document.getElementById('pg-'+id);
  if(pg) pg.classList.add('active');
  var navItem = document.querySelector('[onclick*="showPage(\''+id+'\')"]');
  if(navItem) navItem.classList.add('active');
}
