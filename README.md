# 🧠 KAI DOC PWA

Una ventana a la mente de Kai — visor y editor de archivos markdown de contexto y memoria.

## Arquitectura

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │     Tunnel      │
                    └────────┬────────┘
                             │ :80
                    ┌────────▼────────┐
                    │     Traefik     │
                    │  Reverse Proxy  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐      ...      (futuros proyectos)
     │  kai-doc-pwa  │
     │    :3001      │
     └───────────────┘
```

- **Traefik** — Reverse proxy con descubrimiento automático vía Docker
- **Docker** — Cada proyecto en su contenedor, red compartida `proxy`
- **Cloudflare Tunnel** — Acceso externo seguro sin abrir puertos

## Stack Tecnológico

### Backend
- **Express** — Servidor HTTP
- **WS** — WebSocket para actualizaciones en tiempo real
- **Chokidar** — Watcher de archivos
- **JWT + bcryptjs** — Autenticación

### Frontend
- **React + Vite** — Framework y bundler
- **react-markdown + remark-gfm** — Renderizado de markdown
- **vite-plugin-pwa** — Manifest y service worker
- **CSS Modules** — Estilos encapsulados

## Requisitos

- Docker & Docker Compose
- Node.js 18+ (solo para desarrollo local)

## Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone git@github.com:kai-devia/kai-doc-pwa.git
cd kai-doc-pwa
```

### 2. Levantar todo (Traefik + App)
```bash
chmod +x start.sh
./start.sh
```

### 3. Acceder
- **Local:** http://localhost
- **Traefik Dashboard:** http://localhost:8080

## Credenciales por defecto

- **Usuario:** `guille`
- **Contraseña:** `erythia2026`

## Desarrollo Local (sin Docker)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend (en otra terminal)
```bash
cd frontend
npm install
npm run dev
```

Acceder a http://localhost:5173

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secreto para firmar tokens JWT | - |
| `AUTH_USER` | Usuario para login | - |
| `AUTH_PASS` | Contraseña para login | - |
| `PORT` | Puerto del servidor | 3001 |
| `WORKSPACE_ROOT` | Ruta al directorio con archivos .md | - |

## Cloudflare Tunnel (acceso externo)

```bash
cd /home/kai/infrastructure/traefik
./start-tunnel.sh
```

Esto abrirá un túnel temporal con una URL pública tipo `https://xxx.trycloudflare.com`

## Añadir Proyectos Futuros

Para añadir un nuevo proyecto a la misma infraestructura:

1. Crear `docker-compose.yml` en el proyecto:
```yaml
version: "3.8"

networks:
  proxy:
    external: true

services:
  mi-proyecto:
    build: .
    container_name: mi-proyecto
    restart: unless-stopped
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mi-proyecto.rule=PathPrefix(`/mi-ruta`)"
      - "traefik.http.services.mi-proyecto.loadbalancer.server.port=3000"
```

2. Levantar:
```bash
docker compose up -d
```

Traefik lo detectará automáticamente.

## Estructura de Carpetas

```
kai-doc-pwa/
├── backend/
│   ├── index.js           # Arranque del servidor
│   ├── config/
│   │   └── env.js         # Variables de entorno
│   ├── middlewares/
│   │   └── auth.js        # Verificación JWT
│   ├── routes/
│   │   ├── auth.js        # POST /api/auth/login
│   │   └── files.js       # API de archivos
│   └── services/
│       ├── fileService.js # Operaciones de archivos
│       └── watcherService.js # File watcher + WS
├── frontend/
│   ├── src/
│   │   ├── api/           # Cliente HTTP
│   │   ├── hooks/         # Hooks de React
│   │   ├── components/    # Componentes UI
│   │   └── styles/        # CSS global
│   ├── public/
│   └── vite.config.js
├── Dockerfile             # Multi-stage build
├── docker-compose.yml     # Configuración Docker
├── start.sh               # Script de arranque
└── README.md
```

## Infraestructura Compartida

```
/home/kai/infrastructure/traefik/
├── docker-compose.yml     # Servicio Traefik
├── traefik.yml            # Configuración Traefik
└── start-tunnel.sh        # Script Cloudflare Tunnel
```

## Licencia

MIT — Kai & Guille, 2026
