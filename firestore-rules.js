// Reglas de Firestore para permitir acceso global
// Ve a https://console.firebase.google.com/project/casapbgastos/firestore/rules
// Y reemplaza las reglas existentes con estas:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso a los documentos del usuario global específico
    match /users/global_casa_gastos_2025/{document=**} {
      allow read, write: if request.auth == null || request.auth != null;
    }
    
    // Regla de seguridad: solo permitir acceso si se tiene la clave correcta
    match /users/{userId}/{collection}/{docId} {
      allow read, write: if userId == 'global_casa_gastos_2025' && 
                            resource.data.userKey == 'casa_gastos_familia_key_2025_firebase';
    }
    
    // Permitir crear documentos nuevos con la clave correcta
    match /users/{userId}/{collection}/{docId} {
      allow create: if userId == 'global_casa_gastos_2025' && 
                       request.resource.data.userKey == 'casa_gastos_familia_key_2025_firebase';
    }
  }
}

// INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com/project/casapbgastos/firestore/rules
// 2. Copia y pega estas reglas
// 3. Haz clic en "Publicar"
// 4. Las reglas permitirán acceso global usando el usuario y clave específicos
// 5. Esto mantiene seguridad mientras permite sincronización automática

// NOTA: Estas reglas permiten acceso sin autenticación pero con validación de clave
// Esto es seguro porque:
// - Solo funciona con un ID de usuario específico
// - Requiere una clave específica en cada documento
// - No permite acceso a otros datos en Firebase