SAES — Demo SPA (puro HTML/CSS/JS)

Descripción:
Este directorio contiene una SPA estática de demostración (sin backend C#) que implementa un prototipo del portal estudiantil (SAES). Los datos se almacenan en `localStorage` mediante un mock API.

Cómo ejecutar:
1. Abrir `saes/index.html` en el navegador (doble clic). No requiere servidor.
2. Cuentas de prueba (demo):
   - Alumno: matricula `A12345`, contraseña `12345`
   - Profesor: id `100`, contraseña `101`

Archivos clave:
- `index.html` — estructura de la SPA
- `css/design-tokens.css` y `css/styles.css` — estilos
- `js/api-mock.js` — mock API que usa `localStorage` y contiene seed data
- `js/app.js` — lógica del cliente (login, render, export CSV, generación de PDFs)

Generación de PDF (cliente):
- Esta demo usa jsPDF (CDN) para generar PDFs en el navegador.
- Botones: "Descargar Tira (PDF)" y "Exportar movimientos" generan y descargan PDFs.
- No requiere instalación — el script jsPDF se incluye desde CDN en `index.html`.

-- Añadir más vistas (inscripciones, trámites, horario interactivo)
-- Reemplazar mock API por servidor real cuando decidas mantener backend
-- Generar PDFs (tiras/comprobantes) con una librería cliente o servicio

Siguientes pasos recomendados:
-- Añadir más vistas (inscripciones, trámites, horario interactivo)
-- Reemplazar mock API por servidor real cuando decidas mantener backend
-- Mejorar los PDFs (estilos, logos, cabeceras) y generar comprobantes con más metadatos
-- Añadir más vistas (inscripciones, trámites, horario interactivo)
-- Reemplazar mock API por servidor real cuando decidas mantener backend
-- Generar PDFs (tiras/comprobantes) con una librería cliente o servicio

Notas:
-- Esta demo se implementó según tu solicitud: "desde cero" con HTML/CSS/JS sin C#.
SAES — Demo SPA (puro HTML/CSS/JS)

Descripción:
Este directorio contiene una SPA estática de demostración (sin backend C#) que implementa un prototipo del portal estudiantil (SAES). Los datos se almacenan en `localStorage` mediante un mock API.

Cómo ejecutar:
1. Abrir `saes/index.html` en el navegador (doble clic). No requiere servidor.
2. Cuentas de prueba (demo):
   - Alumno: matricula `A12345`, contraseña `12345`
   - Profesor: id `100`, contraseña `101`

Archivos clave:
- `index.html` — estructura de la SPA
- `css/design-tokens.css` y `css/styles.css` — estilos
- `js/api-mock.js` — mock API que usa `localStorage` y contiene seed data
- `js/app.js` — lógica del cliente (login, render, export CSV, generación de PDFs)

Generación de PDF (cliente):
- Esta demo usa jsPDF (CDN) para generar PDFs en el navegador.
- Botones: "Descargar Tira (PDF)" y "Exportar movimientos" generan y descargan PDFs.
- No requiere instalación — el script jsPDF se incluye desde CDN en `index.html`.

- Añadir más vistas (inscripciones, trámites, horario interactivo)
- Reemplazar mock API por servidor real cuando decidas mantener backend
- Generar PDFs (tiras/comprobantes) con una librería cliente o servicio
Siguientes pasos recomendados:
- Añadir más vistas (inscripciones, trámites, horario interactivo)
- Reemplazar mock API por servidor real cuando decidas mantener backend
- Mejorar los PDFs (estilos, logos, cabeceras) y generar comprobantes con más metadatos
- Añadir más vistas (inscripciones, trámites, horario interactivo)
- Reemplazar mock API por servidor real cuando decidas mantener backend
- Generar PDFs (tiras/comprobantes) con una librería cliente o servicio

Notas:
- Esta demo se implementó según tu solicitud: "desde cero" con HTML/CSS/JS sin C#.
