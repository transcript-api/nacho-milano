# nacho-milano
### Cambiar fotos del perchero sin tocar el diseño

La portada usa una selección editable en `perchero.json`, no toda la grilla del catálogo. Cada entrada refiere al ID de la ficha y al nombre exacto de su color. Apuntá `frente` y `perfil` a dos WebP transparentes de **380 × 512 px**, con el mismo encuadre, escala y gancho alineado (centro horizontal, cerca del borde superior). Para que de verdad se vea el volumen, usá una toma de perfil con la prenda en la misma percha, no la foto frontal girada. Las fotos normales del catálogo y la ficha se administran por separado.

Después de cambiar archivos o referencias, ejecutá `node scripts/build-perchero.mjs` para actualizar el bloque de la portada, y `node scripts/build-perchero.mjs --check` para verificarlo. Incluí `index.html` en el mismo commit. No hace falta tocar la animación.

### Fotos de la ficha y probador

Cada color tiene su propio bloque `photos` en `catalogo-real.json`: frente, espalda (cuando hay una toma de referencia) y textura. Sin foto de un color se conserva el espacio pendiente, sin reciclar la de otro tono. Después de editar el catálogo, regenerá su espejo para el navegador: `node -e 'const fs=require("fs");fs.writeFileSync("catalogo-real.js","window.NM_DRAFT="+JSON.stringify(require("./catalogo-real.json"))+";\n")'`.

El probador de la portada carga alternativas verificadas por ID y color desde `probador.js`. Las prendas son dos placas fotográficas con encuadre común: torso y piernas. Si se suma otro color, verificá el calce en ambas placas y la compatibilidad con todas las combinaciones antes de publicarlo. Para cambiar una foto de ficha no hace falta regenerar las placas del probador.

### Idioma y selección publicada

`catalogo-real.json` contiene únicamente los modelos y variantes con fotos revisadas para esta colección. El nombre de color en los datos es su clave estable: la traducción de interfaz no modifica la clave usada por el enlace, la ficha o el carrito. El perchero puede mostrar varios colores del mismo modelo sin repetir una combinación.

El selector ES/PT mantiene la elección manual. En automático, la función Vercel `/api/market` usa el país aproximado de la conexión en Uruguay o Brasil; si no está disponible, la tienda sigue la preferencia de idioma del navegador y luego español. No solicita ubicación precisa. Tras editar HTML, corré `node scripts/instalar-idiomas.mjs .` y `node scripts/probar-idiomas.cjs .`.
