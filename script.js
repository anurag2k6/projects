const API_BASE = 'http://localhost:5000/api';
const USER_STORAGE_KEY = 'event_portal_user';
const ADMIN_TOKEN_KEY = 'event_portal_admin_token';

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function setMessage(selector, message, type = 'info') {
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = message;
  el.style.color = type === 'error' ? '#c0392b' : '#27ae60';
}

function setLoading(selector, active) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = active ? 'Loading events...' : '';
}

function getUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function logoutUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  window.location = 'index.html';
}

function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.location = 'admin-login.html';
}

function redirectToRegister(targetUrl) {
  window.location = `register.html?redirect=${encodeURIComponent(targetUrl)}`;
}

function redirectToLogin(targetUrl) {
  window.location = `login.html?redirect=${encodeURIComponent(targetUrl)}`;
}

function ensureLoginOrRedirect(targetUrl) {
  const user = getUser();
  if (!user) {
    redirectToRegister(targetUrl);
    return false;
  }
  return true;
}

function buildNavbar() {
  const navEl = document.getElementById('dynamicNav');
  if (!navEl) return;

  const user = getUser();
  const isAdmin = !!getAdminToken();

  navEl.innerHTML = `
    <a href="index.html">Home</a>
    <a href="events.html">Events</a>
    ${user ? '<a href="user-dashboard.html">Dashboard</a>' : '<a href="login.html">User Login</a>'}
    ${user ? '' : '<a href="register.html">User Registration</a>'}
    ${isAdmin ? '<a href="admin-dashboard.html">Admin Dashboard</a>' : '<a href="admin-login.html">Admin Login</a>'}
    ${user ? '<button id="logoutBtn" class="link-btn">Logout</button>' : ''}
    ${isAdmin ? '<button id="logoutAdminBtn" class="link-btn">Admin Logout</button>' : ''}
  `;

  if (user) {
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', logoutUser);
  }
  if (isAdmin) {
    const btn = document.getElementById('logoutAdminBtn');
    if (btn) btn.addEventListener('click', logoutAdmin);
  }
}

function openEvent(eventId) {
  if (!ensureLoginOrRedirect(`event-details.html?id=${eventId}`)) return;
  window.location = `event-details.html?id=${eventId}`;
}



async function loadHomeEvents() {
  const container = document.getElementById('homeEventsContainer');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/users/events`);
    const events = await res.json();

    container.innerHTML = '';
    events.forEach((ev) => {
      const statusClass = ev.status === 'Completed' ? 'status-completed' : 
                         ev.status === 'Ongoing' ? 'status-ongoing' : 'status-upcoming';
      const card = document.createElement('div');
      card.className = `home-event-card ${statusClass}`;
      card.innerHTML = `
        <img src="${ev.image || 'https://via.placeholder.com/350x180?text=Event+Poster'}" alt="${ev.name}" class="event-card-img" />
        <h3>${ev.name}</h3>
        <p><strong>${new Date(ev.date).toLocaleDateString()}</strong> at ${ev.time}</p>
        <p><em>${ev.location}</em></p>
        <p class="status-badge ${statusClass}">Status: ${ev.status}</p>
        <p>🎟️ Seats left: <strong>${ev.seatsRemaining || (ev.seats - ev.seatsBooked)}</strong></p>
        <button onclick="openEvent('${ev._id}')" ${ev.status === 'Completed' || (ev.seatsRemaining || (ev.seats - ev.seatsBooked)) <= 0 ? 'disabled' : ''}>View Event</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<p>Error loading events.</p>';
  }
}

async function loadEventsPage() {
  const container = document.getElementById('eventsContainer');
  if (!container) return;

  // Add search and filter controls
  const searchContainer = document.createElement('div');
  searchContainer.id = 'searchControls';
  searchContainer.innerHTML = `
    <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
      <input type="text" id="eventSearch" placeholder="🔍 Search event name..." style="flex: 1; min-width: 200px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      <input type="date" id="dateFilter" placeholder="Filter by date" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      <button id="clearFilters" style="padding: 8px 15px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Filters</button>
    </div>
  `;
  container.parentElement.insertBefore(searchContainer, container);

  let allEvents = [];

  try {
    const res = await fetch(`${API_BASE}/users/events`);
    allEvents = await res.json();

    const renderEvents = (eventsToShow) => {
      container.innerHTML = '';
      if (eventsToShow.length === 0) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #666;">No events found matching your criteria.</p>';
        return;
      }
      
      eventsToShow.forEach((ev) => {
        const statusClass = ev.status === 'Completed' ? 'status-completed' : 
                           ev.status === 'Ongoing' ? 'status-ongoing' : 'status-upcoming';
        const card = document.createElement('div');
        card.className = `event-card ${statusClass}`;
        card.innerHTML = `
          <img src="${ev.image || 'https://via.placeholder.com/350x180?text=Event+Poster'}" alt="${ev.name}" class="event-card-img" />
          <h3>${ev.name}</h3>
          <p><strong>${new Date(ev.date).toLocaleDateString()}</strong> at ${ev.time}</p>
          <p><em>${ev.location}</em></p>
          <p class="status-badge ${statusClass}">Status: ${ev.status}</p>
          <p>🎟️ Seats left: <strong>${ev.seatsRemaining || (ev.seats - ev.seatsBooked)}</strong></p>
          <a href="event-details.html?id=${ev._id}" class="btn-link">View Event Details →</a>
        `;
        container.appendChild(card);
      });
    };

    const applyFilters = () => {
      const searchTerm = document.getElementById('eventSearch').value.toLowerCase();
      const dateValue = document.getElementById('dateFilter').value;

      const filtered = allEvents.filter(ev => {
        const nameMatch = ev.name.toLowerCase().includes(searchTerm);
        const dateMatch = dateValue ? new Date(ev.date).toISOString().split('T')[0] === dateValue : true;
        return nameMatch && dateMatch;
      });

      renderEvents(filtered);
    };

    document.getElementById('eventSearch').addEventListener('input', applyFilters);
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', () => {
      document.getElementById('eventSearch').value = '';
      document.getElementById('dateFilter').value = '';
      applyFilters();
    });

    renderEvents(allEvents);
  } catch (err) {
    container.innerHTML = '<p>Error loading events.</p>';
  }
}

async function loadEventDetailsPage() {
  const detailsDiv = document.getElementById('details');
  const registerBtn = document.getElementById('registerBtn');

  if (detailsDiv) {
    const id = new URLSearchParams(window.location.search).get('id');

    console.log("Event ID:", id);

    if (!id) {
      detailsDiv.innerHTML = '<p>No event selected</p>';
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/users/events/${id}`);
      const ev = await res.json();

      console.log("Event Data:", ev);

      if (!ev || ev.message) {
        detailsDiv.innerHTML = '<p>Event not found</p>';
        return;
      }

      detailsDiv.innerHTML = `
        <h2>${ev.name}</h2>
        <p>Date: ${new Date(ev.date).toLocaleDateString()}</p>
        <p>Time: ${ev.time}</p>
        <p>Location: ${ev.location}</p>

        <h3>Rules & Instructions</h3>
        <p class="event-rules">${ev.rules || 'No rules provided'}</p>
      `;

      // Handle register button
      if (registerBtn) {
        if (ev.status === 'Completed' || (ev.seatsRemaining || (ev.seats - ev.seatsBooked)) <= 0) {
          registerBtn.textContent = 'Registration Closed';
          registerBtn.disabled = true;
        } else {
          registerBtn.addEventListener('click', () => {
            if (!ensureLoginOrRedirect(`event-register.html?id=${id}`)) return;
            window.location = `event-register.html?id=${id}`;
          });
        }
      }
    } catch (err) {
      console.error(err);
      detailsDiv.innerHTML = '<p>Error loading event</p>';
    }
  }
}

async function loadRegisterPage() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('#message', '');

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
      setMessage('#message', 'Please input all fields.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage('#message', data.message || 'Registration failed', 'error');
        return;
      }

      setMessage('#message', 'Registered successfully. Redirecting to login...');

      const redirectUrl = getQueryParam('redirect') || 'login.html';
      setTimeout(() => {
        window.location = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
      }, 1000);
    } catch (err) {
      setMessage('#message', 'Server error. Try again.', 'error');
    }
  });
}

async function loadLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('#message', '');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage('#message', data.message || 'Login failed', 'error');
        return;
      }

      setUser(data.user);
      setMessage('#message', 'Login successful. Redirecting...');

      const redirectPath = getQueryParam('redirect');
      setTimeout(() => {
        window.location = redirectPath || 'user-dashboard.html';
      }, 800);
    } catch (err) {
      setMessage('#message', 'Server error. Try again.', 'error');
    }
  });
}

async function loadEventRegistrationPage() {
  const form = document.getElementById('eventRegForm');
  const messageEl = document.getElementById('message');
  const eventId = getQueryParam('id');

  if (!form || !eventId) return;

  const user = getUser();
  if (!user) {
    redirectToRegister(`event-register.html?id=${eventId}`);
    return;
  }

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const teamFields = document.getElementById('teamFields');
  const teamNameInput = document.getElementById('teamName');
  const teamMembersInput = document.getElementById('teamMembers');

  nameInput.value = user.name;
  emailInput.value = user.email;

  let eventData = null;
  try {
    const res = await fetch(`${API_BASE}/users/events/${eventId}`);
    eventData = await res.json();
    if (res.ok && eventData) {
      if (eventData.status === 'Completed' || (eventData.seatsRemaining || (eventData.seats - eventData.seatsBooked)) <= 0) {
        setMessage('#message', 'Registration not available for this event.', 'error');
        form.querySelector('button[type=submit]').disabled = true;
      }

      // Show team fields if event is team-based
      if (eventData.eventType === 'Team' || eventData.eventType === 'Both') {
        teamFields.style.display = 'block';
        teamNameInput.required = true;
        teamMembersInput.required = true;
      }
    }
  } catch {
    setMessage('#message', 'Unable to load event status.', 'error');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('#message', '');

    const college = document.getElementById('college').value.trim();
    const branch = document.getElementById('branch').value.trim();

    if (!college || !branch) {
      setMessage('#message', 'Complete all required fields.', 'error');
      return;
    }

    let teamName = null;
    let teamMembers = [];
    if (eventData && (eventData.eventType === 'Team' || eventData.eventType === 'Both')) {
      teamName = teamNameInput.value.trim();
      const membersText = teamMembersInput.value.trim();
      teamMembers = membersText ? membersText.split('\n').map(m => m.trim()).filter(m => m) : [];

      if (!teamName || teamMembers.length !== (eventData.teamSize - 1)) {
        setMessage('#message', `Please provide team name and exactly ${eventData.teamSize - 1} team members.`, 'error');
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/users/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value,
          email: emailInput.value,
          college,
          branch,
          userId: user.id,
          teamName,
          teamMembers,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage('#message', data.message || 'Registration failed', 'error');
        return;
      }

      setMessage('#message', 'Registration successful. Redirecting to dashboard...');
      setTimeout(() => {
        window.location = 'user-dashboard.html';
      }, 1000);
    } catch (err) {
      setMessage('#message', 'Server error. Try again.', 'error');
    }
  });
}

async function loadUserDashboard() {
  const profileBox = document.getElementById('profileBox');
  const regContainer = document.getElementById('registeredEvents');

  const user = getUser();
  if (!user) {
    return redirectToLogin('user-dashboard.html');
  }

  if (profileBox) {
    profileBox.innerHTML = `
      <h3>My Profile</h3>
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;
  }

  if (regContainer) {
    setLoading('#registeredEvents', true);
    try {
      const res = await fetch(`${API_BASE}/users/registrations?email=${encodeURIComponent(user.email)}`);
      const regs = await res.json();

      if (!Array.isArray(regs) || !regs.length) {
        regContainer.innerHTML = '<p>You have no registrations yet.</p>';
        return;
      }

      regContainer.innerHTML = '';
      regs.forEach((reg) => {
        const item = document.createElement('div');
        item.className = 'event-card';
        item.innerHTML = `
          <h4>${reg.event.name}</h4>
          <p>${new Date(reg.event.date).toLocaleDateString()} ${reg.event.time}</p>
          <p>${reg.event.location}</p>
          <p><strong>Registered On:</strong> ${new Date(reg.createdAt).toLocaleDateString()}</p>
        `;
        regContainer.appendChild(item);
      });
    } catch (err) {
      regContainer.innerHTML = '<p>Could not load registrations.</p>';
      console.error(err);
    }
  }
}

async function loadAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('#message', '');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage('#message', data.message || 'Invalid login', 'error');
        return;
      }

      setAdminToken(data.token);
      setMessage('#message', 'Admin login successful. Redirecting...');
      setTimeout(() => {
        window.location = 'admin-dashboard.html';
      }, 600);
    } catch (err) {
      setMessage('#message', 'Server error', 'error');
    }
  });
}

async function loadAddEventPage() {
  const form = document.getElementById('addEventForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('#message', '');

    const name = document.getElementById('name').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const location = document.getElementById('location').value.trim();
    const status = document.getElementById('status')?.value || 'Upcoming';
    const seats = Number(document.getElementById('seats')?.value || 100);
    const image = document.getElementById('image')?.value.trim();
    const eventType = document.getElementById('eventType')?.value || 'Single';
    const teamSize = Number(document.getElementById('teamSize')?.value || 1);
    const rules = document.getElementById('rules')?.value.trim();

    if (!name || !date || !time || !location) {
      setMessage('#message', 'All fields are required', 'error');
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setMessage('#message', 'Admin authorization required', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ name, date, time, location, status, seats, image, eventType, teamSize, rules }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage('#message', data.message || 'Failed to create event', 'error');
        return;
      }

      setMessage('#message', 'Event added successfully');
      setTimeout(() => {
        window.location = 'admin-dashboard.html';
      }, 700);
    } catch (err) {
      setMessage('#message', 'Server error', 'error');
      console.error(err);
    }
  });
}

async function loadEditEventPage() {
  const form = document.getElementById('editEventForm');
  if (!form) return;

  const eventId = getQueryParam('id');
  if (!eventId) {
    window.location = 'admin-dashboard.html';
    return;
  }

  const token = getAdminToken();
  if (!token) {
    window.location = 'admin-login.html';
    return;
  }

  // Load existing event data
  try {
    const res = await fetch(`${API_BASE}/admin/events`, { headers: { 'x-admin-token': token } });
    const events = await res.json();
    const event = events.find(ev => ev._id === eventId);
    if (!event) {
      setMessage('#message', 'Event not found', 'error');
      return;
    }

    document.getElementById('name').value = event.name;
    document.getElementById('date').value = new Date(event.date).toISOString().slice(0, 10);
    document.getElementById('time').value = event.time;
    document.getElementById('location').value = event.location;
    document.getElementById('status').value = event.status;
    document.getElementById('seats').value = event.seats;
    document.getElementById('image').value = event.image || '';
    document.getElementById('eventType').value = event.eventType || 'Single';
    document.getElementById('teamSize').value = event.teamSize || 1;
    document.getElementById('rules').value = event.rules || '';
  } catch (err) {
    setMessage('#message', 'Failed to load event data', 'error');
    console.error(err);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('#message', '');

    const name = document.getElementById('name').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const location = document.getElementById('location').value.trim();
    const status = document.getElementById('status').value;
    const seats = Number(document.getElementById('seats').value);
    const image = document.getElementById('image').value.trim();
    const eventType = document.getElementById('eventType').value;
    const teamSize = Number(document.getElementById('teamSize').value);
    const rules = document.getElementById('rules').value.trim();

    if (!name || !date || !time || !location) {
      setMessage('#message', 'All fields are required', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ name, date, time, location, status, seats, image, eventType, teamSize, rules }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage('#message', data.message || 'Failed to update event', 'error');
        return;
      }

      setMessage('#message', 'Event updated successfully');
      setTimeout(() => {
        window.location = 'admin-dashboard.html';
      }, 700);
    } catch (err) {
      setMessage('#message', 'Server error', 'error');
      console.error(err);
    }
  });
}

async function loadViewRegistrationsPage() {
  const container = document.getElementById('registrationsContainer');
  if (!container) return;

  const token = getAdminToken();
  if (!token) {
    window.location = 'admin-login.html';
    return;
  }

  setLoading('#registrationsContainer', true);

  try {
    const [registrationsRes, eventsRes] = await Promise.all([
      fetch(`${API_BASE}/admin/registrations`, { headers: { 'x-admin-token': token } }),
      fetch(`${API_BASE}/admin/events`, { headers: { 'x-admin-token': token } }),
    ]);

    const registrations = await registrationsRes.json();
    const events = await eventsRes.json();

    if (!Array.isArray(registrations) || !registrations.length) {
      container.innerHTML = '<p>No registrations yet.</p>';
      return;
    }

    const eventsMap = events.reduce((acc, ev) => ({ ...acc, [ev._id]: ev }), {});

    registrations.forEach((reg) => {
      const item = document.createElement('div');
      item.className = 'event-card';
      const event = reg.event || eventsMap[reg.event];

      item.innerHTML = `
        <h4>${event?.name || 'Unknown Event'}</h4>
        <p><strong>User:</strong> ${reg.name} (${reg.email})</p>
        <p><strong>College:</strong> ${reg.college}</p>
        <p><strong>Branch:</strong> ${reg.branch}</p>
        <p><strong>Registered at:</strong> ${new Date(reg.createdAt).toLocaleString()}</p>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    container.innerHTML = '<p>Error loading registrations.</p>';
    console.error(err);
  }
}

async function loadAdminDashboard() {
  const totalEventsEl = document.getElementById('totalEvents');
  const totalUsersEl = document.getElementById('totalUsers');
  const totalRegsEl = document.getElementById('totalRegistrations');

  const token = getAdminToken();
  if (!token) {
    window.location = 'admin-login.html';
    return;
  }

  try {
    const statsRes = await fetch(`${API_BASE}/admin/dashboard`, { headers: { 'x-admin-token': token } });
    const stats = await statsRes.json();

    totalEventsEl.textContent = stats.totalEvents;
    totalUsersEl.textContent = stats.totalUsers;
    totalRegsEl.textContent = stats.totalRegistrations;

    const [eventsRes, regsRes] = await Promise.all([
      fetch(`${API_BASE}/admin/events`, { headers: { 'x-admin-token': token } }),
      fetch(`${API_BASE}/admin/registrations`, { headers: { 'x-admin-token': token } }),
    ]);
    const events = await eventsRes.json();
    const registrations = await regsRes.json();

    // Count registrations per event
    const regCounts = {};
    registrations.forEach(reg => {
      const eventId = typeof reg.event === 'object' ? reg.event._id : reg.event;
      regCounts[eventId] = (regCounts[eventId] || 0) + 1;
    });

    const eventsContainer = document.getElementById('adminEventsContainer');

    if (eventsContainer) {
      eventsContainer.innerHTML = '';
      events.forEach((ev) => {
        const regCount = regCounts[ev._id] || 0;
        const item = document.createElement('div');
        item.className = 'event-card';
        item.innerHTML = `
          <h4>${ev.name}</h4>
          <p>${new Date(ev.date).toLocaleDateString()} ${ev.time}</p>
          <p>${ev.location}</p>
          <p>Status: ${ev.status} | Type: ${ev.eventType || 'Single'}</p>
          <p>Registrations: ${regCount} | Seats: ${ev.seatsBooked}/${ev.seats}</p>
          <button class="small-btn edit-btn" data-id="${ev._id}">Edit</button>
          <button class="small-btn delete-btn" data-id="${ev._id}">Delete</button>
        `;
        eventsContainer.appendChild(item);
      });

      // Edit buttons
      eventsContainer.querySelectorAll('.edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          window.location = `edit-event.html?id=${id}`;
        });
      });

      // Delete buttons
      eventsContainer.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          if (!confirm('Delete event and all its registrations?')) return;
          const res = await fetch(`${API_BASE}/admin/events/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-token': token },
          });
          if (res.ok) {
            loadAdminDashboard();
          } else {
            alert('Delete failed');
          }
        });
      });
    }

    // Auto-complete button
    const autoCompleteBtn = document.getElementById('autoCompleteBtn');
    if (autoCompleteBtn) {
      autoCompleteBtn.addEventListener('click', async () => {
        if (!confirm('Mark all past events as completed?')) return;
        const res = await fetch(`${API_BASE}/admin/auto-complete-events`, {
          method: 'POST',
          headers: { 'x-admin-token': token },
        });
        if (res.ok) {
          alert('Events auto-completed');
          loadAdminDashboard();
        } else {
          alert('Auto-complete failed');
        }
      });
    }
  } catch (err) {
    console.error(err);
    alert('Unable to load admin dashboard');
  }
}

function initPage() {
  buildNavbar();
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  if (document.getElementById('homeEventsContainer')) {
    loadHomeEvents();
  }
  if (document.getElementById('eventsContainer')) {
    loadEventsPage();
  }
  if (document.getElementById('details')) {
    loadEventDetailsPage();
  }
  if (document.getElementById('registerForm')) {
    loadRegisterPage();
  }
  if (document.getElementById('loginForm')) {
    loadLoginPage();
  }
  if (document.getElementById('eventRegForm')) {
    loadEventRegistrationPage();
  }
  if (document.getElementById('profileBox')) {
    loadUserDashboard();
  }
  if (document.getElementById('adminLoginForm')) {
    loadAdminLogin();
  }
  if (document.getElementById('addEventForm')) {
    loadAddEventPage();
  }
  if (document.getElementById('editEventForm')) {
    loadEditEventPage();
  }
  if (document.getElementById('registrationsContainer')) {
    loadViewRegistrationsPage();
  }
  if (document.getElementById('totalEvents')) {
    loadAdminDashboard();
  }
}

window.addEventListener('DOMContentLoaded', initPage);