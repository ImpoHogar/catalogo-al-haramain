# Catálogo Al Haramain — ImpoHogar

Catálogo web de pedido de la marca Al Haramain. Mismo diseño y formato de Excel
que el catálogo grande de perfumería. Estático (GitHub Pages), con stock en vivo
leído de Supabase cada 5 minutos.

## Archivos
- index.html
- css/styles.css   (la MISMA hoja de estilos del catálogo de perfumería)
- css/haramain.css  (ajustes propios: precio, logo de texto)
- js/config.js      (vendedores + llaves públicas de Supabase ya precargadas)
- js/products.js    (los 25 productos con sus precios)
- js/app.js         (lógica: grid, carrito, pedido en Excel, vendedor, stock)
- img/              (fotos opcionales: p<código>.webp)

## Stock
Ya viene conectado (llaves públicas de Supabase precargadas en config.js). El
stock se lee por código de barras de la tabla 'productos' cada 5 minutos.

## Fotos
Subí cada foto a img/ como p<código de barras>.webp (ej: p6291100136605.webp) y
poné img:true en ese producto dentro de js/products.js.

## WhatsApp por vendedor
En js/config.js, poné el número de cada vendedor en "whatsapp" (formato
internacional sin +, ej: 50688889999).

## Publicar
Subí esta carpeta a un repo nuevo → Settings → Pages → rama main → Save.
