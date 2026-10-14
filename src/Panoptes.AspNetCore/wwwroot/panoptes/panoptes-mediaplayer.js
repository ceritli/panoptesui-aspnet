/**
 * Panoptes MediaPlayer Component
 * HTML5 Video & Audio custom UI player, Playlist, Seekbar, Fullscreen, Volume
 */
(function() {
    'use strict';

    window.Panoptes = window.Panoptes || {};
    window.Panoptes.MediaPlayer = {
        instances: new Map(),

        init: function(root) {
            root = root || document;
            const elements = root.querySelectorAll('[data-panoptes-player="true"]');
            elements.forEach(el => {
                if (!this.instances.has(el.id)) {
                    this.instances.set(el.id, new MediaPlayerComponent(el));
                }
            });
        },

        get: function(id) {
            return this.instances.get(id);
        },

        play: function(id) {
            const inst = this.get(id);
            if (inst) inst.play();
        },

        pause: function(id) {
            const inst = this.get(id);
            if (inst) inst.pause();
        },

        seek: function(id, seconds) {
            const inst = this.get(id);
            if (inst) inst.seek(seconds);
        },

        setVolume: function(id, volume) {
            const inst = this.get(id);
            if (inst) inst.setVolume(volume);
        },

        loadSource: function(id, src, title) {
            const inst = this.get(id);
            if (inst) inst.loadSource(src, title);
        }
    };

    class MediaPlayerComponent {
        constructor(element) {
            this.container = element;
            this.id = element.id;
            this.type = element.dataset.type || 'video';
            this.onPlayCb = element.dataset.onPlay || null;
            this.onPauseCb = element.dataset.onPause || null;
            this.onEndedCb = element.dataset.onEnded || null;

            this.media = element.querySelector('.panoptes-player-media');
            this.screenWrap = element.querySelector('.panoptes-player-screen-wrap');
            this.bigPlay = element.querySelector('.panoptes-player-big-play');
            this.btnPlay = element.querySelector('.panoptes-player-btn-play');
            this.iconPlay = element.querySelector('.panoptes-icon-play');
            this.iconPause = element.querySelector('.panoptes-icon-pause');
            this.timeCurrent = element.querySelector('.panoptes-player-time-current');
            this.timeTotal = element.querySelector('.panoptes-player-time-total');
            this.seekWrap = element.querySelector('.panoptes-player-seek-wrap');
            this.progressBar = element.querySelector('.panoptes-player-progress-bar');
            this.btnMute = element.querySelector('.panoptes-player-btn-mute');
            this.iconVolUp = element.querySelector('.panoptes-icon-vol-up');
            this.iconVolMute = element.querySelector('.panoptes-icon-vol-mute');
            this.volRange = element.querySelector('.panoptes-player-vol-range');
            this.btnFullscreen = element.querySelector('.panoptes-player-btn-fullscreen');
            this.titleOverlay = element.querySelector('.panoptes-player-title-overlay span');
            this.audioSub = element.querySelector('.panoptes-player-audio-sub');

            this.playlistItems = element.querySelectorAll('.panoptes-playlist-item');

            this.bindEvents();
        }

        bindEvents() {
            if (!this.media) return;

            // Big play / Screen click
            if (this.bigPlay) {
                this.bigPlay.addEventListener('click', () => this.togglePlay());
            }
            if (this.screenWrap) {
                this.screenWrap.addEventListener('click', (e) => {
                    if (e.target.closest('button')) return;
                    this.togglePlay();
                });
            }

            // Toolbar play button
            if (this.btnPlay) {
                this.btnPlay.addEventListener('click', () => this.togglePlay());
            }

            // Media events
            this.media.addEventListener('play', () => {
                this.updatePlayState(true);
                this.triggerCallback(this.onPlayCb, 'panoptes-player-play');
            });

            this.media.addEventListener('pause', () => {
                this.updatePlayState(false);
                this.triggerCallback(this.onPauseCb, 'panoptes-player-pause');
            });

            this.media.addEventListener('ended', () => {
                this.updatePlayState(false);
                this.triggerCallback(this.onEndedCb, 'panoptes-player-ended');
            });

            this.media.addEventListener('timeupdate', () => {
                this.updateProgress();
            });

            this.media.addEventListener('loadedmetadata', () => {
                if (this.timeTotal && !isNaN(this.media.duration)) {
                    this.timeTotal.textContent = this.formatTime(this.media.duration);
                }
            });

            // Seek bar click
            if (this.seekWrap) {
                this.seekWrap.addEventListener('click', (e) => {
                    const rect = this.seekWrap.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    if (!isNaN(this.media.duration)) {
                        this.media.currentTime = ratio * this.media.duration;
                    }
                });
            }

            // Volume controls
            if (this.volRange) {
                this.volRange.addEventListener('input', () => {
                    this.media.volume = parseFloat(this.volRange.value);
                    this.media.muted = (this.media.volume === 0);
                    this.updateVolumeUI();
                });
            }

            if (this.btnMute) {
                this.btnMute.addEventListener('click', () => {
                    this.media.muted = !this.media.muted;
                    this.updateVolumeUI();
                });
            }

            // Fullscreen
            if (this.btnFullscreen) {
                this.btnFullscreen.addEventListener('click', () => {
                    this.toggleFullscreen();
                });
            }

            // Playlist clicks
            this.playlistItems.forEach(item => {
                item.addEventListener('click', () => {
                    const src = item.dataset.src;
                    const title = item.dataset.title;
                    this.loadSource(src, title);

                    this.playlistItems.forEach(pi => {
                        pi.className = 'panoptes-playlist-item flex items-center justify-between p-2 rounded-xl cursor-pointer transition text-slate-300 hover:bg-slate-800 border border-transparent';
                    });
                    item.className = 'panoptes-playlist-item flex items-center justify-between p-2 rounded-xl cursor-pointer transition bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold';
                    this.play();
                });
            });
        }

        togglePlay() {
            if (this.media.paused || this.media.ended) {
                this.play();
            } else {
                this.pause();
            }
        }

        play() {
            this.media.play().catch(e => console.warn('Media play prevented:', e));
        }

        pause() {
            this.media.pause();
        }

        seek(seconds) {
            this.media.currentTime = seconds;
        }

        setVolume(vol) {
            this.media.volume = Math.max(0, Math.min(1, vol));
            if (this.volRange) this.volRange.value = this.media.volume;
            this.updateVolumeUI();
        }

        loadSource(src, title) {
            this.media.src = src;
            if (this.titleOverlay && title) {
                this.titleOverlay.textContent = title;
            }
            if (this.audioSub && title) {
                this.audioSub.textContent = title;
            }
            this.media.load();
        }

        updatePlayState(isPlaying) {
            if (this.bigPlay) {
                if (isPlaying) {
                    this.bigPlay.classList.add('opacity-0', 'pointer-events-none');
                } else {
                    this.bigPlay.classList.remove('opacity-0', 'pointer-events-none');
                }
            }

            if (this.iconPlay && this.iconPause) {
                if (isPlaying) {
                    this.iconPlay.classList.add('hidden');
                    this.iconPause.classList.remove('hidden');
                } else {
                    this.iconPlay.classList.remove('hidden');
                    this.iconPause.classList.add('hidden');
                }
            }

            if (this.audioSub) {
                this.audioSub.textContent = isPlaying ? 'Oynatılıyor' : 'Duraklatıldı';
            }
        }

        updateProgress() {
            if (!this.media || isNaN(this.media.duration) || this.media.duration === 0) return;
            const percent = (this.media.currentTime / this.media.duration) * 100;
            if (this.progressBar) this.progressBar.style.width = `${percent}%`;
            if (this.timeCurrent) this.timeCurrent.textContent = this.formatTime(this.media.currentTime);
            if (this.timeTotal) this.timeTotal.textContent = this.formatTime(this.media.duration);
        }

        updateVolumeUI() {
            const isMuted = this.media.muted || this.media.volume === 0;
            if (this.iconVolUp && this.iconVolMute) {
                if (isMuted) {
                    this.iconVolUp.classList.add('hidden');
                    this.iconVolMute.classList.remove('hidden');
                } else {
                    this.iconVolUp.classList.remove('hidden');
                    this.iconVolMute.classList.add('hidden');
                }
            }
            if (this.volRange) {
                this.volRange.value = isMuted ? 0 : this.media.volume;
            }
        }

        toggleFullscreen() {
            if (!document.fullscreenElement) {
                if (this.container.requestFullscreen) {
                    this.container.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }

        formatTime(seconds) {
            const s = Math.floor(seconds);
            const m = Math.floor(s / 60);
            const remSec = s % 60;
            return `${m < 10 ? '0' : ''}${m}:${remSec < 10 ? '0' : ''}${remSec}`;
        }

        triggerCallback(fnName, evtName) {
            if (fnName && typeof window[fnName] === 'function') {
                window[fnName](this);
            }
            this.container.dispatchEvent(new CustomEvent(evtName, {
                detail: { player: this, currentTime: this.media.currentTime, duration: this.media.duration }
            }));
        }
    }

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.Panoptes.MediaPlayer.init());
    } else {
        window.Panoptes.MediaPlayer.init();
    }
})();
