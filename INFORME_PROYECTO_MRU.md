# INFORME TÉCNICO DE DESARROLLO
## ACTIVIDAD LIBRO FEST – FÍSICA BÁSICA
### Proyecto: Simulador Interactivo de Movimiento Rectilíneo Uniforme (MRU) y su Aplicación en Computación

---

### 1. Nombre del Proyecto
**Simulador Interactivo de Movimiento Rectilíneo Uniforme (MRU): Modelado Cinemático, Análisis Gráfico y Aplicaciones en Ciencias de la Computación.**

---

### 2. Integrantes del Equipo
- **Estudiante 1:** [Nombre y Apellidos] — *Rol: Modelado Matemático y Documentación*
- **Estudiante 2:** [Nombre y Apellidos] — *Rol: Desarrollo Frontend y Gráficas*
- **Estudiante 3:** [Nombre y Apellidos] — *Rol: Lógica del Motor Físico y Desafíos*
- **Carrera:** Ingeniería en Ciencias de la Computación / Sistemas
- **Materia:** Física Básica
- **Docente:** [Nombre del Docente]
- **Fecha:** Septiembre de 2026

---

### 3. Fenómeno Físico Estudiado
**Movimiento Rectilíneo Uniforme (MRU)**.
El MRU es el movimiento que realiza un cuerpo cuando su trayectoria es una línea recta en una dimensión espacial y su velocidad permanece constante a lo largo del tiempo ($\vec{v} = \text{constante}$), lo que implica de forma directa que la aceleración del sistema es nula ($\vec{a} = 0\text{ m/s}^2$).

---

### 4. Objetivo del Simulador
Desarrollar un recurso digital interactivo de alto impacto visual y pedagógico que permita:
1. Representar y manipular en tiempo real las variables fundamentales del MRU ($x_0$, $v$, $t$).
2. Comprender visualmente la relación entre las fórmulas cinemáticas y su representación gráfica vectorial y cartesiana ($x$ vs $t$, $v$ vs $t$).
3. Proporcionar a los visitantes del stand del **LibroFest** una experiencia interactiva mediante desafíos gamificados con retroalimentación inmediata.
4. Demostrar la vinculación directa e indispensable entre las leyes de la cinemática clásica y la arquitectura del software moderno, motores de videojuegos, renderizado y robótica.

---

### 5. Fundamentación Física

#### 5.1 Principio de Inercia (Primera Ley de Newton)
El MRU se fundamenta directamente en la Primera Ley de Newton:
> *"Todo cuerpo persevera en su estado de reposo o de movimiento rectilíneo uniforme a no ser que sea obligado a cambiar su estado por fuerzas netas aplicadas sobre él."*

$$\sum \vec{F} = 0 \iff \vec{a} = \frac{d\vec{v}}{dt} = 0 \iff \vec{v} = \text{constante}$$

En un medio ideal sin fuerzas de fricción o cuando las fuerzas aplicadas se cancelan mutuamente (equilibrio dinámico), un cuerpo recorre distancias iguales en intervalos de tiempo iguales.

#### 5.2 Interpretación Geométrica de las Gráficas
1. **Gráfica Posición vs Tiempo $x(t)$**:
   - Es una recta de ecuación $x(t) = v \cdot t + x_0$, análoga a la ecuación lineal $y = mx + b$.
   - **La pendiente ($m$) de la recta representa la velocidad ($v$)**:
     $$m = \frac{\Delta x}{\Delta t} = \frac{x_2 - x_1}{t_2 - t_1} = v$$
   - Si la pendiente es positiva ($m > 0$), el cuerpo avanza en sentido positivo.
   - Si la pendiente es negativa ($m < 0$), el cuerpo retrocede.
   - Si la recta es horizontal ($m = 0$), el cuerpo está en reposo.

2. **Gráfica Velocidad vs Tiempo $v(t)$**:
   - Es una línea recta completamente horizontal ($v = \text{constante}$).
   - **El área bajo la curva representa el desplazamiento ($\Delta x$)**:
     $$\text{Área} = \text{Base} \times \text{Altura} = (t_2 - t_1) \times v = \Delta x$$

#### 5.3 Situaciones en la Vida Cotidiana y la Tecnología
- **Cintas Transportadoras Industriales:** Utilizadas en aeropuertos y líneas de ensamble automatizado para mover paquetes con velocidad regulada y constante.
- **Trenes de Levitación Magnética (Maglev):** En tramos rectos de crucero, al no tener fricción mecánica con el riel, se desplazan a velocidad prácticamente constante.
- **Sondas Espaciales Interplanetarias (Voyager 1 y 2):** En el espacio interestelar profundo, lejos de la influencia gravitacional significativa de estrellas o planetas, viajan en MRU perpetuo sin consumir combustible.
- **Propagación de Señales Ópticas:** Los pulsos de luz láser a través de fibra óptica viajan en trayectorias rectilíneas guiadas a velocidad de propagación homogénea.

---

### 6. Variables Utilizadas

| Variable | Símbolo | Tipo | Unidad SI | Descripción | Rango en Simulador |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **Posición Inicial** | $x_0$ | Entrada | Metros ($\text{m}$) | Ubicación del móvil en el instante $t = 0\text{ s}$ | $-50\text{ m}$ a $+50\text{ m}$ |
| **Velocidad** | $v$ | Entrada | Metros por segundo ($\text{m/s}$) | Rapidez constante y sentido del movimiento | $-25\text{ m/s}$ a $+25\text{ m/s}$ |
| **Tiempo Máximo** | $t_{\text{max}}$ | Entrada | Segundos ($\text{s}$) | Límite temporal de la corrida de simulación | $3\text{ s}$ a $20\text{ s}$ |
| **Tiempo Actual** | $t$ | Estado | Segundos ($\text{s}$) | Tiempo transcurrido durante la simulación | $0\text{ s}$ a $t_{\text{max}}$ |
| **Posición Final/Actual** | $x(t)$ | Salida | Metros ($\text{m}$) | Coordenada espacial en el tiempo $t$ | Calculado en vivo |
| **Desplazamiento** | $\Delta x$ | Salida | Metros ($\text{m}$) | Cambio neto de posición ($\Delta x = x(t) - x_0$) | Calculado en vivo |
| **Distancia Recorrida** | $d$ | Salida | Metros ($\text{m}$) | Longitud total recorrida ($d = \|v\| \cdot t$) | Calculado en vivo |
| **Aceleración** | $a$ | Constante | $\text{m/s}^2$ | Tasa de cambio de la velocidad (siempre cero en MRU) | $0.00\text{ m/s}^2$ |

---

### 7. Ecuaciones Empleadas

1. **Ecuación Horaria de la Posición:**
   $$x(t) = x_0 + v \cdot t$$
   *Donde $x(t)$ es la posición en el tiempo $t$, $x_0$ es la posición de partida y $v$ es la velocidad constante.*

2. **Cálculo de la Velocidad Media e Instantánea:**
   $$v = \frac{\Delta x}{\Delta t} = \frac{x_f - x_0}{t_f - t_0}$$

3. **Desplazamiento Escalar:**
   $$\Delta x = x(t) - x_0 = v \cdot t$$

4. **Distancia Total Recorrida:**
   $$d = |v| \cdot t$$

5. **Punto de Encuentro entre Dos Cuerpos (Móvil A y Móvil B):**
   $$x_A(t) = x_B(t) \implies x_{0A} + v_A \cdot t = x_{0B} + v_B \cdot t$$
   $$t_{\text{encuentro}} = \frac{x_{0B} - x_{0A}}{v_A - v_B}$$
   $$x_{\text{encuentro}} = x_{0A} + v_A \cdot t_{\text{encuentro}}$$

---

### 8. Explicación del Funcionamiento del Simulador

El proyecto fue desarrollado como una Single-Page Application (SPA) web nativa basada en módulos JavaScript ES6, HTML5 Canvas 2D y CSS3:

1. **Módulo de Física (`physics.js`):**
   - Implementa la clase `PhysicsEngine`, encargada de calcular de forma determinista la posición analítica $x(t)$, desplazamiento, distancia y matrices de telemetría para 1 y 2 móviles simultáneos.
2. **Renderizador en Canvas 2D (`canvasRenderer.js`):**
   - Dibuja la pista milimetrada, marcas métricas adaptativas según el zoom, sprites vectoriales de vehículos personalizables (Auto deportivo, Rover marciano, Dron cyberpunk, Partícula cuántica), el vector dinámico de velocidad con flecha escalada y marcas de tiempo estroboscópicas.
3. **Motor de Gráficas Vectoriales (`charts.js`):**
   - Dibuja en tiempo real las gráficas cartesianas $x(t)$ y $v(t)$, trazando las pendientes, el área coloreada del desplazamiento y los ejes de coordenadas.
4. **Módulo de Desafíos Gamificados (`challenges.js`):**
   - Plantea misiones interactivas con cálculo de tolerancia ($\pm 3\text{ m}$), feedback auditivo con la *Web Audio API*, cálculo de porcentaje de acierto y desglose de la resolución matemática paso a paso.
5. **Controlador y UI (`app.js` y `style.css`):**
   - Administra el *Game Loop* sincronizado con la frecuencia de actualización del monitor mediante `requestAnimationFrame`, manejo de sliders, exportación de datos a `.CSV` y generación de código QR para teléfonos móviles.

---

### 9. Relación con la Carrera de Computación

La cinemática del MRU constituye uno de los pilares fundacionales en el desarrollo de software, gráficos por computadora y robótica:

#### A. Motores de Videojuegos y Game Loops
En motores como **Unity, Unreal Engine y Godot**, la simulación física se ejecuta en ciclos discretos. Para mover un personaje u objeto a velocidad constante $\vec{v}$ sin depender de la tasa de cuadros por segundo (FPS) del hardware, se aplica la integración de Euler del MRU:
```cpp
// En C++ / C# (Unreal Engine / Unity)
void Update(float deltaTime) {
    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;
}
```

#### B. Interpolación Lineal (LERP) en Animaciones y Gráficos 3D
La función `lerp(a, b, t)` utilizada en shaders, CSS transitions y cinemáticas de cámaras 3D es matemáticamente la ecuación de posición del MRU normalizada entre el tiempo $t \in [0, 1]$:
```javascript
function lerp(start, end, t) {
    return start + (end - start) * t; // Análogo a: x = x0 + v * t
}
```

#### C. Robótica Móvil y Odometría
Los robots de navegación autónoma estiman su posición global en el espacio (*dead reckoning*) integrando las lecturas continuas de velocidad provenientes de encoders de rueda en intervalos de tiempo regulares ($\Delta t$).

#### D. Redes de Computadoras y Simulación de Latencia
En arquitecturas cliente-servidor y telecomunicaciones, el modelado del retraso de propagación de paquetes a través de cables de fibra óptica se rige por $t_{\text{prop}} = \frac{d}{v_{\text{luz}}}$, permitiendo a los algoritmos de enrutamiento predecir el RTT (*Round Trip Time*).

---

### 10. Casos de Validación Teórica vs Simulador

#### Caso de Validación 1: Móvil con Velocidad Positiva
- **Datos:** $x_0 = -20\text{ m}$, $v = 15\text{ m/s}$, $t = 6\text{ s}$.
- **Cálculo Teórico Manual:**
  $$x(6) = -20 + (15)(6) = -20 + 90 = \mathbf{70.00\text{ m}}$$
  $$\Delta x = 70 - (-20) = \mathbf{90.00\text{ m}}$$
- **Resultado del Simulador:** $x = 70.00\text{ m}$, $\Delta x = 90.00\text{ m}$, $\text{Error} = 0.00\%$.

#### Caso de Validación 2: Móvil con Velocidad Negativa (Retroceso)
- **Datos:** $x_0 = 45\text{ m}$, $v = -8\text{ m/s}$, $t = 5\text{ s}$.
- **Cálculo Teórico Manual:**
  $$x(5) = 45 + (-8)(5) = 45 - 40 = \mathbf{5.00\text{ m}}$$
  $$\Delta x = 5 - 45 = \mathbf{-40.00\text{ m}},\quad d = |-8|(5) = \mathbf{40.00\text{ m}}$$
- **Resultado del Simulador:** $x = 5.00\text{ m}$, $\Delta x = -40.00\text{ m}$, $d = 40.00\text{ m}$, $\text{Error} = 0.00\%$.

#### Caso de Validación 3: Punto de Encuentro entre Dos Cuerpos
- **Datos:** Móvil A ($x_{0A} = 0\text{ m}$, $v_A = 15\text{ m/s}$), Móvil B ($x_{0B} = 150\text{ m}$, $v_B = -10\text{ m/s}$).
- **Cálculo Teórico Manual:**
  $$t_{\text{enc}} = \frac{150 - 0}{15 - (-10)} = \frac{150}{25} = \mathbf{6.00\text{ s}}$$
  $$x_{\text{enc}} = 0 + (15)(6) = \mathbf{90.00\text{ m}}$$
- **Resultado del Simulador:** Al tiempo $t = 6.00\text{ s}$, Móvil A se ubica en $90.00\text{ m}$ y Móvil B en $90.00\text{ m}$, coincidiendo con exactitud absoluta.

---

### 11. Registro del Uso de Inteligencia Artificial
*Sección incluida en cumplimiento de la política académica de transparencia en IA.*

1. **Herramienta Utilizada:** Google Gemini / Antigravity Assistant.
2. **¿Para qué se utilizó?:**
   - Como asistente de pair-programming para estructurar la plantilla de arquitectura modular en JavaScript, maquetar la interfaz gráfica en CSS Glassmorphism y refinar la redacción técnica del informe.
3. **¿Qué instrucciones o prompts fueron utilizados?:**
   - *"Ayúdame a desarrollar el proyecto interactivo para LibroFest sobre MRU cumpliendo todos los puntos de la rúbrica (simulador web, gráficas en tiempo real, vectores, desafíos gamificados, relación con computación y código QR)."*
4. **¿Qué elementos generados por IA fueron modificados?:**
   - Se ajustaron las tolerancias de los desafíos gamificados para hacer la experiencia más justa y didáctica para los visitantes del stand.
   - Se calibró la escala gráfica de píxeles por metro y el contraste de colores para garantizar una legibilidad óptima en proyectores y pantallas móviles.
5. **¿Qué errores se encontraron y cómo se corrigieron?:**
   - Se detectó que el redimensionamiento del canvas causaba deformación en pantallas con alta densidad de píxeles (Retina display); se corrigió multiplicando por `window.devicePixelRatio`.
6. **¿Qué parte del proyecto desarrollaron directamente los estudiantes?:**
   - La formulación matemática de los casos de prueba, la definición pedagógica de los desafíos, la verificación de cada ecuación física y la preparación del stand para la jornada del LibroFest.

---

### 12. Conclusiones
1. **Efectividad Didáctica:** La simulación visual interactiva facilita la comprensión intuitiva de conceptos abstractos como la velocidad como pendiente ($m=v$) y el desplazamiento como área bajo la curva.
2. **Validación del Modelo:** Se demostró que las ecuaciones analíticas de la cinemática clásica del MRU se corresponden con un 100% de precisión frente a la discretización numérica en computación.
3. **Relevancia Profesional:** El estudio del MRU trasciende la física teórica y constituye el bloque básico de construcción para cualquier profesional de la computación que desarrolle videojuegos, simuladores científicos o sistemas embebidos de robótica.

---

### Acceso al Proyecto
- **Ejecución Local:** Abrir directamente el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Firefox, Safari, Edge) o mediante servidor local.
- **Acceso Móvil:** Disponible a través del modal interactivo con código QR integrado en el encabezado de la aplicación.
