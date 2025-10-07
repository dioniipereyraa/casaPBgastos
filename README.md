# 🏠 Gestión de Gastos del Hogar

Una aplicación web moderna y fácil de usar para gestionar las finanzas domésticas. Controla tus ingresos, gastos y mantén un balance actualizado de tu economía familiar.

## ✨ Características

### 📊 Balance en Tiempo Real
- **Resumen visual** del estado financiero actual
- **Total de ingresos** y gastos claramente diferenciados
- **Balance automático** que se actualiza con cada transacción
- **Indicadores de color** para balance positivo (verde) o negativo (rojo)

### 🧾 Procesamiento Inteligente de Facturas (NUEVO)
- **Subir facturas** arrastrando y soltando archivos
- **Extracción automática** de datos usando ChatGPT-4o-mini
- **Formatos soportados**: JPG, PNG, PDF (hasta 10MB)
- **Análisis inteligente** que detecta: monto, fecha, establecimiento, categoría
- **Edición manual** de datos extraídos antes de confirmar
- **Historial visual** de facturas procesadas

### 💰 Gestión de Ingresos
- Agregar ingresos con descripción, monto, fecha y categoría
- **Categorías predefinidas**: Salario, Freelance, Inversiones, Alquiler, Otros
- **Validación de datos** para evitar errores
- **Edición y eliminación** de registros existentes

### 💸 Control de Gastos
- Registro detallado de todos los gastos
- **Categorías organizadas**: Alimentación, Transporte, Vivienda, Servicios, Salud, Entretenimiento, Ropa, Educación, Otros
- **Interfaz intuitiva** para agregar gastos rápidamente
- **Gestión completa** de transacciones (editar/eliminar)

### 💾 Persistencia de Datos
- **Almacenamiento local** automático usando localStorage
- **Los datos se mantienen** entre sesiones del navegador
- **No requiere servidor** ni base de datos externa
- **Funciona offline** completamente

### 📱 Diseño Responsive
- **Adaptado para móviles** y tablets
- **Interfaz moderna** con diseño limpio
- **Iconos Font Awesome** para mejor experiencia visual
- **Animaciones suaves** y transiciones

## 🚀 Cómo Usar

### Configuración Inicial
1. Descarga o clona este repositorio
2. Abre el archivo `index.html` en tu navegador web
3. Ve a la pestaña "Subir Facturas" si quieres usar IA
4. Configura tu API Key de OpenAI (opcional pero recomendado)

### 🧾 Subir y Procesar Facturas (IA)
1. Ve a la pestaña **"Subir Facturas"**
2. **Configura tu API Key**:
   - Consigue una API Key en [OpenAI](https://platform.openai.com/api-keys)
   - Pégala en el campo correspondiente
   - Haz clic en "Guardar Configuración"
3. **Sube tus facturas**:
   - Arrastra y suelta archivos (JPG, PNG, PDF)
   - O haz clic para seleccionar archivos
4. **Revisa los datos extraídos**:
   - ChatGPT analizará automáticamente la factura
   - Podrás editar los datos si es necesario
   - Confirma para agregar la transacción

### Agregar un Ingreso Manualmente
1. En la pestaña **"Dashboard"**, haz clic en **"Agregar Ingreso"**
2. Completa los campos:
   - **Descripción**: Ej. "Salario mensual", "Trabajo freelance"
   - **Monto**: Cantidad en euros
   - **Fecha**: Fecha del ingreso
   - **Categoría**: Selecciona la categoría apropiada
3. Haz clic en **"Guardar Ingreso"**

### Registrar un Gasto Manualmente
1. En la pestaña **"Dashboard"**, haz clic en **"Agregar Gasto"**
2. Rellena los datos:
   - **Descripción**: Ej. "Compra supermercado", "Gasolina"
   - **Monto**: Cantidad gastada
   - **Fecha**: Fecha del gasto
   - **Categoría**: Elige la categoría correspondiente
3. Haz clic en **"Guardar Gasto"**

### Gestionar Transacciones
- **Editar**: Haz clic en el icono de lápiz para modificar una transacción
- **Eliminar**: Haz clic en el icono de papelera para eliminar un registro
- **Vista**: Las transacciones se ordenan por fecha (más recientes primero)

## 🏗️ Estructura del Proyecto

```
appCasagastosDef/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos de la aplicación
├── js/
│   └── app.js              # Lógica de la aplicación
├── assets/                 # Recursos adicionales
├── components/             # Componentes futuros
└── README.md              # Este archivo
```

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica y accesible
- **CSS3**: Diseño moderno con Flexbox y Grid
- **JavaScript (ES6+)**: Lógica de aplicación con clases y módulos
- **OpenAI ChatGPT API**: Inteligencia artificial para procesar facturas
- **Font Awesome**: Iconos profesionales
- **Google Fonts (Inter)**: Tipografía moderna
- **LocalStorage API**: Persistencia de datos local
- **File API**: Manejo de archivos e imágenes
- **Canvas API**: Procesamiento de imágenes

## 🎨 Características de Diseño

### Paleta de Colores
- **Primario**: Azul (#2563eb) - Para elementos principales
- **Éxito**: Verde (#10b981) - Para ingresos y confirmaciones
- **Peligro**: Rojo (#ef4444) - Para gastos y alertas
- **Secundario**: Grises - Para elementos de soporte

### Tipografía
- **Fuente**: Inter - Legible y moderna
- **Jerarquía**: Tamaños y pesos diferenciados
- **Responsive**: Se adapta a diferentes tamaños de pantalla

### Componentes
- **Tarjetas**: Con sombras sutiles y bordes redondeados
- **Botones**: Estados hover y focus bien definidos
- **Formularios**: Campos claros con validación visual
- **Alertas**: Notificaciones animadas no intrusivas

## 📊 Funcionalidades Avanzadas

### Validaciones
- **Campos obligatorios**: Todos los campos son requeridos
- **Montos positivos**: No se permiten valores negativos o cero
- **Formato de fecha**: Validación automática de fechas
- **Longitud de texto**: Límites apropiados para descripciones

### Experiencia de Usuario
- **Feedback visual**: Alertas de confirmación para todas las acciones
- **Navegación fluida**: Scroll automático a formularios
- **Estado vacío**: Mensaje amigable cuando no hay transacciones
- **Accesibilidad**: Soporte para lectores de pantalla y navegación por teclado

### Persistencia
- **Guardado automático**: Cada transacción se guarda inmediatamente
- **Recuperación de datos**: Los datos se cargan al abrir la aplicación
- **Identificadores únicos**: Cada transacción tiene un ID único
- **Orden cronológico**: Las transacciones se muestran por fecha

## 🔧 Métodos de Desarrollo Disponibles

La aplicación incluye métodos adicionales para desarrollo y debugging:

```javascript
// Obtener estadísticas completas
gestorFinanzas.obtenerEstadisticas();

// Exportar datos a archivo JSON
gestorFinanzas.exportarDatos();

// Limpiar todos los datos (con confirmación)
gestorFinanzas.limpiarDatos();
```

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome/Chromium (v80+)
- ✅ Firefox (v75+)
- ✅ Safari (v13+)
- ✅ Edge (v80+)

### Dispositivos
- ✅ **Desktop**: Experiencia completa
- ✅ **Tablet**: Diseño adaptado
- ✅ **Móvil**: Interfaz optimizada para pantallas pequeñas

## 🔒 Privacidad y Datos

- **100% Local**: Todos los datos se almacenan en tu navegador
- **Sin servidor**: No se envía información a servidores externos
- **Control total**: Tú tienes el control completo de tus datos
- **Sin cookies**: No se utilizan cookies de seguimiento

## 🚀 Futuras Mejoras

### Versión 2.0 (Planificado)
- [ ] **Gráficos y estadísticas** visuales
- [ ] **Categorías personalizadas** definidas por el usuario
- [ ] **Filtros por fecha** y categoría
- [ ] **Exportación a CSV/PDF** de reportes
- [ ] **Metas de ahorro** y seguimiento
- [ ] **Calculadora de presupuesto** mensual

### Versión 2.1 (Ideas)
- [ ] **Modo oscuro** para la interfaz
- [ ] **Recordatorios** de gastos recurrentes
- [ ] **Comparativas mensuales** y anuales
- [ ] **Respaldo en la nube** opcional
- [ ] **App móvil** nativa

## 🤝 Contribuir

Si quieres mejorar esta aplicación:

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y commits (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Puedes usarlo, modificarlo y distribuirlo libremente.

## 💡 Soporte

Si encuentras algún problema o tienes sugerencias:
- Abre un issue en el repositorio
- Describe detalladamente el problema
- Incluye capturas de pantalla si es necesario

---

**¡Desarrollado con ❤️ para ayudarte a gestionar mejor las finanzas de tu hogar!**# casaPBgastos
