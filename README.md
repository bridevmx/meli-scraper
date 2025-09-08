# Meli Scraper API

![Node.js](https://img.shields.io/badge/Node.js-18.x-green) ![Express.js](https://img.shields.io/badge/Express.js-4.x-blue) ![Axios](https://img.shields.io/badge/Axios-1.x-purple)

## 📖 Descripción General

**Meli Scraper API** es un servicio de backend robusto y eficiente construido con Node.js y Express, diseñado para extraer datos de productos del sitio de **Mercado Libre México**.

La API está diseñada para ser resiliente y discreta, utilizando un sistema de **proxy rotativo**, **user-agents aleatorios** y un mecanismo de **reintentos con backoff exponencial** para manejar errores de red y minimizar la posibilidad de bloqueos.

A diferencia de los scrapers tradicionales que dependen exclusivamente del análisis del DOM, esta API utiliza un enfoque más moderno y estable: extrae la información directamente del objeto `__PRELOADED_STATE__` que Mercado Libre integra en el HTML de sus páginas. Esto resulta en una extracción de datos más rápida, fiable y menos propensa a romperse con cambios menores en la interfaz de usuario del sitio.

---

## ✨ Características

-   **Scraping de Ofertas:** Extrae la lista de productos de la página de ofertas de Mercado Libre.
-   **Scraping de Búsquedas:** Obtiene resultados de búsqueda basados en una consulta (query).
-   **Scraping de Páginas de Producto:** Extrae información detallada de una URL de producto específica.
-   **Paginación:** Capacidad para navegar a través de múltiples páginas en ofertas y búsquedas.
-   **Robusto y Resiliente:** Implementa reintentos automáticos con backoff exponencial para peticiones fallidas.
-   **Evasión de Bloqueos:** Utiliza proxies y rotación de User-Agents para simular tráfico legítimo.
-   **Análisis Inteligente:** Parsea el estado pre-cargado (`__PRELOADED_STATE__`) para una extracción de datos precisa.

---

## 🛠️ Stack Tecnológico

-   **Backend:** Node.js, Express.js
-   **Cliente HTTP:** Axios
-   **Análisis HTML:** Cheerio (para tareas secundarias como la paginación)
-   **Gestión de User-Agents:** `user-agents`

---

## 🚀 Empezando

Sigue estas instrucciones para poner en marcha el proyecto en tu entorno local.

### Prerrequisitos

-   Node.js (v18.x o superior)
-   npm (Node Package Manager)
-   Un servicio de Proxy con credenciales (host, puerto, usuario, contraseña)

### 1. Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/iDontKnowBuddy/meli-scraper.git
cd meli-scraper
npm install
```

### 2. Configuración del Entorno

Para que el scraper funcione correctamente, necesita credenciales de un servicio de proxy. La aplicación está configurada para leer estas credenciales desde variables de entorno.

Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables con tus datos:

```
# .env - Archivo de variables de entorno

# Credenciales del Proxy
PROXY_HOST="HOST_DE_TU_PROXY"
PROXY_PORT="PUERTO_DEL_PROXY"
PROXY_USERNAME="USUARIO_DEL_PROXY"
PROXY_PASSWORD="PASSWORD_DEL_PROXY"
```

**Importante:** Sin estas variables de entorno, el scraper no funcionará, ya que las peticiones a Mercado Libre fallarán.

### 3. Ejecutar la Aplicación

Una vez configurado el archivo `.env`, puedes iniciar el servidor:

```bash
npm start
```

El servidor se iniciará por defecto en `http://localhost:3000`.

---

## 🔌 Guía de la API

La API expone tres endpoints principales para realizar el scraping.

### 1. Obtener Productos en Oferta

Extrae los productos listados en la página de ofertas de Mercado Libre.

-   **Endpoint:** `/api/offers`
-   **Método:** `GET`
-   **Parámetros (Query):**
    -   `maxPages` (Opcional): Número de páginas de ofertas a scrapear. Si se omite, solo extrae la primera página (`maxPages=1`). Para extraer todas las páginas disponibles, usa `maxPages=0`.

-   **Ejemplo de uso (curl):**
    ```bash
    # Extraer la primera página de ofertas
    curl "http://localhost:3000/api/offers"

    # Extraer las primeras 3 páginas de ofertas
    curl "http://localhost:3000/api/offers?maxPages=3"
    ```

-   **Respuesta Exitosa (JSON):**
    ```json
    [
      {
        "id": "MLM12345678",
        "title": "Producto de Ejemplo en Oferta",
        "brand": "Marca Ejemplo",
        "url": "https://...",
        "imageUrl": "https://http2.mlstatic.com/...",
        "price": 499,
        "previousPrice": 599,
        "discount": 16,
        "currency": "MXN",
        "rating": 4.5,
        "votes": 150,
        "shipping": {
          "text": "Envío gratis",
          "isFull": true
        },
        "tags": []
      }
    ]
    ```

### 2. Buscar Productos

Realiza una búsqueda de productos en Mercado Libre basada en un término.

-   **Endpoint:** `/api/search`
-   **Método:** `GET`
-   **Parámetros (Query):**
    -   `q` (**Requerido**): El término de búsqueda.
    -   `maxPages` (Opcional): Número de páginas de resultados a scrapear. Por defecto es `1`. `0` para todas las páginas.

-   **Ejemplo de uso (curl):**
    ```bash
    # Buscar "laptop" en la primera página
    curl "http://localhost:3000/api/search?q=laptop"

    # Buscar "monitor 4k" en las primeras 2 páginas
    curl "http://localhost:3000/api/search?q=monitor%204k&maxPages=2"
    ```
-   **Respuesta Exitosa (JSON):**
    ```json
    [
        {
            "id": "MLM98765432",
            "title": "Laptop Gamer de Última Generación",
            "brand": "Marca Gamer",
            "url": "https://...",
            "imageUrl": "https://http2.mlstatic.com/...",
            "price": 25000,
            "previousPrice": null,
            "discount": null,
            "currency": "MXN",
            "rating": 4.8,
            "votes": 89,
            "shipping": {
                "text": "Envío gratis",
                "isFull": true
            },
            "tags": ["organic"]
        }
    ]
    ```

### 3. Obtener Detalles de un Producto

Extrae toda la información detallada de la página de un producto específico.

-   **Endpoint:** `/api/product`
-   **Método:** `POST`
-   **Cuerpo de la Petición (Body):**
    -   `url` (**Requerido**): La URL completa del producto en Mercado Libre.

-   **Ejemplo de uso (curl):**
    ```bash
    curl -X POST http://localhost:3000/api/product \
    -H "Content-Type: application/json" \
    -d '{"url": "https://articulo.mercadolibre.com.mx/MLM-12345-..."}'
    ```

-   **Respuesta Exitosa (JSON):**
    ```json
    {
      "id": "MLM12345",
      "title": "Detalle de Producto de Ejemplo",
      "price": 1200,
      "previousPrice": 1500,
      "currency": "MXN",
      "description": "Una descripción detallada del producto...",
      "rating": {
        "ratingValue": 4.7,
        "ratingCount": 200,
        "reviewCount": 50
      },
      "reviews": [
          { "text": "¡Excelente producto!", "rating": 5, "date": "2023-10-27" }
      ],
      "images": [
        { "standard": "https://...-F.webp", "highRes": "https://...-O.webp" }
      ],
      "stock": {
          "status": "¡Último disponible!",
          "availableQuantity": "1 unidad"
      },
      "sellerInfo": {
          "name": "Vendedor de Confianza",
          "reputationLevel": "MercadoLíder Platinum",
          "salesCount": "5000"
      },
      "variations": [
        { "name": "Color", "selectedValue": "Negro", "options": [...] }
      ],
      "features": {
        "marca": "Marca Ejemplo",
        "modelo": "Modelo X"
      }
    }
    ```

---

## 🧠 Lógica Interna y Robustez

### Estrategia de Extracción de Datos

El núcleo del scraper (`src/services/scraper.js`) no depende del análisis manual de clases y selectores CSS, que son frágiles y cambian constantemente. En su lugar:

1.  Realiza una petición `GET` a la URL deseada usando **Axios**, un **proxy** y un **User-Agent aleatorio**.
2.  Una vez obtenido el HTML, busca una etiqueta `<script>` con el ID `__PRELOADED_STATE__`.
3.  El contenido de esta etiqueta es un objeto JSON masivo que contiene toda la información que la página usa para renderizarse en el cliente (usando React/Vue/etc.).
4.  La API parsea este JSON para extraer de forma estructurada y fiable los datos de productos, precios, reviews, etc.
5.  **Cheerio** se utiliza de forma secundaria solo para tareas simples, como encontrar el enlace a la "siguiente página" en los listados.

### Manejo de Errores con Reintentos

La función `withRetries` en `src/utils/helpers.js` envuelve cada petición de red. Si una petición falla (por un error de red, un timeout, o un código de estado `5xx` del servidor), no se rinde inmediatamente. En su lugar, espera un tiempo y lo vuelve a intentar, aumentando el tiempo de espera en cada intento fallido (backoff exponencial) hasta un máximo de 10 reintentos. Esto hace que el scraper sea muy resistente a fallos temporales.
