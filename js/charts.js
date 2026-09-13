/**
 * charts.js - Motor de Gráficas Vectoriales en Tiempo Real para MRU
 * Grafica x vs t (Posición vs Tiempo) y v vs t (Velocidad vs Tiempo) con cálculo de pendiente y área
 */

export class ChartEngine {
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
            const w = rect.width || 380;
            const h = rect.height || 200;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        });
    }

    /**
     * Actualiza ambas gráficas con el estado actual y el historial
     */
    update(engine) {
        this.renderPositionChart(engine);
        this.renderVelocityChart(engine);
    }

    /**
     * Gráfica x(t): Posición vs Tiempo
     * Demuestra que la pendiente de la recta es la velocidad (m = v)
     */
    renderPositionChart(engine) {
        if (!this.ctxPos || !this.canvasPos) return;
        const ctx = this.ctxPos;
        const rect = this.canvasPos.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);
        this.drawChartBackground(ctx, w, h, 'Gráfica Posición vs Tiempo [ x(t) ]', 'Tiempo t (s)', 'Posición x (m)');

        const padLeft = 45;
        const padRight = 20;
        const padTop = 30;
        const padBottom = 35;
        const plotW = w - padLeft - padRight;
        const plotH = h - padTop - padBottom;

        // Determinar límites de escala
        const maxT = Math.max(5, engine.maxTime);
        const xFinal = engine.x0 + (engine.v * maxT);
        let minX = Math.min(engine.x0, xFinal, -10);
        let maxX = Math.max(engine.x0, xFinal, 10);
        if (engine.activeSecondBody) {
            const xFinalB = engine.x0_B + (engine.v_B * maxT);
            minX = Math.min(minX, engine.x0_B, xFinalB);
            maxX = Math.max(maxX, engine.x0_B, xFinalB);
        }

        const margin = (maxX - minX) * 0.1 || 5;
        minX = Math.floor(minX - margin);
        maxX = Math.ceil(maxX + margin);

        const mapT = (t) => padLeft + (t / maxT) * plotW;
        const mapX = (x) => padTop + plotH - ((x - minX) / (maxX - minX)) * plotH;

        // Ejes y cuadrícula
        this.drawGridAndAxes(ctx, padLeft, padTop, plotW, plotH, 0, maxT, minX, maxX, mapT, mapX);

        // Línea teórica proyectada (punteada)
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mapT(0), mapX(engine.x0));
        ctx.lineTo(mapT(maxT), mapX(engine.calculatePosition(maxT, engine.x0, engine.v)));
        ctx.stroke();
        ctx.setLineDash([]);

        // Trazo recorrido del historial Móvil A
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

            // Punto actual Móvil A
            const lastPt = engine.history[engine.history.length - 1];
            const curX = mapT(lastPt.t);
            const curY = mapX(lastPt.xA);
            ctx.fillStyle = '#00f2fe';
            ctx.beginPath();
            ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Si Móvil B está activo
        if (engine.activeSecondBody && engine.history.length > 0) {
            ctx.strokeStyle = '#ff4b72';
            ctx.lineWidth = 2;
            ctx.beginPath();
            engine.history.forEach((pt, i) => {
                if (pt.xB !== undefined) {
                    const px = mapT(pt.t);
                    const py = mapX(pt.xB);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
            });
            ctx.stroke();
        }

        // Insignia de Pendiente (m = v)
        ctx.fillStyle = '#38ef7d';
        ctx.font = 'bold 10px "Fira Code", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Pendiente (m = v) = ${engine.v} m/s`, w - padRight, padTop + 14);
    }

    /**
     * Gráfica v(t): Velocidad vs Tiempo
     * Demuestra que la velocidad es una línea horizontal constante y el área es el desplazamiento Δx
     */
    renderVelocityChart(engine) {
        if (!this.ctxVel || !this.canvasVel) return;
        const ctx = this.ctxVel;
        const rect = this.canvasVel.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);
        this.drawChartBackground(ctx, w, h, 'Gráfica Velocidad vs Tiempo [ v(t) ]', 'Tiempo t (s)', 'Velocidad v (m/s)');

        const padLeft = 45;
        const padRight = 20;
        const padTop = 30;
        const padBottom = 35;
        const plotW = w - padLeft - padRight;
        const plotH = h - padTop - padBottom;

        const maxT = Math.max(5, engine.maxTime);
        let minV = Math.min(engine.v, 0, -5);
        let maxV = Math.max(engine.v, 5);
        if (engine.activeSecondBody) {
            minV = Math.min(minV, engine.v_B);
            maxV = Math.max(maxV, engine.v_B);
        }
        const marginV = (maxV - minV) * 0.15 || 5;
        minV = Math.floor(minV - marginV);
        maxV = Math.ceil(maxV + marginV);

        const mapT = (t) => padLeft + (t / maxT) * plotW;
        const mapV = (v) => padTop + plotH - ((v - minV) / (maxV - minV)) * plotH;

        this.drawGridAndAxes(ctx, padLeft, padTop, plotW, plotH, 0, maxT, minV, maxV, mapT, mapV);

        const zeroY = mapV(0);
        const curY = mapV(engine.v);
        const curT_X = mapT(engine.t);
        const startT_X = mapT(0);

        // Área sombreada bajo la curva (representa el desplazamiento Δx = v * t)
        if (engine.t > 0) {
            ctx.fillStyle = engine.v >= 0 ? 'rgba(56, 239, 125, 0.2)' : 'rgba(255, 75, 114, 0.2)';
            ctx.fillRect(startT_X, Math.min(zeroY, curY), curT_X - startT_X, Math.abs(curY - zeroY));

            ctx.strokeStyle = engine.v >= 0 ? '#38ef7d' : '#ff4b72';
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(startT_X, Math.min(zeroY, curY), curT_X - startT_X, Math.abs(curY - zeroY));
            ctx.setLineDash([]);
        }

        // Línea horizontal continua de velocidad
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startT_X, curY);
        ctx.lineTo(mapT(maxT), curY);
        ctx.stroke();

        // Punto actual
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(curT_X, curY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Si Móvil B está activo
        if (engine.activeSecondBody) {
            const curY_B = mapV(engine.v_B);
            ctx.strokeStyle = '#ff4b72';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startT_X, curY_B);
            ctx.lineTo(mapT(maxT), curY_B);
            ctx.stroke();
        }

        // Insignia del Área (Área = Desplazamiento)
        const displacement = (engine.v * engine.t).toFixed(1);
        ctx.fillStyle = '#38ef7d';
        ctx.font = 'bold 10px "Fira Code", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Área = Δx = ${displacement} m`, w - padRight, padTop + 14);
    }

    drawChartBackground(ctx, w, h, title, xLabel, yLabel) {
        // Fondo con borde translúcido
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);

        // Título de la gráfica
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, 12, 18);

        // Etiquetas de ejes
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(xLabel, w / 2, h - 6);

        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
    }

    drawGridAndAxes(ctx, padLeft, padTop, plotW, plotH, minT, maxT, minY, maxY, mapT, mapY) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;

        // Líneas verticales (Tiempo)
        const numStepsT = 5;
        const stepT = (maxT - minT) / numStepsT;
        ctx.font = '9px "Fira Code", monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.textAlign = 'center';

        for (let i = 0; i <= numStepsT; i++) {
            const valT = minT + i * stepT;
            const px = mapT(valT);
            ctx.beginPath();
            ctx.moveTo(px, padTop);
            ctx.lineTo(px, padTop + plotH);
            ctx.stroke();

            ctx.fillText(`${valT.toFixed(0)}s`, px, padTop + plotH + 14);
        }

        // Líneas horizontales (Valor Y)
        const numStepsY = 4;
        const stepY = (maxY - minY) / numStepsY;
        ctx.textAlign = 'right';

        for (let j = 0; j <= numStepsY; j++) {
            const valY = minY + j * stepY;
            const py = mapY(valY);
            ctx.beginPath();
            ctx.moveTo(padLeft, py);
            ctx.lineTo(padLeft + plotW, py);
            ctx.stroke();

            ctx.fillText(`${valY.toFixed(0)}`, padLeft - 6, py + 3);
        }

        // Eje cero si está visible
        if (minY <= 0 && maxY >= 0) {
            const zeroY = mapY(0);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(padLeft, zeroY);
            ctx.lineTo(padLeft + plotW, zeroY);
            ctx.stroke();
        }
    }
}
