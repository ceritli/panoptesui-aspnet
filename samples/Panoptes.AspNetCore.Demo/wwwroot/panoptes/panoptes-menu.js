/**
 * Panoptes Menu & ContextMenu v1.0.0
 * Enterprise Panoptes UI
 * - Horizontal & Vertical Multi-Level Hierarchical Menus
 * - Interactive ContextMenu (Right-Click) with Smart Viewport Collision Avoidance
 * - Icons, Badges, Separators, Shortcuts & Keyboard Navigation
 * - Target Element Data Extraction for DataGrids, ListViews & Cards
 * - Pure Vanilla JS + Tailwind CSS (Zero external dependencies)
 */
(function (window) {
  'use strict';

  window.Panoptes = window.Panoptes || {};
  window.Panoptes.instances = window.Panoptes.instances || {};
  window.Panoptes.Menu = window.Panoptes.Menu || {};
  window.Panoptes.ContextMenu = window.Panoptes.ContextMenu || {};

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Built-in SVG Icons Library
  const ICONS = {
    file: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>',
    folder: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>',
    edit: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>',
    copy: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>',
    trash: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
    eye: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>',
    download: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>',
    print: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>',
    printer: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>',
    settings: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
    plus: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>',
    search: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>',
    share: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>',
    save: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>',
    clock: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    logout: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>',
    chart: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
    help: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    info: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    refresh: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
    home: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
    user: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
    users: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
    lock: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>',
    shield: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
    truck: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>',
    'shopping-bag': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>',
    bell: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>',
    sliders: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>',
    terminal: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
    mail: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
    check: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
    undo: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>',
    redo: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>',
    scissors: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242 3 3 0 014.242 0L12 12zm0 0L9.121 9.121a3 3 0 10-4.242 4.242 3 3 0 004.242 0L12 12z"/></svg>',
    clipboard: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
    maximize: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>',
    menu: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>',
    archive: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>',
    dollar: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 8c-1.11 0-2.08-.402-2.599-1M12 16v2m0-12a10 10 0 100 20 10 10 0 000-20z"/></svg>',
    code: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>',
    book: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
    command: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v6a2 2 0 01-2 2h-4a2 2 0 01-2-2V9a2 2 0 012-2h4a2 2 0 012 2zM6 9a2 2 0 114 0v6a2 2 0 11-4 0V9zm12 0a2 2 0 114 0v6a2 2 0 11-4 0V9z"/></svg>',
    list: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>',
    palette: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>',
    chevronDown: '<svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>',
    chevronRight: '<svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>'
  };

  function renderIcon(icon) {
    if (!icon) return '';
    if (icon.trim().startsWith('<svg')) return icon;
    const key = icon.toLowerCase().trim();
    if (ICONS[key]) return ICONS[key];
    return `<span class="panoptes-menu-icon-text font-bold text-xs">${escapeHtml(icon)}</span>`;
  }

  // --- Horizontal & Vertical Menu Class ---
  class PanoptesMenuInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      this.config = this.readConfig();
      this.items = this.config.items || [];
      this.orientation = this.config.orientation || 'horizontal';
      this.openOn = this.config.openOn || 'hover';

      this.initDom();
    }

    readConfig() {
      const script = this.wrapper.querySelector(`script[data-panoptes-config="${this.id}"]`);
      if (script) {
        try {
          return JSON.parse(script.textContent);
        } catch (e) {
          console.error(`Panoptes.Menu [${this.id}] invalid config JSON`, e);
        }
      }
      return {};
    }

    initDom() {
      const container = this.wrapper.querySelector('.panoptes-menu-container') || this.wrapper;
      const isHoriz = (this.orientation === 'horizontal');

      container.className = isHoriz
        ? 'panoptes-menu-root flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs relative'
        : 'panoptes-menu-root flex flex-col space-y-1 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs relative w-64';

      let html = '';
      this.items.forEach((item, index) => {
        html += this.renderItemHtml(item, index, 0, isHoriz);
      });
      container.innerHTML = html;

      this.bindInteractions(container);
    }

    renderItemHtml(item, index, depth, isHorizRoot) {
      if (item.separator) {
        return depth === 0 && isHorizRoot
          ? '<span class="w-px h-5 bg-slate-200 mx-1 self-center"></span>'
          : '<div class="h-px bg-slate-100 my-1"></div>';
      }

      const hasChildren = item.items && item.items.length > 0;
      const disabledClass = item.disabled ? 'opacity-40 pointer-events-none' : '';
      const customClass = item.class || '';

      let arrowIcon = '';
      if (hasChildren) {
        arrowIcon = (depth === 0 && isHorizRoot) ? ICONS.chevronDown : ICONS.chevronRight;
      }

      let badgeHtml = '';
      if (item.badge) {
        badgeHtml = `<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeClass || 'bg-blue-100 text-blue-700'}">${escapeHtml(item.badge)}</span>`;
      }

      let shortcutHtml = '';
      if (item.shortcut) {
        shortcutHtml = `<span class="text-[10px] text-slate-400 font-mono pl-3 ml-auto">${escapeHtml(item.shortcut)}</span>`;
      }

      const iconHtml = renderIcon(item.icon);

      // Submenu HTML
      let subMenuHtml = '';
      if (hasChildren) {
        const subPosClass = (depth === 0 && isHorizRoot)
          ? 'top-full left-0 mt-1.5'
          : 'top-0 left-full ml-1.5';

        subMenuHtml = `
          <div class="panoptes-submenu hidden absolute ${subPosClass} min-w-[200px] bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 transition-all duration-150">
            ${item.items.map((sub, sIdx) => this.renderItemHtml(sub, sIdx, depth + 1, false)).join('')}
          </div>
        `;
      }

      const tag = item.url ? 'a' : 'button';
      const hrefAttr = item.url ? `href="${item.url}"` : 'type="button"';

      return `
        <div class="panoptes-menu-node relative group/item" data-index="${index}" data-action="${escapeHtml(item.action || '')}">
          <${tag} ${hrefAttr} class="panoptes-menu-item-btn w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition select-none ${disabledClass} ${customClass}">
            <div class="flex items-center gap-2 truncate">
              ${iconHtml ? `<span class="shrink-0 text-slate-500 group-hover/item:text-blue-600 transition">${iconHtml}</span>` : ''}
              <span class="truncate">${escapeHtml(item.text)}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              ${badgeHtml}
              ${shortcutHtml}
              ${arrowIcon ? `<span class="shrink-0 text-slate-400 group-hover/item:text-blue-600 transition">${arrowIcon}</span>` : ''}
            </div>
          </${tag}>
          ${subMenuHtml}
        </div>
      `;
    }

    bindInteractions(container) {
      const isHover = (this.openOn === 'hover');

      container.querySelectorAll('.panoptes-menu-node').forEach(node => {
        const submenu = node.querySelector(':scope > .panoptes-submenu');
        const btn = node.querySelector(':scope > .panoptes-menu-item-btn');

        if (submenu) {
          if (isHover) {
            let timeout;
            node.addEventListener('mouseenter', () => {
              clearTimeout(timeout);
              this.closeSiblings(node);
              submenu.classList.remove('hidden');
              this.trigger('onOpen', { node });
            });

            node.addEventListener('mouseleave', () => {
              timeout = setTimeout(() => {
                submenu.classList.add('hidden');
                this.trigger('onClose', { node });
              }, 120);
            });
          } else {
            // Click mode
            btn.addEventListener('click', (e) => {
              const isClosed = submenu.classList.contains('hidden');
              this.closeSiblings(node);
              if (isClosed) {
                submenu.classList.remove('hidden');
                this.trigger('onOpen', { node });
              } else {
                submenu.classList.add('hidden');
                this.trigger('onClose', { node });
              }
            });
          }
        }

        // Click select on leaf item
        if (btn) {
          btn.addEventListener('click', (e) => {
            if (!submenu) {
              const action = node.dataset.action;
              const text = btn.textContent.trim();
              this.trigger('onSelect', { action, text, event: e });
              this.closeAll();
            }
          });
        }
      });

      // Global click outside to close
      document.addEventListener('click', (e) => {
        if (!this.wrapper.contains(e.target)) {
          this.closeAll();
        }
      });
    }

    closeSiblings(node) {
      const parent = node.parentElement;
      if (!parent) return;
      parent.querySelectorAll(':scope > .panoptes-menu-node > .panoptes-submenu').forEach(sub => {
        sub.classList.add('hidden');
      });
    }

    closeAll() {
      this.wrapper.querySelectorAll('.panoptes-submenu').forEach(sub => {
        sub.classList.add('hidden');
      });
    }

    trigger(eventName, data) {
      const cbName = this.config[eventName];
      if (cbName && typeof window[cbName] === 'function') {
        try { window[cbName](data, this); } catch (e) { console.error(e); }
      }
      this.wrapper.dispatchEvent(new CustomEvent(`panoptes:${eventName.toLowerCase()}`, { detail: data }));
    }
  }

  // --- Interactive ContextMenu (Right-Click) Class ---
  class PanoptesContextMenuInstance {
    constructor(id) {
      this.id = id;
      this.wrapper = document.getElementById(id);
      if (!this.wrapper) return;

      this.config = this.readConfig();
      this.items = this.config.items || [];
      this.targetSelector = this.config.target || '';
      this.filterSelector = this.config.filter || '';
      this.showOn = this.config.showOn || 'contextmenu';

      this.activeTarget = null;
      this.initDom();
      this.bindTarget();
    }

    readConfig() {
      const script = this.wrapper.querySelector(`script[data-panoptes-config="${this.id}"]`);
      if (script) {
        try {
          return JSON.parse(script.textContent);
        } catch (e) {
          console.error(`Panoptes.ContextMenu [${this.id}] invalid config JSON`, e);
        }
      }
      return {};
    }

    initDom() {
      // Floating Context Menu popup
      this.menuEl = document.createElement('div');
      this.menuEl.id = `${this.id}-popup`;
      this.menuEl.className = 'panoptes-context-menu-popup hidden fixed z-[9999] min-w-[210px] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-1.5 font-sans animate-in fade-in zoom-in-95 duration-100 select-none';

      let html = '';
      this.items.forEach((item, index) => {
        html += this.renderContextItemHtml(item, index);
      });
      this.menuEl.innerHTML = html;

      document.body.appendChild(this.menuEl);
      this.bindMenuActions();
    }

    renderContextItemHtml(item, index) {
      if (item.separator) {
        return '<div class="h-px bg-slate-100 my-1"></div>';
      }

      const disabledClass = item.disabled ? 'opacity-40 pointer-events-none' : '';
      const customClass = item.class || '';
      const iconHtml = renderIcon(item.icon);

      let badgeHtml = '';
      if (item.badge) {
        badgeHtml = `<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeClass || 'bg-slate-100 text-slate-700'}">${escapeHtml(item.badge)}</span>`;
      }

      let shortcutHtml = '';
      if (item.shortcut) {
        shortcutHtml = `<span class="text-[10px] text-slate-400 font-mono pl-3 ml-auto">${escapeHtml(item.shortcut)}</span>`;
      }

      return `
        <div class="panoptes-cm-item relative" data-index="${index}" data-action="${escapeHtml(item.action || '')}">
          <button type="button" class="panoptes-cm-btn w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 active:bg-blue-100 transition ${disabledClass} ${customClass}">
            <div class="flex items-center gap-2.5 truncate">
              ${iconHtml ? `<span class="shrink-0 text-slate-500">${iconHtml}</span>` : ''}
              <span class="truncate">${escapeHtml(item.text)}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              ${badgeHtml}
              ${shortcutHtml}
            </div>
          </button>
        </div>
      `;
    }

    bindTarget() {
      if (!this.targetSelector) return;

      const triggerEvent = (this.showOn === 'click') ? 'click' : 'contextmenu';

      document.addEventListener(triggerEvent, (e) => {
        let targetEl = null;

        // Check if event occurred inside matched target selector
        const match = e.target.closest(this.targetSelector);
        if (match) {
          if (this.filterSelector) {
            targetEl = e.target.closest(this.filterSelector);
          } else {
            targetEl = match;
          }
        }

        if (targetEl) {
          e.preventDefault();
          this.activeTarget = targetEl;
          this.show(e.clientX, e.clientY);
        }
      });

      // Close on outside click, window resize or scroll
      document.addEventListener('click', (e) => {
        if (!this.menuEl.contains(e.target)) {
          this.hide();
        }
      });
      document.addEventListener('contextmenu', (e) => {
        if (!e.target.closest(this.targetSelector)) {
          this.hide();
        }
      });
      window.addEventListener('resize', () => this.hide());
      window.addEventListener('scroll', () => this.hide(), true);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.hide();
      });
    }

    bindMenuActions() {
      this.menuEl.querySelectorAll('.panoptes-cm-item').forEach(itemEl => {
        const btn = itemEl.querySelector('.panoptes-cm-btn');
        if (btn) {
          btn.addEventListener('click', (e) => {
            const action = itemEl.dataset.action;
            const text = btn.textContent.trim();
            const target = this.activeTarget;
            const targetData = target ? { ...target.dataset } : {};

            this.trigger('onSelect', {
              action,
              text,
              target,
              targetData,
              event: e
            });

            this.hide();
          });
        }
      });
    }

    show(x, y) {
      this.menuEl.classList.remove('hidden');

      // Smart Viewport Collision Avoidance
      const rect = this.menuEl.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      let posX = x + 2;
      let posY = y + 2;

      // Overflow Right -> flip to left
      if (posX + rect.width > winW - 10) {
        posX = Math.max(10, x - rect.width - 2);
      }
      // Overflow Bottom -> flip to top
      if (posY + rect.height > winH - 10) {
        posY = Math.max(10, y - rect.height - 2);
      }

      this.menuEl.style.left = `${posX}px`;
      this.menuEl.style.top = `${posY}px`;

      this.trigger('onOpen', { x: posX, y: posY, target: this.activeTarget });
    }

    hide() {
      if (!this.menuEl.classList.contains('hidden')) {
        this.menuEl.classList.add('hidden');
        this.trigger('onClose', {});
      }
    }

    trigger(eventName, data) {
      const cbName = this.config[eventName];
      if (cbName && typeof window[cbName] === 'function') {
        try { window[cbName](data, this); } catch (e) { console.error(e); }
      }
      this.wrapper.dispatchEvent(new CustomEvent(`panoptes:${eventName.toLowerCase()}`, { detail: data }));
    }
  }

  // Public Static API
  window.Panoptes.Menu = {
    init: function (id) {
      const inst = new PanoptesMenuInstance(id);
      window.Panoptes.instances[id] = inst;
      return inst;
    },
    get: function (id) {
      return window.Panoptes.instances[id];
    }
  };

  window.Panoptes.ContextMenu = {
    init: function (id) {
      const inst = new PanoptesContextMenuInstance(id);
      window.Panoptes.instances[id] = inst;
      return inst;
    },
    get: function (id) {
      return window.Panoptes.instances[id];
    }
  };

})(window);
