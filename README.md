# nacho-milano
### Cambiar fotos del perchero sin tocar el diseño

La portada usa una selección editable en `perchero.json`, no toda la grilla del catálogo. Cada entrada refiere al ID de la ficha y al nombre exacto de su color. Apuntá `frente` y `perfil` a dos WebP transparentes de **380 × 512 px**, con el mismo encuadre, escala y gancho alineado (centro horizontal, cerca del borde superior). Para que de verdad se vea el volumen, usá una toma de perfil con la prenda en la misma percha, no la foto frontal girada. Las fotos normales del catálogo y la ficha se administran por separado.

Después de cambiar archivos o referencias, ejecutá `node scripts/build-perchero.mjs` para actualizar el bloque de la portada, y `node scripts/build-perchero.mjs --check` para verificarlo. Incluí `index.html` en el mismo commit. No hace falta tocar la animación.
