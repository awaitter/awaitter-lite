# 🚀 Quick Start - Code CLI

Tu clon de Claude Code está listo! Aquí tienes todo lo que necesitas saber.

## ✅ Instalación Completa

El CLI ya está instalado globalmente. Puedes usarlo desde cualquier directorio.

## 💻 Cómo Usar

### 1. Inicia tu LLM local

Primero asegúrate de que tu servidor de LLM esté corriendo:

```bash
# En otra terminal, desde el directorio LLM
cd ../
python api/server.py
```

### 2. Usa el CLI

```bash
# Opción 1: Comando completo
code-cli

# Opción 2: Alias corto
cc

# Con modelo específico
code-cli --model local
code-cli --model gpt4
code-cli --model claude

# En un proyecto específico
code-cli --directory /path/to/project
```

## 📝 Ejemplos de Uso

### Ejemplo 1: Leer y Analizar

```
> Lee el archivo package.json y explica qué hace este proyecto

[El CLI leerá el archivo y te explicará]
```

### Ejemplo 2: Crear Archivos

```
> Crea un servidor Express.js simple en server.js con un endpoint /hello

[El CLI creará el archivo automáticamente]
```

### Ejemplo 3: Editar Código

```
> Refactoriza la función main() en app.ts para usar async/await

[El CLI leerá, modificará y guardará los cambios]
```

### Ejemplo 4: Buscar en Proyecto

```
> Encuentra todos los archivos TypeScript en src/ y lista sus exports

[El CLI buscará y analizará los archivos]
```

### Ejemplo 5: Ejecutar Comandos

```
> Ejecuta npm test y si hay errores, analízalos

[El CLI ejecutará el comando y procesará los resultados]
```

### Ejemplo 6: Proyecto Completo

```
> Crea un proyecto React TypeScript con:
  - Componente de login con validación
  - Context de autenticación
  - Custom hook useAuth
  - Tests con Vitest
  - README con instrucciones

[El CLI creará toda la estructura del proyecto]
```

## 🎛️ Comandos Internos

Una vez dentro del CLI:

```
/help         - Ver ayuda completa
/models       - Listar modelos disponibles
/models local - Cambiar a modelo local
/models gpt4  - Cambiar a GPT-4
/context      - Ver información de contexto
/clear        - Limpiar conversación
/save         - Guardar conversación
/load <file>  - Cargar conversación
/tools        - Ver herramientas disponibles
/exit         - Salir
```

## ⚙️ Configuración

### Ubicación del Config

- **Windows:** `%APPDATA%\code-cli\config.json`
- **Mac/Linux:** `~/.config/code-cli/config.json`

### Configurar API Keys

Opción 1: Variables de entorno (recomendado)

```bash
# .env en el directorio code-cli
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LOCAL_LLM_URL=http://localhost:8000
```

Opción 2: Editar config.json

```json
{
  "models": {
    "gpt4": {
      "type": "openai",
      "apiKey": "sk-...",
      "model": "gpt-4-turbo"
    },
    "claude": {
      "type": "anthropic",
      "apiKey": "sk-ant-...",
      "model": "claude-3-5-sonnet-20241022"
    }
  }
}
```

### Personalizar Comportamiento

Edita `config.json`:

```json
{
  "defaultModel": "local",  // Modelo por defecto

  "ui": {
    "streaming": true,       // Respuestas en tiempo real
    "showToolCalls": true    // Mostrar herramientas usadas
  },

  "safety": {
    "confirmBash": true,     // Confirmar comandos shell
    "confirmWrite": false,   // Confirmar escritura de archivos
    "confirmEdit": false     // Confirmar ediciones
  },

  "tools": {
    "read": true,
    "write": true,
    "edit": true,
    "bash": true,           // ← Deshabilitar si no quieres ejecutar comandos
    "glob": true,
    "grep": true
  }
}
```

## 🔄 Cambiar entre Modelos

Puedes cambiar de modelo en cualquier momento:

```
> /models
📦 Available Models:

→ local (local)
  gpt4 (openai)
  claude (anthropic)

> /models gpt4
✅ Switched to model: gpt4

> Ahora escribe código con GPT-4
```

## 💡 Tips

### 1. Mantén Contexto

El CLI recuerda toda tu conversación:

```
> Lee main.ts
> Ahora refactoriza esa función
> Y escribe tests para ella
```

### 2. Usa Modelos Según Tarea

- **Local**: Tareas rápidas, iteración rápida
- **GPT-4**: Tareas complejas, mejor razonamiento
- **Claude**: Análisis de código extenso, refactoring

### 3. Guardar Sesiones

```
> /save proyecto-auth
✅ Conversation saved: ./conversations/proyecto-auth.json

# Más tarde...
> /load proyecto-auth.json
✅ Loaded 15 messages
```

## 🐛 Troubleshooting

### Error: "Model not loaded"

Tu LLM local no está corriendo:

```bash
cd ..
python api/server.py
```

### Error: "OpenAI API key not found"

Configura tu API key:

```bash
export OPENAI_API_KEY="sk-..."
# o edita config.json
```

### Error: "command not found: code-cli"

Reinstala globalmente:

```bash
cd code-cli
npm run build
npm link
```

### El CLI no ejecuta comandos

Verifica que `bash` tool esté habilitado en config.json:

```json
{
  "tools": {
    "bash": true
  }
}
```

## 🎯 Comparación con Claude Code

### ✅ Características Implementadas

- Interfaz similar con colores y formato
- Herramientas: Read, Write, Edit, Bash, Glob, Grep
- Sistema de agentes con function calling
- Multi-modelo (local, GPT-4, Claude)
- Gestión de contexto
- Guardar/cargar conversaciones

### 🚧 Diferencias

- Claude Code usa Anthropic API directamente
- Este CLI te permite usar tu LLM local (sin límites!)
- Puedes cambiar entre modelos en cualquier momento
- 100% código abierto y personalizable

## 📚 Siguientes Pasos

1. **Pruébalo**: Crea un proyecto pequeño
2. **Personaliza**: Ajusta config.json a tu gusto
3. **Extiende**: Agrega nuevas herramientas si lo necesitas
4. **Comparte**: Publica en npm si quieres

## 🎉 ¡Listo!

Ya tienes tu propio clon de Claude Code que funciona con tu LLM local.

```bash
# Simplemente ejecuta
code-cli

# Y empieza a programar sin límites!
```
