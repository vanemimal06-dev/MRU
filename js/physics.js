/**
 * physics.js - Motor de Cálculo Físico para MRU (Movimiento Rectilíneo Uniforme)
 * Actividad: Libro Fest - Física Básica
 */

export class PhysicsEngine {
    constructor() {
        // Estado del móvil principal (Móvil A)
        this.x0 = 0;       // Posición inicial (m)
        this.v = 10;       // Velocidad constante (m/s)
        this.t = 0;        // Tiempo transcurrido actual (s)
        this.maxTime = 10; // Tiempo límite de simulación (s)

        // Estado de un segundo móvil opcional (Móvil B) para desafíos de intercepción/encuentro
        this.activeSecondBody = false;
        this.x0_B = 100;
        this.v_B = -5;

        // Historial de telemetría (para tablas y gráficas)
        this.history = [];
    }

    /**
     * Configura los parámetros iniciales del móvil A
     * @param {number} x0 - Posición inicial en metros
     * @param {number} v - Velocidad en m/s
     * @param {number} maxTime - Tiempo máximo de simulación
     */
    setInitialState(x0, v, maxTime = 10) {
        this.x0 = parseFloat(x0);
        this.v = parseFloat(v);
        this.maxTime = Math.max(1, parseFloat(maxTime));
        this.reset();
    }

    /**
     * Configura el segundo móvil (Móvil B)
     */
    setSecondBody(active, x0_B = 80, v_B = -10) {
        this.activeSecondBody = active;
        this.x0_B = parseFloat(x0_B);
        this.v_B = parseFloat(v_B);
    }

    /**
     * Reinicia el tiempo y el historial
     */
    reset() {
        this.t = 0;
        this.history = [];
        this.recordPoint(0);
    }

    /**
     * Calcula la posición analítica exacta en el tiempo t: x(t) = x0 + v * t
     * @param {number} time - Tiempo en segundos
     * @param {number} xInit - Posición inicial
     * @param {number} velocity - Velocidad constante
     * @returns {number} Posición en metros
     */
    calculatePosition(time, xInit = this.x0, velocity = this.v) {
        return xInit + (velocity * time);
    }

    /**
     * Calcula el desplazamiento: Δx = x(t) - x0 = v * t
     */
    calculateDisplacement(time, velocity = this.v) {
        return velocity * time;
    }

    /**
     * Calcula la distancia recorrida: d = |v| * t
     */
    calculateDistance(time, velocity = this.v) {
        return Math.abs(velocity) * time;
    }

    /**
     * Avanza la simulación un delta de tiempo (dt)
     * @param {number} dt - Diferencial de tiempo en segundos
     * @returns {boolean} true si aún está dentro del tiempo máximo, false si terminó
     */
    step(dt) {
        if (this.t >= this.maxTime) {
            this.t = this.maxTime;
            return false;
        }

        this.t = Math.min(this.maxTime, this.t + dt);
        this.recordPoint(this.t);
        return this.t < this.maxTime;
    }

    /**
     * Fija el tiempo exactamente a un valor dado
     * @param {number} targetTime 
     */
    setTime(targetTime) {
        this.t = Math.max(0, Math.min(this.maxTime, targetTime));
        this.rebuildHistoryUpTo(this.t);
    }

    /**
     * Registra un punto en el historial si no existe ya para ese tiempo aproximado
     */
    recordPoint(time) {
        const xA = this.calculatePosition(time, this.x0, this.v);
        const point = {
            t: parseFloat(time.toFixed(3)),
            xA: parseFloat(xA.toFixed(2)),
            vA: this.v,
            dispA: parseFloat(this.calculateDisplacement(time, this.v).toFixed(2)),
            distA: parseFloat(this.calculateDistance(time, this.v).toFixed(2)),
            aA: 0 // Aceleración en MRU siempre es 0 m/s²
        };

        if (this.activeSecondBody) {
            const xB = this.calculatePosition(time, this.x0_B, this.v_B);
            point.xB = parseFloat(xB.toFixed(2));
            point.vB = this.v_B;
        }

        // Evitar duplicados muy cercanos en tiempo
        const last = this.history[this.history.length - 1];
        if (!last || Math.abs(last.t - point.t) >= 0.04 || time >= this.maxTime) {
            this.history.push(point);
        }
    }

    /**
     * Reconstruye el historial completo desde t=0 hasta targetTime
     */
    rebuildHistoryUpTo(targetTime) {
        this.history = [];
        const stepSize = 0.05;
        for (let currentTime = 0; currentTime <= targetTime; currentTime += stepSize) {
            this.recordPoint(currentTime);
        }
        if (targetTime % stepSize !== 0) {
            this.recordPoint(targetTime);
        }
    }

    /**
     * Genera una tabla de datos discreta en intervalos regulares (por ejemplo cada 1s o 0.5s)
     * @param {number} interval - Intervalo de tiempo en segundos (default: 1s)
     * @returns {Array<Object>}
     */
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

    /**
     * Calcula el punto de encuentro teórico entre dos móviles:
     * x0_A + v_A * t = x0_B + v_B * t  =>  t = (x0_B - x0_A) / (v_A - v_B)
     * @returns {Object|null} { time, position } o null si no se cruzan en t >= 0
     */
    calculateMeetingPoint() {
        if (!this.activeSecondBody) return null;
        const deltaV = this.v - this.v_B;
        if (Math.abs(deltaV) < 0.0001) {
            return null; // Velocidades paralelas e iguales: nunca se encuentran
        }
        const tMeet = (this.x0_B - this.x0) / deltaV;
        if (tMeet < 0) {
            return null; // El encuentro ocurrió en el pasado
        }
        const xMeet = this.calculatePosition(tMeet, this.x0, this.v);
        return {
            time: parseFloat(tMeet.toFixed(2)),
            position: parseFloat(xMeet.toFixed(2))
        };
    }
}
