
const map = L.map('map').setView([53.430127, 14.564802], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
}).addTo(map);

let userMarker = null;

const btnRequestPerms = document.getElementById('requestPerms');
const btnMyLoc = document.getElementById('btnMyLoc');
const btnExport = document.getElementById('btnExport');
const btnDownloadFull = document.getElementById('btnDownloadFull');
const latitudeSpan = document.getElementById('latitude');
const longitudeSpan = document.getElementById('longitude');
const pool = document.getElementById('pool');
const grid = document.getElementById('grid');
const hiddenCanvas = document.getElementById('hiddenCanvas');

let lastRasterCanvas = null;
let pieces = [];

function createGridSlots() {
    grid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.correctIndex = i;
        slot.dataset.currentIndex = '';
        slot.addEventListener('dragover', ev => ev.preventDefault());
        slot.addEventListener('drop', onDropToSlot);
        grid.appendChild(slot);
    }
}
createGridSlots();

btnRequestPerms.addEventListener('click', () => {
    if ('Notification' in window)
        Notification.requestPermission().then(p => console.log('Notification perm:', p));

    if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(() => console.log('Geo OK'), e => console.warn(e));
});

btnMyLoc.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Brak geolokacji');
    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        latitudeSpan.textContent = lat.toFixed(6);
        longitudeSpan.textContent = lon.toFixed(6);
        map.setView([lat, lon], 16);
        if (userMarker) userMarker.remove();
        userMarker = L.marker([lat, lon]).addTo(map).bindPopup('Moja lokalizacja').openPopup();
    });
});

function renderMapToCanvas() {
    return new Promise((resolve, reject) => {
        leafletImage(map, function (err, canvas) {
            if (err) return reject(err);
            lastRasterCanvas = canvas;
            resolve(canvas);
        });
    });
}

btnExport.addEventListener('click', async () => {
    btnExport.disabled = true;
    btnExport.textContent = 'Generuję...';

    try {
        const canvas = await renderMapToCanvas();

        const w = canvas.width;
        const h = canvas.height;
        const tileCount = 4;
        const tileW = Math.floor(w / tileCount);
        const tileH = Math.floor(h / tileCount);
        const usableW = tileW * tileCount;
        const usableH = tileH * tileCount;

        hiddenCanvas.width = usableW;
        hiddenCanvas.height = usableH;
        const ctx = hiddenCanvas.getContext('2d');
        ctx.clearRect(0, 0, usableW, usableH);
        ctx.drawImage(canvas, 0, 0, usableW, usableH, 0, 0, usableW, usableH);

        btnDownloadFull.disabled = false;
        createTilesFromCanvas(hiddenCanvas, tileCount, tileCount);
    } catch (err) {
        alert('Błąd podczas eksportu mapy: ' + err.message);
    }

    btnExport.disabled = false;
    btnExport.textContent = 'Pobierz mapę';
});

btnDownloadFull.addEventListener('click', () => {
    if (!hiddenCanvas.width) return alert('Najpierw wygeneruj mapę.');
    const link = document.createElement('a');
    link.href = hiddenCanvas.toDataURL('image/png');
    link.download = 'mapa.png';
    link.click();
});

function createTilesFromCanvas(canvas, cols, rows) {
    pool.innerHTML = '';
    pieces = [];

    const size = Math.min(canvas.width, canvas.height);
    const tileSize = size / cols;

    const ctx = canvas.getContext('2d');

    let index = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = tileSize;
            tileCanvas.height = tileSize;
            const tctx = tileCanvas.getContext('2d');
            tctx.drawImage(
                canvas,
                c * tileSize, r * tileSize, tileSize, tileSize, 
                0, 0, tileSize, tileSize 
            );

            pieces.push({ index, dataURL: tileCanvas.toDataURL('image/png') });
            index++;
        }
    }

    shuffleArray(pieces);

    for (const p of pieces) {
        const img = document.createElement('img');
        img.src = p.dataURL;
        img.className = 'piece';
        img.draggable = true;
        img.dataset.index = p.index;
        img.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', e.target.dataset.index);
        });
        pool.appendChild(img);
    }

    grid.querySelectorAll('.slot').forEach(s => {
        s.innerHTML = '';
        s.dataset.currentIndex = '';
        s.classList.remove('correct', 'wrong');
    });
}


function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

function onDropToSlot(ev) {
    ev.preventDefault();
    const idx = ev.dataTransfer.getData('text/plain');
    const slot = ev.currentTarget;
    if (!idx) return;

    if (slot.firstChild) moveToPool(slot.firstChild);

    const img = document.querySelector(`img[data-index="${idx}"]`);
    if (!img) return;

    const clone = img.cloneNode(true);
    clone.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.dataset.index));
    slot.innerHTML = '';
    slot.appendChild(clone);
    slot.dataset.currentIndex = idx;

    if (img.parentElement === pool) img.remove();

    checkSlot(slot);
    checkAll();
}

function moveToPool(el) {
    if (el.tagName === 'IMG') {
        el.remove();
        pool.appendChild(el);
    }
}

function checkSlot(slot) {
    const c = slot.dataset.correctIndex;
    const cur = slot.dataset.currentIndex;
    if (!cur) {
        slot.classList.remove('correct', 'wrong');
        return false;
    }
    if (c === cur) {
        slot.classList.add('correct');
        slot.classList.remove('wrong');
        return true;
    } else {
        slot.classList.add('wrong');
        slot.classList.remove('correct');
        return false;
    }
}

function checkAll() {
    const slots = [...grid.querySelectorAll('.slot')];
    const allFilled = slots.every(s => s.dataset.currentIndex);
    const allCorrect = slots.every(s => s.dataset.correctIndex === s.dataset.currentIndex);
    if (allFilled && allCorrect) {
        onSolved();
    }
}

function onSolved() {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Gratulacje!', {
            body: 'Wszystkie elementy są na swoim miejscu '
        });
    } else {
        alert('Gratulacje! Wszystkie elementy są na swoim miejscu ');
    }
}

pool.addEventListener('dragover', e => e.preventDefault());
pool.addEventListener('drop', e => {
    e.preventDefault();
    const idx = e.dataTransfer.getData('text/plain');
    const slot = [...grid.querySelectorAll('.slot')].find(s => s.dataset.currentIndex === idx);
    if (slot && slot.firstChild) {
        const img = slot.firstChild;
        slot.innerHTML = '';
        slot.dataset.currentIndex = '';
        slot.classList.remove('correct', 'wrong');
        pool.appendChild(img);
    }
});
