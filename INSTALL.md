# Instalación de Code CLI

## 🚀 Opción 1: Instalar Globalmente (Recomendado)

```bash
# 1. Ir al directorio
cd code-cli

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build

# 4. Instalar globalmente (link para desarrollo)
npm link

# 5. Usar desde cualquier lugar
code-cli
# o
cc
```

## 📦 Opción 2: Usar Localmente

```bash
# 1. Instalar y compilar
cd code-cli
npm install
npm run build

# 2. Ejecutar directamente
node dist/index.js

# O con npm
npm start
```

## 🔧 Opción 3: Publicar en NPM (Para Distribución)

```bash
# 1. Login a npm
npm login

# 2. Publicar
npm publish --access public

# 3. Ahora cualquiera puede instalar
npm install -g @yourname/code-cli
```

## ⚙️ Configuración

### API Keys

Crea un archivo `.env` en la raíz:

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LOCAL_LLM_URL=http://localhost:8000
```

O configura variables de entorno:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Config File

La primera vez que ejecutes el CLI, se creará:
- **Linux/Mac:** `~/.config/code-cli/config.json`
- **Windows:** `%APPDATA%\code-cli\config.json`

Puedes editarlo manualmente:

```json
{
  "defaultModel": "local",
  "models": {
    "local": {
      "type": "local",
      "url": "http://localhost:8000"
    }
  }
}
```

## ✅ Verificar Instalación

```bash
# Ver versión
code-cli --version

# Ver ayuda
code-cli --help

# Iniciar
code-cli
```

## 🐛 Troubleshooting

### Error: "command not found: code-cli"

Después de `npm link`, recarga tu terminal:
```bash
source ~/.bashrc  # o ~/.zshrc
# En Windows, cierra y abre la terminal
```

### Error: "Cannot find module"

Asegúrate de compilar primero:
```bash
npm run build
```

### Error: "Permission denied"

En Linux/Mac, usa sudo:
```bash
sudo npm link
```

### Desarrollo Activo

Si estás modificando el código:

```bash
# Terminal 1: Watch mode (recompila automáticamente)
npm run dev

# Terminal 2: Ejecuta el CLI
node dist/index.js
```

## 🔄 Actualizar

```bash
cd code-cli
git pull  # Si usas git
npm install
npm run build
```

Si instalaste con `npm link`, los cambios se reflejan automáticamente.

## 🗑️ Desinstalar

```bash
# Si usaste npm link
npm unlink -g code-cli

# Si instalaste globalmente
npm uninstall -g @yourname/code-cli
```

## 📝 Siguiente Paso

Después de instalar, lee [QUICKSTART.md](./QUICKSTART.md) para empezar a usar el CLI.
