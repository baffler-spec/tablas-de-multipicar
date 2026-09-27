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

## 🎁 Recompensas y poderes

| Avance | Recompensa |
|---|---|
| Cada acierto | Monedas 🪙 y puntos (más si respondes rápido) |
| Racha de 5 | Un poder al azar |
| Racha de 8 | 🔥 **Modo fuego**: los puntos valen el doble |
| Ganar un nivel | 1 a 3 ⭐ según los errores, monedas extra y un sticker para el álbum |
| Juntar estrellas | Nuevos personajes (🐶 🐰 🦊 🐼 🐯 🦁 🦄 🐉) |
| Monedas | Gorros en la tienda (🧢 🎀 🥳 🎩 🎓 👑) y más poderes |
| Logros | 10 trofeos por descubrir |

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
js/data.js        Mundos, monstruos, personajes, gorros, poderes y trofeos
js/game.js        Lógica del juego, pantallas y guardado
```
