// ============================================================
//  CONFIGURACIÓN — CATÁLOGO AL HARAMAIN
// ============================================================

const CONFIG = {
  EMPRESA: "ImpoHogar",

  // ---- STOCK EN VIVO (Supabase) ----
  // Ya vienen precargadas tus llaves PÚBLICAS (las mismas del catálogo
  // de perfumería). El stock se lee por código de barras de la tabla
  // 'productos', que tu sincronización de cada 5 min ya actualiza.
  SUPABASE_URL: "https://wzntsmbnsiafebfojaww.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_5eCDbAxlk-Q6nreXo0dhgQ_Gjq7pY0s",
  STOCK_TABLE: "productos",
  STOCK_REFRESH_MS: 300000, // 5 minutos

  // ---- VENDEDORES ----
  // El cliente elige uno al final para mandarle el pedido por WhatsApp.
  // Poné el número en formato internacional sin "+" (ej: 50688889999).
  // Sin número, igual aparece el vendedor pero sin abrir WhatsApp.
  VENDEDORES: [
    { nombre: "Pedro",    whatsapp: "" },
    { nombre: "Roy",      whatsapp: "" },
    { nombre: "Maricela", whatsapp: "" },
    { nombre: "Wendy",    whatsapp: "" },
    { nombre: "Raquel",   whatsapp: "" },
    { nombre: "Lohana",   whatsapp: "" },
    { nombre: "Jenny",    whatsapp: "" },
    { nombre: "Ingrid",   whatsapp: "" },
    { nombre: "Nicole",   whatsapp: "" }
  ],

  // Subí esta fecha cuando reemplaces fotos, para que no queden en caché.
  IMG_VERSION: "20261125"
};
