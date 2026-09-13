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
                name: 'Nivel 1: Entrega de Suministros',
                description: 'Ajusta la velocidad adecuada para que el móvil se detenga dentro de la zona objetivo en exactamente el tiempo fijado.',
                x0: -20,
                targetX: 80,
                tolerance: 3.5,
                targetTime: 5.0,
                hintFormula: 'v = (x_final - x0) / t',
                calculateIdeal: (x0, targetX, targetTime) => (targetX - x0) / targetTime
            },
            {
                id: 2,
                name: 'Nivel 2: Cruce de Barrera Láser',
                description: 'Una barrera de seguridad se cerrará a los 6.0 segundos en la posición indicada. Calcula la velocidad mínima para cruzar la línea de meta a tiempo.',
                x0: 0,
                targetX: 120,
                tolerance: 4.0,
                targetTime: 6.0,
                hintFormula: 'v ≥ (x_barrera - x0) / t_cierre',
                calculateIdeal: (x0, targetX, targetTime) => (targetX - x0) / targetTime
            },
            {
                id: 3,
                name: 'Nivel 3: Intercepción Espacial (2 Cuerpos)',
                description: 'La sonda B viaja hacia nosotros desde 150m a -10 m/s. Ajusta la velocidad de la sonda A para que ambas colisionen/se encuentren exactamente en x = 90m.',
                x0_A: 0,
                x0_B: 150,
                v_B: -10,
                meetingX: 90,
                tolerance: 3.0,
                hintFormula: 't_encuentro = (x_encuentro - x0_B) / v_B   ⇒   v_A = x_encuentro / t_encuentro',
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
