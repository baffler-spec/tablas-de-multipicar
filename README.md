# 🦸 Héroes de las Tablas

Juego web para que niñas y niños de **6 a 10 años** aprendan las **tablas de multiplicar del 1 al 10**, con música rítmica, monstruos que vencer, recompensas y poderes.

## ▶️ Cómo jugar

No necesita instalación. Abre `index.html` en cualquier navegador moderno (computadora, tableta o celular).

También se puede publicar tal cual en GitHub Pages: *Settings → Pages → Deploy from branch*.

## 🎮 ¿Qué incluye?

- **Mapa de aventuras** con 10 mundos (uno por tabla) y un **jefe final**, el *Dragón Olvidón*, que mezcla todas las tablas. Cada mundo se abre al vencer el anterior.
- **Modo aprender:** antes de cada batalla se ve la tabla completa. Al tocar una operación aparece dibujada con puntitos (grupos), y con **🎤 Cantar con ritmo** la tabla se canta al compás de la música: una línea por compás.
- **Batallas:** cada respuesta correcta lanza una estrella al monstruo. Hay 3 corazones, 4 respuestas grandes y un reloj opcional. Si el niño se equivoca, se le muestra el resultado correcto y esa pregunta vuelve a salir más adelante para practicarla.
- **Música que reacciona:** la canción se genera en tiempo real con Web Audio. Mientras más larga es la racha de aciertos, más instrumentos se suman y más rápido va el ritmo. Los botones rebotan al compás.
- **Voz:** lee las preguntas y las respuestas correctas en español, lo que ayuda a quienes todavía leen despacio.

## 🏆 Finales y Nivel 2

- **Final del Nivel 1:** al vencer al *Dragón Olvidón* por primera vez aparece una escena especial: el dragón recuerda las tablas y se vuelve tu amigo 💖. Después hay fuegos artificiales, el título **Héroe de las Tablas** y un **diploma** con el nombre del niño que se puede imprimir. Como premio se desbloquean el personaje 🦸 Súper Héroe, la mascota 🐲 Dragón amigo, el aura 🌈 Arcoíris y el gorro 🏅 Medalla de héroe.
- **Nivel 2 · Modo Leyenda** 🌋 (se abre al terminar el Nivel 1):
  - ⏱️ Menos tiempo: 9 s en *Normal*, 6 s en *Rápido* y 20 s en *Sin prisa*.
  - ⚠️ Ataques sorpresa: el monstruo lanza preguntas de otras tablas.
  - 🧩 Nuevas formas de preguntar: `5 × ? = 25`, `? × 4 = 12` y *¿Qué multiplicación da 24?*
  - 💰 Premios dobles: más monedas y estrellas, un poder cada 4 aciertos seguidos y stickers dorados.
  - Con 5 tablas completadas se ganan el aura 🔥 Fuego y la mascota 🦄 Unicornio veloz.
- **Final del Nivel 2:** al vencer al *Rey Dragón Olvidón* 🐉 llega la celebración de **Leyenda de las Tablas**: 100 % del juego completado, un resumen de logros y un diploma dorado. Como premio se desbloquean 🧙 Gran Mago, 🐉 Dragón dorado, el aura ✨ Dorada y 🌟 Estrella legendaria.

## 🎁 Recompensas y poderes

| Avance | Recompensa |
|---|---|
| Cada acierto | Monedas 🪙 y puntos (más si respondes rápido) |
| Racha de 5 | Un poder al azar |
| Racha de 8 | 🔥 **Modo fuego**: los puntos valen el doble |
| Ganar un nivel | 1 a 3 ⭐ según los errores, monedas extra y un sticker para el álbum |
| Juntar estrellas | Nuevos personajes (🐶 🐰 🦊 🐼 🐯 🦁 🦄 🐉) |
| Monedas | Gorros, mascotas y auras en la tienda, y más poderes |
| Logros | 15 trofeos por descubrir |

**Poderes** (se desbloquean al completar tablas):

| Poder | Se desbloquea | Efecto |
|---|---|---|
| 💡 Pista | Desde el inicio | Muestra la multiplicación con puntitos y pausa el reloj |
| ✂️ 50/50 | 2 tablas | Quita dos respuestas incorrectas |
| ❄️ Congelar | 4 tablas | Detiene el reloj en esa pregunta |
| 🛡️ Escudo | 6 tablas | El siguiente error no quita corazón |

## ⚙️ Ajustes

- Música, efectos y voz se pueden activar o apagar por separado.
- Tiempo para responder: 🐢 *Sin prisa* (sin reloj, ideal para los más pequeños), 🐇 *Normal* (15 s) o 🚀 *Rápido* (8 s).
- El progreso se guarda automáticamente en el navegador.
- Se puede jugar con el teclado usando las teclas **1–4**.

## 🗂️ Estructura

```
index.html        Página principal
css/styles.css    Estilos y animaciones
js/sound.js       Música generativa, efectos de sonido y voz
js/data.js        Mundos, niveles, personajes, gorros, mascotas, auras, poderes y trofeos
js/game.js        Lógica del juego, pantallas y guardado
```
