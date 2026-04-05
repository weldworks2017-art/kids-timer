document.addEventListener('DOMContentLoaded', () => {
    // ---- 設定管理 ----
    let targetTimeStr = localStorage.getItem('targetTime') || '21:00';
    let name1 = localStorage.getItem('name1') || 'AK';
    let name2 = localStorage.getItem('name2') || 'DI';

    document.getElementById('target-time-input').value = targetTimeStr;
    document.getElementById('name1').innerText = name1;
    document.getElementById('name2').innerText = name2;

    // 名前編集の保存
    const saveName = (elId, storageKey) => {
        document.getElementById(elId).addEventListener('blur', (e) => {
            localStorage.setItem(storageKey, e.target.innerText);
        });
    };
    saveName('name1', 'name1');
    saveName('name2', 'name2');

    // ---- モーダル ----
    const modal = document.getElementById('settings-modal');
    document.getElementById('settings-btn').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('close-settings').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('save-settings').addEventListener('click', () => {
        targetTimeStr = document.getElementById('target-time-input').value;
        localStorage.setItem('targetTime', targetTimeStr);
        updateHourglasses();
        modal.classList.add('hidden');
    });

    // ---- 砂時計ロジック ----
    const container = document.getElementById('hourglass-container');
    
    function createHourglassHTML(topPercent) {
        let bottomPercent = 100 - topPercent;
        let isFlowing = topPercent > 0 && topPercent < 100;
        
        return `
            <div class="hourglass">
                <div class="glass glass-top">
                    <div class="sand sand-top" style="height: ${topPercent}%"></div>
                </div>
                <div class="sand-stream ${isFlowing ? 'active' : ''}"></div>
                <div class="glass glass-bottom">
                    <div class="sand sand-bottom" style="height: ${bottomPercent}%"></div>
                </div>
            </div>
        `;
    }

    function updateHourglasses() {
        let now = new Date();
        let [targetH, targetM] = targetTimeStr.split(':').map(Number);
        let target = new Date();
        target.setHours(targetH, targetM, 0, 0);

        let diffMs = target - now;
        let diffMins = Math.max(0, Math.floor(diffMs / 60000));

        let html = '';
        for (let i = 4; i >= 1; i--) {
            let minBound = (i - 1) * 60;
            let p = 0;
            if (diffMins >= i * 60) {
                p = 100;
            } else if (diffMins <= minBound) {
                p = 0;
            } else {
                p = ((diffMins - minBound) / 60) * 100;
            }
            html += createHourglassHTML(p);
        }
        
        container.innerHTML = html;
    }

    updateHourglasses();
    setInterval(updateHourglasses, 60000);

    // ---- やることリストロジック ----
    const allCheckboxes = document.querySelectorAll('.checkbox-wrapper');
    const allTaskRows = document.querySelectorAll('.task-row:not(.header-row)');
    
    // 今日の日付が変わったらチェックをリセット
    let lastDate = localStorage.getItem('lastDate');
    let todayDate = new Date().toDateString();
    if (lastDate !== todayDate) {
        allCheckboxes.forEach(item => {
            localStorage.removeItem('check_' + item.dataset.id);
        });
        localStorage.setItem('lastDate', todayDate);
    }

    function createRipple(event, element) {
        const circle = document.createElement('span');
        const diameter = Math.max(element.clientWidth, element.clientHeight);
        const radius = diameter / 2;
        const rect = element.getBoundingClientRect();
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add('ripple');
        
        const ripple = element.querySelector('.ripple');
        if (ripple) {
            ripple.remove();
        }
        
        element.appendChild(circle);
    }

    function updateRowStyles() {
        allTaskRows.forEach(row => {
            const boxes = row.querySelectorAll('.checkbox-wrapper');
            let allChecked = true;
            boxes.forEach(box => {
                if (!box.classList.contains('checked')) {
                    allChecked = false;
                }
            });
            
            if (allChecked) {
                row.classList.add('checked-row');
            } else {
                row.classList.remove('checked-row');
            }
        });
    }

    function checkAllCompleted() {
        const completedCount = document.querySelectorAll('.checkbox-wrapper.checked').length;
        const notice = document.getElementById('game-time-notice');
        if (completedCount === allCheckboxes.length) {
            notice.classList.remove('hidden');
            fireConfetti();
        } else {
            notice.classList.add('hidden');
        }
    }

    allCheckboxes.forEach(item => {
        const id = item.dataset.id;
        
        if (localStorage.getItem('check_' + id) === 'true') {
            item.classList.add('checked');
        }

        item.addEventListener('click', (e) => {
            createRipple(e, item);
            item.classList.toggle('checked');
            
            let isChecked = item.classList.contains('checked');
            localStorage.setItem('check_' + id, isChecked);
            
            updateRowStyles();
            checkAllCompleted();
        });
    });

    // 初回の状態反映
    updateRowStyles();
    checkAllCompleted();

    // ---- 紙吹雪アニメーション ----
    let confettiActive = false;
    function fireConfetti() {
        if(confettiActive) return; // 重複実行防止
        confettiActive = true;
        
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 1) * 20 - 5,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;
            
            for (let i = 0; i < pieces.length; i++) {
                let p = pieces[i];
                p.vy += 0.5; // 重力
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;

                if (p.y < canvas.height) active = true;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            }

            if (active) {
                requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                confettiActive = false; // アニメーション終了後にフラグを戻す
            }
        }
        animate();
    }
});
