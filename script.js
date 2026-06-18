// --- PARTICLES ENGINE (Content from particles.js) ---
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

    // --- EQUALIZER ENGINE (Modified content from visualizer.js for real audio) ---
    const eqCanvas = document.getElementById("equalizerCanvas");
    const eqCtx = eqCanvas.getContext("2d");

    eqCanvas.width = 180;
    eqCanvas.height = 60;

    // This function will be called by app.js's visualizeAudio loop
    function drawEqualizer(analyser, dataArray, bufferLength) {
      eqCtx.clearRect(0, 0, eqCanvas.width, eqCanvas.height);
      analyser.getByteFrequencyData(dataArray); // Get real audio data

      const barWidth = 5;
      const barGap = 3;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Scale height, ensuring a minimum height for visibility
        const barHeight = Math.max(2, dataArray[i] / 255 * eqCanvas.height * 0.8);

        const gradient = eqCtx.createLinearGradient(0, 0, 0, eqCanvas.height);
        gradient.addColorStop(0, "#00f7ff");
        gradient.addColorStop(1, "#9d4dff");
        eqCtx.fillStyle = gradient;

        eqCtx.fillRect(x, eqCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + barGap;
      }
    }

    // --- APP.JS (Main Logic) ---
    // Global state
    let currentSongIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 0; // 0: no repeat, 1: repeat one, 2: repeat all
    let favorites = [];
    let activeView = 'home';
    let shuffledSongs = []; // To store shuffled order

    // DOM Elements
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

    // Web Audio API for Equalizer
    let audioCtx;
    let analyser;
    let source;
    let dataArray;
    let bufferLength;

    // Songs data (Músicas nativas base)
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

    // Carrega músicas customizadas do LocalStorage e junta com a lista base global
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
      progressEl.value = 0; // Reset progress
      audio.currentTime = 0; // Reset audio time
      updateFavoriteButton();
      playSong();
      saveState();
    }

    function playSong() {
      if (!audioCtx) {
        initWebAudio(); // Initialize Web Audio API on first play
      }
      audio.play();
      isPlaying = true;
      playBtn.innerHTML = '⏸';
      songInfoDiv.classList.add('playing');
      visualizeAudio(); // Start visualization
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
      if (repeatMode === 1) { // Repeat one song
        loadSong(currentSongIndex);
        return;
      }

      const playlist = isShuffle ? shuffledSongs : songs;
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      loadSong(playlist[currentSongIndex].id);

      if (repeatMode === 0 && currentSongIndex === 0) { // No repeat, stop at end
        pauseSong();
      }
    }

    function prevSong() {
      if (repeatMode === 1) { // Repeat one song
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
        // If shuffle is turned off, try to find current song in original order
        const currentSongId = songs[currentSongIndex].id;
        currentSongIndex = songs.findIndex(song => song.id === currentSongId);
      }
      saveState();
    }

    function toggleRepeat() {
      repeatMode = (repeatMode + 1) % 3; // 0 -> 1 -> 2 -> 0
      repeatBtn.classList.remove('active');
      if (repeatMode === 1) {
        repeatBtn.classList.add('active');
        repeatBtn.innerHTML = '🔂'; // Repeat one
      } else if (repeatMode === 2) {
        repeatBtn.classList.add('active');
        repeatBtn.innerHTML = '🔁'; // Repeat all
      } else {
        repeatBtn.innerHTML = '🔁'; // No repeat
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
        favorites.splice(index, 1); // Remove
      } else {
        favorites.push(currentSongId); // Add
      }
      updateFavoriteButton();
      saveState();
      if (activeView === 'favorites') {
        renderFavoritesView(); // Re-render favorites if on that view
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
        document.getElementById('home-view').classList.add('active'); // Fallback to home
        activeView = 'home';
      }

      updateSidebarActive(activeView);
      window.location.hash = activeView; // Update URL hash

      // Specific view rendering logic
      if (viewName === 'library') {
        renderLibraryView();
      } else if (viewName === 'favorites') {
        renderFavoritesView();
      } else if (viewName === 'search') {
        // Clear previous search results when opening search view
        document.getElementById('search-results-container').innerHTML = '<p class="empty-state">Start typing in the search bar to find music.</p>';
        searchInput.value = ''; // Clear search input
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

        // Apply loaded state to UI
        shuffleBtn.classList.toggle('active', isShuffle);
        if (isShuffle) {
          shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
        }
        toggleRepeat(); // Call to update button icon based on repeatMode
        updateFavoriteButton();
      }
      loadSong(currentSongIndex); // Load the last played song
      pauseSong(); // Start paused
    }

    // --- Web Audio API Initialization ---
    function initWebAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256; // Fast Fourier Transform size
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

    // --- Fullscreen Player (Placeholder) ---
    function openFullscreenPlayer() {
      alert('Fullscreen Player coming soon! Enjoy the music!');
    }

    // --- Playlist Sidebar Populator ---
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

    // --- SISTEMA DE IMPORTAÇÃO E UPLOAD LOCAL ---
    function openUploader() {
      document.getElementById("uploadModal").style.display = "flex";
    }

    function closeUploader() {
      document.getElementById("uploadModal").style.display = "none";
    }

    function saveUploadedSong() {
      const title = document.getElementById("musicTitle").value || "Música Importada";
      const artist = document.getElementById("musicArtist").value || "Artista Desconhecido";
      const musicFile = document.getElementById("musicFile").files[0];
      const coverFile = document.getElementById("coverFile").files[0];

      if (!musicFile) {
        alert("Por favor, selecione um ficheiro de música (MP3)!");
        return;
      }

      // Converte a música para base64 DataURL para salvar permanentemente
      const musicReader = new FileReader();
      musicReader.onload = function(e) {
        const musicData = e.target.result;

        if (coverFile) {
          const coverReader = new FileReader();
          coverReader.onload = function(evt) {
            finalizeSongUpload(title, artist, musicData, evt.target.result);
          };
          coverReader.readAsDataURL(coverFile);
        } else {
          // Capa padrão futurista caso nenhuma seja selecionada
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
        // Guarda na lista atual em execução
        songs.push(newSong);

        // Guarda permanentemente no LocalStorage do Navegador
        let currentCustoms = JSON.parse(localStorage.getItem("customSongs")) || [];
        currentCustoms.push({
          title: title,
          artist: artist,
          src: musicSrc,
          cover: coverData
        });
        localStorage.setItem("customSongs", JSON.stringify(currentCustoms));

        // Atualiza as interfaces instantaneamente
        updatePlaylist();
        if (activeView === 'library') {
          renderLibraryView();
        }

        closeUploader();
        alert("Música importada com sucesso!");

        // Limpa os campos do formulário
        document.getElementById("musicTitle").value = "";
        document.getElementById("musicArtist").value = "";
        document.getElementById("musicFile").value = "";
        document.getElementById("coverFile").value = "";
      } catch (error) {
        console.error(error);
        alert("Aviso: O ficheiro de música pode ser demasiado grande para o limite padrão do LocalStorage (5MB). No futuro, a sincronização com o Google Drive real contornará este limite!");
      }
    }

    // --- Initialization ---
    function initApp() {
      loadState(); // Load player state from localStorage
      updatePlaylist(); // Carrega dinamicamente a lista na barra lateral no boot

      // Set initial volume
      audio.volume = volumeEl.value;

      // Check URL hash for initial view
      const hash = window.location.hash.substring(1);
      if (hash && document.getElementById(`${hash}-view`)) {
        renderView(hash);
      } else {
        renderView('home');
      }

      // Event Listeners
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', nextSong); // Auto play next song
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

      // Ensure audio context is resumed if suspended (e.g., after user interaction)
      document.body.addEventListener('click', () => {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }, { once: true });
    }

    window.addEventListener('load', initApp);
