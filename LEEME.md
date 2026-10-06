# JD-Software: diagnóstico CRM

- `public/index.html`: el sitio (portada, diagnóstico, resumen y reunión).
- `api/diagnostico.js`: recibe el diagnóstico y lo envía por correo.

## Publicar en Vercel

1. Suba esta carpeta a un repositorio de GitHub e impórtelo en Vercel (preset "Other", sin comando de build).
2. En Google: active la verificación en dos pasos y cree una contraseña de aplicación.
3. En Vercel, Settings > Environment Variables:
   - `GMAIL_USER`: su dirección de Gmail
   - `GMAIL_APP_PASSWORD`: la contraseña de aplicación de 16 caracteres
   - `DESTINO` (opcional): otra dirección que deba recibir los diagnósticos
4. Vuelva a desplegar para que tome las variables y haga un envío de prueba.

Si el correo no llega, revise Logs de la función en Vercel.
