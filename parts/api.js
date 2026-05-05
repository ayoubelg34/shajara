// ═══════════════════════════ API & AUTH ═══════════════════════════
const API_URL = 'http://localhost:3000/api';

function getAuthToken() {
  return localStorage.getItem('shajara_token');
}

function setAuthToken(token) {
  if (token) localStorage.setItem('shajara_token', token);
  else localStorage.removeItem('shajara_token');
}

function isLogged() {
  return !!getAuthToken();
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur API');
    return data;
  } catch (err) {
    showToast(`⚠️ ${err.message}`);
    throw err;
  }
}

async function authLogin(email, password) {
  const data = await apiCall('/auth/login', 'POST', { email, password });
  setAuthToken(data.token);
  showToast('✅ ' + data.message);
  return data;
}

async function authRegister(email, password) {
  const data = await apiCall('/auth/register', 'POST', { email, password });
  setAuthToken(data.token);
  showToast('✅ ' + data.message);
  return data;
}

function authLogout() {
  setAuthToken(null);
  showToast('👋 Déconnecté');
  setTimeout(() => location.reload(), 1000);
}

// Background sync functions
let syncTimeout = null;
async function syncSaveToCloud(dbData, locData) {
  if (!isLogged()) return;
  // Debounce cloud saving to avoid spamming the backend
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await apiCall('/data', 'POST', { data: dbData, location: locData });
      console.log('☁️ Sauvegarde Cloud réussie');
    } catch (err) {
      console.warn('Sync failed', err);
    }
  }, 2000);
}

async function syncLoadFromCloud() {
  if (!isLogged()) return null;
  try {
    return await apiCall('/data', 'GET');
  } catch (err) {
    if (err.message === 'Token invalide') authLogout();
    return null;
  }
}
