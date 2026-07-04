(function(){
  const card = document.getElementById('card');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const dodgeCounter = document.getElementById('dodgeCounter');
  const inviteStage = document.getElementById('inviteStage');
  const planner = document.getElementById('planner');
  const success = document.getElementById('success');

  /* ---------------- Runaway "No" button ---------------- */
  const noPhrases = ["nope", "try again", "not today", "can't catch me", "nice try", "still no", "keep trying?"];
  let dodgeCount = 0;
  let isDodging = false;
  let lastDodgeTime = 0;

  function moveNoButton(){
    const btnRect = noBtn.getBoundingClientRect();
    const w = btnRect.width || 100;
    const h = btnRect.height || 50;
    const margin = 24;
    const maxX = Math.max(margin, window.innerWidth - w - margin);
    const maxY = Math.max(margin, window.innerHeight - h - margin);
    const newX = margin + Math.random() * (maxX - margin);
    const newY = margin + Math.random() * (maxY - margin);

    if(!isDodging){
      noBtn.classList.add('dodging');
      isDodging = true;
    }
    noBtn.style.left = newX + 'px';
    noBtn.style.top = newY + 'px';

    dodgeCount++;
    dodgeCounter.textContent = dodgeCount === 1
      ? "the 'no' button just ran away."
      : `${noPhrases[dodgeCount % noPhrases.length]} — attempts dodged: ${dodgeCount}`;
    dodgeCounter.classList.add('show');
  }

  function proximityCheck(clientX, clientY){
    const rect = noBtn.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    const now = Date.now();
    if(dist < 110 && now - lastDodgeTime > 180){
      lastDodgeTime = now;
      moveNoButton();
    }
  }

  document.addEventListener('mousemove', (e) => proximityCheck(e.clientX, e.clientY));
  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if(t) proximityCheck(t.clientX, t.clientY);
  }, {passive:true});

  noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveNoButton();
  }, {passive:false});

  noBtn.addEventListener('mouseenter', moveNoButton);
  noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    moveNoButton();
  });

  window.addEventListener('resize', () => {
    if(isDodging) moveNoButton();
  });

  /* ---------------- Yes -> open envelope + planner ---------------- */
  yesBtn.addEventListener('click', () => {
    card.classList.add('opened');
    setTimeout(() => {
      inviteStage.style.display = 'none';
      planner.classList.add('show');
      planner.scrollIntoView({behavior:'smooth', block:'center'});
    }, 550);
  });

  /* ---------------- Calendar ---------------- */
  const calMonth = document.getElementById('calMonth');
  const calGrid = document.getElementById('calGrid');
  const prevMonth = document.getElementById('prevMonth');
  const nextMonth = document.getElementById('nextMonth');
  const confirmBtn = document.getElementById('confirmBtn');
  const noteField = document.getElementById('noteField');
  const errorMsg = document.getElementById('errorMsg');

  const today = new Date();
  today.setHours(0,0,0,0);
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = null;

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dowNames = ["S","M","T","W","T","F","S"];
  const MAX_MONTHS_AHEAD = 3;

  function renderCalendar(){
    calGrid.innerHTML = '';
    dowNames.forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-dow';
      el.textContent = d;
      calGrid.appendChild(el);
    });

    calMonth.textContent = `${monthNames[viewMonth]} ${viewYear}`;

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for(let i=0;i<firstDay;i++){
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      calGrid.appendChild(empty);
    }

    for(let d=1; d<=daysInMonth; d++){
      const cellDate = new Date(viewYear, viewMonth, d);
      cellDate.setHours(0,0,0,0);
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = d;

      if(cellDate < today){
        cell.classList.add('disabled');
      } else {
        if(cellDate.getTime() === today.getTime()) cell.classList.add('today');
        if(selectedDate && cellDate.getTime() === selectedDate.getTime()) cell.classList.add('selected');
        cell.addEventListener('click', () => {
          selectedDate = cellDate;
          confirmBtn.disabled = false;
          renderCalendar();
        });
      }
      calGrid.appendChild(cell);
    }

    const monthsFromNow = (viewYear - today.getFullYear()) * 12 + (viewMonth - today.getMonth());
    prevMonth.disabled = monthsFromNow <= 0;
    nextMonth.disabled = monthsFromNow >= MAX_MONTHS_AHEAD;
  }

  prevMonth.addEventListener('click', () => {
    viewMonth--;
    if(viewMonth < 0){ viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  nextMonth.addEventListener('click', () => {
    viewMonth++;
    if(viewMonth > 11){ viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  renderCalendar();

  /* ---------------- Confirm -> send to Flask backend ---------------- */
  const successDate = document.getElementById('successDate');

  function formatDate(d){
    const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
    return d.toLocaleDateString('en-US', opts);
  }

  confirmBtn.addEventListener('click', async () => {
    if(!selectedDate) return;
    const formatted = formatDate(selectedDate);
    const note = noteField.value.trim();

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Locking it in...';
    errorMsg.textContent = '';

    try{
      const res = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: formatted, note })
      });
      const result = await res.json();

      if(!res.ok || !result.ok){
        throw new Error(result.error || 'Something went wrong');
      }

      successDate.textContent = `${formatted} it is.`;
      planner.classList.remove('show');
      success.classList.add('show');
      success.scrollIntoView({behavior:'smooth', block:'center'});
    }catch(err){
      errorMsg.textContent = "Couldn't save that — please try again.";
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Lock it in →';
    }
  });
})();
