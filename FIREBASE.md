# Configuración de Firebase para Gestión de Gastos

## Configuración Requerida

Para habilitar la sincronización entre dispositivos, necesitas configurar Firebase:

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto llamado "gestion-gastos-hogar"
3. Habilita Firestore Database
4. Configura las reglas de seguridad

### 2. Configuración de Firestore

Reglas de seguridad recomendadas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso solo con userKey válida
    match /users/{userId}/expenses/{document=**} {
      allow read, write: if request.auth != null || 
        resource.data.userKey == request.query.userKey;
    }
    match /users/{userId}/incomes/{document=**} {
      allow read, write: if request.auth != null || 
        resource.data.userKey == request.query.userKey;
    }
    match /users/{userId}/invoices/{document=**} {
      allow read, write: if request.auth != null || 
        resource.data.userKey == request.query.userKey;
    }
  }
}
```

### 3. Obtener Configuración

En la consola de Firebase:
1. Ve a "Configuración del proyecto"
2. En "Tus apps" crea una nueva "App web"
3. Copia la configuración que se genera

### 4. Variables de Entorno

La configuración se guardará en `js/firebase-config.js`:

```javascript
// Reemplaza con tu configuración real
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

## Estructura de Datos en Firestore

```
users/
  {userId}/
    profile/
      - created: timestamp
      - lastSync: timestamp
    expenses/
      {expenseId}/
        - description: string
        - amount: number
        - date: timestamp
        - category: string
        - userKey: string
    incomes/
      {incomeId}/
        - description: string
        - amount: number
        - date: timestamp
        - category: string
        - userKey: string
    invoices/
      {invoiceId}/
        - originalName: string
        - extractedData: object
        - processedDate: timestamp
        - userKey: string
```

## Características

✅ **Sincronización automática entre dispositivos**
✅ **Trabajo offline con sincronización posterior**
✅ **Clave personal para seguridad**
✅ **Backup automático en la nube**
✅ **Límite gratuito: 1GB / 50,000 lecturas diarias**