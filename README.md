# LogiExpres S.A.S. — sitio web y acceso empresarial

## Archivos
- `index.html`: sitio público corporativo.
- `login.html`: inicio de sesión con Firebase Authentication.
- `dashboard.html`: bienvenida y panel inicial con empresa, usuario y rol.
- `firebase-config.js`: configuración del proyecto Firebase.
- `auth.js` / `dashboard.js`: autenticación y consulta de perfil en Firestore.
- `firestore.rules`: reglas iniciales restrictivas de ejemplo.
- `assets/logo-logiexpres.png`: logo recortado conservando transparencia.

## Publicar en GitHub Pages
Sube el contenido de esta carpeta a la raíz del repositorio. En GitHub entra a Settings → Pages y selecciona la rama y carpeta que contiene `index.html`. Firebase Auth necesita que el dominio publicado esté autorizado en Firebase Console → Authentication → Settings → Authorized domains.

## Configurar Firebase
1. En Firebase Console crea un proyecto y registra una aplicación web.
2. Activa Authentication → Sign-in method → Email/Password.
3. Crea una base de datos Firestore.
4. Copia la configuración de la aplicación en `firebase-config.js`.
5. En Firestore crea `companies/{companyId}` con al menos `{ name: "LogiExpres S.A.S." }`.
6. Crea `users/{UID}` donde UID sea el UID exacto del usuario creado en Authentication. Ejemplo:
   `{ displayName: "Juan Carlos Julio", email: "correo@empresa.com", role: "Gerente general", companyId: "logiexpres", active: true }`
7. Publica las reglas iniciales de `firestore.rules` y revisa que el perfil del usuario y la empresa estén creados correctamente.

No existe registro público: el administrador crea los usuarios en Firebase Authentication y luego crea el perfil Firestore asociado al UID. No guardes contraseñas en Firestore.

## Importante sobre seguridad y producción
- La configuración web de Firebase identifica el proyecto; la seguridad real depende de Authentication y reglas de Firestore bien diseñadas.
- Las reglas incluidas son deliberadamente restrictivas y solo permiten leer el perfil propio y la empresa vinculada. Las colecciones operativas están cerradas hasta definir permisos por rol y empresa.
- Para producción, crea roles (admin, gerente, operaciones, comercial, cliente), valida permisos en reglas y, para acciones privilegiadas, usa Cloud Functions o backend confiable. No confíes solo en ocultar botones en el frontend.
- La hora de acceso mostrada es la hora local del navegador, no un registro auditado del servidor. Para auditoría real, registra eventos con backend/Cloud Functions y timestamps del servidor.
- Las imágenes del sitio se cargan desde Unsplash mediante URL, por lo que requieren conexión a internet. Sustitúyelas por fotografías propias o con licencia adecuada antes de la publicación comercial.
- El cotizador público abre WhatsApp con los datos; no guarda solicitudes en Firestore todavía.
- El logo original ya era PNG con transparencia. Se recortó al contenido visible para evitar márgenes sobrantes y se coloca sobre fondos claros para mantener contraste.
