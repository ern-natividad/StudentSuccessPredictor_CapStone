
var ROLE_MAP = {'admin@wmsu.edu.ph':'admin','staff@wmsu.edu.ph':'staff','admin':'admin','staff':'staff'};
var VALID_CREDS = {'admin':'admin123','staff':'staff123','admin@wmsu.edu.ph':'admin123','staff@wmsu.edu.ph':'staff123','student':'student123'};

function getRole(email){ 
  return ROLE_MAP[email.toLowerCase()]||'student'; 
}

function toggleEye(inp, ico){
  var i = document.getElementById(inp);
  var icn = document.getElementById(ico);
  if(i.type === 'password'){
    i.type = 'text';
    icn.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    i.type = 'password';
    icn.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function checkPwReqs(val){
  var map = [
    {id:'r-len', ok:val.length >= 8},
    {id:'r-up', ok:/[A-Z]/.test(val)},
    {id:'r-num', ok:/[0-9]/.test(val)},
    {id:'r-sp', ok:/[^A-Za-z0-9]/.test(val)}
  ];
  map.forEach(function(r){
    var el = document.getElementById(r.id);
    el.className = 'req-pill' + (r.ok ? ' ok' : '');
  });
}

function doLogin(){
  var email = document.getElementById('l-email').value.trim();
  var pass = document.getElementById('l-pass').value;
  var err = document.getElementById('login-err');
  var msg = document.getElementById('login-err-msg');
  
  if(!email || !pass){
    msg.textContent = 'Please fill in all fields.';
    err.classList.remove('hidden');
    return;
  }
  
  // Validate credentials
  var emailLower = email.toLowerCase();
  if(!VALID_CREDS[emailLower] || VALID_CREDS[emailLower] !== pass){
    msg.textContent = 'Invalid email or password.';
    err.classList.remove('hidden');
    return;
  }
  
  err.classList.add('hidden');
  var role = getRole(emailLower);
  var name = emailLower.split('@')[0].replace('.',' ').replace(/\b\w/g, function(c){return c.toUpperCase();});
  
  // Redirect to dashboard
  launchDashboard(name, role);
}

function doSignup(){
  var fn = document.getElementById('su-fn').value.trim();
  var ln = document.getElementById('su-ln').value.trim();
  var email = document.getElementById('su-email').value.trim();
  var uid = document.getElementById('su-id').value.trim();
  var yr = document.getElementById('su-yr').value;
  var pass = document.getElementById('su-pass').value;
  var conf = document.getElementById('su-conf').value;
  var terms = document.getElementById('su-terms').checked;
  
  if(!fn || !ln || !email || !uid || !yr || !pass || !conf){
    alert('Please complete all fields.');
    return;
  }
  if(pass !== conf){
    alert('Passwords do not match.');
    return;
  }
  if(!terms){
    alert('Please accept the Terms of Service.');
    return;
  }
  
  var role = getRole(email);
  launchDashboard(fn + ' ' + ln, role);
}

function launchDashboard(name, role){
  // Store user info in session storage
  sessionStorage.setItem('userName', name);
  sessionStorage.setItem('userRole', role);
  
  // Role-based redirect
  if(role === 'admin' || role === 'staff'){
    window.location.href = 'admin-dashboard.html';
  } else {
    window.location.href = 'student-dashboard.html';
  }
}

function capitalize(s){
  return s.charAt(0).toUpperCase() + s.slice(1);
}
