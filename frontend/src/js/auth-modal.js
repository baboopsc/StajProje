import { loginUser, registerUser, getAllUsers } from './api.js';

const AUTH_OVERLAY_ID = 'auth-modal-overlay';

export function setCurrentUser(user) {
  localStorage.setItem('cinemania_current_user', JSON.stringify(user));
  updateHeaderAuthUI();
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('cinemania_current_user');
  return userStr ? JSON.parse(userStr) : null;
}

export function logoutUser() {
  localStorage.removeItem('cinemania_current_user');
  updateHeaderAuthUI();
}

function createAuthModalMarkup(isLogin = true) {
  return `
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 99999;">
      <div style="width: 100%; max-width: 380px; background: #111; border: 1px solid #333; border-radius: 8px; padding: 30px; box-sizing: border-box; position: relative; font-family: inherit;">
        
        <button id="auth-close-btn" type="button" style="position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: #aaa; font-size: 24px; cursor: pointer; line-height: 1;">&times;</button>
        
        <h2 style="color: #fff; text-align: center; margin: 0 0 25px 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">
          ${isLogin ? 'GİRİŞ YAP' : 'KAYIT OL'}
        </h2>

        <form id="auth-form" style="display: flex; flex-direction: column; gap: 15px; width: 100%;">
          ${!isLogin ? `
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <label style="color: #ccc; font-size: 12px;">Kullanıcı Adı</label>
              <input type="text" id="auth-username" required placeholder="Örn: SinemaKurdu" style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 14px;" />
            </div>
          ` : ''}

          <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="color: #ccc; font-size: 12px;">E-posta Adresi</label>
            <input type="email" id="auth-email" required placeholder="mail@ornek.com" style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 14px;" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="color: #ccc; font-size: 12px;">Şifre</label>
            <input type="password" id="auth-password" required placeholder="••••••••" style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 14px;" />
          </div>

          <button type="submit" style="margin-top: 5px; width: 100%; padding: 12px; background: #f86f03; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 15px;">
            ${isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        <div style="text-align: center; margin-top: 20px; border-top: 1px solid #222; padding-top: 15px;">
          <span style="color: #888; font-size: 13px;">
            ${isLogin ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
          </span>
          <a href="#" id="auth-toggle-link" style="color: #f86f03; font-weight: bold; text-decoration: none; margin-left: 5px; font-size: 13px;">
            ${isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </a>
        </div>

      </div>
    </div>
  `;
}

export function showAuthModal(isLogin = true) {
  const existingOverlay = document.getElementById(AUTH_OVERLAY_ID);
  if (existingOverlay) existingOverlay.remove();

  const overlayElement = document.createElement('div');
  overlayElement.id = AUTH_OVERLAY_ID;
  overlayElement.innerHTML = createAuthModalMarkup(isLogin);

  document.body.appendChild(overlayElement);

  const closeBtn = overlayElement.querySelector('#auth-close-btn');
  closeBtn.addEventListener('click', () => overlayElement.remove());

  overlayElement.addEventListener('click', (e) => {
    if (e.target === overlayElement) overlayElement.remove();
  });

  const toggleLink = overlayElement.querySelector('#auth-toggle-link');
  toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal(!isLogin);
  });

  const form = overlayElement.querySelector('#auth-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('#auth-email').value.trim();
    const password = form.querySelector('#auth-password').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'İşleniyor...';

    try {
      if (isLogin) {
        const user = await loginUser(email, password);
        setCurrentUser(user);
        alert(`Hoş geldin, ${user.username || 'Sinemasever'}!`);
        overlayElement.remove();
      } else {
        const username = form.querySelector('#auth-username').value.trim();
        const newUser = await registerUser({ username, email, password });
        setCurrentUser(newUser);
        alert('Kayıt başarılı! Giriş yapıldı.');
        overlayElement.remove();
      }
    } catch (error) {
      alert(error.message || 'Bir hata oluştu. Bilgilerinizi kontrol edin.');
      submitBtn.disabled = false;
      submitBtn.textContent = isLogin ? 'Giriş Yap' : 'Kayıt Ol';
    }
  });
}

function showProfileModal() {
  const existingOverlay = document.getElementById('profile-modal-overlay');
  if (existingOverlay) existingOverlay.remove();

  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const storageKeyFriends = `cinemania_friends_${currentUser.id}`;
  const storageKeyRequests = `cinemania_requests_${currentUser.id}`;
  
  let friends = JSON.parse(localStorage.getItem(storageKeyFriends)) || [];
  let requests = JSON.parse(localStorage.getItem(storageKeyRequests)) || [];

  const overlayElement = document.createElement('div');
  overlayElement.id = 'profile-modal-overlay';
  overlayElement.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px;';
  
  // HTML yapısı artık tamamen base.css'teki mimariye uygun
  overlayElement.innerHTML = `
    <div class="profile-modal">
      <button id="profile-close-btn" type="button" style="position: absolute; top: 20px; right: 20px; background: transparent; border: none; color: var(--text-dark-muted); font-size: 28px; cursor: pointer;">&times;</button>
      
      <div class="profile-header">
        <div>
          <h2 class="profile-title">Kullanıcı Paneli</h2>
          <div style="font-size: 14px; color: var(--text-dark-soft);">
            Hoş geldin, <strong style="color: var(--white); font-size: 16px;">${currentUser.username}</strong> 
            <span style="margin: 0 10px;">|</span>
            <span class="profile-id-badge">ID: ${currentUser.id}</span>
          </div>
        </div>
        <!-- Sitenin orijinal ikincil (secondary) butonunu kullandık -->
        <button id="modal-logout-btn" class="btn btn--secondary" style="padding: 8px 20px; font-size: 13px;">Çıkış Yap</button>
      </div>

      <div class="profile-grid">
        
        <div class="profile-card">
          <h3 class="profile-card-title">Arkadaş Ekle</h3>
          <p style="color: var(--text-dark-muted); font-size: 13px; margin-bottom: 16px;">Arkadaşının ID numarasını girerek istek atabilirsin.</p>
          <div style="margin-top: auto;">
            <input type="number" id="friend-id-input" class="profile-input" placeholder="Örn: 2" />
            <!-- Sitenin orijinal birincil (primary) butonunu kullandık -->
            <button id="add-friend-btn" class="btn btn--primary" style="width: 100%;">İstek Gönder</button>
          </div>
        </div>

        <div class="profile-card">
          <h3 class="profile-card-title">Arkadaşlarım</h3>
          <div style="flex: 1; overflow-y: auto; max-height: 200px;">
            ${friends.length > 0 ? friends.map((f, index) => `
              <div class="friend-item">
                <span class="friend-name">${f.username}</span>
                <button class="btn-mini-remove" data-id="${f.id}" data-index="${index}">Sil</button>
              </div>
            `).join('') : '<p style="color: var(--text-dark-muted); font-size: 13px; text-align: center; margin-top: 40px;">Henüz arkadaşın yok.</p>'}
          </div>
        </div>

        <div class="profile-card">
          <h3 class="profile-card-title">İstekler</h3>
          <div style="flex: 1; overflow-y: auto; max-height: 200px;">
            ${requests.length > 0 ? requests.map((req, index) => `
              <div class="friend-item">
                <span class="friend-name">${req.username}</span>
                <button class="btn-mini-accept accept-req-btn" data-index="${index}">Kabul Et</button>
              </div>`).join('') : '<p style="color: var(--text-dark-muted); font-size: 13px; text-align: center; margin-top: 40px;">Bekleyen istek yok.</p>'}
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(overlayElement);

  overlayElement.querySelector('#profile-close-btn').addEventListener('click', () => overlayElement.remove());
  overlayElement.addEventListener('click', (e) => {
    if (e.target === overlayElement) overlayElement.remove();
  });

  // Arkadaş Ekleme
  overlayElement.querySelector('#add-friend-btn').addEventListener('click', async () => {
    const targetIdStr = overlayElement.querySelector('#friend-id-input').value.trim();
    if (!targetIdStr) return;
    
    const targetId = Number(targetIdStr);
    if (targetId === currentUser.id) {
      alert('Kendine arkadaşlık isteği gönderemezsin!');
      return;
    }

    try {
      const allUsers = await getAllUsers();
      const targetUser = allUsers.find(u => Number(u.id) === targetId);

      if (!targetUser) {
        alert(`ID #${targetId} numarasına ait bir kullanıcı bulunamadı!`);
        return;
      }

      const targetRequestsKey = `cinemania_requests_${targetUser.id}`;
      let targetRequests = JSON.parse(localStorage.getItem(targetRequestsKey)) || [];

      if (targetRequests.some(r => r.id === currentUser.id)) {
        alert('Bu kullanıcıya zaten arkadaşlık isteği göndermişsin!');
        return;
      }

      targetRequests.push({ id: currentUser.id, username: currentUser.username });
      localStorage.setItem(targetRequestsKey, JSON.stringify(targetRequests));

      alert(`"${targetUser.username}" adlı kullanıcıya arkadaşlık isteği gönderildi!`);
      overlayElement.querySelector('#friend-id-input').value = '';
    } catch (err) {
      console.error(err);
      alert('İstek gönderilirken bir hata oluştu.');
    }
  });

  // İstek Kabul Etme
  overlayElement.querySelectorAll('.accept-req-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      const acceptedUser = requests.splice(index, 1)[0];
      friends.push(acceptedUser);

      const targetFriendsKey = `cinemania_friends_${acceptedUser.id}`;
      let targetFriends = JSON.parse(localStorage.getItem(targetFriendsKey)) || [];
      if (!targetFriends.some(f => f.id === currentUser.id)) {
        targetFriends.push({ id: currentUser.id, username: currentUser.username });
        localStorage.setItem(targetFriendsKey, JSON.stringify(targetFriends));
      }

      localStorage.setItem(storageKeyFriends, JSON.stringify(friends));
      localStorage.setItem(storageKeyRequests, JSON.stringify(requests));

      overlayElement.remove();
      showProfileModal();
    });
  });

  // Arkadaş Silme
  overlayElement.querySelectorAll('.btn-mini-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const friendId = Number(e.target.getAttribute('data-id'));
      const index = e.target.getAttribute('data-index');
      
      if (confirm("Bu kişiyi arkadaşlarından çıkarmak istediğine emin misin?")) {
        friends.splice(index, 1);
        localStorage.setItem(storageKeyFriends, JSON.stringify(friends));
        
        const targetFriendsKey = `cinemania_friends_${friendId}`;
        let targetFriends = JSON.parse(localStorage.getItem(targetFriendsKey)) || [];
        targetFriends = targetFriends.filter(tf => tf.id !== currentUser.id);
        localStorage.setItem(targetFriendsKey, JSON.stringify(targetFriends));

        overlayElement.remove();
        showProfileModal();
      }
    });
  });

  // Çıkış Yap
  overlayElement.querySelector('#modal-logout-btn').addEventListener('click', () => {
    logoutUser();
    overlayElement.remove();
  });
}

export function updateHeaderAuthUI() {
  let authContainer = document.getElementById('header-auth-container');

  if (!authContainer) {
    const controlsArea = document.querySelector('.header__controls');
    if (!controlsArea) return;

    authContainer = document.createElement('div');
    authContainer.id = 'header-auth-container';
    authContainer.style.display = 'flex';
    authContainer.style.alignItems.center;
    authContainer.style.marginRight = '10px';
    
    controlsArea.prepend(authContainer);
  }

  const currentUser = getCurrentUser();

  if (currentUser) {
    authContainer.innerHTML = `
      <div style="display: flex; align-items: center;">
        <button id="open-profile-btn" style="background: transparent; border: none; color: #f86f03; font-weight: bold; font-size: 15px; cursor: pointer; padding: 5px; text-decoration: underline; text-underline-offset: 4px;">
          ${currentUser.username || 'Kullanıcı'}
        </button>
      </div>
    `;
    document.getElementById('open-profile-btn')?.addEventListener('click', showProfileModal);
  } else {
    authContainer.innerHTML = `
      <button id="open-login-btn" class="btn btn--primary" type="button">Giriş Yap / Kayıt Ol</button>
    `;
    document.getElementById('open-login-btn')?.addEventListener('click', () => showAuthModal(true));
  }
}