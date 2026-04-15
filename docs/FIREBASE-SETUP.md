# 🔥 Configuración de Firebase

Para habilitar la **sincronización entre dispositivos**, necesitas configurar Firebase:

## 🚀 Pasos para Configurar Firebase

### 1. **Crear Proyecto en Firebase**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto llamado "gestion-gastos-hogar"
3. **No** habilites Google Analytics (opcional)

### 2. **Configurar Firestore Database**
1. En el menú lateral, ve a **"Build" > "Firestore Database"**
2. Clic en **"Create database"**
3. **Importante**: Selecciona **"Start in production mode"**
4. Elige la región más cercana (por ejemplo: us-central1)

### 3. **Configurar Reglas de Seguridad**
Ve a la pestaña **"Rules"** en Firestore y pega esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso con userKey válida
    match /users/{userId}/{collection}/{document=**} {
      allow read, write: if resource == null || 
        resource.data.userKey == request.query.userKey ||
        request.resource.data.userKey is string;
    }
  }
}
```

### 4. **Crear App Web**
1. Ve a **"Project Settings"** (ícono de engranaje)
2. En la sección **"Your apps"**, clic en **"Add app"**
3. Selecciona **"Web"** (ícono </>)
4. Nombre: "Gestión Gastos Web"
5. **No** configures Firebase Hosting aún
6. Clic en **"Register app"**

### 5. **Copiar Configuración**
Copia el objeto `firebaseConfig` que aparece:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key-aqui",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

### 6. **Actualizar tu App**
1. Abre el archivo `js/firebase-config.js`
2. Reemplaza la configuración de ejemplo con la tuya
3. ¡Listo! 🎉

## ✅ **Después de Configurar:**
- ✅ Sincronización automática entre dispositivos
- ✅ Backup en la nube
- ✅ Trabajo offline con sincronización posterior
- ✅ Gratis hasta 1GB de datos

## 📱 **Sin Firebase:**
La app funciona perfectamente usando **localStorage**:
- ❌ No sincroniza entre dispositivos
- ✅ Funciona completamente offline
- ✅ Datos seguros en tu navegador
- ✅ Exportación/importación manual

## 🆘 **¿Problemas?**
Si tienes algún error:
1. Verifica que las reglas de Firestore estén correctas
2. Asegúrate de que el `projectId` sea correcto
3. Revisa la consola del navegador para errores
4. La app funcionará con localStorage mientras tanto