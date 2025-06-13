# 🎨 Guía Completa de Variables CSS
## WhatsApp Voice Assistant - Color System

Esta guía te ayuda a identificar qué variable CSS controla el color de cada elemento en la aplicación.

---

## 🏗️ **ESTRUCTURA PRINCIPAL**

### **🖼️ Fondos Principales**
```css
--color-background: #0b141a        /* Fondo general de la app */
--color-surface: #111b21           /* Fondo de cards/containers */
--color-surface-secondary: #202c33  /* Fondo de header/footer */
--color-surface-tertiary: #2a3942   /* Fondo de elementos hover */
```

**¿Dónde se usan?**
- `--color-background` → `body`, `.app-container`
- `--color-surface` → `.message-form`, `.call-container`
- `--color-surface-secondary` → `.app-header`, `.message-input-container`, `.control-btn`
- `--color-surface-tertiary` → `.control-btn:hover`, `.mute-btn`

---

## 💬 **MENSAJES / CHAT**

### **🗨️ Burbujas de Usuario (Tú)**
```css
--bubble-bg-user: #005c4b           /* Fondo del mensaje del usuario */
--bubble-bg-user-hover: #056c5a     /* Hover del mensaje del usuario */
--bubble-text-user: #e9edef         /* Texto del mensaje del usuario */
```

**¿Dónde se usan?**
- `.message-bubble.user { background-color: var(--bubble-bg-user) }`
- `.message-bubble.user:hover { background-color: var(--bubble-bg-user-hover) }`
- `.message-bubble.user { color: var(--bubble-text-user) }`

### **🤖 Burbujas del Bot (Asistente)**
```css
--bubble-bg-bot: #202c33             /* Fondo del mensaje del bot */
--bubble-bg-bot-hover: #2a3942       /* Hover del mensaje del bot */
--bubble-text-bot: #e9edef           /* Texto del mensaje del bot */
```

**¿Dónde se usan?**
- `.message-bubble.bot { background-color: var(--bubble-bg-bot) }`
- `.message-bubble.bot:hover { background-color: var(--bubble-bg-bot-hover) }`
- `.message-bubble.bot { color: var(--bubble-text-bot) }`

### **⌨️ Typing Indicator**
```css
--bubble-bg-bot: #202c33             /* Fondo del typing indicator */
--text-secondary: #8696a0            /* Color de los puntos animados */
```

**¿Dónde se usan?**
- `.typing-bubble { background-color: var(--bubble-bg-bot) }`
- `.typing-dot { background-color: var(--text-secondary) }`

---

## 📝 **TEXTO Y TIPOGRAFÍA**

### **🔤 Jerarquía de Texto**
```css
--text-primary: #e9edef      /* Texto principal (títulos, nombres) */
--text-secondary: #8696a0    /* Texto secundario (subtítulos, meta) */
--text-tertiary: #667781     /* Texto terciario (placeholders, hints) */
--text-accent: #00a884       /* Texto de acento (enlaces, destacados) */
```

**¿Dónde se usan?**
- `--text-primary` → `.assistant-name`, `.call-title`, títulos principales
- `--text-secondary` → `.connection-status`, `.call-status`, labels secundarios
- `--text-tertiary` → `.text-input::placeholder`, texto de ayuda
- `--text-accent` → links, elementos destacados

### **🎨 Estados de Texto**
```css
--text-error: #ff6b6b        /* Texto de error */
--text-warning: #ffab00      /* Texto de advertencia */
--text-success: #00d856      /* Texto de éxito */
```

**¿Dónde se usan?**
- Error messages, validation feedback
- Warning notifications, alerts
- Success messages, confirmations

---

## 🎯 **ELEMENTOS INTERACTIVOS**

### **🔵 Botones Primarios**
```css
--color-primary: #00a884           /* Fondo de botones principales */
--color-primary-hover: #00c99a     /* Hover de botones principales */
--color-primary-active: #008f6f    /* Active de botones principales */
```

**¿Dónde se usan?**
- `.send-btn { background-color: var(--color-primary) }`
- `.send-btn:hover { background-color: var(--color-primary-hover) }`
- `.audio-btn.enabled { background-color: var(--color-primary) }`

### **🔴 Botones de Peligro**
```css
--color-danger: #ff6b6b             /* Fondo de botones de peligro */
--color-danger-hover: #ff5252       /* Hover de botones de peligro */
```

**¿Dónde se usan?**
- `.hangup-btn { background-color: var(--color-danger) }`
- `.mute-btn.muted { background-color: var(--color-danger) }`

### **⚠️ Botones de Advertencia**
```css
--color-warning: #ffab00            /* Fondo de botones de advertencia */
```

**¿Dónde se usan?**
- Estados de espera, procesamiento
- Indicadores de voice activity "thinking"

---

## 📞 **MODO VOZ**

### **🟢 Voice Activity Indicator**
```css
/* Punto verde principal */
background: rgba(0, 168, 132, 0.9)  /* Verde activo WhatsApp */

/* Estado pensando (amarillo) */
background: rgba(255, 171, 0, 0.9)  /* Amarillo pensando */
```

**¿Dónde se usan?**
- `.voice-activity-content { background: rgba(0, 168, 132, 0.9) }`
- `.voice-activity-content.thinking { background: rgba(255, 171, 0, 0.9) }`

### **🎤 Avatar y Modal**
```css
--color-surface: #111b21            /* Fondo del avatar container */
--color-surface-secondary: #202c33  /* Fondo fallback del avatar */
```

**¿Dónde se usan?**
- `.call-avatar { background-color: var(--color-surface-secondary) }`
- `.call-container { background: rgba(32, 44, 51, 0.95) }`

---

## 🎨 **SISTEMA DE ESTADOS**

### **🔗 Estados de Conexión**
```css
--status-connecting: #ffab00         /* Conectando (amarillo) */
--status-connected: #00d856          /* Conectado (verde) */
--status-error: #ff6b6b              /* Error (rojo) */
```

**¿Dónde se usan?**
- `.status-connecting .status-icon { color: var(--status-connecting) }`
- `.status-connected .status-icon { color: var(--status-connected) }`
- `.status-error .status-icon { color: var(--status-error) }`

### **📶 Calidad de Conexión**
```css
--color-success: #00d856     /* Excelente (verde) */
--color-warning: #ffab00     /* Buena (amarillo) */
--color-danger: #ff6b6b      /* Pobre (rojo) */
```

**¿Dónde se usan?**
- `.quality-excellent { color: var(--color-success) }`
- `.quality-good { color: var(--color-warning) }`
- `.quality-poor { color: var(--color-danger) }`

---

## 🔲 **BORDES Y LÍNEAS**

### **📏 Bordes**
```css
--border-color: #313d45              /* Bordes principales */
--border-color-light: rgba(255, 255, 255, 0.1)  /* Bordes sutiles */
--divider-color: #313d45             /* Líneas divisorias */
```

**¿Dónde se usan?**
- `.app-header { border-bottom: 1px solid var(--border-color) }`
- `.message-input-container { border-top: 1px solid var(--border-color) }`
- `.call-container { border: 1px solid var(--border-color-light) }`

---

## 🌟 **NOTIFICACIONES Y TOASTS**

### **🎯 Toast Colors**
```css
/* Success Toast */
background: #00d856

/* Error Toast */
background: #ff6b6b

/* Warning Toast */
background: #ffab00

/* Info Toast */
background: #00a884
```

**¿Dónde se usan?**
- Se aplican dinámicamente en JavaScript
- `.toast.success { background: #00d856 }`
- `.toast.error { background: #ff6b6b }`

---

## 🌓 **MODO CLARO (Light Mode)**

Cuando `prefers-color-scheme: light`:

```css
--color-background: #f0f2f5          /* Fondo claro */
--color-surface: #ffffff             /* Superficie blanca */
--bubble-bg-user: #d9fdd3            /* Burbujas usuario verdes claras */
--bubble-bg-bot: #ffffff             /* Burbujas bot blancas */
--text-primary: #111b21              /* Texto oscuro */
```

---

## 🛠️ **CÓMO PERSONALIZAR**

### **✏️ Cambiar Color de Burbujas del Usuario**
```css
:root {
  --bubble-bg-user: #your-color;      /* Nuevo color de fondo */
  --bubble-text-user: #your-text;     /* Nuevo color de texto */
}
```

### **🎨 Cambiar Color Primario (Botones)**
```css
:root {
  --color-primary: #your-primary;
  --color-primary-hover: #your-hover;
}
```

### **🌈 Cambiar Tema Completo**
```css
:root {
  /* Oscuro → Claro */
  --color-background: #ffffff;
  --color-surface: #f5f5f5;
  --text-primary: #000000;
  --text-secondary: #666666;
}
```

---

## 📍 **REFERENCIA RÁPIDA**

| **Elemento** | **Variable CSS** | **Valor** |
|--------------|------------------|-----------|
| Fondo app | `--color-background` | `#0b141a` |
| Header | `--color-surface-secondary` | `#202c33` |
| Mensaje usuario | `--bubble-bg-user` | `#005c4b` |
| Mensaje bot | `--bubble-bg-bot` | `#202c33` |
| Botón enviar | `--color-primary` | `#00a884` |
| Botón colgar | `--color-danger` | `#ff6b6b` |
| Texto principal | `--text-primary` | `#e9edef` |
| Typing dots | `--text-secondary` | `#8696a0` |
| Voice activity | `rgba(0, 168, 132, 0.9)` | Verde |
| Conexión buena | `--status-connected` | `#00d856` |

---

## 🎯 **TIPS DE PERSONALIZACIÓN**

1. **Mantén el contraste**: Asegúrate de que el texto sea legible
2. **Usa HSL para variaciones**: `hsl(160, 100%, 33%)` para generar tonos
3. **Testa en modo claro y oscuro**: Algunos usuarios pueden tener preferencias diferentes
4. **Prueba con daltonismo**: Usa herramientas como Stark o Colour Contrast Analyser

Esta guía te permite identificar exactamente qué cambiar para personalizar cualquier color en la aplicación! 🎨
