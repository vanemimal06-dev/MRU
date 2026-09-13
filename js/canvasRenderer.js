/**
 * canvasRenderer.js - Renderizador Gráfico 2D para la pista de MRU
 * Dibuja la pista graduada, el móvil seleccionado, vectores de velocidad y marcas de posición
 */

export class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.vehicleType = 'car'; // 'car', 'rover', 'drone', 'particle'

        // Configuración de la escala de la pista
        this.minWorldX = -50; // Metros
        this.maxWorldX = 150; // Metros
        this.viewOffsetX = 0; // Desplazamiento de cámara opcional

        // Ajuste de resolución para pantallas Retina / High DPI
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width || 800;
        this.height = rect.height || 260;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    setVehicleType(type) {
        this.vehicleType = type;
    }

    /**
     * Convierte una coordenada del mundo físico (metros) a píxeles en el canvas
     */
    worldToScreenX(worldX) {
        const padding = 60;
        const availableWidth = this.width - (padding * 2);
        const worldRange = this.maxWorldX - this.minWorldX;
        const normalized = (worldX - this.minWorldX) / worldRange;
        return padding + (normalized * availableWidth);
    }

    /**
     * Ajusta el rango de visualización según los datos
     */
    updateBounds(x0, v, maxTime, targetZone = null) {
        const xFinal = x0 + (v * maxTime);
        let minX = Math.min(x0, xFinal, -20);
        let maxX = Math.max(x0, xFinal, 100);

        if (targetZone) {
            minX = Math.min(minX, targetZone.xMin - 10);
            maxX = Math.max(maxX, targetZone.xMax + 20);
        }

        // Añadir margen de visualización
        const margin = (maxX - minX) * 0.15;
        this.minWorldX = Math.floor((minX - margin) / 10) * 10;
        this.maxWorldX = Math.ceil((maxX + margin) / 10) * 10;
    }

    /**
     * Renderiza todo el cuadro de la simulación
     */
    render(engine, options = {}) {
        const { showVectors = true, showStrobe = true, targetZone = null, obstacle = null } = options;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Limpiar lienzo
        ctx.clearRect(0, 0, w, h);

        // Fondo futurista / Pista
        this.drawBackground(ctx, w, h);

        // Zona objetivo de desafío (si aplica)
        if (targetZone) {
            this.drawTargetZone(ctx, targetZone, h);
        }

        // Obstáculo / Semáforo láser (si aplica)
        if (obstacle) {
            this.drawObstacle(ctx, obstacle, h);
        }

        // Marcas estroboscópicas del historial
        if (showStrobe && engine.history.length > 1) {
            this.drawStrobeMarks(ctx, engine.history, h);
        }

        // Regla métrica y graduación
        this.drawRuler(ctx, w, h);

        // Posición actual Móvil A
        const currentXA = engine.calculatePosition(engine.t, engine.x0, engine.v);
        const screenXA = this.worldToScreenX(currentXA);
        const groundY = h - 70;

        // Dibujar Móvil A
        this.drawVehicle(ctx, screenXA, groundY, this.vehicleType, engine.v, '#00f2fe', 'Móvil A', currentXA);

        // Vector de velocidad Móvil A
        if (showVectors && Math.abs(engine.v) > 0.01) {
            this.drawVelocityVector(ctx, screenXA, groundY - 45, engine.v, '#00f2fe');
        }

        // Dibujar Móvil B (si está activo)
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
        // Fondo degradado tecnológico
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.7, '#111827');
        bgGrad.addColorStop(1, '#070a10');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Cuadrícula sutil de fondo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // Línea de horizonte de la pista
        const groundY = h - 60;
        const roadGrad = ctx.createLinearGradient(0, groundY, 0, h);
        roadGrad.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
        roadGrad.addColorStop(1, 'rgba(15, 23, 42, 1)');
        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, groundY, w, 60);

        // Borde superior de pista con brillo cian
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.stroke();
    }

    drawRuler(ctx, w, h) {
        const groundY = h - 45;
        const range = this.maxWorldX - this.minWorldX;
        
        // Determinar paso métrico para no saturar la pantalla
        let step = 10;
        if (range <= 40) step = 5;
        else if (range <= 100) step = 10;
        else if (range <= 250) step = 25;
        else step = 50;

        ctx.font = '10px "Fira Code", monospace';
        ctx.textAlign = 'center';

        const startMeter = Math.ceil(this.minWorldX / step) * step;
        for (let meter = startMeter; meter <= this.maxWorldX; meter += step) {
            const screenX = this.worldToScreenX(meter);
            if (screenX < 20 || screenX > w - 20) continue;

            const isOrigin = (meter === 0);

            // Marca vertical
            ctx.strokeStyle = isOrigin ? '#38ef7d' : 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = isOrigin ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(screenX, groundY - 8);
            ctx.lineTo(screenX, groundY + 8);
            ctx.stroke();

            // Etiqueta numérica
            ctx.fillStyle = isOrigin ? '#38ef7d' : 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`${meter}m`, screenX, groundY + 22);

            // Marcas intermedias pequeñas
            const subStep = step / 5;
            for (let sub = 1; sub < 5; sub++) {
                const subMeter = meter + (sub * subStep);
                if (subMeter <= this.maxWorldX) {
                    const subX = this.worldToScreenX(subMeter);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.beginPath();
                    ctx.moveTo(subX, groundY - 4);
                    ctx.lineTo(subX, groundY + 4);
                    ctx.stroke();
                }
            }
        }
    }

    drawStrobeMarks(ctx, history, h) {
        const groundY = h - 60;
        ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';

        history.forEach((point, idx) => {
            // Dibujar cada 0.5s o en puntos clave
            if (idx % 8 === 0 || idx === history.length - 1) {
                const sx = this.worldToScreenX(point.xA);
                ctx.beginPath();
                ctx.arc(sx, groundY, 3, 0, Math.PI * 2);
                ctx.fill();

                // Marca de tiempo
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.font = '9px sans-serif';
                ctx.fillText(`t=${point.t}s`, sx, groundY - 10);
            }
        });
    }

    drawVelocityVector(ctx, x, y, velocity, color) {
        const isRight = velocity >= 0;
        const maxArrowLen = 90;
        const minArrowLen = 30;
        const arrowLen = Math.min(maxArrowLen, Math.max(minArrowLen, Math.abs(velocity) * 3)) * (isRight ? 1 : -1);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;

        // Línea principal
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + arrowLen, y);
        ctx.stroke();

        // Cabeza de flecha
        const headSize = 7;
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

        // Etiqueta del vector
        ctx.font = 'bold 11px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`v⃗ = ${velocity > 0 ? '+' : ''}${velocity} m/s`, x + (arrowLen / 2), y - 9);
        ctx.restore();
    }

    drawVehicle(ctx, x, y, type, velocity, color, label, worldPos) {
        ctx.save();
        ctx.translate(x, y);

        // Reflejar sprite si la velocidad es negativa
        if (velocity < 0) {
            ctx.scale(-1, 1);
        }

        // Dibujo según el tipo seleccionado
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

        // Etiqueta flotante con posición en tiempo real
        ctx.fillStyle = color;
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${label} (${worldPos.toFixed(1)}m)`, x, y - 28);
    }

    drawSportCar(ctx, primaryColor) {
        // Chasis estilizado Cyberpunk
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(-25, 5);
        ctx.lineTo(-20, -5);
        ctx.lineTo(-8, -12);
        ctx.lineTo(12, -12);
        ctx.lineTo(24, -2);
        ctx.lineTo(28, 5);
        ctx.closePath();
        ctx.fill();

        // Parabrisas / Techo
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(-6, -11);
        ctx.lineTo(8, -11);
        ctx.lineTo(16, -3);
        ctx.lineTo(-12, -3);
        ctx.closePath();
        ctx.fill();

        // Faros neón
        ctx.fillStyle = '#ffe600';
        ctx.fillRect(25, 0, 3, 3);
        ctx.fillStyle = '#ff2a2a';
        ctx.fillRect(-26, 0, 3, 3);

        // Ruedas
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(-14, 6, 6, 0, Math.PI * 2);
        ctx.arc(16, 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rines brillantes
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(-14, 6, 2, 0, Math.PI * 2);
        ctx.arc(16, 6, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMarsRover(ctx, primaryColor) {
        // Cuerpo del Rover
        ctx.fillStyle = primaryColor;
        ctx.fillRect(-18, -12, 36, 14);

        // Mástil con cámara
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, -12);
        ctx.lineTo(8, -22);
        ctx.lineTo(12, -22);
        ctx.stroke();
        ctx.fillStyle = '#38ef7d';
        ctx.beginPath();
        ctx.arc(12, -22, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Ruedas 6x6
        ctx.fillStyle = '#334155';
        for (let wx of [-14, 0, 14]) {
            ctx.beginPath();
            ctx.arc(wx, 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawDrone(ctx, primaryColor) {
        // Cuerpo del dron
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.ellipse(0, -6, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hélices flotantes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(-14, -14, 8, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(14, -14, 8, 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Brazos
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(-14, -14);
        ctx.lineTo(-4, -6);
        ctx.moveTo(14, -14);
        ctx.lineTo(4, -6);
        ctx.stroke();

        // Sensor
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawQuantumParticle(ctx, primaryColor) {
        // Núcleo brillante
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, primaryColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Anillo orbital
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawTargetZone(ctx, targetZone, h) {
        const sxMin = this.worldToScreenX(targetZone.xMin);
        const sxMax = this.worldToScreenX(targetZone.xMax);
        const width = sxMax - sxMin;
        const groundY = h - 60;

        ctx.fillStyle = 'rgba(56, 239, 125, 0.2)';
        ctx.fillRect(sxMin, groundY - 30, width, 30);

        ctx.strokeStyle = '#38ef7d';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(sxMin, groundY - 30, width, 30);
        ctx.setLineDash([]);

        // Bandera de Meta
        ctx.fillStyle = '#38ef7d';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 ZONA OBJETIVO', (sxMin + sxMax) / 2, groundY - 38);
    }

    drawObstacle(ctx, obstacle, h) {
        const sx = this.worldToScreenX(obstacle.x);
        const groundY = h - 60;

        // Barrera láser roja
        ctx.strokeStyle = obstacle.active ? '#ff3366' : 'rgba(255, 51, 102, 0.2)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx, groundY - 50);
        ctx.lineTo(sx, groundY);
        ctx.stroke();

        ctx.fillStyle = '#ff3366';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🚧 Barrera (${obstacle.x}m)`, sx, groundY - 56);
    }
}
