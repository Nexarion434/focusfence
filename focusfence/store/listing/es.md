# FocusFence: ficha de Chrome Web Store, español

> Instrucciones campo por campo: [`../SUBMISSION.md`](../SUBMISSION.md). El texto de un bloque de código se pega tal cual.
> El nombre y el resumen se leen del paquete (`src/_locales/es/messages.json`): aparecen aquí para revisarlos, no se escriben en el panel.
> En el panel, elige **Español** en el selector de idioma de la pestaña de la ficha, pega la descripción y sube las capturas de [`../assets/es/`](../assets/es/).
> La pestaña de privacidad (propósito único, permisos, datos) existe una sola vez y se rellena en inglés, desde [`en.md`](en.md). Las traducciones de abajo son solo de referencia.

## Nombre (del paquete, 61 de 75 caracteres)

FocusFence – App de concentración y bloqueador de páginas web

## Resumen (del paquete, 129 de 132 caracteres)

Concéntrate: bloquea gratis y sin límite las páginas web que te distraen. Pro añade sesiones de concentración y el modo estricto.

## Categoría

Productividad › **Workflow & Planning** (la misma para todos los idiomas: ver [`en.md`](en.md)).

## Descripción detallada

```
Concéntrate en Chrome. FocusFence bloquea las páginas web que abres sin pensar, como una red social o una web de noticias, y en su lugar muestra una página de bloqueo tranquila. El plan gratuito bloquea todas las webs que quieras, durante todo el tiempo que lo uses. Pro añade sesiones de concentración, horarios, el modo estricto y el bloqueo de los Shorts de YouTube.

Gratis, para todas las webs que quieras
• Abre la ventana de FocusFence en una web y pulsa «Bloquear web», o escribe una dirección en la ventana o en los ajustes.
• Bloquear reddit.com también bloquea old.reddit.com, m.reddit.com y cualquier otro subdominio.
• Un interruptor quita el bloqueo durante un descanso y lo vuelve a poner después.
• Una web bloqueada muestra una página tranquila, con una cita y tus intentos bloqueados de hoy y de esta semana.

FocusFence Pro: 2,99 US$ al mes o 19,99 US$ al año (en la zona euro, 2,99 € o 19,99 €)
• Sesiones de concentración: rondas Pomodoro de 25 minutos de concentración y 5 de descanso, cuatro veces por defecto, y puedes cambiarlo todo. Toda tu lista queda bloqueada mientras te concentras, y los minutos que quedan aparecen en el icono de la barra de herramientas.
• Horarios: bloquea solo en las horas y los días que elijas. También funcionan los tramos nocturnos, como 22:00–06:00.
• Modo estricto para cuando falla la fuerza de voluntad: elige una duración de 1 hora a 1 semana, o hasta que lo desbloquees. Hasta entonces, no se puede quitar el bloqueo ni borrar webs. Para terminarlo antes, hay que esperar 10 minutos y volver a escribir ocho palabras al azar.
• Bloquea los Shorts y conserva YouTube: una regla de ruta como youtube.com/shorts bloquea solo esa sección, también los Shorts que abras desde dentro de YouTube.
• Las reglas por palabra clave bloquean cualquier dirección que contenga la palabra que elijas.
• Bloqueo con contraseña: quitar el bloqueo, borrar webs o cambiar ajustes pide una contraseña, que otra persona puede guardar por ti.
• Estadísticas: intentos bloqueados por día y por web en los últimos 7 días.
• Tu propio mensaje en la página de bloqueo, y exportar o importar tus ajustes en un archivo JSON.

¿FocusFence ayuda con el TDAH?
FocusFence no es una herramienta médica ni un tratamiento. Puede hacer tu navegador más adaptado al TDAH al poner un obstáculo entre el impulso y el feed. Las webs de tu lista siguen cerradas hasta que quites el bloqueo. Con Pro, el modo estricto exige esperar 10 minutos y volver a escribir ocho palabras antes de poder quitarlo, las sesiones de concentración dividen tu trabajo en rondas Pomodoro y los horarios activan el bloqueo a las horas que elijas.

Privacidad desde el diseño
• Funciona sin cuenta. Tu lista, tus ajustes y tus estadísticas se quedan en Chrome, en tu ordenador.
• El bloqueo lo hace el motor de reglas integrado en Chrome (declarativeNetRequest), así que FocusFence nunca lee las páginas que visitas.
• El acceso a las webs se pide de una en una, solo para las que bloqueas. Si lo rechazas, la web sigue bloqueada, con la página de error de Chrome en lugar de la de FocusFence.
• FocusFence no contiene código de analítica ni de publicidad. Su único tráfico de red es ExtensionPay comprobando tu licencia Pro, después de que decidas pasarte a Pro.
• Código abierto con licencia GNU AGPL v3. Disponible en español, inglés, francés y alemán.

Conviene saber
• FocusFence no toca los anuncios. Solo bloquea lo que está en tu lista, y todas las demás webs cargan igual que antes.
• Chrome siempre permite desactivar o quitar una extensión, y ninguna extensión puede bloquear la página de extensiones. Una sesión estricta con tiempo se pausa mientras FocusFence está desactivado, así que su tiempo no corre en segundo plano.
• Las ventanas de incógnito solo están cubiertas si permites FocusFence en incógnito, y FocusFence te avisa cuando no lo está.
• Otros navegadores, perfiles de Chrome y dispositivos no están cubiertos.

Para empezar
1. Fija FocusFence en la barra de herramientas.
2. Al instalarlo, elige hasta tres webs que bloquear. Añade más después desde la ventana o los ajustes.
3. Permite el acceso cuando Chrome lo pida, para que FocusFence muestre su página de bloqueo.
4. Con Pro, define tus horas de concentración, empieza una sesión o activa el modo estricto antes de una entrega.

Pagos procesados por ExtensionPay (Stripe), sin cuenta de FocusFence.
Web: https://focusfence.dev/es/
Política de privacidad: https://focusfence.dev/es/privacy.html
Soporte: contact@focusfence.dev
Código fuente: https://github.com/Nexarion434/focusfence
```

## Propósito único (se rellena en inglés: ver en.md)

```
FocusFence es una herramienta de concentración con un único propósito: ayudar al usuario a concentrarse bloqueando las webs, o partes de webs, que él elige. Todas las funciones (la página de bloqueo, los horarios, las sesiones de concentración Pomodoro, el modo estricto, el bloqueo con contraseña y las estadísticas de intentos bloqueados) deciden cuándo y cómo se bloquean esas webs elegidas por el usuario.
```

## Justificación de permisos (se rellena en inglés: ver en.md)

Una casilla por permiso. El manifiesto pide `storage`, `declarativeNetRequest`, `alarms`, `activeTab` y `scripting`, un permiso de host opcional (`*://*/*`) y un script de contenido (en `https://extensionpay.com/*`).

**storage**
```
Guarda la lista de bloqueo, los ajustes, los temporizadores de las sesiones de concentración y del modo estricto, los recuentos de intentos bloqueados que muestran las estadísticas (90 días) y, si el usuario la define, el hash con sal de la contraseña de los ajustes. Todo se queda en el almacenamiento de Chrome, en el dispositivo. La biblioteca de pagos ExtensionPay incluida guarda también allí la ficha de la licencia Pro.
```

**declarativeNetRequest**
```
Función principal. FocusFence convierte la lista de bloqueo en reglas dinámicas. Chrome bloquea entonces las navegaciones a esas webs, o las redirige a la página de bloqueo de FocusFence. Chrome evalúa las reglas él mismo, así que la extensión nunca ve el tráfico del usuario.
```

**alarms**
```
Despierta el service worker cada minuto para activar o quitar el bloqueo en los límites del horario, actualizar la cuenta atrás del icono y pausar un modo estricto con tiempo mientras la extensión no estaba activa; al final de cada periodo de concentración o descanso Pomodoro; cuando termina un modo estricto con tiempo; y cada 12 horas para actualizar el estado de la licencia Pro.
```

**activeTab**
```
Cuando el usuario abre la ventana de la extensión, FocusFence lee la dirección de la pestaña activa para mostrar la web y bloquearla con un clic, y luego recarga esa pestaña para aplicar el bloqueo. Nunca accede a otras pestañas.
```

**scripting**
```
Solo se usa para las reglas de ruta Pro (como youtube.com/shorts), y solo en las webs a las que el usuario dio acceso. FocusFence registra en ellas un pequeño script de contenido, spa-guard.js. Las aplicaciones de una sola página cambian de dirección sin una navegación real, que declarativeNetRequest no ve: el script solo lee la dirección de la página, avisa de sus cambios al service worker y envía la pestaña a la página de bloqueo cuando la dirección coincide con una regla. Nunca lee ni cambia el contenido de las páginas.
```

**Host permissions** (permisos de acceso a webs)
```
El permiso de host opcional *://*/* nunca se pide al instalar. Cuando el usuario añade una web a su lista, FocusFence pide acceso solo a esa web (por ejemplo *://reddit.com/* y *://*.reddit.com/*), porque Chrome solo permite redirigir a la página de bloqueo en las webs a las que la extensión tiene acceso. Si el usuario lo rechaza, la web sigue bloqueada, con la página de error de Chrome. El acceso a todas las webs solo se pide si el usuario quiere que las reglas por palabra clave muestren la página de bloqueo. El script de contenido en https://extensionpay.com/* forma parte de la biblioteca de pagos ExtensionPay: en las páginas de pago de ExtensionPay avisa a la extensión de que el pago se completó, para desbloquear Pro enseguida. No se ejecuta en ninguna otra web.
```

## Código remoto

Responde «No» (**No, I am not using remote code**). Todo el JavaScript va en el paquete, sin minificar, incluida la biblioteca ExtensionPay (copia sin cambios de extpay 3.1.2). Sin `eval` ni scripts alojados fuera; las únicas peticiones de red van a extensionpay.com para comprobar la licencia Pro.

## Uso de datos (se marca una sola vez: ver en.md)

Google pide declarar los datos que se tratan «incluso cuando se procesan o almacenan localmente en el dispositivo del usuario y no se transmiten a servidores externos ni a terceros» ([FAQ de datos de usuario](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), pregunta 3). Cada respuesta coincide con la [política de privacidad](https://focusfence.dev/es/privacy.html).

| Categoría del panel | Marcar | Lo que trata FocusFence |
|---|---|---|
| Información personal identificable | **Sí** | Solo compradores de Pro: el correo electrónico con el que pagaron. ExtensionPay lo devuelve con la ficha de la licencia y su biblioteca lo guarda en el almacenamiento de Chrome (`chrome.storage.sync`). FocusFence no lo envía a ningún sitio. |
| Información de salud | No | Nada. |
| Información financiera y de pago | **Sí** | Solo compradores de Pro: estado de la suscripción, plan y fecha de pago, devueltos por ExtensionPay. Los datos de la tarjeta se escriben en la página de pago de Stripe y nunca llegan a la extensión. |
| Información de autenticación | **Sí** | El bloqueo opcional con contraseña: la contraseña se convierte en un hash PBKDF2 con sal en el dispositivo y solo se guarda el hash. También la clave de licencia aleatoria que ExtensionPay asigna a la instalación. |
| Comunicaciones personales | No | Nada. |
| Ubicación | No | No se lee ninguna ubicación. La región del ajuste de idioma del navegador (por ejemplo es-ES) solo elige precios en euros o en dólares. |
| Historial web | **Sí** | Recuentos de intentos bloqueados por web bloqueada y por día, guardados 90 días en el dispositivo para las estadísticas; la dirección de la pestaña activa al abrir la ventana; en las webs con una regla de ruta, la dirección de la página, comparada con la lista. No se envía nada. |
| Actividad del usuario | No | No se registran clics, pulsaciones, movimientos del ratón ni tráfico de red. |
| Contenido de sitios web | No | Nunca se lee el contenido de las páginas. |

Hay que marcar los tres compromisos:

- No vendo ni transfiero datos de usuario a terceros, fuera de los casos de uso aprobados
- No uso ni transfiero datos de usuario para fines ajenos al propósito único de mi elemento
- No uso ni transfiero datos de usuario para determinar la solvencia crediticia ni para préstamos

## Política de privacidad

Campo del panel (una sola dirección): `https://focusfence.dev/privacy.html`. Versión en español: `https://focusfence.dev/es/privacy.html` (citada en la descripción).

## Enlaces y contacto

| Campo | Valor |
|---|---|
| URL de la página principal | `https://focusfence.dev/` (la descripción cita `https://focusfence.dev/es/`) |
| URL de asistencia | `https://focusfence.dev/#faq` |
| Correo de asistencia | `contact@focusfence.dev` |

## Capturas de pantalla

En este orden, desde [`../assets/es/`](../assets/es/):

1. `1-block-page.png`: Ponle una valla a las distracciones.
2. `2-popup.png`: Bloquea la web en la que estás.
3. `3-focus-session.png`: Trabaja por rondas. (Pro)
4. `4-strict-mode.png`: Ciérralo con llave antes de una entrega. (Pro)
5. `5-blocklist.png`: Bloquea la web entera. O solo la parte mala.

El icono, el mosaico pequeño y el banner no se traducen: son los mismos archivos que en inglés.

## Notas de posicionamiento (español)

- El nombre usa «bloqueador de páginas web»: es lo que se busca («bloquear páginas web en chrome», «extensión para bloquear páginas web»); «bloqueador de webs» casi no aparece en las sugerencias de Google (`COPY_CHANGES.md`).
- El resto del texto mantiene el *tú* y «webs», como el sitio.
- La descripción nunca presenta FocusFence como un bloqueador de anuncios: «Conviene saber» dice que no toca los anuncios, como la FAQ del sitio.
