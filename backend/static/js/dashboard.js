/**
 * KaamSetu Modern Dashboard JavaScript
 * Controls: Mobile drawer, user dropdown, notification popover, keyboard shortcuts
 */

(function() {
  'use strict';

  function initDashboard() {
    const sidebar = document.getElementById('dashSidebar');
    const backdrop = document.getElementById('dashDrawerBackdrop');
    const toggleBtn = document.getElementById('dashMobileToggle');
    const profileBtn = document.getElementById('dashProfileTrigger');
    const profileMenu = document.getElementById('dashProfileDropdown');
    const notifBtn = document.getElementById('dashNotifTrigger');
    const notifMenu = document.getElementById('dashNotifDropdown');

    // Toggle Mobile Sidebar Drawer
    if (toggleBtn && sidebar && backdrop) {
      toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = sidebar.classList.contains('is-open');
        if (isOpen) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });

      backdrop.addEventListener('click', closeDrawer);
    }

    function openDrawer() {
      if (sidebar) sidebar.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      if (sidebar) sidebar.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    // Toggle Profile Dropdown
    if (profileBtn && profileMenu) {
      profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (notifMenu) notifMenu.classList.remove('is-open');
        profileMenu.classList.toggle('is-open');
      });
    }

    // Toggle Notification Dropdown
    if (notifBtn && notifMenu) {
      notifBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (profileMenu) profileMenu.classList.remove('is-open');
        notifMenu.classList.toggle('is-open');
      });
    }

    // Click outside to close dropdowns
    document.addEventListener('click', function(e) {
      if (profileMenu && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove('is-open');
      }
      if (notifMenu && !notifMenu.contains(e.target)) {
        notifMenu.classList.remove('is-open');
      }
    });

    // Escape key listener
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDrawer();
        if (profileMenu) profileMenu.classList.remove('is-open');
        if (notifMenu) notifMenu.classList.remove('is-open');
      }
    });
    // Modal Support
    window.toggleModal = function(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      if (modal.classList.contains('open') || modal.classList.contains('is-open')) {
        modal.classList.remove('open', 'is-open');
        document.body.style.overflow = '';
      } else {
        modal.classList.add('open', 'is-open');
        document.body.style.overflow = 'hidden';
      }
    };
    window.openModal = function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open', 'is-open');
        document.body.style.overflow = 'hidden';
      }
    };
    window.closeModal = function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('open', 'is-open');
        document.body.style.overflow = '';
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
})();
