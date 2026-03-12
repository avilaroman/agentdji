---

# 🚁 Agente de Dron DJI Mini/Tello 🤖💬

Controlá un **DJI Mini o Tello** usando **lenguaje natural** a través de una interfaz de chat inteligente basada en **Cloudflare Agents + LLMs**.

Hablarle al dron como a una persona y dejá que la IA traduzca tu intención en comandos reales de vuelo 🧠✨


---

## 🧩 Arquitectura

```
┌─────────────────┐         ┌─────────────────────┐         ┌─────────────────┐         ┌─────────────┐
│ 💬 Agente Chat │◄──RPC──►│ 🤖 DroneAgent       │◄───WS──►│ 🕹 Controller   │◄──UDP──►│ 🚁 DJI-Drone│
│   (Chat UI)     │         │  (Durable Object)   │         │   (Node.js)     │         │             │
└─────────────────┘         └─────────────────────┘         └─────────────────┘         └─────────────┘
```

---

## 🔄 Componentes y Flujo de Datos

### 🧱 Componentes

| Componente            | Descripción                                                                   |
| --------------------- | ----------------------------------------------------------------------------- |
| 💬 **Agente de Chat** | UI en React + Agente IA que interpreta lenguaje natural e invoca herramientas |
| 🤖 **DroneAgent**     | Durable Object de Cloudflare que gestiona RPC y WebSocket                     |
| 🕹 **Controller**     | App Node.js que traduce WebSocket ↔ UDP y maneja visión                       |
| 🚁 **DJI Drone**      | Dron que recibe comandos UDP y transmite video                                |

---

### 🔀 Flujo de Datos

1. **Control manual**
   Usuario → Chat → `sendCommand` → DroneAgent (RPC) → WebSocket → Controller → UDP → DJI Drone

2. **Misión autónoma**
   Usuario → Chat → `startMission` → DroneAgent →
   Controller procesa visión → LLM decide movimientos → Controller ejecuta comandos

---

## 🖼️ Imágenes de ejemplo

Vista de prueba capturada desde el pipeline de visión del controlador:

![Imagen de ejemplo del dron](controller/drone_image.png)

Versión anotada para depuración de detecciones y objetivos:

![Imagen anotada del dron](controller/drone_image_annotated.png)

---

### 🛠 Herramientas del Agente

| Herramienta    | Función                                     |
| -------------- | ------------------------------------------- |
| `sendCommand`  | Envía comandos directos del SDK de DJI      |
| `startMission` | Inicia una misión autónoma basada en visión |
| `stopMission`  | Detiene la misión actual                    |
| `getStatus`    | Estado del controlador y de la misión       |

---

## 📋 Requisitos

✅ Node.js v18+
✅ Cuenta de Cloudflare
✅ API Key de OpenAI
✅ API Key de Moondream (visión)
✅ DJI Drone *Mini o Tello*
✅ `ffmpeg` instalado

```bash
# macOS
brew install ffmpeg
```

---

## ⚙️ Configuración

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/avilaroman/agentdji.git
cd agentdji

# Install agent dependencies
cd agent && npm install

# Install controller dependencies
cd ../controller && npm install
```

### 2. Configure Environment

**Agent** (`agent/.dev.vars`):
```env
OPENAI_API_KEY=your_openai_api_key
```

**Controller** (`controller/.env`):
```env
MOONDREAM_KEY=your_moondream_api_key
TELLO_IP=192.168.10.1
TELLO_PORT=8889
VIDEO_PORT=11111
AGENT_WS_URL=ws://localhost:5173/agents/drone-agent/default
```

### 3. Run Locally

**Terminal 1 - Start the Agent:**
```bash
cd agent
npm run dev
```

**Terminal 2 - Connect to Tello WiFi, then start Controller:**
```bash
cd controller
npm run dev
```

**Terminal 3 - Open the Chat UI:**
```
http://localhost:5173
```

## Usage

### Manual Control

Chat naturally with the agent:
- "Take off"
- "Check the battery level"
- "Move forward 1 meter"
- "Turn right 90 degrees"
- "Land"


## 🎮 Uso

### ✋ Control Manual

Escribí comandos naturales como:

* 🛫 “Despegar”
* 🔋 “¿Cuánta batería queda?”
* ⬆️ “Avanzar 1 metro”
* 🔄 “Girar 90 grados a la derecha”
* 🛬 “Aterrizar”

👉 El agente conoce todo el **SDK de DJI** y traduce automáticamente tu intención.

---

### 🧠 Misión Autónoma (Visión)

Ejemplos:

* 🎯 “Vuela hacia la copa roja y aterriza”
* 🧍 “Encontrá a la persona y acercate”

#### Flujo automático:

1. Despega
2. Usa la cámara + Moondream
3. El LLM genera movimientos
4. Ajusta hasta que el objetivo ocupe el 80% del frame
5. Aterriza 🛬

🛑 Podés detener la misión en cualquier momento.

---

## ☁️ Deploy en Producción

### 🚀 Cloudflare Agent

```bash
cd agent
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

### 🌍 Controller (Producción)

```env
AGENT_WS_URL=wss://agentdji.<your-username>.workers.dev/agents/drone-agent/default
```

---

## 🗂 Estructura del Proyecto

```
agentdji/
├── agent/          # Cloudflare Worker + Chat UI
│ ├── src/
│ │ ├── server.ts   # DroneAgent + IA
│ │ ├── tools.ts    # Herramientas
│ │ ├── telloCommands.ts
│ │ └── app.tsx     # UI Chat
│ └── wrangler.jsonc
│
├── controller/     # Controlador Node.js
│ ├── src/
│ │ ├── index.ts    # WS + UDP bridge
│ │ └── utils.ts    # Video utils
│
└── README.md
```

---

## 📚 Comandos SDK DJI Drone

| Comando          | Descripción             |
| ---------------- | ----------------------- |
| `command`        | Entrar en modo SDK      |
| `takeoff`        | Despegar                |
| `land`           | Aterrizar               |
| `emergency`      | Apagar motores          |
| `up/down x`      | Subir/Bajar (20–500 cm) |
| `left/right x`   | Izquierda/Derecha       |
| `forward/back x` | Adelante/Atrás          |
| `cw/ccw x`       | Rotar (1–360°)          |
| `flip x`         | Flip (l/r/f/b)          |
| `speed x`        | Velocidad               |
| `battery?`       | Nivel batería           |
| `time?`          | Tiempo de vuelo         |

---

## 📄 Licencia

MIT 📝
