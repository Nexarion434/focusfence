# Política de privacidad de FocusFence

_Fecha de entrada en vigor: 14 de noviembre de 2026_

_Esto es una traducción. En caso de discrepancia, prevalece la [versión en inglés](../privacy.html)._

FocusFence («la extensión») es una extensión de Chrome que bloquea las webs que eliges para que puedas concentrarte. Está diseñada para funcionar por completo en tu dispositivo. Esta política explica qué guarda la extensión, qué (muy poco) envía por la red y qué opciones tienes.

## En resumen

- **Sin cuenta, sin analíticas, sin rastreo, sin anuncios.** No tenemos ningún servidor y nunca recibimos tus datos.
- **Tu lista de bloqueo, tus ajustes y tus estadísticas se quedan en tu dispositivo**, en el almacenamiento local de extensiones de Chrome.
- **La extensión no lee el contenido de las páginas.** El bloqueo lo hace el motor `declarativeNetRequest` integrado en Chrome, que compara las direcciones con tu lista sin exponer tu navegación a la extensión.
- **La única comunicación de red es con ExtensionPay**, y solo si decides pasarte a Pro (detalles más abajo).

## Qué se guarda en tu dispositivo

| Dato | Para qué | Dónde |
|---|---|---|
| Tu lista de bloqueo (dominios, rutas, palabras clave) | Para bloquear esas webs | `chrome.storage.local` |
| Ajustes (encendido/apagado, horario, duración de las sesiones, mensaje de la página de bloqueo) | Para aplicar tus preferencias | `chrome.storage.local` |
| Temporizadores de las sesiones de concentración y del modo estricto | Para que las sesiones sigan tras reiniciar el navegador | `chrome.storage.local` |
| Número de intentos bloqueados por web bloqueada y por día (últimos 90 días) | Para mostrar tus estadísticas (intentos bloqueados hoy y esta semana) | `chrome.storage.local` |
| Bloqueo con contraseña: un hash PBKDF2-SHA-256 con sal (nunca la contraseña) | Para proteger tus ajustes | `chrome.storage.local` |
| Estado de tu licencia Pro (si Pro está activo, el plan y cuándo se comprobó por última vez) | Para desbloquear Pro, también sin conexión | `chrome.storage.local` |
| Indicador de «desbloqueado» durante 15 minutos tras introducir la contraseña | Comodidad | `chrome.storage.session` (se borra al cerrar el navegador) |
| Número de contraseñas incorrectas (para frenar los intentos) | Seguridad | `chrome.storage.session` (se borra al cerrar el navegador) |

Las estadísticas solo registran las visitas **bloqueadas**, etiquetadas con la regla que coincide (por ejemplo `reddit.com`). FocusFence no guarda un historial de las webs que visitas.

Puedes borrar las estadísticas cuando quieras (Ajustes → Estadísticas → Borrar estadísticas). Al desinstalar la extensión se eliminan todos los datos anteriores.

## Qué sale de tu dispositivo

**Nada, salvo que decidas pasarte a Pro.**

Los pagos los gestiona [ExtensionPay](https://extensionpay.com), un servicio de pagos para extensiones de navegador que usa Stripe para procesar las tarjetas. Cuando pulsas un botón para pasarte a Pro o para «restaurar la compra»:

1. La extensión pide a ExtensionPay un identificador aleatorio (una clave de API) para tu instalación y abre la página de pago de ExtensionPay en una pestaña nueva.
2. Introduces tus datos de pago y tu correo **directamente en las páginas de ExtensionPay/Stripe**. FocusFence nunca ve ni guarda los datos de tu tarjeta.
3. Después, la extensión envía periódicamente ese identificador a ExtensionPay (al iniciar el navegador, cada 12 horas aproximadamente y al abrir los ajustes) para comprobar si tu suscripción está activa. Nunca se envían datos de navegación, la lista de bloqueo ni las estadísticas.

En `chrome.storage.sync`, la biblioteca de ExtensionPay guarda el identificador, la fecha de instalación y la ficha que ExtensionPay devuelve para ese identificador: el estado de tu suscripción y tu plan y, una vez que hayas pagado, la fecha del pago y el correo electrónico con el que pagaste. Si tienes activada la sincronización de Chrome, Chrome sincroniza estos datos con tu cuenta de Google para que tu compra te acompañe en tus otros ordenadores.

Para los datos que facilites a ExtensionPay, su declaración de privacidad es la respuesta a «What about user privacy?» («¿Y la privacidad de los usuarios?») en las preguntas frecuentes de su página principal, en inglés: <https://extensionpay.com/>. ExtensionPay escribe allí que los usuarios son anónimos hasta que pagan y que no guarda ningún dato de tarjetas de crédito en sus servidores, porque de eso se encarga Stripe; que solo usa Google Analytics en el sitio extensionpay.com, no en las extensiones; que la única otra información identificativa que guarda es el correo electrónico del usuario, y que nunca vende ni cede ningún dato.

## Permisos y para qué se usan

- **storage**: guardar localmente tu lista, tus ajustes y tus estadísticas.
- **declarativeNetRequest**: permitir que Chrome bloquee o redirija la navegación a las webs de tu lista.
- **alarms**: hacer funcionar los horarios y los temporizadores de concentración y del modo estricto.
- **activeTab**: leer la dirección de la pestaña actual solo cuando abres la ventana de FocusFence, para que puedas bloquearla con un clic.
- **scripting**: para las reglas de ruta (p. ej. `youtube.com/shorts`), registrar un pequeño script solo en esa web para bloquear también la navegación interna. Solo comunica la dirección de la página a FocusFence; no lee ni modifica el contenido de la página.
- **Acceso opcional a webs**: se pide web a web, al añadir esa web, para que FocusFence muestre su página de bloqueo en lugar de la página de error de Chrome. Si lo rechazas, la web sigue bloqueada.
- **extensionpay.com**: el script de ExtensionPay solo se ejecuta en extensionpay.com para confirmar un pago completado.

## Menores

FocusFence no está dirigida a menores de 13 años y no recoge a sabiendas información personal de nadie.

## Venta y cesión de datos

No vendemos, alquilamos ni compartimos tus datos. No los usamos ni los transferimos para fines ajenos al propósito único de la extensión, ni los usamos para determinar solvencia o conceder préstamos.

## Código abierto

FocusFence es software libre bajo la GNU Affero General Public License v3 (o posterior). Puedes comprobar cada afirmación de esta política en el código fuente: <https://github.com/Nexarion434/focusfence>.

## Cambios

Si esta política cambia, la nueva versión se publicará en la misma dirección con una nueva fecha de entrada en vigor. Los cambios importantes se indicarán en las notas de versión de la extensión.

## Contacto

Preguntas sobre privacidad: **{{CONTACT}}**
