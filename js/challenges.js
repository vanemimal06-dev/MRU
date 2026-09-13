/**
 * challenges.js - Módulo de Desafíos Gamificados para Visitantes del Stand
 * Actividad: Libro Fest - Física Básica
 */

export class ChallengeManager {
    constructor(engine, renderer, onStateChange) {
        this.engine = engine;
        this.renderer = renderer;
        this.onStateChange = onStateChange;

        this.currentLevel = 1;
        this.activeChallenge = null;
        this.isEvaluating = false;
        this.score = 0;
        this.stars = 0;

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
                config: this.activeChallenge,
                result: null
            });
        }
    }

    /**
     * Valida el intento del usuario tras completar la simulación
     */
    evaluateAttempt(userVelocity) {
        const config = this.activeChallenge;
        if (!config) return null;

        const idealV = config.calculateIdeal(config.x0, config.targetX, config.targetTime);
        const diffV = Math.abs(userVelocity - idealV);

        let finalPosA = 0;
        let success = false;
        let errorDistance = 0;
        let stepByStepSolution = '';

        if (config.id === 1 || config.id === 2) {
            finalPosA = this.engine.calculatePosition(config.targetTime, config.x0, userVelocity);
            errorDistance = Math.abs(finalPosA - config.targetX);
            success = errorDistance <= config.tolerance;

            stepByStepSolution = `
**Resolución Matemática Paso a Paso:**
1. Fórmula base: $x(t) = x_0 + v \\cdot t$
2. Despeje de la velocidad: $v = \\frac{x(t) - x_0}{t}$
3. Sustitución numérica:
   $$v = \\frac{${config.targetX} - (${config.x0})}{${config.targetTime}} = \\frac{${config.targetX - config.x0}}{${config.targetTime}} = \\mathbf{${idealV.toFixed(2)}\\text{ m/s}}$$
4. Tu elección: **${userVelocity} m/s** (Llegaste a $x = ${finalPosA.toFixed(2)}$ m).
            `.trim();
        } else if (config.id === 3) {
            const tMeet = (config.meetingX - config.x0_B) / config.v_B;
            finalPosA = this.engine.calculatePosition(tMeet, config.x0_A, userVelocity);
            errorDistance = Math.abs(finalPosA - config.meetingX);
            success = errorDistance <= config.tolerance;

            stepByStepSolution = `
**Resolución Matemática Paso a Paso (Punto de Encuentro):**
1. Para Móvil B: $x_B(t) = ${config.x0_B} + (${config.v_B}) \\cdot t = ${config.meetingX}$
   $$t_{\\text{encuentro}} = \\frac{${config.meetingX} - ${config.x0_B}}{${config.v_B}} = \\frac{${config.meetingX - config.x0_B}}{${config.v_B}} = ${tMeet.toFixed(2)}\\text{ s}$$
2. Para Móvil A: $x_A(t) = ${config.x0_A} + v_A \\cdot (${tMeet}) = ${config.meetingX}$
   $$v_A = \\frac{${config.meetingX} - ${config.x0_A}}{${tMeet}} = \\mathbf{${idealV.toFixed(2)}\\text{ m/s}}$$
3. Tu elección: **${userVelocity} m/s** (Móvil A llegó a $x = ${finalPosA.toFixed(2)}$ m al tiempo $t = ${tMeet}$ s).
            `.trim();
        }

        if (success) {
            this.score += 100;
            this.stars++;
        }

        const result = {
            success,
            idealVelocity: parseFloat(idealV.toFixed(2)),
            userVelocity,
            finalPosition: parseFloat(finalPosA.toFixed(2)),
            targetPosition: config.targetX || config.meetingX,
            errorDistance: parseFloat(errorDistance.toFixed(2)),
            solutionText: stepByStepSolution
        };

        if (this.onStateChange) {
            this.onStateChange({
                level: this.currentLevel,
                config: this.activeChallenge,
                result
            });
        }

        return result;
    }

    getTargetZone() {
        if (!this.activeChallenge) return null;
        if (this.activeChallenge.id === 1) {
            return {
                xMin: this.activeChallenge.targetX - this.activeChallenge.tolerance,
                xMax: this.activeChallenge.targetX + this.activeChallenge.tolerance
            };
        } else if (this.activeChallenge.id === 2) {
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
