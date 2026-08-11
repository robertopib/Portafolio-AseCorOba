# R23 — Client worksheet: who was each image made for?

> **Status: waiting on the owner. Nothing has been changed.** This file is the human decision
> gate that **R23a-ii** exists to produce and **R23b** will execute. Design rationale lives in
> [r23-target-model.md](r23-target-model.md); the original problem statement is
> [analysis-projects-vs-photos.md](analysis-projects-vs-photos.md).
>
> **Generated from committed content on 2026-08-10** — see
> [§5](#5-cómo-regenerar-el-inventario) for the exact script. No database, no network.
>
> ### ⚠️ This file replaces R23a's backfill mapping, and the reason matters
>
> R23a proposed a project for all 57 rows by **grouping on the text before the first `" - "`**.
> The owner reviewed it and corrected the model, and in doing so proved the method wrong:
> `Crackers D'Argent` and `Pan D'Argent` name the client, but **`Croissant Artesanal` and
> `Croissant Premium` carry no client marker at all — yet all four are D'Argent's.** Prefix
> grouping produces the wrong answer *exactly where the owner corrected it*.
>
> **So this is a worksheet you fill in, not a mapping you correct.** A client is pre-filled
> **only** where the string itself names one. Everywhere else the cell is **blank on purpose**
> — a plausible wrong guess is much harder to spot than an obvious gap, and a plausible wrong
> guess is what went wrong last time. **22 of 40 pre-filled, 18 blank** ([§3](#3-el-recuento)).

---

## 0. Esto es lo que necesito de ti

**Rellena la columna `CLIENTE` en las tablas B. Son 18 casillas.** Nada más.

1. **Escribe un nombre de cliente** en cada casilla vacía.
2. **Repite un nombre para unir.** Dos imágenes con el mismo cliente **en la misma categoría**
   se convierten en **un solo proyecto**. Esa es toda la regla.
3. **Escribe `—`** si esa imagen no tiene cliente y debe quedar como su propio proyecto.
4. **No dejes ninguna en blanco.** En blanco significa «sin responder» y detiene la migración
   ([r23-target-model.md §5.2](r23-target-model.md#52-the-backfill)). `—` es una respuesta;
   vacío no lo es.
5. **Revisa también las tablas A** (las que ya vienen rellenas). Solo busca un error; si están
   bien, no toques nada.

**Cómo devolverlo:** edita este archivo directamente — es la fuente que R23b lee, y queda en
`git`, que es de dónde se reconstruyen los clientes si hay que revertir
([§5.4](r23-target-model.md#54-rollback)). Si prefieres, responde con una lista
`B7 = Adriana Muñoz` y yo lo escribo.

**Dos cosas que NO te estoy preguntando:**

- **La ortografía exacta del nombre.** Estoy identificando *quién*, no cómo se escribe.
  Renombrar un cliente después será **una sola edición**, porque `Clientes` pasa a ser una
  colección de verdad y no un texto tecleado en cada fila.
- **Nada de lo que se ve en la web.** El resultado de R23b es que `content/*.json` salga
  **idéntico byte a byte**. El sitio público no cambia ni un píxel.

---

## 1. Qué se está reorganizando, en una frase

Hoy un *Proyecto* en el CMS = **una tarjeta de imagen**. Un proyecto de verdad — un cliente con
cuatro publicaciones, una sesión de fotos con siete vistas — no está guardado en ninguna parte:
existe solo como **un prefijo tecleado a mano** en el texto de cada fila.

El modelo nuevo, ya cerrado por ti el 2026-08-10
([r23-target-model.md §3.0](r23-target-model.md#30-the-locked-model--settled-by-the-owner-2026-08-10)):

```
Clientes  ←── cliente
                │
Categoría ←── Proyecto  (exactamente una categoría)
                └── imágenes[]
```

**La regla que genera los proyectos: un `Cliente` + una `Categoría` = un `Proyecto`.**
Por eso la única pregunta de este documento es *el cliente*. Todo lo demás se deduce.

### El recuento: 57 filas, 40 imágenes

Las 57 filas incluyen la misma foto **dos veces** cuando aparece en inicio y en la página de
la categoría. La misma foto no puede tener dos clientes, así que se pregunta **una vez por
imagen**. Reproducible con `node /tmp/r23-worksheet.mjs`:

| Categoría | imágenes | en ambas | solo página | solo inicio | filas |
|---|---|---|---|---|---|
| Branding Corporativo | 21 | 4 | 16 | 1 | 25 |
| Fotografía de Producto | 12 | 6 | 6 | 0 | 18 |
| Marketing 360° | 4 | 4 | 0 | 0 | 8 |
| Web y Apps | 3 | 3 | 0 | 0 | 6 |
| **Total** | **40** | **17** | **22** | **1** | **57** |

**17 × 2 + 22 + 1 = 57** ✓ — las 57 filas quedan cubiertas por las 40 imágenes.

*(La imagen 58 del CMS es el caso de estudio de UX/UI. No tiene fila de imagen, ya es un
proyecto de verdad, y este documento no lo toca.)*

**Cómo leer las tablas.** `dónde` = si la foto sale en la página de la categoría, en la vista
previa de inicio, o en ambas. `id` = el número de tarjeta publicado de Branding, que debe
sobrevivir la migración sin cambiar. `grupo` = la sección de la página de Branding donde
aparece — **es contexto, no la respuesta**: `sports` contiene tres clientes distintos.

---

## 2. Las tablas

### 2.1 Branding Corporativo — 21 imágenes, 25 filas

#### A. Ya tienen cliente — solo revisa · 10 proyectos, 16 imágenes

**WodFest Costa Rica** · Branding → **2 imágenes** *(grupo `sports`)*

| id | Archivo | Texto de la fila | Dónde |
|---|---|---|---|
| 1 | `wodfest-1.png` | **WodFest Costa Rica** - Campaña publicitaria | ambas |
| 2 | `wodfest-2.png` | **WodFest Costa Rica** - Diseño de marca | ambas |

> Las dos salen en inicio. Bajo la regla es **un proyecto con dos imágenes**, y las dos
> conservan su tarjeta en inicio.

**OFF DAY Trainer** · Branding → **2 imágenes** *(grupo `sports`)*

| id | Archivo | Texto de la fila | Dónde |
|---|---|---|---|
| 10 | `fitness-deadlift.png` | **OFF DAY Trainer** - Técnica Deadlift | página |
| 11 | `fitness-pullups.png` | **OFF DAY Trainer** - Técnica Pull-ups | página |

> Mismo cliente que **OFF DAY Trainer · Web y Apps** ([§2.4](#24-web-y-apps--3-imágenes-6-filas)).
> **Un cliente, dos categorías, dos proyectos** — es el caso que justifica todo el modelo.

**Adriana Muñoz** · Branding → **2 imágenes** *(grupo `adrianaMunoz`)*

| id | Archivo | Texto de la fila | Dónde |
|---|---|---|---|
| 3 | `adriana-munoz.png` | **Adriana Muñoz** - Contenido para redes sociales | ambas |
| 6 | `phicontour-live.png` | Live Técnica Phicontour - **Adriana Muñoz** | página |

> La segunda la nombra en el **sufijo**, no en el prefijo — por eso R23a las separó.
> ⚠️ Hay **4 imágenes más** en el grupo `adrianaMunoz` que están en blanco abajo. Si son suyas,
> este proyecto pasa de 2 a 6 imágenes. Es la decisión de mayor impacto del documento.

**Ana Grace Salon & Estética** · Branding → **4 imágenes** *(grupo `anaGrace`)*

| id | Archivo | Texto de la fila | Dónde |
|---|---|---|---|
| 5 | `ana-grace.png` | **Ana Grace Salon & Estética** - Branding digital | ambas |
| 7 | `ana-grace-hair.png` | **Ana Grace** - Promoción Tratamiento Capilar | página |
| 8 | `ana-grace-online.png` | **Ana Grace** - Compra Online | página |
| 13 | `ana-grace-payment.png` | **Ana Grace** - Información de Pago | página |

> Los dos prefijos son el mismo salón. Esto es precisamente el error que la colección
> `Clientes` elimina: el prefijo se tecleaba a mano y derivó.

**Los cinco logos** · Branding → **1 imagen cada uno** *(grupo `logos`)*

| id | Archivo | Texto de la fila | → Cliente | Dónde |
|---|---|---|---|---|
| 17 | `la-dulcereta.png` | **La Dulcereta Obleas** - Diseño de Logo | La Dulcereta Obleas | página |
| 18 | `fit-cookie.png` | **Fit Cookie by Elsa Cubero** - Diseño de Logo | Fit Cookie by Elsa Cubero | página |
| 19 | `nomads.png` | **Nomads Eighty-Six** - Diseño de Logo | Nomads Eighty-Six | página |
| 20 | `la-pedrena.png` | **Carnicería La Pedreña** - Diseño de Logo | Carnicería La Pedreña | página |
| 21 | `falecon.png` | **Falecon Decoraciones** - Diseño de Logo | Falecon Decoraciones | página |

**FisioEquina** · Branding → **1 imagen** *(sin grupo)*

| id | Archivo | Texto de la fila | Dónde |
|---|---|---|---|
| — | `fisio-equina.png` | **FisioEquina** - Social media marketing | **solo inicio** |

> La única imagen del portafolio que sale en inicio y en ninguna página. Se conserva tal cual.
> ⚠️ Posiblemente el mismo cliente que `Tarjetas de Presentación - Fisioterapia` en
> Marketing 360° ([§2.3](#23-marketing-360--4-imágenes-8-filas)) — pero «Fisioterapia» es un
> sustantivo genérico, así que **no lo doy por hecho**. Tú decides.

#### B. Falta el cliente — rellena · 5 imágenes

> Nombres que ya existen en esta categoría: **WodFest Costa Rica · OFF DAY Trainer ·
> Adriana Muñoz · Ana Grace Salon & Estética · La Dulcereta Obleas · Fit Cookie by Elsa
> Cubero · Nomads Eighty-Six · Carnicería La Pedreña · Falecon Decoraciones · FisioEquina**.
> Si escribes uno de ellos, la imagen se une a ese proyecto. Si escribes uno nuevo, crea uno.

| # | id | Archivo | Texto de la fila | Grupo | Dónde | **CLIENTE** |
|---|---|---|---|---|---|---|
| **B1** | 9 | `phibrows-course.png` | Curso Phibrows - Material Promocional | `adrianaMunoz` | página | **Adriana Muñoz** |
| **B2** | 12 | `phibrows-before-after.png` | Curso Phibrows - Antes y Después | `adrianaMunoz` | página | **Adriana Muñoz** |
| **B3** | 14 | `live-microblading.png` | Live con Ana Oprea - Técnica Microblading | `adrianaMunoz` | página | **Adriana Muñoz** |
| **B4** | 15 | `live-phibrows-shading.png` | Live con Stefany Galeano - Phibrows Shading | `adrianaMunoz` | página | **Adriana Muñoz** |
| **B5** | 16 | `snaga-relay.png` | SNAGA Team Relay 9th Anniversary | `sports` | página | **Crossfit SNAGA** |

> **Por qué están en blanco.** B1/B2: «Phibrows» es la **técnica** de la que trata el curso, no
> quien lo encarga. B3/B4: Ana Oprea y Stefany Galeano son las **invitadas** del directo
> («Live con…»), que no es lo mismo que la clienta. B5: ver [§3.1](#31-cerca-pero-no-lo-doy-por-hecho).
>
> **Si las cuatro primeras son de Adriana Muñoz**, escribe su nombre en B1–B4 y su proyecto de
> Branding pasa a **6 imágenes**.

---

### 2.2 Fotografía de Producto — 12 imágenes, 18 filas

#### A. Ya tienen cliente — solo revisa · 1 proyecto, 2 imágenes

**D'Argent** · Fotografía → **2 imágenes**

| Archivo | Texto de la fila | Dónde |
|---|---|---|
| `crackers.png` | Crackers **D'Argent** | ambas |
| `bread-dargent.png` | Pan **D'Argent** | ambas |

> Tu propio ejemplo. El cliente no es «Crackers D'Argent» sino **D'Argent**; «Crackers» y «Pan»
> son los productos. Ese matiz es justo el que R23a se saltó.

#### B. Falta el cliente — rellena · 10 imágenes

> Nombre que ya existe en esta categoría: **D'Argent**. Si escribes `D'Argent` en varias
> casillas, todas se unen a ese mismo proyecto.

| # | Archivo | Texto de la fila | Dónde | **CLIENTE** |
|---|---|---|---|---|
| **B6** | `croissant.png` | Croissant Artesanal | ambas | **D'Argent** |
| **B7** | `croissant-packaging.png` | Croissant Premium | ambas | **D'Argent** |
| **B8** | `gift-box-1.png` | Caja de Regalo Navideña | ambas | **Todo en caja** |
| **B9** | `gift-box-vinte-1.png` | Set Regalo Vinte-Vinte - Vista 1 | página | **Todo en caja** |
| **B10** | `gift-box-vinte-2.png` | Set Regalo Vinte-Vinte - Vista 2 | página | **Todo en caja** |
| **B11** | `gift-box-vinte-3.png` | Set Regalo Vinte-Vinte - Vista 3 | página | **Todo en caja** |
| **B12** | `gift-box-vinte.png` | Set Regalo Vinte-Vinte - Vista 4 | **ambas** | **Todo en caja** |
| **B13** | `gift-box-vinte-4.png` | Set Regalo Vinte-Vinte - Vista 5 | página | **Todo en caja** |
| **B14** | `gift-box-vinte-5.png` | Set Regalo Vinte-Vinte - Vista 6 | página | **Todo en caja** |
| **B15** | `gift-box-vinte-6.png` | Set Regalo Vinte-Vinte - Vista 7 | página | **Todo en caja** |

> **B6/B7:** tú dijiste que estos dos son de D'Argent aunque el texto no lo diga. No lo he
> rellenado porque **la única prueba es tu palabra, no el texto** — y ese es el punto de esta
> hoja. Confírmalo escribiéndolo.
>
> **B9–B15 son las 7 vistas de un mismo set.** Si les pones el mismo cliente, forman **un solo
> proyecto de 7 imágenes** — el criterio de aceptación de R23. Si además es el mismo cliente
> que B8 o que D'Argent, se une a ese. Ojo: la tarjeta de inicio del set es **B12 (Vista 4)**,
> no la Vista 1; eso se conserva automáticamente.
>
> **Sobre «Vinte-Vinte»:** parece un nombre propio, pero podría ser el nombre del *set*.
> Ver [§3.1](#31-cerca-pero-no-lo-doy-por-hecho).

---

### 2.3 Marketing 360° — 4 imágenes, 8 filas

#### A. Ya tienen cliente — solo revisa · 2 proyectos, 2 imágenes

| Archivo | Texto de la fila | → Cliente | Dónde |
|---|---|---|---|
| `santa-fe-brochure.png` | Brochure Corporativo - **Grupo Santa Fe** | Grupo Santa Fe | ambas |
| `basketball-mural.png` | Mural Deportivo - **PAS Eagles** | PAS Eagles | ambas |

#### B. Falta el cliente — rellena · 2 imágenes

| # | Archivo | Texto de la fila | Dónde | **CLIENTE** |
|---|---|---|---|---|
| **B16** | `concert-banner.png` | Banner de Evento - Concierto | ambas | **—** |
| **B17** | `fisioterapia-cards.png` | Tarjetas de Presentación - Fisioterapia | ambas | **—** |

> **B16:** «Concierto» es el tipo de evento, no quien lo encarga.
> **B17:** «Fisioterapia» es la disciplina. ⚠️ **Podría ser FisioEquina**, que ya es cliente en
> Branding ([§2.1](#21-branding-corporativo--21-imágenes-25-filas)). Si lo es, escribe
> `FisioEquina`: sería **un cliente con dos proyectos en dos categorías**, igual que OFF DAY
> Trainer. No lo he asumido porque el texto no lo dice.

---

### 2.4 Web y Apps — 3 imágenes, 6 filas

#### A. Ya tienen cliente — solo revisa · 2 proyectos, 2 imágenes

| Archivo | Texto de la fila | → Cliente | Dónde |
|---|---|---|---|
| `offday-trainer.png` | **OFF DAY Trainer** - Diseño Web de Fitness | OFF DAY Trainer | ambas |
| `topmed-ecommerce.png` | **TOPMED** E-Commerce - Diseño Responsivo | TOPMED | ambas |

> `OFF DAY Trainer` es **el mismo cliente** que en Branding, y aun así **un proyecto distinto**,
> porque un proyecto pertenece a una sola categoría. Un cliente, dos proyectos.

#### B. Falta el cliente — rellena · 1 imagen

| # | Archivo | Texto de la fila | Dónde | **CLIENTE** |
|---|---|---|---|---|
| **B18** | `live-betting.png` | Live Betting App - UI/UX Mobile | ambas | **—** |

> El texto describe el **producto** («app de apuestas en directo»), no quién lo encargó.

---

## 3. El recuento

| | imágenes | filas |
|---|---|---|
| **Pre-rellenadas** (el texto nombra al cliente) | **22** | 32 |
| **En blanco** (el texto no lo nombra) | **18** | 25 |
| **Total** | **40** | **57** ✓ |

Las 22 forman **15 proyectos** de **14 clientes distintos** — 14 y no 15 porque `OFF DAY
Trainer` tiene dos proyectos, uno por categoría.

**Cada casilla pre-rellenada es defendible desde su propio texto**, y esa es la prueba a la que
someterla: si no puedo señalar las palabras que nombran al cliente, la casilla va en blanco.

| Cliente | La prueba, en el texto | Imgs |
|---|---|---|
| WodFest Costa Rica | «**WodFest Costa Rica** - Campaña publicitaria» — nombre propio en prefijo, sufijo = servicio | 2 |
| OFF DAY Trainer (Branding) | «**OFF DAY Trainer** - Técnica Deadlift» | 2 |
| Adriana Muñoz | «**Adriana Muñoz** - Contenido…» y «…- **Adriana Muñoz**» — nombre de persona | 2 |
| Ana Grace Salon & Estética | «**Ana Grace Salon & Estética** - Branding digital» + tres «**Ana Grace** - …» | 4 |
| La Dulcereta Obleas | «**La Dulcereta Obleas** - Diseño de Logo» — el logo *es* del cliente | 1 |
| Fit Cookie by Elsa Cubero | «**Fit Cookie by Elsa Cubero** - Diseño de Logo» | 1 |
| Nomads Eighty-Six | «**Nomads Eighty-Six** - Diseño de Logo» | 1 |
| Carnicería La Pedreña | «**Carnicería La Pedreña** - Diseño de Logo» | 1 |
| Falecon Decoraciones | «**Falecon Decoraciones** - Diseño de Logo» | 1 |
| FisioEquina | «**FisioEquina** - Social media marketing» | 1 |
| D'Argent | «Crackers **D'Argent**» / «Pan **D'Argent**» — marca en el sufijo, producto en el prefijo | 2 |
| Grupo Santa Fe | «Brochure Corporativo - **Grupo Santa Fe**» | 1 |
| PAS Eagles | «Mural Deportivo - **PAS Eagles**» | 1 |
| TOPMED | «**TOPMED** E-Commerce - Diseño Responsivo» | 1 |
| OFF DAY Trainer (Web y Apps) | «**OFF DAY Trainer** - Diseño Web de Fitness» | 1 |
| | | **22** |

**El criterio, dicho una vez:** se rellena solo cuando el texto contiene un nombre propio que
**no** puede leerse como producto, servicio ni invitado. Un producto (`Croissant Premium`), un
servicio (`Diseño de Logo`, `Packaging & Fotografía`), una técnica (`Phibrows`), un tipo de
evento (`Concierto`) o una invitada (`Live con Ana Oprea`) **no** son clientes.

### 3.1 Cerca, pero no lo doy por hecho

Dos casos donde hay un nombre propio y aun así la casilla va en blanco. Los declaro para que no
parezcan un descuido:

- **`SNAGA Team Relay 9th Anniversary`** (B5) — todo el texto es el nombre de un evento y no
  hay sufijo de servicio, así que no se ve **dónde termina el cliente**: ¿`SNAGA`, `SNAGA Team`,
  o la organización que patrocina la carrera? *(Dato aparte, que no uso como prueba: el caso de
  estudio de UX/UI describe a Snaga como «un centro de entrenamiento físico en Costa Rica, un
  cliente real» — `content/sections/uxui-casestudy.json:42`. Es otra sección del portafolio;
  decide tú si es el mismo.)*
- **`Set Regalo Vinte-Vinte`** (B9–B15) — «Vinte-Vinte» parece una marca, pero también puede
  ser el nombre del set. Si me equivoco aquí, se forma un proyecto de **7 imágenes** con el
  cliente equivocado, y **parecería correcto**. Ese es exactamente el error que esta hoja
  existe para no cometer.

---

## 4. Lo que la regla no resuelve

R23a dejó seis preguntas abiertas. **La regla «un cliente + una categoría = un proyecto»
resuelve cuatro de ellas**, y no hace falta que las contestes.

| # | Pregunta de R23a | Estado |
|---|---|---|
| 1.1 | `Ana Grace` + `Ana Grace Salon & Estética` — ¿un proyecto o dos? | ✅ **Resuelta.** Mismo cliente + misma categoría = **un proyecto de 4 imágenes**. La colección `Clientes` impide que el prefijo vuelva a derivar. |
| 1.2 | `WodFest Costa Rica` — ¿uno o dos? | ✅ **Resuelta.** Un cliente, una categoría = **un proyecto con dos imágenes**, y las dos siguen en inicio porque «sale en inicio» vive en la imagen, no en el proyecto ([r23-target-model.md §3.2](r23-target-model.md#32-decision-2--home-vs-page-placement-stays-on-the-image-not-the-parent)). |
| 1.3 | `Live Técnica Phicontour` — ¿proyecto propio o de Adriana Muñoz? | ✅ **Resuelta.** El texto la nombra en el sufijo → mismo cliente, misma categoría → **el proyecto de Adriana Muñoz**. |
| 1.4 | `OFF DAY Trainer` (2 imgs) — ¿bien agrupado? | ✅ **Resuelta** para OFF DAY Trainer. *(La otra mitad de 1.4, `Curso Phibrows`, no era una pregunta de agrupación sino de cliente: es **B1/B2**.)* |
| 1.5 | Los 23 proyectos de una sola imagen — ¿se acepta el criterio por defecto? | ⚠️ **Sobrevive, muy reducida** — ver abajo. |
| 1.6 | `FisioEquina` solo en inicio — ¿intencionado? | ⚠️ **Sobrevive** — ver abajo. |

### Las dos que sobreviven

**1.5 — La excepción genuina.** En su forma original la pregunta ha desaparecido: ya no hay un
«criterio por defecto» que aceptar, porque la agrupación se **deduce** del cliente y no se
supone. Lo que queda es su reverso, y es real: **un mismo cliente, una misma categoría, pero
dos proyectos distintos porque son dos encargos distintos.** La regla lo permite
explícitamente («excepciones genuinas»).

> **→ Lo único que necesito:** si al rellenar alguna casilla piensas *«sí, es el mismo cliente,
> pero esto es otro trabajo»*, escríbelo al lado (p. ej. `Adriana Muñoz — proyecto aparte:
> cursos`). Si no dices nada, se aplica la regla.

*Sigue importando, pero no bloquea:* si no se declara ninguna excepción, R23b procede igual.

**1.6 — `FisioEquina` sale en inicio y en ninguna página.** Es la única fila así de las 57. No
es un error de este documento; es cómo está construido el sitio hoy.

> **→ La pregunta sigue viva:** ¿es intencionado, o debería aparecer también en la página de
> Branding?

*Importa, pero no bloquea R23b.* Los interruptores `showOnHome` / `showOnPage` viven en la
imagen, así que el modelo representa las dos respuestas sin perder nada
([r23-target-model.md §3.2](r23-target-model.md#32-decision-2--home-vs-page-placement-stays-on-the-image-not-the-parent)).
Contestarlo es un cambio de contenido de un clic, **después** de la migración, no antes.

### Lo que no cambia: la web

`Cliente` **no llega a nada de lo que se publica.** Comprobado, no supuesto: ninguno de los dos
exportadores lee la colección `clients`, y cada tarjeta que emiten enumera sus campos uno a uno
— la prueba, con cuatro razones independientes, está en
[r23-target-model.md §4.1](r23-target-model.md#41-cliente-changes-nothing-the-exporter-emits--checked-not-assumed).
Rellenar esta hoja no puede mover un píxel.

---

## 5. Cómo regenerar el inventario

Las tablas salen de un script, no están tecleadas. Guárdalo **fuera del repositorio** (no se
commitea a propósito: es de un solo uso) y ejecútalo desde la raíz:

```
node /tmp/r23-worksheet.mjs          # recuentos + la reconciliación de §1
node /tmp/r23-worksheet.mjs --rows   # las 57 filas
node /tmp/r23-worksheet.mjs --imgs   # las 40 imágenes
```

Lee solo `content/sections/*.json`. **Sin base de datos, sin red, sin escrituras.**

> **En qué se diferencia del script de R23a.** El de R23a (`/tmp/r23-map.mjs`) *proponía una
> agrupación*, partiendo cada texto por el primer `" - "`. **Eso es el bug**, y por eso este no
> lo hace: inventaría filas e imágenes, comprueba que cuadran, y se detiene. La columna
> `CLIENTE` no se puede calcular; por eso te la pregunto.

```js
// R23a-ii — inventory the rows and the distinct images behind them, from committed
// content. Read-only: no database, no network, no writes.
//
// It deliberately does NOT propose a grouping. R23a's prefix-grouping is the bug this
// task corrects: the client is not recoverable from the strings.
//
//   node /tmp/r23-worksheet.mjs        # counts + reconciliation
//   node /tmp/r23-worksheet.mjs --rows # every row, per category
//   node /tmp/r23-worksheet.mjs --imgs # every distinct image, per category
import fs from 'node:fs'

const SECTIONS = [
  { slug: 'branding', file: 'branding.json', label: 'Branding Corporativo' },
  { slug: 'fotografia-producto', file: 'photography.json', label: 'Fotografía de Producto' },
  { slug: 'marketing-360', file: 'marketing-360.json', label: 'Marketing 360°' },
  { slug: 'web-apps', file: 'web-apps.json', label: 'Web y Apps' },
]
const BRANDING_GROUPS = [
  ['sportsProjects', 'sports'],
  ['adrianaMunozProjects', 'adrianaMunoz'],
  ['anaGraceProjects', 'anaGrace'],
  ['logoProjects', 'logos'],
]

const rows = []
for (const s of SECTIONS) {
  const d = JSON.parse(fs.readFileSync(`content/sections/${s.file}`, 'utf8'))
  if (s.slug === 'branding') {
    // Shape C: {src, alt} — no title, no label.
    d.home.images.forEach((it) =>
      rows.push({ sec: s.slug, placement: 'home', group: null, id: null,
                  img: it.src, text: it.alt.es, label: null }))
    // Shape D: {id, src, alt, category}, one array per page section.
    for (const [key, group] of BRANDING_GROUPS)
      d.page[key].forEach((it) =>
        rows.push({ sec: s.slug, placement: 'page', group, id: it.id,
                    img: it.src, text: it.alt.es, label: it.category.es }))
  } else {
    // Shape A: {image, title, category}.
    d.home.projects.forEach((it) =>
      rows.push({ sec: s.slug, placement: 'home', group: null, id: null,
                  img: it.image, text: it.title.es, label: it.category.es }))
    // Shape B: {image, alt, category}.
    d.page.projects.forEach((it) =>
      rows.push({ sec: s.slug, placement: 'page', group: null, id: null,
                  img: it.image, text: it.alt.es, label: it.category.es }))
  }
}

// One entry per distinct media file within a category. The image — not the row — is the
// thing that gets a client, because a home row and its page twin are the same photograph.
const images = new Map() // key: sec|img
for (const r of rows) {
  const k = `${r.sec}|${r.img}`
  if (!images.has(k))
    images.set(k, { sec: r.sec, img: r.img, page: null, home: null, group: null, id: null })
  const e = images.get(k)
  e[r.placement] = r
  if (r.group) e.group = r.group
  if (r.id != null) e.id = r.id
}

const base = (p) => p.split('/').pop()
const where = (e) => (e.page && e.home ? 'ambas' : e.page ? 'página' : 'inicio')

console.log(`ROWS: ${rows.length}`)
console.log(`IMAGES: ${images.size}`)
console.log()
console.log('| Categoría | imágenes | ambas | solo página | solo inicio | filas |')
console.log('|---|---|---|---|---|---|')
let T = [0, 0, 0, 0, 0]
for (const s of SECTIONS) {
  const es = [...images.values()].filter((e) => e.sec === s.slug)
  const both = es.filter((e) => e.page && e.home).length
  const pageOnly = es.filter((e) => e.page && !e.home).length
  const homeOnly = es.filter((e) => !e.page && e.home).length
  const n = rows.filter((r) => r.sec === s.slug).length
  if (both * 2 + pageOnly + homeOnly !== n) throw new Error(`reconciliation failed: ${s.slug}`)
  console.log(`| ${s.label} | ${es.length} | ${both} | ${pageOnly} | ${homeOnly} | ${n} |`)
  T = [T[0] + es.length, T[1] + both, T[2] + pageOnly, T[3] + homeOnly, T[4] + n]
}
console.log(`| **Total** | **${T[0]}** | **${T[1]}** | **${T[2]}** | **${T[3]}** | **${T[4]}** |`)
if (T[1] * 2 + T[2] + T[3] !== T[4]) throw new Error('reconciliation failed: total')
if (T[4] !== rows.length || T[0] !== images.size) throw new Error('count mismatch')
console.log(`\nCheck: ${T[1]}×2 + ${T[2]} + ${T[3]} = ${T[1] * 2 + T[2] + T[3]} = ROWS ✓`)

if (process.argv.includes('--rows'))
  for (const s of SECTIONS) {
    console.log(`\n===== ${s.slug} (${rows.filter((r) => r.sec === s.slug).length} filas)`)
    for (const r of rows.filter((r) => r.sec === s.slug))
      console.log(`  ${r.placement.padEnd(6)} ${String(r.group ?? '-').padEnd(13)} id=${String(r.id ?? '-').padEnd(3)} ${base(r.img).padEnd(28)} | ${r.text} | ${r.label ?? '-'}`)
  }

if (process.argv.includes('--imgs'))
  for (const s of SECTIONS) {
    const es = [...images.values()].filter((e) => e.sec === s.slug)
    console.log(`\n===== ${s.slug} (${es.length} imágenes)`)
    for (const e of es) {
      const p = e.page, h = e.home
      console.log(`  ${where(e).padEnd(7)} ${String(e.group ?? '-').padEnd(13)} id=${String(e.id ?? '-').padEnd(3)} ${base(e.img).padEnd(28)} | ${p ? p.text : ''}${p && h && p.text !== h.text ? `   [inicio: ${h.text}]` : ''}${!p ? h.text : ''} | ${(p ?? h).label ?? '-'}`)
    }
  }
```

**Verificación, 2026-08-10:** `node /tmp/r23-worksheet.mjs` imprime `ROWS: 57` (branding 25,
fotografia-producto 18, marketing-360 8, web-apps 6) e `IMAGES: 40` (21 / 12 / 4 / 3), y el
script **aborta solo** si la reconciliación no cuadra. Ambos números coinciden con el recuento
independiente del conductor y con [§1](#el-recuento-57-filas-40-imágenes).

---

## 6. Firma

**R23b no puede empezar hasta que las 18 casillas de las tablas B tengan un nombre o un `—`.**

| | |
|---|---|
| Casillas rellenadas por el propietario | ` ___ / 18` |
| Excepciones declaradas ([§4](#4-lo-que-la-regla-no-resuelve), 1.5) | *ninguna / …* |
| `FisioEquina` solo en inicio ([§4](#4-lo-que-la-regla-no-resuelve), 1.6) | *pendiente* |
| Fecha | |
