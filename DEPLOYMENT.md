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

La validación pública de GitHub Pages se realiza después del despliegue. El modelo continúa siendo didáctico; esta revisión no recalibra equipos ni reemplaza las hipótesis de cálculo existentes.
