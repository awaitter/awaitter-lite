# Archivos Restantes por Crear

El CLI ya tiene la estructura principal. Faltan crear estos archivos:

## 📁 src/tools/

Crea `src/tools/ToolManager.ts` y las herramientas individuales. Puedes copiar la lógica de `LLM/cli/tools/` (Python) y convertirla a TypeScript.

### ToolManager.ts

```typescript
export class ToolManager {
  // Gestiona todas las herramientas
  // - getToolSchemas(): devuelve schemas para function calling
  // - executeTool(name, args): ejecuta una herramienta
  // - getTool(name): obtiene herramienta por nombre
}
```

### Herramientas a crear:

1. **ReadTool.ts** - Leer archivos
2. **WriteTool.ts** - Escribir archivos
3. **EditTool.ts** - Editar archivos (string replacement)
4. **BashTool.ts** - Ejecutar comandos shell
5. **GlobTool.ts** - Buscar archivos por patrón
6. **GrepTool.ts** - Buscar en contenido de archivos

Cada herramienta debe implementar:
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: any;  // JSON Schema
  execute(args: any): Promise<string>;
  needsConfirmation(config: Config): boolean;
}
```

## 📁 src/models/

Crea `src/models/ModelManager.ts` y los providers:

### ModelManager.ts

```typescript
export class ModelManager {
  private currentModel: any;
  private currentModelName: string;

  setModel(name: string): void {
    // Inicializa el modelo según tipo
    // local, openai, anthropic, google
  }

  async chat(messages: any[], tools?: any[]): Promise<any> {
    return this.currentModel.chat(messages, tools);
  }

  getCurrentModelName(): string {
    return this.currentModelName;
  }
}
```

### Providers a crear:

1. **LocalModel.ts** - Tu LLM local (OpenAI API compatible)
2. **OpenAIModel.ts** - GPT-4
3. **AnthropicModel.ts** - Claude
4. **GoogleModel.ts** - Gemini (opcional)

## 🚀 Atajos

### Opción 1: Copiar desde Python

Ya tienes toda la lógica en `LLM/cli/` (Python). Puedes:

1. Copiar la lógica de cada tool
2. Convertir de Python a TypeScript
3. Adaptar imports y sintaxis

### Opción 2: Usar IA

Pídele a tu LLM local o GPT-4:

```
Lee LLM/cli/tools/read.py y conviértelo a TypeScript como src/tools/ReadTool.ts
```

### Opción 3: Implementación Mínima

Para testing rápido, crea versiones simplificadas:

```typescript
// src/tools/ReadTool.ts
import * as fs from 'fs';
import * as path from 'path';

export class ReadTool {
  name = 'read';
  description = 'Read file contents';
  parameters = {
    file_path: { type: 'string', description: 'File to read' }
  };

  async execute({ file_path }: any): Promise<string> {
    const fullPath = path.join(this.workingDir, file_path);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return content;
  }

  needsConfirmation() { return false; }
}
```

## ✅ Archivos Completados

Ya están listos:
- ✅ package.json
- ✅ tsconfig.json
- ✅ src/index.ts
- ✅ src/config/Config.ts
- ✅ src/cli/CodeCLI.ts
- ✅ src/agent/Agent.ts
- ✅ bin/code-cli.js

## 🔨 Para Compilar y Probar

```bash
# 1. Crear archivos faltantes (tools y models)

# 2. Compilar
npm run build

# 3. Probar localmente
node dist/index.js

# 4. O instalar globalmente
npm link
code-cli
```

## 💡 Recomendación

Por ahora, **copia la estructura exacta de la versión Python** (`LLM/cli/`) y adáptala a TypeScript. La lógica es idéntica, solo cambia la sintaxis.

¿Quieres que cree los archivos restantes o prefieres hacerlo tú basándote en la versión Python?
