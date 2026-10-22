# Simuladores
Simuladores de funcionamiento didáctico de instalaciones 


## City Gate · Reflujo, medidor y RTU

Disponible en [city-gate-reflujo/](https://arielurrutipi-crypto.github.io/Simuladores/city-gate-reflujo/). HTML autónomo con Plotly incorporado. Simula el inventario finito entre reguladores cerrados y medidor, con metano puro y volumen de equipos editable.

El esquema 2D representa un Instromet IRM-S-HP G160, acondicionador TURCK y RTU ControlWave EFM-2 con entrada HSC_1. Se adopta expresamente la hipótesis de pulsos contados positivos en ambos sentidos; no acredita la programación del equipo instalado. Kp demostrativo editable: 1000 pulsos/m³ reales. La equivalencia en Sm³ integra las condiciones P/T/Z del medidor y conserva fracciones de pulso. Giro y destellos a escala visual.

Herramienta didáctica y conceptual, con simplificaciones; no representa íntegramente la instalación ni constituye un sistema de medición operativo.

## Tormene TA956 DFO · Regulador y pilotaje

[Simulador TA956 DFO](https://arielurrutipi-crypto.github.io/Simuladores/ta956-dfo/) · Rev15 (22/10/2026).

HTML autónomo con Three.js, renderizador alternativo y referencias gráficas incorporados. Cuatro escenarios guiados con consigna de salida 1,5 bar(g), pausa, pasos, cámara lenta y zoom. Conserva Cg 860 y C1 28.

La reconstrucción es didáctica, no un CAD de fabricación: perfiles, espesores y trama J200 son aproximados; los internos específicos del TA984 requieren documentación adicional. Incluye comparación con el corte original Tormene y trazabilidad documental. No constituye una herramienta operativa.
