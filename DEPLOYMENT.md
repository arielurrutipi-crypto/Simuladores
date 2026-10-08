# Publicación

GitHub Pages: rama `main`, carpeta raíz `/`.

## Estructura

- `index.html`: portada y acceso a los simuladores.
- `erp-25-15/index.html`: simulador ERP 25/1,5.
- `erp-25-15/assets/`: módulos de simulación, geometría 3D procedural, curvas y librerías locales.
- `archive/ERP25_Rev32_original.zip`: copia exacta del HTML anterior a esta revisión.

## Revisión 33

Conserva el diseño Rev32. Cambios limitados a tres módulos:

- `erp-modes.js`: el escenario 12 reutiliza el perfil de reserva de los escenarios 03/11. R1 a 1,40 bar y R2 a 1,30 bar; aislamientos abiertos. Las consignas originales se restauran al salir. Las protecciones por máxima conservan su funcionamiento.
- `erp-ui.js`: mensajes y consignas visibles de escenario 12 coherentes con los estados calculados.
- `erp-scene.js`: caños de venteo incluidos en el modo de flujo interno, flechas ascendentes e intensidad dependiente de la descarga calculada; sin nubes exteriores. Cuerpos de alivio y demás equipos permanecen sólidos.

El motor de cálculo, curvas, disposición y restantes escenarios se conservan. Las dependencias de interfaz se sirven desde assets; no requiere backend, CDN ni archivos locales. `assets/dependencies.json` registra origen y huellas de las librerías incorporadas.

## Comprobación previa

- 13 escenarios no modificados: igualdad exacta frente a Rev32, muestreada cada 5 s hasta 1200 s.
- Escenario 12: reserva inicial disponible, disparo de fallas a los 4 s, balance de caudales y protecciones conservados. Con valores predeterminados, estabiliza aproximadamente en 2,89 bar y 100 Nm³/h de alivio total.
- Caudal de arranque limitado por la capacidad existente de 200 Nm³/h.
- Comprobados restauración de consignas, curvas (4 series de caudal y 5 de apertura), etiquetas, cámaras, transparencia sólo en cañerías y venteos sin animación a caudal nulo.
- Recursos relativos y revisión de patrones de credenciales/rutas locales completados.

## Validación pública — 8 de octubre de 2026

Publicación comprobada en:
- https://arielurrutipi-crypto.github.io/Simuladores/
- https://arielurrutipi-crypto.github.io/Simuladores/erp-25-15/

El despliegue de Pages del commit `c2f45d09faaee051b544473c6ca6f62b437d3c99` finalizó correctamente. Se corrigió la política CSP del HTML para permitir los scripts del propio sitio mediante `script-src 'self'`; el cálculo y el diseño no cambian.

- Portada y botón de acceso al ERP: carga y navegación correctas.
- HTML y 13 recursos JavaScript: respuesta HTTP 200, rutas relativas y contenido contrastado con los archivos publicados. Consultas sin cookies ni autenticación.
- Los 14 escenarios se seleccionaron e iniciaron desde la URL pública; curvas y valores respondieron.
- Iniciar, Pausar, avance +5 s, velocidad, zoom, rotación, cámaras y etiquetas comprobados.
- Modelo completo visible, junto a curvas de presión, cuatro series de caudal y cinco de apertura.
- Escenario 11: transferencia a R1 observada con salida de 1,40 bar y arranque sin caudal.
- Escenario 12: inicialmente R1 1,40/R2 1,30 bar con reserva disponible; estabilización observada en 2,89 bar, entrada 200 Nm³/h, salida a red 100 Nm³/h y alivio total 100 Nm³/h, sin crecimiento indefinido.
- Al volver a operación normal se restauraron R1 1,50/R2 1,30 bar; alivio 0 Nm³/h y entrada/salida 500 Nm³/h.
- Recarga directa de la URL pública: modelo, etiquetas y valores correctos; sin errores funcionales bloqueantes.

### Alcance y limitaciones

El navegador remoto de prueba no ofrece WebGL. Se comprobó el renderizador alternativo ya incluido: modelo, cámaras, rotación y controles operativos. La consola registra la indisponibilidad de WebGL al pasar a ese renderizador; no se verificó renderizado GPU en una computadora física.

Los recursos necesarios se alojan en este repositorio: no requiere backend, inicio de sesión, CDN ni archivos de la PC. Sólo necesita acceso a GitHub Pages. No se modificó ningún otro repositorio.

El modelo continúa siendo didáctico; esta publicación no recalibra equipos ni reemplaza las hipótesis de cálculo existentes.
