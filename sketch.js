// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 
let p5Container; // 儲存 p5.js 的容器元素

window.addEventListener('message', function (event) {
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        // ----------------------------------------
        // 關鍵修正 1：顯示 p5.js 畫布容器
        // ----------------------------------------
        if (p5Container) {
             // 確保在收到成績後，顯示整個 overlay
            p5Container.style.display = 'block'; 
        }

        // ----------------------------------------
        // 關鍵修正 2：根據分數啟動或停止連續繪製 (loop/noLoop)
        // ----------------------------------------
        let percentage = (finalScore / maxScore) * 100;
        
        if (percentage >= 90) {
            loop(); // 90分以上，開始循環繪製 (以運行煙火動畫)
        } else {
            noLoop(); // 低於 90分，停止循環繪製 (只繪製一次靜態畫面)
            redraw(); // 確保靜態畫面更新
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

let fireworks = []; 
let gravity;        

// Particle 類別：構成煙火爆炸後的每一個點
class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; 
        this.lifespan = 255;
        this.hue = hue;
        
        if (this.firework) {
            this.vel = createVector(0, random(-10, -18));
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); 
        }
        this.acc = createVector(0, 0); 
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9); 
            this.lifespan -= 4; 
        }
        
        this.applyForce(gravity); 
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); 
    }

    show() {
        if (!this.firework) {
            strokeWeight(2);
            stroke(this.hue, 100, 100, this.lifespan / 255); 
        } else {
            strokeWeight(4);
            stroke(this.hue, 100, 100);
        }
        point(this.pos.x, this.pos.y);
    }
    
    isDead() {
        return this.lifespan < 0;
    }
}

// Firework 類別
class Firework {
    constructor() {
        this.hue = random(360); 
        this.firework = new Particle(random(width), height, this.hue, true); 
        this.exploded = false;
        this.particles = []; 
    }
    
    explode() {
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hue, false);
            this.particles.push(p);
        }
    }

    update() {
        if (!this.exploded) {
            this.firework.update();
            if (this.firework.vel.y >= 0) { 
                this.exploded = true;
                this.explode();
            }
        } else {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].isDead()) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        } else {
            for (let p of this.particles) {
                p.show();
            }
        }
    }
    
    done() {
        return this.exploded && this.particles.length === 0;
    }
}


function setup() { 
    // 關鍵修正 3：讓 canvas 創建在指定的 overlay 容器中
    p5Container = document.getElementById('p5js-overlay-container');
    
    // 讓 canvas 的尺寸與其父容器 (即 p5js-overlay-container) 一樣大
    let containerWidth = p5Container ? p5Container.offsetWidth : windowWidth / 2;
    let containerHeight = p5Container ? p5Container.offsetHeight : windowHeight / 2;

    let canvas = createCanvas(containerWidth, containerHeight); 

    // 將 canvas 附加到指定的容器，如果容器存在
    if (p5Container) {
        canvas.parent('p5js-overlay-container');
    }

    colorMode(HSB, 360, 100, 100, 1); 
    gravity = createVector(0, 0.2); 
    background(0); 
    noLoop(); 
} 

function draw() { 
    // 關鍵修正 4：背景使用半透明，讓 H5P 內容在沒有煙火的地方隱約可見
    // 如果想要完全遮蓋 H5P，請使用 background(0, 0, 0); 
    background(0, 0, 0, 0.2); 

    let percentage = (finalScore / maxScore) * 100;

    // --- 煙火邏輯 ---
    if (percentage >= 90) {
        if (frameCount % 10 === 0 && random(1) < 0.1) {
            fireworks.push(new Firework());
        }
    }
    
    // 更新並顯示所有煙火
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
    // ----------------------
    
    // 畫面中央的文字與幾何圖形顯示 
    
    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        fill(0, 200, 50); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(255); 
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        fill(0, 200, 50, 150); 
        noStroke();
        circle(width / 4, height - 100, 100); 
        
    } else if (percentage >= 60) {
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height - 100, 100, 100); 
    }
}
