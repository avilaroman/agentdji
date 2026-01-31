# Agente de Dron Tello

Controla un dron DJI Tello usando lenguaje natural a través de una interfaz de chat basada en Cloudflare Agents.

## Arquitectura

```
┌─────────────────┐ ┌─────────────────────┐ ┌─────────────────┐ ┌───────────────┐
│ Agente de chat │◄──RPC──►│ DroneAgent │◄───WS──►│ Controlador │◄──UDP──►│ Tello Drone │
│ (Interfaz de chat) │ │ (Objeto duradero) │ │ (Node.js) │ │ │
└─────────────────┘ └────────────────────┘ └────────────────┘ └──────────────┘
```

<details>
<summary><strong>Componentes y flujo de datos</strong></summary>

### Componentes

| Componente | Descripción |
|-----------|-------------|
| **Agente de chat** | Interfaz de usuario de chat de React + agente de IA que interpreta lenguaje natural e invoca herramientas |
| **DroneAgent** | Objeto duradero de Cloudflare que aloja el servidor WebSocket para las conexiones del controlador |
| **Controller** | Aplicación Node.js que conecta WebSocket ↔ UDP y gestiona la visión para misiones autónomas |
| **Tello Drone** | Dron DJI Tello (recibe comandos UDP y envía secuencias de vídeo) |

### Flujo de datos

1. **Comandos manuales**: Usuario → Agente de chat → herramienta `sendCommand` → DroneAgent RPC → WebSocket → Controlador → UDP → Dron
2. **Misión autónoma**: Usuario → Agente de chat → herramienta `startMission` → DroneAgent → El controlador ejecuta el bucle de detección → DroneAgent genera movimientos mediante LLM → El controlador los ejecuta

### Herramientas

| Herramienta | Descripción |
|------|-------------|
| `sendCommand` | Envía un comando directamente del SDK de Tello (p. ej., `takeoff`, `land`, `forward 100`, `battery?`) |
| `startMission` | Inicia una misión autónoma basada en visión para volar hacia un objetivo |
| `stopMission` | Detiene la misión autónoma actual |
| `getStatus` | Verifica si el controlador está conectado y el estado actual de la misión | </details>

<details>
<summary><strong>Requisitos</strong></summary>

- [Node.js](https://nodejs.org/) v18+
- [Cuenta de Cloudflare](https://dash.cloudflare.com/sign-up)
- [Clave de API de OpenAI](https://platform.openai.com/api-keys)
- [Clave de API de Moondream](https://moondream.ai/) (para misiones de visión/autónomas)
- Dron DJI Tello
- ffmpeg instalado (`brew install ffmpeg` en macOS)

</details>

## Configuración

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd tello-agent

# Instalar las dependencias del agente
cd agent && npm install

# Instalar las dependencias del controlador
cd ../controller && npm Instalar
```

### 2. Configurar el entorno

**Agente** (`agent/.dev.vars`):
```env
OPENAI_API_KEY=your_openai_api_key
```

**Controlador** (`controller/.env`):
```env
MOONDREAM_KEY=your_moondream_api_key
TELLO_IP=192.168.10.1
TELLO_PORT=8889
VIDEO_PORT=11111
AGENT_WS_URL=ws://localhost:5173/agents/drone-agent/default
```

### 3. Ejecutar localmente

**Terminal 1 - Iniciar el agente:**
```bash
cd agent
npm run dev
```

**Terminal 2 - Conectarse a la red Wi-Fi de Tello e iniciar Controlador:**
```bash
cd controller
npm run dev
```

**Terminal 3 - Abrir la interfaz de chat:**
```
http://localhost:5173
```

## Uso

### Control manual

Chatea de forma natural con el agente:
- "Despegar"
- "Comprobar el nivel de batería"
- "Avanzar 1 metro"
- "Girar 90 grados a la derecha"
- "Aterrizar"

El agente de chat conoce todos los comandos de Tello y traducirá tu intención al comando correcto del SDK.

### Misión Autónoma

Inicia una misión basada en visión:
- "Vuela hacia la copa roja y aterriza en ella"
- "Encuentra a la persona y ve hacia ella"

El dron:
1. Despegará
2. Usará la cámara y el modelo de visión Moondream para detectar el objetivo
3. LLM generará comandos de movimiento basados ​​en los datos de detección
4. Repetirá hasta que el objetivo cubra el 80% del encuadre
5. Aterrizará

Puedes detenerte en cualquier momento pulsando "Detener la misión".

<details>
<summary><strong>Implementación</strong></summary>

### Implementar el agente en Cloudflare

```bash
cd agent

# Establecer el secreto de producción
npx wrangler secret put OPENAI_API_KEY

# Implementar
npm run deploy
```

### Actualizar el controlador para producción

Actualizar `controller/.env`:
```env
AGENT_WS_URL=wss://tello-agent.<your-subdomain>.workers.dev/agents/drone-agent/default
```

</details>

<details>
<summary><strong>Estructura del proyecto</strong></summary>

```
tello-agent/
├── agent/ # Cloudflare Worker + React UI
│ ├── src/
│ │ ├── server.ts # DroneAgent + Agente de chat
│ │ ├── tools.ts # Definiciones de herramientas
│ │ ├── telloCommands.ts # Comandos + indicaciones del SDK de Tello
│ │ └── app.tsx # Interfaz de chat
│ ├── wrangler.jsonc # Configuración de Cloudflare
│ └── package.json
│
├── controller/ # Controlador de drones Node.js
│ ├── src/
│ │ ├── index.ts # Cliente WebSocket + Puente UDP
│ │ └── utils.ts # Vídeo Utilidades de captura
│ └── paquete.json
│
└── README.md
```

</details>

<details>
<summary><strong>Referencia de comandos del SDK de Tello</strong></summary>

| Comando | Descripción |
|---------|-------------|
| `comando` | Entrar en modo SDK |
| `despegue` | Despegue automático |
| `aterrizaje` | Aterrizaje automático |
| `emergencia` | Detener motores inmediatamente |
| `arriba/abajo x` | Ascender/descender x cm (20-500) |
| `izquierda/derecha x` | Volar izquierda/derecha x cm (20-500) |
| `adelante/atrás x` | Volar f
