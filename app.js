
const calendar = document.getElementById('calendar');
const dialog = document.getElementById('day-dialog');
const closeButton = document.getElementById('close-dialog');
const progress = document.getElementById('progress');
const openedDays = new Set(JSON.parse(localStorage.getItem('jhopeOpenedDays') || '[]'));
let currentDay = null;
let selectedAnswer = null;

function getUnlockedThrough() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const dateParts = Object.fromEntries(
    parts.map(part => [part.type, part.value])
  );

  const dateKey = Number(
  `${dateParts.year}${dateParts.month}${dateParts.day}`
  );

  const firstDay = 20261201;
  const lastDay = 20261224;

  if (dateKey < firstDay) return 0;
  if (dateKey > lastDay) return 24;

  return Number(dateParts.day);
}

function shuffledDays() {
  const days = Array.from({ length: 24 }, (_, i) => i + 1);
  for (let i = days.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [days[i], days[j]] = [days[j], days[i]];
  }
  return days;
}

function renderCalendar() {
  calendar.innerHTML = '';
  const unlockedThrough = getUnlockedThrough();
  shuffledDays().forEach(day => {
    const button = document.createElement('button');
    button.className = 'door' + (openedDays.has(day) ? ' opened' : '');
    button.type = 'button';
    button.disabled = day > unlockedThrough;
    button.setAttribute('aria-label', `Day ${day}${button.disabled ? ', locked' : ''}`);
    button.innerHTML = `<span class="number">${String(day).padStart(2, '0')}</span><span class="door-label">${button.disabled ? 'Coming soon' : openedDays.has(day) ? 'Revisit' : 'Open the door'}</span>`;
    button.addEventListener('click', () => openDay(day));
    calendar.appendChild(button);
  });
  progress.textContent = `${openedDays.size} / 24 opened`;
}

function getYouTubeVideoId(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.replace(/^www\./, '');

    let videoId = null;

    if (host === 'youtu.be') {
      videoId = url.pathname.slice(1).split('/')[0];
    } else if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v');
      } else {
        const match = url.pathname.match(
          /^\/(?:embed|shorts|live)\/([^/?]+)/
        );
        if (match) videoId = match[1];
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId || '')
      ? videoId
      : null;

  } catch {
    return null;
  }
}

function clearSurpriseMedia() {
  const video = document.getElementById('surprise-video');
  const youtube = document.getElementById('surprise-youtube');
  const link = document.getElementById('surprise-link');

  video.pause();
  video.removeAttribute('src');
  video.load();
  video.hidden = true;

  youtube.src = '';
  youtube.hidden = true;

  link.hidden = true;
  link.removeAttribute('href');
}

async function openDay(day) {
  try {
    const response = await fetch(`days/${day}.json`);
    if (!response.ok) throw new Error('Could not load day content');
    const data = await response.json();
    currentDay = data;

    openedDays.add(day);
    localStorage.setItem('jhopeOpenedDays', JSON.stringify([...openedDays]));
    progress.textContent = `${openedDays.size} / 24 opened`;

    document.getElementById('day-number').textContent = `DAY ${String(day).padStart(2, '0')}`;
    document.getElementById('day-title').textContent = data.title;
    const storyElement = document.getElementById('day-story');

    const escapeHtml = (text) => text.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

    const formatText = (text) => {
      return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    };

    storyElement.innerHTML = data.story
      .split(/\n\s*\n/)
      .map(block => {
        const text = block.trim();

        if (!text) return '';

        if (text === text.toUpperCase() && /[A-Z]/.test(text)) {
          return `<h3 class="story-heading">${escapeHtml(text)}</h3>`;
        }

        return `<p>${formatText(text)}</p>`;
      })
      .join('');

    // Daily Christmas Photo
    const photoPanel = document.getElementById('photo-panel');
    const christmasPhoto = document.getElementById('christmas-photo');

    if (data.christmasImage) {
      christmasPhoto.src = data.christmasImage;
      christmasPhoto.alt = `j-hope Christmas photo - Day ${day}`;
      christmasPhoto.hidden = false;
      photoPanel.hidden = false;

      christmasPhoto.onerror = () => {
        christmasPhoto.hidden = true;
        photoPanel.hidden = true;
        console.error(`Could not load image: ${data.christmasImage}`);
      };
    } else {
      christmasPhoto.removeAttribute('src');
      christmasPhoto.hidden = true;
      photoPanel.hidden = true;
    }

    
    // Today's Surprise
    document.getElementById('surprise-title').textContent =
      data.surpriseTitle || 'Your daily surprise';

    document.getElementById('surprise-description').textContent =
      data.surpriseDescription || '';

    const link = document.getElementById('surprise-link');
    const video = document.getElementById('surprise-video');
    const youtube = document.getElementById('surprise-youtube');

    // Reset previous surprise
    clearSurpriseMedia();

    const surpriseUrl = data.surpriseUrl || '';

    if (surpriseUrl) {
      const youtubeId = getYouTubeVideoId(surpriseUrl);

      if (youtubeId) {
        // YouTube video
        const embedUrl = surpriseUrl.includes('/embed/')
          ? surpriseUrl
          : `https://www.youtube.com/embed/${youtubeId}`;

        youtube.src = embedUrl;
        youtube.hidden = false;

      } else if (/\.mp4(?:$|[?#])/i.test(surpriseUrl)) {
        // Local MP4 video
        video.src = surpriseUrl;
        video.hidden = false;

      } else {
        // External link
        link.href = surpriseUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = data.surpriseLabel || 'Open surprise ↗';
        link.hidden = false;
      }
    }


    resetChallenge(data.challenge);
    renderCalendar();
    dialog.showModal();

  } catch (error) {
    alert('This day could not be loaded. Please check the content file and try again.');
    console.error(error);
  }
}

function resetChallenge(challenge) {
  selectedAnswer = null;
  const panel = document.getElementById('challenge-panel');
  const options = document.getElementById('challenge-options');
  const check = document.getElementById('check-answer');
  const feedback = document.getElementById('challenge-feedback');

  options.innerHTML = '';
  feedback.textContent = '';

  if (!challenge || challenge.enabled === false || !challenge.options?.length) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  document.getElementById('challenge-question').textContent = challenge.question || '';

  challenge.options.forEach(option => {
    const label = document.createElement('label');
    label.className = 'option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'challenge-answer';
    input.value = option;

    input.addEventListener('change', () => {
      selectedAnswer = option;
      check.disabled = false;
      feedback.textContent = '';
    });

    label.append(input, document.createTextNode(option));
    options.appendChild(label);
  });

  check.disabled = true;

  check.onclick = () => {
    if (selectedAnswer === null) return;

    const correct = challenge.answer && selectedAnswer.toLowerCase() === challenge.answer.toLowerCase();

    feedback.textContent = correct
      ? `Correct! ❤️‍🔥 ${challenge.explanation || ''}`
      : `Not quite! ${challenge.answer ? `The answer is: ${challenge.answer}. ` : ''}${challenge.explanation || ''}`;

    feedback.style.color = correct ? '#276342' : '#8a2636';
  };
}

// Stop the video when the visitor closes the daily window
function stopSurpriseVideo() {
  const video = document.getElementById('surprise-video');

  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden = true;
  }
}

closeButton.addEventListener('click', () => {
  stopSurpriseVideo();
  dialog.close();
});

dialog.addEventListener('close', clearSurpriseMedia);

dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    stopSurpriseVideo();
    dialog.close();
  }
});


renderCalendar();
