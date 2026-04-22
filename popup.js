// popup.js - Paste this into a file named popup.js in the same folder

let items = [];
let currentAngle = 0;
let spinning = false;
let landedItem = null;
let colors = [];

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const landedTitleEl = document.getElementById('landed-title');
const landedUrlEl = document.getElementById('landed-url');
const prizeBannerEl = document.getElementById('prize-banner');
const prizeTextEl = document.getElementById('prize-text');
const navigateBtn = document.getElementById('navigate-btn');
const spinAgainBtn = document.getElementById('spin-again-btn');
const spinBtn = document.getElementById('spin-btn');
const loadBtn = document.getElementById('load-btn');
const modeSelect = document.getElementById('mode');

// Prize pool (Wheel of Fortune style)
const prizes = [
    "💰 $250 CASH!",
    "🏝️ 7-DAY VACATION TO HAWAII!",
    "✈️ FIRST-CLASS FLIGHT ANYWHERE!",
    "🍔 $100 RESTAURANT GIFT CARD!",
    "📱 BRAND NEW IPHONE!",
    "💸 $1,000 JACKPOT!",
    "🚀 PRIVATE JET EXPERIENCE!",
    "🏦 BANKRUPT! 😭",
    "🎟️ VIP CONCERT TICKETS!",
    "🛳️ CRUISE TO THE BAHAMAS!",
    "🏎️ FORMULA 1 RACE DAY!",
    "💎 GOLD WATCH + $500!"
];

function getRandomPrize() {
    return prizes[Math.floor(Math.random() * prizes.length)];
}

function flattenBookmarks(nodes, result = []) {
    for (let node of nodes) {
        if (node.url) {
            const hostname = node.url ? new URL(node.url).hostname : '';
            const label = (node.title || hostname || node.url).substring(0, 22);
            result.push({ label: label || 'Untitled', url: node.url });
        } else if (node.children) {
            flattenBookmarks(node.children, result);
        }
    }
    return result;
}

function drawWheel() {
    ctx.clearRect(0, 0, 400, 400);
    
    const centerX = 200;
    const centerY = 200;
    const radius = 175;
    const num = items.length || 1;
    const arc = (2 * Math.PI) / num;
    
    // Save context and rotate the entire wheel
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);
    
    for (let i = 0; i < num; i++) {
        const startAngle = i * arc;
        
        // Rainbow segments
        ctx.fillStyle = `hsl(${i * (360 / num)}, 85%, 55%)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, startAngle + arc);
        ctx.closePath();
        ctx.fill();
        
        // Segment border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Label (tangential text - classic Wheel of Fortune style)
        ctx.save();
        ctx.rotate(startAngle + arc / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "Press Start 2P"';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // Truncated label placed along the arc
        ctx.fillText(items[i].label, radius * 0.68, 0);
        ctx.restore();
    }
    
    // Inner hub
    ctx.fillStyle = '#220044';
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 12;
    ctx.stroke();
    
    // Center text
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('FORTUNE', 0, 8);
    
    ctx.restore();
    
    // Outer glow ring
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 18, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
}

function calculateLandedIndex() {
    if (items.length === 0) return 0;
    
    const pointerAngle = -Math.PI / 2; // Top of canvas (12 o'clock)
    let relativeAngle = (pointerAngle - currentAngle) % (2 * Math.PI);
    if (relativeAngle < 0) relativeAngle += 2 * Math.PI;
    
    const arc = (2 * Math.PI) / items.length;
    let index = Math.floor(relativeAngle / arc);
    
    // Safety clamp
    if (index < 0 || index >= items.length) index = 0;
    return index;
}

function spinWheel() {
    if (spinning || items.length === 0) return;
    
    spinning = true;
    spinBtn.disabled = true;
    resultEl.style.display = 'none';
    
    statusEl.textContent = '🎡 SPINNING... GOOD LUCK!';
    
    const startAngle = currentAngle;
    const numRotations = 8 + Math.random() * 6; // 8–14 full spins
    const extraAngle = Math.random() * 2 * Math.PI;
    const totalDelta = numRotations * 2 * Math.PI + extraAngle;
    const duration = 3800 + Math.random() * 1200; // 3.8–5 seconds
    
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= duration) {
            currentAngle = startAngle + totalDelta;
            drawWheel();
            spinning = false;
            spinBtn.disabled = false;
            
            const index = calculateLandedIndex();
            landedItem = items[index];
            
            // Show result with prize
            landedTitleEl.textContent = landedItem.label;
            landedUrlEl.textContent = landedItem.url;
            
            const prize = getRandomPrize();
            prizeTextEl.textContent = prize;
            
            if (prize.includes('BANKRUPT')) {
                prizeBannerEl.classList.add('bankrupt');
            } else {
                prizeBannerEl.classList.remove('bankrupt');
            }
            
            resultEl.style.display = 'block';
            statusEl.textContent = '🎉 WINNER!';
            
            return;
        }
        
        // Quartic ease-out for realistic slowing
        const t = elapsed / duration;
        const eased = 1 - Math.pow(1 - t, 4);
        
        currentAngle = startAngle + totalDelta * eased;
        drawWheel();
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

async function loadData() {
    const mode = modeSelect.value;
    items = [];
    statusEl.textContent = mode === 'bookmarks' ? '📚 Loading bookmarks...' : '🕒 Loading history...';
    resultEl.style.display = 'none';
    
    try {
        if (mode === 'bookmarks') {
            const tree = await chrome.bookmarks.getTree();
            const flat = flattenBookmarks(tree);
            // Limit to 20 for clean wheel
            items = flat.length > 20 
                ? flat.sort(() => Math.random() - 0.5).slice(0, 20) 
                : flat;
        } else {
            // History - last 30 days, max 30 results
            const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const results = await chrome.history.search({
                text: '',
                startTime: oneMonthAgo,
                maxResults: 30
            });
            items = results
                .filter(item => item.url && item.url.startsWith('http'))
                .map(item => {
                    const hostname = new URL(item.url).hostname;
                    const label = (item.title || hostname || item.url).substring(0, 22);
                    return { label: label || 'Untitled Page', url: item.url };
                });
            
            // Limit + randomize
            if (items.length > 20) {
                items = items.sort(() => Math.random() - 0.5).slice(0, 20);
            }
        }
        
        if (items.length === 0) {
            statusEl.textContent = '⚠️ No items found!';
            ctx.clearRect(0, 0, 400, 400);
            ctx.fillStyle = '#440088';
            ctx.fillRect(0, 0, 400, 400);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 20px "Press Start 2P"';
            ctx.fillText('NO ITEMS', 200, 190);
            ctx.fillText('TO SPIN!', 200, 230);
            return;
        }
        
        statusEl.textContent = `${items.length} items loaded — ready to spin!`;
        drawWheel();
        
    } catch (err) {
        console.error(err);
        statusEl.textContent = '❌ Permission error. Check extension permissions.';
    }
}

// Button handlers
spinBtn.addEventListener('click', spinWheel);
loadBtn.addEventListener('click', loadData);
modeSelect.addEventListener('change', loadData);

navigateBtn.addEventListener('click', () => {
    if (landedItem && landedItem.url) {
        chrome.tabs.create({ url: landedItem.url });
        // Popup stays open so user can spin again if they want
    }
});

spinAgainBtn.addEventListener('click', () => {
    resultEl.style.display = 'none';
    spinWheel();
});

// Initial load
window.addEventListener('load', () => {
    loadData();
    
    // Keyboard shortcut fun
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !spinning) {
            e.preventDefault();
            spinWheel();
        }
    });
});