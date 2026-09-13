# 🚀 Simulador Interactivo MRU - LibroFest 2026
> **Física Básica & Ciencias de la Computación**

Recurso digital interactivo desarrollado para la feria académica **LibroFest**, enfocado en el modelado del **Movimiento Rectilíneo Uniforme (MRU)** y su relación con el desarrollo de software, videojuegos y robótica.

---

## 🌟 Características Principales

- **🎮 Simulación en Tiempo Real (Canvas 2D):**
  - Pista graduada milimétricamente con marcas dinámicas.
  - Selección de 4 vehículos/móviles: *Auto Deportivo, Rover Marciano, Dron Autónomo y Partícula Cuántica*.
  - Vector de velocidad dinámico ($\vec{v}$) con magnitud y sentido en tiempo real.
  - Marcas estroboscópicas de tiempo ($t$).
- **📈 Gráficas Sincronizadas en Vivo:**
  - Gráfica $x(t)$ (Posición vs Tiempo) con cálculo visual de la **pendiente ($m = v$)**.
  - Gráfica $v(t)$ (Velocidad vs Tiempo) con **área sombreada bajo la curva ($\text{Área} = \Delta x$)**.
- **📊 Telemetría y Exportación:**
  - Panel HUD con resultados físicos en tiempo real ($x, \Delta x, d, v, a$).
  - Tabla de datos discreta segundo a segundo.
  - **Botón de exportación a archivo `.CSV`** para análisis en Excel.
- **🎯 Modo Desafíos Gamificados (Para el Stand del LibroFest):**
  - 3 niveles interactivos de dificultad progresiva con cálculo de tolerancias, puntuación, efectos de sonido (Web Audio API) y resolución matemática paso a paso.
- **📱 Código QR Integrado:**
  - Generador de QR directo para que cualquier visitante o docente abra el simulador en su smartphone en segundos.
- **💻 Sección Pedagógica de Computación:**
  - Explicación de *Game Loops* (`position += velocity * dt`), interpolación lineal (*Lerp*), odometría robótica y latencia de redes.

---

## 📂 Estructura del Proyecto

```
MRU/
├── index.html              # Interfaz principal completa con pestañas
├── css/
│   └── style.css           # Estilos Glassmorphism Cyberpunk responsivos
├── js/
│   ├── physics.js          # Motor matemático de física pura para MRU
│   ├── canvasRenderer.js   # Renderizador en Canvas 2D de pista, vehículos y vectores
│   ├── charts.js           # Generación de gráficas vectoriales x(t) y v(t)
│   ├── challenges.js       # Sistema de desafíos interactivos con tolerancias y puntuación
│   └── app.js              # Controlador principal y gestión de eventos
├── INFORME_PROYECTO_MRU.md # Informe técnico formal según los 12 puntos de la rúbrica
└── README.md               # Guía rápida del proyecto
```

---

## 🖥️ ¿Cómo Ejecutar el Proyecto?

1. **Opción 1 (Directa):**
   - Haz doble clic sobre el archivo `index.html` para abrirlo en tu navegador web preferido (Chrome, Edge, Firefox, Brave, Safari).

2. **Opción 2 (Servidor Local con VS Code / Node):**
   - Si utilizas la extensión *Live Server* en VS Code, haz clic derecho en `index.html` $\rightarrow$ **Open with Live Server**.
   - O mediante terminal con `npx serve .`

---

## 📄 Informe para el Docente
El documento formal con los 12 puntos obligatorios de la rúbrica se encuentra listo en [INFORME_PROYECTO_MRU.md](file:///c:/Users/esteb/OneDrive/Desktop/MRU/INFORME_PROYECTO_MRU.md).
