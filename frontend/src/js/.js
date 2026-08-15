var overlay = document.getElementById('teamModalOverlay');
var openBtn = document.getElementById('openTeamModal');
var closeBtn = document.getElementById('closeTeamModal');

if (overlay && openBtn && closeBtn) {
  openBtn.addEventListener('click', function () {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  closeBtn.addEventListener('click', function () {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  });
}