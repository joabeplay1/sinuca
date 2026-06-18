// ==========================================
// CONFIGURAÇÃO DO GOOGLE DRIVE API
// ==========================================
const CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com'; 
const API_KEY = 'SUA_API_KEY_AQUI'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let accessToken = null;
let currentPickerTarget = null; // 'audio' ou 'image'
let driveAudioUrl = null;
let driveCoverUrl = null;

// --- PARTICLES ENGINE ---
    const particleCanvas = document.getElementById("particleCanvas");
    const p_ctx = particleCanvas.getContext("2d");

    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;

    let particles = [];

    class Particle {
      constructor() {
        this.x = Math.random() * particleCanvas.width;
        this.y = Math.random() * particleCanvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 1.2;
        this.speedY = (Math.random() - 0.5) * 1.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > particleCanvas.width) {
          this.speedX *= -1;
        }
        if (this.y < 0 || this.y > particleCanvas.height) {
          this.speedY *= -1;
        }
      }

      draw() {
        p_ctx.beginPath();
        p_ctx.fillStyle = "rgba(0,247,255,0.8)";
        p_ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        p_ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < 120; i++) {
        particles.push(new Particle());
      }
    }

    function connectParticles() {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = dx * dx + dy * dy;

          if (distance < 10000) {
            p_ctx.strokeStyle = "rgba(157,77,255,0.08)";
            p_ctx.lineWidth = 1;
            p_ctx.beginPath();
            p_ctx.moveTo(particles[a].x, particles[a].y);
            p_ctx.lineTo(particles[b].x, particles[b].y);
            p_ctx.stroke();
          }
        }
      }
    }

    function animateParticles() {
      p_ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      connectParticles();
      requestAnimationFrame(animateParticles);
    }

    window.addEventListener("resize", () => {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
      initParticles();
    });

    initParticles();
    animateParticles();

    // --- EQUALIZER ENGINE ---
    const eqCanvas = document.getElementById("equalizerCanvas");
    const eqCtx = eqCanvas.getContext("2d");

    eqCanvas.width = 180;
    eqCanvas.height = 60;

    function drawEqualizer(analyser, dataArray, bufferLength) {
      eqCtx.clearRect(0, 0, eqCanvas.width, eqCanvas.height);
      analyser.getByteFrequencyData(dataArray); 

      const barWidth = 5;
      const barGap = 3;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = Math.max(2, dataArray[i] / 255 * eqCanvas.height * 0.8);

        const gradient = eqCtx.createLinearGradient(0, 0, 0, eqCanvas.height);
        gradient.addColorStop(0, "#00f7ff");
        gradient.addColorStop(1, "#9d4dff");
        eqCtx.fillStyle = gradient;

        eqCtx.fillRect(x, eqCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + barGap;
      }
    }

    // --- APP STATE & SYSTEM ---
    let currentSongIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 0; 
    let favorites = [];
    let activeView = 'home';
    let shuffledSongs = []; 

    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('playBtn');
    const coverImg = document.getElementById('cover');
    const titleEl = document.getElementById('title');
    const artistEl = document.getElementById('artist');
    const progressEl = document.getElementById('progress');
    const volumeEl = document.getElementById('volume');
    const songInfoDiv = document.querySelector('.song-info');
    const mainContentWrapper = document.getElementById('main-content-wrapper');
    const sidebarNavButtons = document.querySelectorAll('.sidebar nav button');
    const searchInput = document.getElementById('searchInput');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const favoriteBtn = document.getElementById('favoriteBtn');

    let audioCtx;
    let analyser;
    let source;
    let dataArray;
    let bufferLength;

    const baseSongs = [
      { id: 0, title: "Neon Dreams", artist: "Pulse Studio", src: "assets/audio/song1.mp3", cover: "https://picsum.photos/id/1040/200/200" },
      { id: 1, title: "Future Bass", artist: "Synthwave Collective", src: "assets/audio/song2.mp3", cover: "https://picsum.photos/id/1041/200/200" },
      { id: 2, title: "Night Cyber", artist: "Digital Beats Inc.", src: "assets/audio/song3.mp3", cover: "https://picsum.photos/id/1042/200/200" },
      { id: 3, title: "Deep Space", artist: "Cosmic Echoes", src: "assets/audio/song4.mp3", cover: "https://picsum.photos/id/1043/200/200" },
      { id: 4, title: "Electric Pulse", artist: "Neon Waves", src: "assets/audio/song5.mp3", cover: "https://picsum.photos/id/1044/200/200" },
      { id: 5, title: "Starlight Drive", artist: "Astro Beats", src: "assets/audio/song6.mp3", cover: "https://picsum.photos/id/1045/200/200" },
      { id: 6, title: "Cybernetic Heart", artist: "Robo Funk", src: "assets/audio/song7.mp3", cover: "https://picsum.photos/id/1046/200/200" },
      { id: 7, title: "Quantum Leap", artist: "Future Soundscapes", src: "assets/audio/song8.mp3", cover: "https://picsum.photos/id/1047/200/200" },
    ];

    let savedCustomSongs = [];
    try {
      savedCustomSongs = JSON.parse(localStorage.getItem("customSongs")) || [];
    } catch(e) {
      console.error(e);
    }

    const songs = [...baseSongs];
    savedCustomSongs.forEach((song, idx) => {
      songs.push({
        id: baseSongs.length + idx,
        title: song.title,
        artist: song.artist,
        src: song.src,
        cover: song.cover
      });
    });

    // --- Core Player Functions ---
    function loadSong(index) {
      if (index < 0 || index >= songs.length) return;
      currentSongIndex = index;
      const song = songs[currentSongIndex];
      audio.src = song.src;
      coverImg.src = song.cover;
      titleEl.textContent = song.title;
      artistEl.textContent = song.artist;
      progressEl.value = 0; 
      audio.currentTime = 0; 
      updateFavoriteButton();
      playSong();
      saveState();
    }

    function playSong() {
      if (!audioCtx) {
        initWebAudio(); 
      }
      audio.play();
      isPlaying = true;
      playBtn.innerHTML = '⏸';
      songInfoDiv.classList.add('playing');
      visualizeAudio(); 
    }

    function pauseSong() {
      audio.pause();
      isPlaying = false;
      playBtn.innerHTML = '▶';
      songInfoDiv.classList.remove('playing');
    }

    function togglePlay() {
      if (isPlaying) {
        pauseSong();
      } else {
        playSong();
      }
    }

    function nextSong() {
      if (repeatMode === 1) {
        loadSong(currentSongIndex);
        return;
      }

      const playlist = isShuffle ? shuffledSongs : songs;
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      loadSong(playlist[currentSongIndex].id);

      if (repeatMode === 0 && currentSongIndex === 0) { 
        pauseSong();
      }
    }

    function prevSong() {
      if (repeatMode === 1) {
        loadSong(currentSongIndex);
        return;
      }

      const playlist = isShuffle ? shuffledSongs : songs;
      currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
      loadSong(playlist[currentSongIndex].id);
    }

    function toggleShuffle() {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle('active', isShuffle);
      if (isShuffle) {
        shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
      } else {
        const currentSongId = songs[currentSongIndex].id;
        currentSongIndex = songs.findIndex(song => song.id === currentSongId);
      }
      saveState();
    }

    function toggleRepeat() {
      repeatMode = (repeatMode + 1) % 3; 
      repeatBtn.classList.remove('active');
      if (repeatMode === 1) {
        repeatBtn.classList.add('active');
        repeatBtn.innerHTML = '🔂'; 
      } else if (repeatMode === 2) {
        repeatBtn.classList.add('active');
        repeatBtn.innerHTML = '🔁'; 
      } else {
        repeatBtn.innerHTML = '🔁'; 
      }
      saveState();
    }

    function updateProgress() {
      const { duration, currentTime } = audio;
      const progressPercent = (currentTime / duration) * 100;
      progressEl.value = isNaN(progressPercent) ? 0 : progressPercent;
    }

    function seekProgress() {
      const seekTime = (progressEl.value / 100) * audio.duration;
      audio.currentTime = seekTime;
    }

    function setVolume() {
      audio.volume = volumeEl.value;
      saveState();
    }

    function updateFavoriteButton() {
      if (currentSongIndex >= songs.length) return;
      const currentSongId = songs[currentSongIndex].id;
      if (favorites.includes(currentSongId)) {
        favoriteBtn.classList.add('active');
      } else {
        favoriteBtn.classList.remove('active');
      }
    }

    function toggleFavorite() {
      const currentSongId = songs[currentSongIndex].id;
      const index = favorites.indexOf(currentSongId);
      if (index > -1) {
        favorites.splice(index, 1); 
      } else {
        favorites.push(currentSongId); 
      }
      updateFavoriteButton();
      saveState();
      if (activeView === 'favorites') {
        renderFavoritesView(); 
      }
    }

    // --- Routing & View Management ---
    function renderView(viewName) {
      activeView = viewName;
      const sections = document.querySelectorAll('.view-section');
      sections.forEach(section => section.classList.remove('active'));

      const targetSection = document.getElementById(`${viewName}-view`);
      if (targetSection) {
        targetSection.classList.add('active');
      } else {
        document.getElementById('home-view').classList.add('active'); 
        activeView = 'home';
      }

      updateSidebarActive(activeView);
      window.location.hash = activeView; 

      if (viewName === 'library') {
        renderLibraryView();
      } else if (viewName === 'favorites') {
        renderFavoritesView();
      } else if (viewName === 'search') {
        document.getElementById('search-results-container').innerHTML = '<p class="empty-state">Start typing in the search bar to find music.</p>';
        searchInput.value = ''; 
      }
    }

    function updateSidebarActive(viewName) {
      sidebarNavButtons.forEach(button => {
        if (button.dataset.view === viewName) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });
    }

    function goHome() { renderView('home'); }
    function openSearch() { renderView('search'); }
    function openLibrary() { renderView('library'); }
    function openFavorites() { renderView('favorites'); }
    function openProfile() { renderView('profile'); }

    function renderSongCard(song) {
      return `
        <div class="card" onclick="loadSong(${song.id})">
          <img src="${song.cover}" alt="Album Cover">
          <h4>${song.title}</h4>
          <p>${song.artist}</p>
        </div>
      `;
    }

    function renderLibraryView() {
      const libraryContainer = document.getElementById('library-list-container');
      if (songs.length === 0) {
        libraryContainer.innerHTML = '<p class="empty-state">Your library is empty.</p>';
        return;
      }
      libraryContainer.innerHTML = songs.map(renderSongCard).join('');
    }

    function renderFavoritesView() {
      const favoritesContainer = document.getElementById('favorites-list-container');
      if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p class="empty-state">No favorite songs yet. Click the ❤️ button on the player to add some!</p>';
        return;
      }
      const favoriteSongs = songs.filter(song => favorites.includes(song.id));
      favoritesContainer.innerHTML = favoriteSongs.map(renderSongCard).join('');
    }

    function searchMusic() {
      const query = searchInput.value.toLowerCase();
      const searchResultsContainer = document.getElementById('search-results-container');

      if (query.length < 2) {
        searchResultsContainer.innerHTML = '<p class="empty-state">Start typing in the search bar to find music.</p>';
        return;
      }

      const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );

      if (filteredSongs.length === 0) {
        searchResultsContainer.innerHTML = '<p class="empty-state">No results found for your search.</p>';
      } else {
        searchResultsContainer.innerHTML = filteredSongs.map(renderSongCard).join('');
      }
    }

    // --- LocalStorage ---
    function saveState() {
      localStorage.setItem('pulseMusicState', JSON.stringify({
        currentSongIndex,
        volume: audio.volume,
        isShuffle,
        repeatMode,
        favorites
      }));
    }

    function loadState() {
      const savedState = JSON.parse(localStorage.getItem('pulseMusicState'));
      if (savedState) {
        currentSongIndex = savedState.currentSongIndex || 0;
        audio.volume = savedState.volume !== undefined ? savedState.volume : 0.7;
        volumeEl.value = audio.volume;
        isShuffle = savedState.isShuffle || false;
        repeatMode = savedState.repeatMode || 0;
        favorites = savedState.favorites || [];

        shuffleBtn.classList.toggle('active', isShuffle);
        if (isShuffle) {
          shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
        }
        toggleRepeat(); 
        updateFavoriteButton();
      }
      loadSong(currentSongIndex); 
      pauseSong(); 
    }

    // --- Web Audio API Initialization ---
    function initWebAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256; 
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      }
    }

    function visualizeAudio() {
      if (isPlaying && analyser && dataArray) {
        drawEqualizer(analyser, dataArray, bufferLength);
        requestAnimationFrame(visualizeAudio);
      }
    }

    function openFullscreenPlayer() {
      alert('Fullscreen Player coming soon! Enjoy the music!');
    }

    function updatePlaylist() {
      const list = document.getElementById("playlist-list");
      if (list) {
        list.innerHTML = "";
        songs.forEach((song, index) => {
          list.innerHTML += `
            <li onclick="loadSong(${index})" contenteditable="true" data-omega-editable="true">
              ${song.title}
            </li>
          `;
        });
      }
    }

    function openUploader() {
      document.getElementById("uploadModal").style.display = "flex";
    }

    function closeUploader() {
      document.getElementById("uploadModal").style.display = "none";
    }

    // ==========================================
    // FLUXO DO MOTOR DO GOOGLE DRIVE PICKER
    // ==========================================
    function pickFromDrive(targetType) {
      currentPickerTarget = targetType;
      
      if (CLIENT_ID.includes('SEU_CLIENT_ID')) {
        alert('Por favor, edite as variáveis CLIENT_ID e API_KEY no topo do ficheiro "script.js" para conectar com o seu console da Google API.');
        return;
      }

      if (!accessToken) {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              accessToken = tokenResponse.access_token;
              launchGooglePicker();
            }
          },
        });
        tokenClient.requestAccessToken();
      } else {
        launchGooglePicker();
      }
    }

    function launchGooglePicker() {
      gapi.load('picker', () => {
        let view;
        if (currentPickerTarget === 'audio') {
          view = new google.picker.View(google.picker.ViewId.AUDIO);
        } else {
          view = new google.picker.View(google.picker.ViewId.DOCS_IMAGES);
        }

        const picker = new google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(accessToken)
          .setDeveloperKey(API_KEY)
          .setCallback(googlePickerCallback)
          .build();
        picker.setVisible(true);
      });
    }

    function googlePickerCallback(data) {
      if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        const doc = data[google.picker.Response.DOCUMENTS][0];
        const fileId = doc[google.picker.Document.ID];
        const fileName = doc[google.picker.Document.NAME];

        // Cria o link direto de streaming público do Google Drive
        const directDriveLink = `https://docs.google.com/uc?export=download&id=${fileId}`;

        if (currentPickerTarget === 'audio') {
          driveAudioUrl = directDriveLink;
          const statusSpan = document.getElementById('driveMusicStatus');
          statusSpan.innerText = `Selecionado do Drive: ${fileName}`;
          statusSpan.style.display = 'block';
          
          if (!document.getElementById("musicTitle").value) {
            document.getElementById("musicTitle").value = fileName.replace(/\.[^/.]+$/, "");
          }
        } else {
          driveCoverUrl = directDriveLink;
          const statusSpan = document.getElementById('driveCoverStatus');
          statusSpan.innerText = `Capa selecionada do Drive!`;
          statusSpan.style.display = 'block';
        }
      }
    }

    // --- SALVAR MÚSICA (Modificado para aceitar local ou Drive) ---
    function saveUploadedSong() {
      const title = document.getElementById("musicTitle").value || "Música Importada";
      const artist = document.getElementById("musicArtist").value || "Artista Desconhecido";
      const musicFile = document.getElementById("musicFile").files[0];
      const coverFile = document.getElementById("coverFile").files[0];

      if (!musicFile && !driveAudioUrl) {
        alert("Por favor, selecione um ficheiro de música (seja Local ou via Google Drive)!");
        return;
      }

      // Se a música veio do Google Drive
      if (driveAudioUrl) {
        if (coverFile) {
          const coverReader = new FileReader();
          coverReader.onload = function(evt) {
            finalizeSongUpload(title, artist, driveAudioUrl, evt.target.result);
          };
          coverReader.readAsDataURL(coverFile);
        } else if (driveCoverUrl) {
          finalizeSongUpload(title, artist, driveAudioUrl, driveCoverUrl);
        } else {
          finalizeSongUpload(title, artist, driveAudioUrl, "https://picsum.photos/id/1044/200/200");
        }
        return;
      }

      // Fluxo Nativo para Arquivo Local (Base64)
      const musicReader = new FileReader();
      musicReader.onload = function(e) {
        const musicData = e.target.result;

        if (coverFile) {
          const coverReader = new FileReader();
          coverReader.onload = function(evt) {
            finalizeSongUpload(title, artist, musicData, evt.target.result);
          };
          coverReader.readAsDataURL(coverFile);
        } else if (driveCoverUrl) {
          finalizeSongUpload(title, artist, musicData, driveCoverUrl);
        } else {
          finalizeSongUpload(title, artist, musicData, "https://picsum.photos/id/1044/200/200");
        }
      };

      musicReader.onerror = function() {
        alert("Erro ao ler o ficheiro de áudio.");
      };

      musicReader.readAsDataURL(musicFile);
    }

    function finalizeSongUpload(title, artist, musicSrc, coverData) {
      const newSong = {
        id: songs.length,
        title: title,
        artist: artist,
        src: musicSrc,
        cover: coverData
      };

      try {
        songs.push(newSong);

        let currentCustoms = JSON.parse(localStorage.getItem("customSongs")) || [];
        currentCustoms.push({
          title: title,
          artist: artist,
          src: musicSrc,
          cover: coverData
        });
        localStorage.setItem("customSongs", JSON.stringify(currentCustoms));

        updatePlaylist();
        if (activeView === 'library') {
          renderLibraryView();
        }

        closeUploader();
        alert("Música adicionada com sucesso!");

        // Limpa campos e estados do Drive
        document.getElementById("musicTitle").value = "";
        document.getElementById("musicArtist").value = "";
        document.getElementById("musicFile").value = "";
        document.getElementById("coverFile").value = "";
        
        driveAudioUrl = null;
        driveCoverUrl = null;
        document.getElementById('driveMusicStatus').style.display = 'none';
        document.getElementById('driveCoverStatus').style.display = 'none';

      } catch (error) {
        console.error(error);
        alert("Erro de espaço: Ficheiros locais em Base64 podem exceder o limite do navegador. Dê preferência por importar músicas via Google Drive para evitar este limite!");
      }
    }

    // --- Initialization ---
    function initApp() {
      loadState(); 
      updatePlaylist(); 

      audio.volume = volumeEl.value;

      const hash = window.location.hash.substring(1);
      if (hash && document.getElementById(`${hash}-view`)) {
        renderView(hash);
      } else {
        renderView('home');
      }

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', nextSong); 
      progressEl.addEventListener('input', seekProgress);
      volumeEl.addEventListener('input', setVolume);
      window.addEventListener('hashchange', () => {
        const currentHash = window.location.hash.substring(1);
        if (currentHash) {
          renderView(currentHash);
        } else {
          renderView('home');
        }
      });

      document.body.addEventListener('click', () => {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }, { once: true });
    }

    window.addEventListener('load', initApp);
