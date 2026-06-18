/* ═══════════════════════════════════
   REPORTS & ANALYTICS LOGIC
═══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function(){
  initReports();
});

function initReports(){
  buildReportTrendChart();
  buildRiskDistributionChart();
}

function showPage(id){
  document.querySelectorAll('.page-view').forEach(function(v){v.classList.remove('active');});
  document.querySelectorAll('.nav-item,.sidebar-item').forEach(function(b){b.classList.remove('active');});
  var pg = document.getElementById('pg-'+id);
  if(pg) pg.classList.add('active');
  var navItem = document.querySelector('[onclick*="showPage(\''+id+'\')"]');
  if(navItem) navItem.classList.add('active');
}

function buildReportTrendChart(){
  var ctx = document.getElementById('report-trend-chart');
  if(!ctx || ctx._ch) return;
  ctx._ch = new Chart(ctx, {
    type:'line',
    data:{
      labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets:[{
        label:'Reports Generated',
        data:[18,22,25,28,31,34,32,38,40,42,43,45],
        borderColor:'#C9A200',
        backgroundColor:'rgba(197,162,0,0.08)',
        tension:.4,
        fill:true,
        borderWidth:2.5
      }]
    },
    options:{
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:function(c){return c.raw+' reports';}}}
      },
      scales:{
        y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.05)'}}
      }
    }
  });
}

function buildRiskDistributionChart(){
  var ctx = document.getElementById('risk-dist-chart');
  if(!ctx || ctx._ch) return;
  ctx._ch = new Chart(ctx, {
    type:'doughnut',
    data:{
      labels:['Low Risk','Medium Risk','High Risk','Critical Risk'],
      datasets:[{
        data:[63.7,19.0,10.2,7.1],
        backgroundColor:['#2d7a4f','#C9A200','#d47000','#c0392b'],
        borderWidth:3,
        borderColor:'#fff'
      }]
    },
    options:{
      cutout:'72%',
      plugins:{
        legend:{position:'bottom',labels:{font:{size:10},boxWidth:10,padding:12}},
        tooltip:{callbacks:{label:function(c){return c.label+': '+c.raw+'%';}}}
      },
      responsive:true
    }
  });
}

function generateReport(){
  var reportType = document.getElementById('report-type').value;
  var format = document.querySelector('input[name="format"]:checked').value;
  
  alert('Report generation initiated!\n\nReport Type: '+reportType+'\nFormat: '+format.toUpperCase()+'\n\nA notification will be sent when ready.');
  
  showPage('history');
}

function quickReport(type){
  document.getElementById('report-type').value = type;
  showPage('generate');
  alert('Quick report configuration loaded: '+type);
}
