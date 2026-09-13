/**
 * app.js - Motor Completo y Controlador Unificado para Simulador MRU
 * Diseñado para ejecutarse 100% OFFLINE y directamente con doble clic en index.html (sin errores de CORS).
 */

// ==========================================
// 1. MOTOR DE FÍSICA PURA (MRU)
// ==========================================
class PhysicsEngine {
    constructor() {
        this.x0 = 0;       // Posición inicial (m)
        this.v = 10;       // Velocidad constante (m/s)
        this.t = 0;        // Tiempo transcurrido (s)
        this.maxTime = 10; // Tiempo límite (s)

        // Móvil B opcional para desafíos
        this.activeSecondBody = false;
        this.x0_B = 100;
        this.v_B = -5;

        this.history = [];
    }

    setInitialState(x0, v, maxTime = 10) {
        this.x0 = parseFloat(x0) || 0;
        this.v = parseFloat(v) || 0;
        this.maxTime = Math.max(1, parseFloat(maxTime) || 10);
        this.reset();
    }

    setSecondBody(active, x0_B = 80, v_B = -10) {
        this.activeSecondBody = active;
        this.x0_B = parseFloat(x0_B);
        this.v_B = parseFloat(v_B);
    }

    reset() {
        this.t = 0;
        this.history = [];
        this.recordPoint(0);
    }

    calculatePosition(time, xInit = this.x0, velocity = this.v) {
        return xInit + (velocity * time);
    }

    calculateDisplacement(time, velocity = this.v) {
        return velocity * time;
    }

    calculateDistance(time, velocity = this.v) {
        return Math.abs(velocity) * time;
    }

    step(dt) {
        if (this.t >= this.maxTime) {
            this.t = this.maxTime;
            return false;
        }
        this.t = Math.min(this.maxTime, this.t + dt);
        this.recordPoint(this.t);
        return this.t < this.maxTime;
    }

    setTime(targetTime) {
        this.t = Math.max(0, Math.min(this.maxTime, targetTime));
        this.rebuildHistoryUpTo(this.t);
    }

    recordPoint(time) {
        const xA = this.calculatePosition(time, this.x0, this.v);
        const point = {
            t: parseFloat(time.toFixed(3)),
            xA: parseFloat(xA.toFixed(2)),
            vA: this.v,
            dispA: parseFloat(this.calculateDisplacement(time, this.v).toFixed(2)),
            distA: parseFloat(this.calculateDistance(time, this.v).toFixed(2)),
            aA: 0
        };

        if (this.activeSecondBody) {
            const xB = this.calculatePosition(time, this.x0_B, this.v_B);
            point.xB = parseFloat(xB.toFixed(2));
            point.vB = this.v_B;
        }

        const last = this.history[this.history.length - 1];
        if (!last || Math.abs(last.t - point.t) >= 0.04 || time >= this.maxTime) {
            this.history.push(point);
        }
    }

    rebuildHistoryUpTo(targetTime) {
        this.history = [];
        const stepSize = 0.05;
        for (let cur = 0; cur <= targetTime; cur += stepSize) {
            this.recordPoint(cur);
        }
        if (targetTime % stepSize !== 0) {
            this.recordPoint(targetTime);
        }
    }

    generateDiscreteTable(interval = 1.0) {
        const table = [];
        for (let time = 0; time <= this.maxTime + 0.001; time += interval) {
            const tRounded = parseFloat(time.toFixed(2));
            const xA = this.calculatePosition(tRounded, this.x0, this.v);
            const row = {
                time: tRounded,
                posA: parseFloat(xA.toFixed(2)),
                velA: this.v,
                dispA: parseFloat((xA - this.x0).toFixed(2)),
                distA: parseFloat((Math.abs(this.v) * tRounded).toFixed(2)),
                accA: 0
            };
            if (this.activeSecondBody) {
                const xB = this.calculatePosition(tRounded, this.x0_B, this.v_B);
                row.posB = parseFloat(xB.toFixed(2));
                row.velB = this.v_B;
            }
            table.push(row);
        }
        return table;
    }
}

// ==========================================
// 2. RENDERIZADOR CANVAS 2D
// ==========================================
class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.vehicleType = 'car';

        this.minWorldX = -50;
        this.maxWorldX = 150;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width || 800;
        this.height = rect.height || 240;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }
    }

    setVehicleType(type) {
        this.vehicleType = type;
    }

    worldToScreenX(worldX) {
        const padding = 60;
        const availableWidth = this.width - (padding * 2);
        const worldRange = this.maxWorldX - this.minWorldX || 1;
        const normalized = (worldX - this.minWorldX) / worldRange;
        return padding + (normalized * availableWidth);
    }

    updateBounds(x0, v, maxTime, targetZone = null) {
        const xFinal = x0 + (v * maxTime);
        let minX = Math.min(x0, xFinal, -20);
        let maxX = Math.max(x0, xFinal, 100);

        if (targetZone) {
            minX = Math.min(minX, targetZone.xMin - 10);
            maxX = Math.max(maxX, targetZone.xMax + 20);
        }

        const margin = (maxX - minX) * 0.15;
        this.minWorldX = Math.floor((minX - margin) / 10) * 10;
        this.maxWorldX = Math.ceil((maxX + margin) / 10) * 10;
    }

    render(engine, options = {}) {
        if (!this.ctx) return;
        const { showVectors = true, showStrobe = true, targetZone = null, obstacle = null } = options;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);
        this.drawBackground(ctx, w, h);

        if (targetZone) {
            this.drawTargetZone(ctx, targetZone, h);
        }
        if (obstacle) {
            this.drawObstacle(ctx, obstacle, h);
        }
        if (showStrobe && engine.history.length > 1) {
            this.drawStrobeMarks(ctx, engine.history, h);
        }

        this.drawRuler(ctx, w, h);

        const currentXA = engine.calculatePosition(engine.t, engine.x0, engine.v);
        const screenXA = this.worldToScreenX(currentXA);
        const groundY = h - 65;

        this.drawVehicle(ctx, screenXA, groundY, this.vehicleType, engine.v, '#00f2fe', 'Móvil A', currentXA);

        if (showVectors && Math.abs(engine.v) > 0.01) {
            this.drawVelocityVector(ctx, screenXA, groundY - 45, engine.v, '#00f2fe');
        }

        if (engine.activeSecondBody) {
            const currentXB = engine.calculatePosition(engine.t, engine.x0_B, engine.v_B);
            const screenXB = this.worldToScreenX(currentXB);
            this.drawVehicle(ctx, screenXB, groundY - 35, 'drone', engine.v_B, '#ff4b72', 'Móvil B', currentXB);
            if (showVectors && Math.abs(engine.v_B) > 0.01) {
                this.drawVelocityVector(ctx, screenXB, groundY - 80, engine.v_B, '#ff4b72');
            }
        }
    }

    drawBackground(ctx, w, h) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.7, '#111827');
        bgGrad.addColorStop(1, '#070a10');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        const groundY = h - 55;
        const roadGrad = ctx.createLinearGradient(0, groundY, 0, h);
        roadGrad.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
        roadGrad.addColorStop(1, 'rgba(15, 23, 42, 1)');
        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, groundY, w, 55);

        ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.stroke();
    }

    drawRuler(ctx, w, h) {
        const groundY = h - 40;
        const range = this.maxWorldX - this.minWorldX;
        let step = 10;
        if (range <= 40) step = 5;
        else if (range <= 100) step = 10;
        else if (range <= 250) step = 25;
        else step = 50;

        ctx.font = '10px monospace';
        ctx.textAlign = 'center';

        const startMeter = Math.ceil(this.minWorldX / step) * step;
        for (let meter = startMeter; meter <= this.maxWorldX; meter += step) {
            const screenX = this.worldToScreenX(meter);
            if (screenX < 20 || screenX > w - 20) continue;

            const isOrigin = (meter === 0);
            ctx.strokeStyle = isOrigin ? '#38ef7d' : 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = isOrigin ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(screenX, groundY - 6);
            ctx.lineTo(screenX, groundY + 6);
            ctx.stroke();

            ctx.fillStyle = isOrigin ? '#38ef7d' : 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`${meter}m`, screenX, groundY + 18);
        }
    }

    drawStrobeMarks(ctx, history, h) {
        const groundY = h - 55;
        ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';

        history.forEach((point, idx) => {
            if (idx % 6 === 0 || idx === history.length - 1) {
                const sx = this.worldToScreenX(point.xA);
                ctx.beginPath();
                ctx.arc(sx, groundY, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.font = '9px sans-serif';
                ctx.fillText(`t=${point.t}s`, sx, groundY - 8);
            }
        });
    }

    drawVelocityVector(ctx, x, y, velocity, color) {
        const isRight = velocity >= 0;
        const maxArrowLen = 80;
        const minArrowLen = 25;
        const arrowLen = Math.min(maxArrowLen, Math.max(minArrowLen, Math.abs(velocity) * 3)) * (isRight ? 1 : -1);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + arrowLen, y);
        ctx.stroke();

        const headSize = 6;
        const tipX = x + arrowLen;
        ctx.beginPath();
        if (isRight) {
            ctx.moveTo(tipX, y);
            ctx.lineTo(tipX - headSize, y - headSize * 0.7);
            ctx.lineTo(tipX - headSize, y + headSize * 0.7);
        } else {
            ctx.moveTo(tipX, y);
            ctx.lineTo(tipX + headSize, y - headSize * 0.7);
            ctx.lineTo(tipX + headSize, y + headSize * 0.7);
        }
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`v⃗ = ${velocity > 0 ? '+' : ''}${velocity} m/s`, x + (arrowLen / 2), y - 7);
        ctx.restore();
    }

    drawVehicle(ctx, x, y, type, velocity, color, label, worldPos) {
        ctx.save();
        ctx.translate(x, y);

        if (velocity < 0) {
            ctx.scale(-1, 1);
        }

        if (type === 'car') {
            this.drawSportCar(ctx, color);
        } else if (type === 'rover') {
            this.drawMarsRover(ctx, color);
        } else if (type === 'drone') {
            this.drawDrone(ctx, color);
        } else {
            this.drawQuantumParticle(ctx, color);
        }

        ctx.restore();

        ctx.fillStyle = color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${label} (${worldPos.toFixed(1)}m)`, x, y - 26);
    }

    drawSportCar(ctx, primaryColor) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(-22, 4);
        ctx.lineTo(-18, -4);
        ctx.lineTo(-6, -10);
        ctx.lineTo(10, -10);
        ctx.lineTo(20, -2);
        ctx.lineTo(24, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(-5, -9);
        ctx.lineTo(6, -9);
        ctx.lineTo(13, -3);
        ctx.lineTo(-10, -3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffe600';
        ctx.fillRect(22, 0, 3, 3);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-12, 5, 5, 0, Math.PI * 2);
        ctx.arc(14, 5, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMarsRover(ctx, primaryColor) {
        ctx.fillStyle = primaryColor;
        ctx.fillRect(-16, -10, 32, 12);
        ctx.fillStyle = '#334155';
        for (let wx of [-12, 0, 12]) {
            ctx.beginPath();
            ctx.arc(wx, 4, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDrone(ctx, primaryColor) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse(0, -5, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(-12, -12, 7, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(12, -12, 7, 2, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawQuantumParticle(ctx, primaryColor) {
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTargetZone(ctx, targetZone, h) {
        const sxMin = this.worldToScreenX(targetZone.xMin);
        const sxMax = this.worldToScreenX(targetZone.xMax);
        const width = sxMax - sxMin;
        const groundY = h - 55;

        ctx.fillStyle = 'rgba(56, 239, 125, 0.2)';
        ctx.fillRect(sxMin, groundY - 26, width, 26);
        ctx.strokeStyle = '#38ef7d';
        ctx.lineWidth = 2;
        ctx.strokeRect(sxMin, groundY - 26, width, 26);

        ctx.fillStyle = '#38ef7d';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 OBJETIVO', (sxMin + sxMax) / 2, groundY - 32);
    }

    drawObstacle(ctx, obstacle, h) {
        const sx = this.worldToScreenX(obstacle.x);
        const groundY = h - 55;

        ctx.strokeStyle = obstacle.active ? '#ff3366' : 'rgba(255, 51, 102, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx, groundY - 45);
        ctx.lineTo(sx, groundY);
        ctx.stroke();

        ctx.fillStyle = '#ff3366';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🚧 Barrera (${obstacle.x}m)`, sx, groundY - 50);
    }
}

// ==========================================
// 3. MOTOR DE GRÁFICAS VECTORIALES
// ==========================================
class ChartEngine {
    constructor(canvasPosId, canvasVelId) {
        this.canvasPos = document.getElementById(canvasPosId);
        this.canvasVel = document.getElementById(canvasVelId);
        this.ctxPos = this.canvasPos ? this.canvasPos.getContext('2d') : null;
        this.ctxVel = this.canvasVel ? this.canvasVel.getContext('2d') : null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        [this.canvasPos, this.canvasVel].forEach(canvas => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const w = rect.width || 360;
            const h = rect.height || 190;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);
        });
    }

    update(engine) {
        this.renderPositionChart(engine);
        this.renderVelocityChart(engine);
    }

    renderPositionChart(engine) {
        if (!this.ctxPos || !this.canvasPos) return;
        const ctx = this.ctxPos;
        const rect = this.canvasPos.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);
        this.drawBackground(ctx, w, h, 'Gráfica Posición vs Tiempo [ x(t) ]', 't (s)', 'x (m)');

        const padLeft = 45;
        const padRight = 20;
        const padTop = 30;
        const padBottom = 30;
        const plotW = w - padLeft - padRight;
        const plotH = h - padTop - padBottom;

        const maxT = Math.max(5, engine.maxTime);
        const xFinal = engine.x0 + (engine.v * maxT);
        let minX = Math.min(engine.x0, xFinal, -10);
        let maxX = Math.max(engine.x0, xFinal, 10);
        const margin = (maxX - minX) * 0.1 || 5;
        minX = Math.floor(minX - margin);
        maxX = Math.ceil(maxX + margin);

        const mapT = (t) => padLeft + (t / maxT) * plotW;
        const mapX = (x) => padTop + plotH - ((x - minX) / (maxX - minX || 1)) * plotH;

        this.drawAxes(ctx, padLeft, padTop, plotW, plotH, 0, maxT, minX, maxX, mapT, mapX);

        if (engine.history.length > 0) {
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            engine.history.forEach((pt, i) => {
                const px = mapT(pt.t);
                const py = mapX(pt.xA);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();

            const lastPt = engine.history[engine.history.length - 1];
            ctx.fillStyle = '#00f2fe';
            ctx.beginPath();
            ctx.arc(mapT(lastPt.t), mapX(lastPt.xA), 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#38ef7d';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Pendiente (m = v) = ${engine.v} m/s`, w - padRight, padTop + 14);
    }

    renderVelocityChart(engine) {
        if (!this.ctxVel || !this.canvasVel) return;
        const ctx = this.ctxVel;
        const rect = this.canvasVel.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);
        this.drawBackground(ctx, w, h, 'Gráfica Velocidad vs Tiempo [ v(t) ]', 't (s)', 'v (m/s)');

        const padLeft = 45;
        const padRight = 20;
        const padTop = 30;
        const padBottom = 30;
        const plotW = w - padLeft - padRight;
        const plotH = h - padTop - padBottom;

        const maxT = Math.max(5, engine.maxTime);
        let minV = Math.min(engine.v, 0, -5);
        let maxV = Math.max(engine.v, 5);
        const marginV = (maxV - minV) * 0.15 || 5;
        minV = Math.floor(minV - marginV);
        maxV = Math.ceil(maxV + marginV);

        const mapT = (t) => padLeft + (t / maxT) * plotW;
        const mapV = (v) => padTop + plotH - ((v - minV) / (maxV - minV || 1)) * plotH;

        this.drawAxes(ctx, padLeft, padTop, plotW, plotH, 0, maxT, minV, maxV, mapT, mapV);

        const zeroY = mapV(0);
        const curY = mapV(engine.v);
        const curT_X = mapT(engine.t);
        const startT_X = mapT(0);

        if (engine.t > 0) {
            ctx.fillStyle = engine.v >= 0 ? 'rgba(56, 239, 125, 0.2)' : 'rgba(255, 75, 114, 0.2)';
            ctx.fillRect(startT_X, Math.min(zeroY, curY), curT_X - startT_X, Math.abs(curY - zeroY));
        }

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startT_X, curY);
        ctx.lineTo(mapT(maxT), curY);
        ctx.stroke();

        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(curT_X, curY, 4, 0, Math.PI * 2);
        ctx.fill();

        const disp = (engine.v * engine.t).toFixed(1);
        ctx.fillStyle = '#38ef7d';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Área = Δx = ${disp} m`, w - padRight, padTop + 14);
    }

    drawBackground(ctx, w, h, title, xLabel, yLabel) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, 10, 18);
    }

    drawAxes(ctx, padLeft, padTop, plotW, plotH, minT, maxT, minY, maxY, mapT, mapY) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.textAlign = 'center';

        for (let i = 0; i <= 5; i++) {
            const valT = minT + i * (maxT - minT) / 5;
            const px = mapT(valT);
            ctx.beginPath();
            ctx.moveTo(px, padTop);
            ctx.lineTo(px, padTop + plotH);
            ctx.stroke();
            ctx.fillText(`${valT.toFixed(0)}s`, px, padTop + plotH + 12);
        }

        ctx.textAlign = 'right';
        for (let j = 0; j <= 4; j++) {
            const valY = minY + j * (maxY - minY) / 4;
            const py = mapY(valY);
            ctx.beginPath();
            ctx.moveTo(padLeft, py);
            ctx.lineTo(padLeft + plotW, py);
            ctx.stroke();
            ctx.fillText(`${valY.toFixed(0)}`, padLeft - 4, py + 3);
        }
    }
}

// ==========================================
// 4. MÓDULO DE DESAFÍOS GAMIFICADOS
// ==========================================
class ChallengeManager {
    constructor(engine, renderer, onStateChange) {
        this.engine = engine;
        this.renderer = renderer;
        this.onStateChange = onStateChange;

        this.currentLevel = 1;
        this.activeChallenge = null;

        this.levels = [
            {
                id: 1,
                name: 'Nivel 1: Entrega de Suministros (Cálculo Directo de v)',
                description: 'Un vehículo de transporte autónomo debe entregar suministros a una base en un tiempo estricto para no perder la ventana de acoplamiento.',
                statement: 'El vehículo parte desde una posición inicial $x_0 = -20\\text{ m}$ y debe llegar con velocidad constante a la base ubicada en $x_f = 80\\text{ m}$ en exactamente $t = 5.0\\text{ s}$.',
                question: '¿A qué velocidad ($v$) en m/s debe configurarse el motor del móvil?',
                givenData: [
                    { label: 'Posición inicial ($x_0$)', value: '-20 m', icon: '📍' },
                    { label: 'Posición final ($x_f$)', value: '80 m', icon: '🎯' },
                    { label: 'Tiempo fijado ($t$)', value: '5.0 s', icon: '⏱️' }
                ],
                x0: -20,
                targetX: 80,
                tolerance: 3.5,
                targetTime: 5.0,
                hintFormula: 'v = \\frac{x_f - x_0}{t} = \\frac{80 - (-20)}{5.0} = \\frac{100}{5.0}',
                hintText: 'Aplica la fórmula de velocidad despejada: v = (x_f - x₀) / t. Recuerda la ley de signos: 80 - (-20) = 80 + 20 = 100.',
                calculateIdeal: (x0, targetX, targetTime) => (targetX - x0) / targetTime
            },
            {
                id: 2,
                name: 'Nivel 2: Cruce de Barrera Láser (Tiempo Límite)',
                description: 'Un dron de rescate terrestre debe atravesar un túnel de seguridad antes de que se active un campo de fuerza láser.',
                statement: 'El dron parte desde el origen $x_0 = 0\\text{ m}$. La compuerta láser está situada en $x = 120\\text{ m}$ y el temporizador la cerrará automáticamente a los $t = 6.0\\text{ s}$.',
                question: '¿Cuál es la velocidad constante mínima ($v$) para cruzar la compuerta justo a tiempo?',
                givenData: [
                    { label: 'Posición inicial ($x_0$)', value: '0 m', icon: '📍' },
                    { label: 'Posición de la barrera ($x_f$)', value: '120 m', icon: '🚧' },
                    { label: 'Tiempo de cierre ($t$)', value: '6.0 s', icon: '⏳' }
                ],
                x0: 0,
                targetX: 120,
                tolerance: 4.0,
                targetTime: 6.0,
                hintFormula: 'v = \\frac{x_f - x_0}{t} = \\frac{120 - 0}{6.0}',
                hintText: 'Despeja la velocidad de la ecuación de posición del MRU: v = (x - x₀) / t.',
                calculateIdeal: (x0, targetX, targetTime) => (targetX - x0) / targetTime
            },
            {
                id: 3,
                name: 'Nivel 3: Intercepción Espacial (Problema de 2 Cuerpos)',
                description: 'Dos sondas espaciales se mueven en la misma línea de exploración y deben acoplarse exactamente en una estación de paso.',
                statement: 'La sonda B viaja hacia nosotros desde $x_{0B} = 150\\text{ m}$ a una velocidad constante $v_B = -10\\text{ m/s}$. Nuestra sonda A parte del origen $x_{0A} = 0\\text{ m}$ en $t = 0\\text{ s}$. Ambas deben encontrarse exactamente en la estación en $x = 90\\text{ m}$.',
                question: '¿Qué velocidad ($v_A$) debe tener la sonda A para llegar a $x = 90\\text{ m}$ al mismo tiempo que la sonda B?',
                givenData: [
                    { label: 'Sonda A (Origen $x_{0A}$)', value: '0 m', icon: '🚀' },
                    { label: 'Sonda B (Origen $x_{0B}$)', value: '150 m', icon: '🛰️' },
                    { label: 'Velocidad Sonda B ($v_B$)', value: '-10 m/s', icon: '⬅️' },
                    { label: 'Punto de encuentro ($x$)', value: '90 m', icon: '📍' }
                ],
                x0_A: 0,
                x0_B: 150,
                v_B: -10,
                meetingX: 90,
                tolerance: 3.0,
                hintFormula: 't = \\frac{90 - 150}{-10} = 6\\text{ s} \\quad \\Rightarrow \\quad v_A = \\frac{90}{6}',
                hintText: 'Paso 1: Calcula el tiempo en que la sonda B llega a x = 90m con t = (90 - 150) / -10 = 6s. Paso 2: Calcula la velocidad de la sonda A con v_A = 90m / 6s.',
                calculateIdeal: () => {
                    const tMeet = (90 - 150) / -10; // 6s
                    return 90 / tMeet; // 15 m/s
                }
            }
        ];
    }

    loadLevel(levelIndex) {
        const idx = Math.max(0, Math.min(this.levels.length - 1, levelIndex - 1));
        this.currentLevel = idx + 1;
        const config = this.levels[idx];
        this.activeChallenge = config;

        if (config.id === 3) {
            this.engine.setSecondBody(true, config.x0_B, config.v_B);
            this.engine.setInitialState(config.x0_A, 0, 8);
            this.renderer.updateBounds(config.x0_A, 25, 8, { xMin: config.meetingX - 5, xMax: config.meetingX + 5 });
        } else {
            this.engine.setSecondBody(false);
            this.engine.setInitialState(config.x0, 0, config.targetTime);
            this.renderer.updateBounds(config.x0, 30, config.targetTime, {
                xMin: config.targetX - config.tolerance,
                xMax: config.targetX + config.tolerance
            });
        }

        if (this.onStateChange) {
            this.onStateChange({
                level: this.currentLevel,
                config: this.activeChallenge
            });
        }
    }

    evaluateAttempt(userVelocity) {
        const config = this.activeChallenge;
        if (!config) return null;

        const idealV = config.calculateIdeal(config.x0, config.targetX, config.targetTime);
        let finalPosA = 0;
        let success = false;
        let errorDistance = 0;
        let stepByStepSolution = '';

        if (config.id === 1 || config.id === 2) {
            finalPosA = this.engine.calculatePosition(config.targetTime, config.x0, userVelocity);
            errorDistance = Math.abs(finalPosA - config.targetX);
            success = errorDistance <= config.tolerance;

            stepByStepSolution = `
📐 Resolución Matemática Paso a Paso:
1. Fórmula base: x(t) = x0 + v · t
2. Despeje de velocidad: v = (x_final - x0) / t
3. Sustitución numérica:
   v = (${config.targetX} - (${config.x0})) / ${config.targetTime} = ${config.targetX - config.x0} / ${config.targetTime} = ${idealV.toFixed(2)} m/s
4. Tu elección: ${userVelocity} m/s (Llegaste a x = ${finalPosA.toFixed(2)} m).
            `.trim();
        } else if (config.id === 3) {
            const tMeet = (config.meetingX - config.x0_B) / config.v_B;
            finalPosA = this.engine.calculatePosition(tMeet, config.x0_A, userVelocity);
            errorDistance = Math.abs(finalPosA - config.meetingX);
            success = errorDistance <= config.tolerance;

            stepByStepSolution = `
📐 Resolución Matemática Paso a Paso (Punto de Encuentro):
1. Tiempo para que Móvil B llegue a ${config.meetingX}m:
   t_encuentro = (${config.meetingX} - ${config.x0_B}) / (${config.v_B}) = ${tMeet.toFixed(2)} s
2. Velocidad necesaria para Móvil A:
   v_A = (${config.meetingX} - ${config.x0_A}) / ${tMeet.toFixed(2)} = ${idealV.toFixed(2)} m/s
3. Tu elección: ${userVelocity} m/s (Llegaste a x = ${finalPosA.toFixed(2)} m al tiempo t = ${tMeet} s).
            `.trim();
        }

        return {
            success,
            idealVelocity: parseFloat(idealV.toFixed(2)),
            userVelocity,
            finalPosition: parseFloat(finalPosA.toFixed(2)),
            targetPosition: config.targetX || config.meetingX,
            errorDistance: parseFloat(errorDistance.toFixed(2)),
            solutionText: stepByStepSolution
        };
    }

    getTargetZone() {
        if (!this.activeChallenge) return null;
        if (this.activeChallenge.id === 1 || this.activeChallenge.id === 2) {
            return {
                xMin: this.activeChallenge.targetX - this.activeChallenge.tolerance,
                xMax: this.activeChallenge.targetX + this.activeChallenge.tolerance
            };
        } else if (this.activeChallenge.id === 3) {
            return {
                xMin: this.activeChallenge.meetingX - this.activeChallenge.tolerance,
                xMax: this.activeChallenge.meetingX + this.activeChallenge.tolerance
            };
        }
        return null;
    }

    getObstacle() {
        if (!this.activeChallenge || this.activeChallenge.id !== 2) return null;
        return {
            x: this.activeChallenge.targetX,
            active: this.engine.t >= this.activeChallenge.targetTime
        };
    }
}

// ==========================================
// 5. CONTROLADOR PRINCIPAL DE LA APLICACIÓN
// ==========================================
class App {
    constructor() {
        this.physics = new PhysicsEngine();
        this.renderer = new CanvasRenderer('mruCanvas');
        this.charts = new ChartEngine('chartPosCanvas', 'chartVelCanvas');

        this.challengePhysics = new PhysicsEngine();
        this.challengeRenderer = new CanvasRenderer('challengeCanvas');

        this.isPlaying = false;
        this.lastTimestamp = 0;
        this.showVectors = true;
        this.showStrobe = true;

        this.audioCtx = null;

        this.initUI();
        this.initChallenges();
        this.initQRModal();
        this.syncInputsFromState();
        this.updateAllViews();
    }

    initAudio() {
        try {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) this.audioCtx = new AudioContext();
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        } catch (e) {}
    }

    playTone(freq, type = 'sine', duration = 0.12) {
        try {
            this.initAudio();
            if (!this.audioCtx) return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {}
    }

    initUI() {
        // Pestañas
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playTone(440, 'triangle', 0.08);
                const targetTab = btn.getAttribute('data-tab');

                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const panel = document.getElementById(targetTab);
                if (panel) panel.classList.add('active');

                setTimeout(() => {
                    this.renderer.resize();
                    this.challengeRenderer.resize();
                    this.charts.resize();
                    this.updateAllViews();
                    this.renderChallengeView();
                }, 60);
            });
        });

        // Sliders de Entrada
        const sliderX0 = document.getElementById('sliderX0');
        const sliderV = document.getElementById('sliderV');
        const sliderMaxTime = document.getElementById('sliderMaxTime');

        if (sliderX0) {
            sliderX0.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                document.getElementById('badgeX0').textContent = `${val} m`;
                this.physics.setInitialState(val, this.physics.v, this.physics.maxTime);
                this.onParametersChanged();
            });
        }

        if (sliderV) {
            sliderV.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                document.getElementById('badgeV').textContent = `${val} m/s`;
                this.physics.setInitialState(this.physics.x0, val, this.physics.maxTime);
                this.onParametersChanged();
            });
        }

        if (sliderMaxTime) {
            sliderMaxTime.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                document.getElementById('badgeMaxTime').textContent = `${val} s`;
                document.getElementById('sliderTimeline').max = val;
                this.physics.setInitialState(this.physics.x0, this.physics.v, val);
                this.onParametersChanged();
            });
        }

        // Barra de tiempo
        const sliderTimeline = document.getElementById('sliderTimeline');
        if (sliderTimeline) {
            sliderTimeline.addEventListener('input', (e) => {
                this.pause();
                this.physics.setTime(parseFloat(e.target.value));
                this.updateAllViews();
            });
        }

        // Botones de Reproducción
        const btnPlay = document.getElementById('btnPlayPause');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => this.togglePlay());
        }

        const btnResetSim = document.getElementById('btnResetSim');
        if (btnResetSim) {
            btnResetSim.addEventListener('click', () => {
                this.playTone(320, 'sine', 0.1);
                this.pause();
                this.physics.reset();
                this.updateAllViews();
            });
        }

        const btnResetValues = document.getElementById('btnResetValues');
        if (btnResetValues) {
            btnResetValues.addEventListener('click', () => {
                this.pause();
                this.physics.setInitialState(0, 10, 10);
                this.syncInputsFromState();
                this.onParametersChanged();
            });
        }

        const btnStepBack = document.getElementById('btnStepBack');
        if (btnStepBack) {
            btnStepBack.addEventListener('click', () => {
                this.pause();
                this.physics.setTime(Math.max(0, this.physics.t - 0.1));
                this.updateAllViews();
            });
        }

        const btnStepForward = document.getElementById('btnStepForward');
        if (btnStepForward) {
            btnStepForward.addEventListener('click', () => {
                this.pause();
                this.physics.setTime(Math.min(this.physics.maxTime, this.physics.t + 0.1));
                this.updateAllViews();
            });
        }

        // Selector de Móvil
        const vehicleBtns = document.querySelectorAll('.vehicle-btn');
        vehicleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playTone(520, 'sine', 0.08);
                vehicleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const type = btn.getAttribute('data-type');
                this.renderer.setVehicleType(type);
                this.challengeRenderer.setVehicleType(type);
                this.updateAllViews();
                this.renderChallengeView();
            });
        });

        // Opciones de visualización
        const chkVectors = document.getElementById('chkShowVectors');
        if (chkVectors) {
            chkVectors.addEventListener('change', (e) => {
                this.showVectors = e.target.checked;
                this.updateAllViews();
            });
        }

        const chkStrobe = document.getElementById('chkShowStrobe');
        if (chkStrobe) {
            chkStrobe.addEventListener('change', (e) => {
                this.showStrobe = e.target.checked;
                this.updateAllViews();
            });
        }

        // Exportar CSV
        const btnCsv = document.getElementById('btnExportCSV');
        if (btnCsv) {
            btnCsv.addEventListener('click', () => this.exportTelemetryToCSV());
        }
    }

    syncInputsFromState() {
        const sx0 = document.getElementById('sliderX0');
        if (sx0) sx0.value = this.physics.x0;
        const bx0 = document.getElementById('badgeX0');
        if (bx0) bx0.textContent = `${this.physics.x0} m`;

        const sv = document.getElementById('sliderV');
        if (sv) sv.value = this.physics.v;
        const bv = document.getElementById('badgeV');
        if (bv) bv.textContent = `${this.physics.v} m/s`;

        const st = document.getElementById('sliderMaxTime');
        if (st) st.value = this.physics.maxTime;
        const bt = document.getElementById('badgeMaxTime');
        if (bt) bt.textContent = `${this.physics.maxTime} s`;

        const sTime = document.getElementById('sliderTimeline');
        if (sTime) {
            sTime.max = this.physics.maxTime;
            sTime.value = this.physics.t;
        }
    }

    onParametersChanged() {
        this.renderer.updateBounds(this.physics.x0, this.physics.v, this.physics.maxTime);
        this.updateAllViews();
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    play() {
        this.initAudio();
        this.playTone(600, 'triangle', 0.1);
        if (this.physics.t >= this.physics.maxTime) {
            this.physics.reset();
        }
        this.isPlaying = true;
        this.lastTimestamp = performance.now();
        const icon = document.getElementById('iconPlay');
        const lbl = document.getElementById('lblPlay');
        if (icon) icon.textContent = '⏸';
        if (lbl) lbl.textContent = 'Pausar';
        requestAnimationFrame((ts) => this.animationLoop(ts));
    }

    pause() {
        this.isPlaying = false;
        const icon = document.getElementById('iconPlay');
        const lbl = document.getElementById('lblPlay');
        if (icon) icon.textContent = '▶';
        if (lbl) lbl.textContent = 'Iniciar';
    }

    animationLoop(timestamp) {
        if (!this.isPlaying) return;
        const deltaMs = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        const dt = Math.min(0.08, deltaMs / 1000);
        const stillRunning = this.physics.step(dt);
        this.updateAllViews();

        if (stillRunning) {
            requestAnimationFrame((ts) => this.animationLoop(ts));
        } else {
            this.pause();
            this.playTone(380, 'sine', 0.2);
        }
    }

    updateAllViews() {
        const curX = this.physics.calculatePosition(this.physics.t);
        const disp = this.physics.calculateDisplacement(this.physics.t);
        const dist = this.physics.calculateDistance(this.physics.t);

        const elX = document.getElementById('hudPosX');
        if (elX) elX.innerHTML = `${curX.toFixed(2)} <span class="metric-unit">m</span>`;
        const elDisp = document.getElementById('hudDisp');
        if (elDisp) elDisp.innerHTML = `${disp.toFixed(2)} <span class="metric-unit">m</span>`;
        const elDist = document.getElementById('hudDist');
        if (elDist) elDist.innerHTML = `${dist.toFixed(2)} <span class="metric-unit">m</span>`;
        const elVel = document.getElementById('hudVel');
        if (elVel) elVel.innerHTML = `${this.physics.v.toFixed(1)} <span class="metric-unit">m/s</span>`;
        const elTime = document.getElementById('hudTime');
        if (elTime) elTime.textContent = `${this.physics.t.toFixed(2)} s`;
        const elSTime = document.getElementById('sliderTimeline');
        if (elSTime) elSTime.value = this.physics.t;

        this.renderer.render(this.physics, {
            showVectors: this.showVectors,
            showStrobe: this.showStrobe
        });

        this.charts.update(this.physics);
        this.updateTable();
    }

    updateTable() {
        const tableBody = document.getElementById('telemetryBody');
        if (!tableBody) return;

        const rows = this.physics.generateDiscreteTable(1.0);
        let html = '';
        rows.forEach(r => {
            const isCurrent = Math.abs(r.time - this.physics.t) < 0.5;
            html += `
                <tr style="${isCurrent ? 'background: rgba(0, 242, 254, 0.12); color: #00f2fe; font-weight: 700;' : ''}">
                    <td>${r.time.toFixed(1)} s</td>
                    <td>${r.posA.toFixed(2)} m</td>
                    <td>${r.velA.toFixed(1)} m/s</td>
                    <td>${r.dispA.toFixed(2)} m</td>
                    <td>${r.distA.toFixed(2)} m</td>
                    <td>0.00 m/s²</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    exportTelemetryToCSV() {
        this.playTone(700, 'sine', 0.1);
        const rows = this.physics.generateDiscreteTable(0.5);
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Tiempo (s),Posicion (m),Velocidad (m/s),Desplazamiento (m),Distancia (m),Aceleracion (m/s2)\n";

        rows.forEach(r => {
            csvContent += `${r.time},${r.posA},${r.velA},${r.dispA},${r.distA},${r.accA}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `telemetria_MRU_v${this.physics.v}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ================= DESAFÍOS DEL STAND =================
    initChallenges() {
        const title = document.getElementById('chLevelTitle');
        const desc = document.getElementById('chLevelDesc');
        const statement = document.getElementById('chStatement');
        const givenData = document.getElementById('chGivenData');
        const question = document.getElementById('chQuestion');
        const hintFormula = document.getElementById('chHintFormula');
        const hintText = document.getElementById('chHintText');
        const btnToggleHint = document.getElementById('btnToggleHint');
        const hintBox = document.getElementById('chHintBox');

        if (btnToggleHint && hintBox) {
            btnToggleHint.addEventListener('click', () => {
                const isHidden = hintBox.style.display === 'none' || !hintBox.style.display;
                hintBox.style.display = isHidden ? 'block' : 'none';
                btnToggleHint.innerHTML = isHidden ? '<span>🙈</span> Ocultar Pista' : '<span>💡</span> Ver Pista / Fórmula de Ayuda';
            });
        }

        this.challenges = new ChallengeManager(this.challengePhysics, this.challengeRenderer, (state) => {
            const config = state.config;
            if (!config) return;

            if (title) title.textContent = config.name;
            if (desc) desc.textContent = config.description;
            if (statement) statement.innerHTML = config.statement.replace(/\$(.*?)\$/g, '<strong>$1</strong>');
            if (question) question.innerHTML = config.question;

            if (givenData && config.givenData) {
                givenData.innerHTML = config.givenData.map(d => `
                    <div class="data-pill">
                        <span class="data-pill-icon">${d.icon || '📌'}</span>
                        <div class="data-pill-info">
                            <span class="data-pill-label">${d.label.replace(/\$(.*?)\$/g, '$1')}</span>
                            <span class="data-pill-value">${d.value}</span>
                        </div>
                    </div>
                `).join('');
            }

            if (hintFormula) hintFormula.textContent = config.hintFormula ? config.hintFormula.replace(/\\text\{m\/s\}/g, 'm/s').replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1)/($2)').replace(/\\quad/g, ' ').replace(/\\Rightarrow/g, '➔') : '';
            if (hintText) hintText.textContent = config.hintText || '';

            // Reset hint box
            if (hintBox) hintBox.style.display = 'none';
            if (btnToggleHint) btnToggleHint.innerHTML = '<span>💡</span> Ver Pista / Fórmula de Ayuda';

            // Reset input default
            const inputField = document.getElementById('chInputVelocity');
            if (inputField) {
                inputField.value = config.id === 1 ? '20' : (config.id === 2 ? '20' : '15');
            }
        });

        const levelBtns = document.querySelectorAll('.level-btn');
        levelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playTone(500, 'triangle', 0.08);
                levelBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const level = parseInt(btn.getAttribute('data-level'));
                this.challenges.loadLevel(level);
                const rBox = document.getElementById('chResultBox');
                if (rBox) rBox.style.display = 'none';
                this.renderChallengeView();
            });
        });

        const btnLaunch = document.getElementById('btnLaunchChallenge');
        if (btnLaunch) {
            btnLaunch.addEventListener('click', () => {
                this.runChallengeTest();
            });
        }

        this.challenges.loadLevel(1);
        this.renderChallengeView();
    }

    runChallengeTest() {
        this.initAudio();
        const inputField = document.getElementById('chInputVelocity');
        const inputV = parseFloat(inputField ? inputField.value : 0) || 0;
        const config = this.challenges.activeChallenge;

        this.challengePhysics.setInitialState(config.x0 || config.x0_A, inputV, config.targetTime || 8);
        if (config.id === 3) {
            this.challengePhysics.setSecondBody(true, config.x0_B, config.v_B);
        } else {
            this.challengePhysics.setSecondBody(false);
        }

        let currentT = 0;
        const simDuration = config.targetTime || 8;
        const stepDt = 0.04;

        const animTest = () => {
            currentT += stepDt;
            this.challengePhysics.setTime(currentT);
            this.renderChallengeView();

            if (currentT < simDuration) {
                requestAnimationFrame(animTest);
            } else {
                const evalResult = this.challenges.evaluateAttempt(inputV);
                this.showChallengeFeedback(evalResult);
            }
        };

        requestAnimationFrame(animTest);
    }

    renderChallengeView() {
        this.challengeRenderer.render(this.challengePhysics, {
            showVectors: true,
            showStrobe: true,
            targetZone: this.challenges.getTargetZone(),
            obstacle: this.challenges.getObstacle()
        });
    }

    showChallengeFeedback(result) {
        const box = document.getElementById('chResultBox');
        const title = document.getElementById('chResultTitle');
        const msg = document.getElementById('chResultMsg');
        const details = document.getElementById('chSolutionDetails');

        if (!box) return;
        box.style.display = 'block';

        if (result.success) {
            this.playTone(880, 'sine', 0.3);
            box.className = 'challenge-result-box success';
            if (title) title.textContent = '🎉 ¡Excelente! ¡Misión Completada con Éxito!';
            if (msg) msg.textContent = `Has detenido el móvil a ${result.finalPosition}m del origen (Error: solo ${result.errorDistance}m). ¡Cálculo físico exacto!`;
        } else {
            this.playTone(220, 'sawtooth', 0.3);
            box.className = 'challenge-result-box fail';
            if (title) title.textContent = '❌ Misión Fallida: Desviación de la meta';
            if (msg) msg.textContent = `El móvil llegó a ${result.finalPosition}m (Objetivo: ${result.targetPosition}m, Diferencia: ${result.errorDistance}m). La velocidad ideal requerida era ${result.idealVelocity} m/s.`;
        }

        if (details) details.textContent = result.solutionText;
    }

    // ================= MODAL CÓDIGO QR =================
    initQRModal() {
        const modal = document.getElementById('qrModal');
        const btnOpen = document.getElementById('btnOpenQr');
        const btnClose = document.getElementById('btnCloseQr');
        const qrContainer = document.getElementById('qrcodeContainer');
        const qrUrlLabel = document.getElementById('qrUrlLabel');
        const defaultPublicUrl = 'https://vanemimal06-dev.github.io/MRU/';

        // Determinar URL real para el QR (si es local file:// o localhost, usamos la URL de GitHub Pages)
        let targetUrl = defaultPublicUrl;
        if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
            targetUrl = window.location.href;
        }

        const renderQR = (url) => {
            if (!qrContainer) return;
            qrContainer.innerHTML = '';

            if (qrUrlLabel) {
                qrUrlLabel.textContent = url;
            }

            if (window.QRCode) {
                try {
                    new QRCode(qrContainer, {
                        text: url,
                        width: 180,
                        height: 180,
                        colorDark: "#070a12",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M
                    });
                } catch (e) {
                    console.error('Error generando QR:', e);
                }
            } else {
                qrContainer.innerHTML = `
                    <div style="padding: 10px; color: #070a12; font-size: 0.8rem; font-weight: bold; text-align: center;">
                        📱 Simulador MRU
                        <div style="font-size: 0.7rem; color: #64748b; margin-top: 5px; word-break: break-all;">
                            ${url}
                        </div>
                    </div>
                `;
            }
        };

        renderQR(targetUrl);

        window.openQrModal = () => {
            this.playTone(480, 'sine', 0.1);
            renderQR(targetUrl);
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex';
            }
        };

        window.closeQrModal = () => {
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        };

        if (btnOpen) {
            btnOpen.addEventListener('click', () => window.openQrModal());
        }

        if (btnClose) {
            btnClose.addEventListener('click', () => window.closeQrModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) window.closeQrModal();
            });
        }
    }
}

// Funciones de respaldo global inmediatas
window.openQrModal = function() {
    const modal = document.getElementById('qrModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
};
window.closeQrModal = function() {
    const modal = document.getElementById('qrModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
};

// Inicialización garantizada
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.mruApp = new App();
        } catch (e) {
            console.error('Error inicializando MRU App:', e);
        }
    });
} else {
    try {
        window.mruApp = new App();
    } catch (e) {
        console.error('Error inicializando MRU App:', e);
    }
}
