// Servicio de Base de Datos con Firebase Firestore
class DatabaseService {
    constructor() {
        this.db = null;
        this.userId = null;
        this.userKey = null;
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.syncInProgress = false;
        
        // Escuchar cambios de conectividad
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        this.initializeFirebase();
    }

    async initializeFirebase() {
        try {
            console.log('🚀 Iniciando Firebase...');
            this.showSyncStatus('syncing');

            // Verificar si Firebase está configurado
            if (!window.firebaseConfig || !window.firebaseConfig.apiKey || 
                window.firebaseConfig.apiKey.includes('Example')) {
                console.warn('Firebase no configurado. Usando localStorage únicamente.');
                this.useLocalStorageOnly = true;
                this.showSyncStatus('offline');
                return;
            }

            // Importar Firebase de forma dinámica
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js');
            const { getFirestore, connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js');
            
            // Inicializar Firebase
            const app = initializeApp(window.firebaseConfig);
            this.db = getFirestore(app);
            
            console.log('✅ Firebase inicializado correctamente');
            
            // Obtener o crear usuario
            await this.setupUser();
            
            // Mostrar estado final
            if (this.isOnline) {
                this.showSyncStatus('online');
                console.log('🌍 Sistema global listo - sincronización activa');
            } else {
                this.showSyncStatus('offline');
            }
            
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
            this.useLocalStorageOnly = true;
            this.showSyncStatus('error');
        }
    }

    async setupUser() {
        // ✨ USUARIO GLOBAL COMPARTIDO - Todos ven los mismos datos
        const GLOBAL_USER_ID = 'global_casa_gastos_2025';
        const GLOBAL_USER_KEY = 'casa_gastos_familia_key_2025_firebase';
        
        // Usar siempre el mismo usuario global
        this.userId = GLOBAL_USER_ID;
        this.userKey = GLOBAL_USER_KEY;
        
        // Guardar en localStorage para compatibilidad
        localStorage.setItem('userId', this.userId);
        localStorage.setItem('userKey', this.userKey);
        
        console.log('🌍 Usuario global configurado - Datos compartidos entre todos los dispositivos');
        
        // Configurar listeners de tiempo real si Firebase está disponible
        if (!this.useLocalStorageOnly && this.db) {
            await this.setupRealtimeListeners();
        }
    }

    // Configurar listeners de tiempo real para sincronización automática
    async setupRealtimeListeners() {
        try {
            const { collection, query, where, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js');
            
            // Listener para gastos
            const expensesQuery = query(
                collection(this.db, 'users', this.userId, 'expenses'),
                where('userKey', '==', this.userKey)
            );
            
            this.expensesUnsubscribe = onSnapshot(expensesQuery, (snapshot) => {
                console.log('📱 Cambios detectados en gastos');
                this.handleRealtimeUpdate('expenses', snapshot);
            });

            // Listener para ingresos
            const incomesQuery = query(
                collection(this.db, 'users', this.userId, 'incomes'),
                where('userKey', '==', this.userKey)
            );
            
            this.incomesUnsubscribe = onSnapshot(incomesQuery, (snapshot) => {
                console.log('📱 Cambios detectados en ingresos');
                this.handleRealtimeUpdate('incomes', snapshot);
            });

            console.log('👂 Listeners de tiempo real configurados');
        } catch (error) {
            console.error('Error configurando listeners:', error);
        }
    }

    // Manejar actualizaciones en tiempo real
    handleRealtimeUpdate(collection, snapshot) {
        const data = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        
        // Actualizar localStorage
        this.saveCollectionToLocalStorage(collection, data);
        
        // Notificar a la app que hay cambios
        window.dispatchEvent(new CustomEvent('dataUpdated', { 
            detail: { collection, data } 
        }));
        
        this.showSyncStatus('synced');
        console.log(`✅ Datos actualizados: ${collection} (${data.length} elementos)`);
    }

    generateUserId() {
        // Ya no se usa - mantenido por compatibilidad
        return 'global_casa_gastos_2025';
    }

    generateUserKey() {
        // Ya no se usa - mantenido por compatibilidad
        return 'casa_gastos_familia_key_2025_firebase';
    }

    // Guardar datos con sincronización
    async saveData(collection, data) {
        const id = data.id || Date.now().toString();
        data.id = id;
        data.userKey = this.userKey;
        data.timestamp = new Date();

        try {
            // Guardar en localStorage primero (para funcionamiento offline)
            this.saveToLocalStorage(collection, data);

            // Si Firebase está disponible y online, sincronizar
            if (!this.useLocalStorageOnly && this.isOnline && this.db) {
                await this.saveToFirestore(collection, data);
                console.log(`✅ Datos sincronizados: ${collection}/${id}`);
            } else {
                // Agregar a operaciones pendientes
                this.pendingOperations.push({
                    type: 'save',
                    collection,
                    data: { ...data }
                });
                console.log(`📝 Operación guardada para sincronizar: ${collection}/${id}`);
            }

            return id;
        } catch (error) {
            console.error('Error guardando datos:', error);
            throw error;
        }
    }

    // Cargar datos con sincronización
    async loadData(collection) {
        try {
            // Cargar desde localStorage primero
            const localData = this.loadFromLocalStorage(collection);

            // Si Firebase está disponible, sincronizar
            if (!this.useLocalStorageOnly && this.isOnline && this.db) {
                try {
                    const firebaseData = await this.loadFromFirestore(collection);
                    
                    // Merge de datos (Firebase tiene prioridad)
                    const mergedData = this.mergeData(localData, firebaseData);
                    
                    // Actualizar localStorage con datos merged
                    this.saveCollectionToLocalStorage(collection, mergedData);
                    
                    console.log(`✅ Datos sincronizados desde Firebase: ${collection}`);
                    return mergedData;
                } catch (error) {
                    console.warn('Error cargando desde Firebase, usando localStorage:', error);
                    return localData;
                }
            }

            return localData;
        } catch (error) {
            console.error('Error cargando datos:', error);
            return [];
        }
    }

    // Eliminar datos con sincronización
    async deleteData(collection, id) {
        try {
            // Eliminar de localStorage
            this.deleteFromLocalStorage(collection, id);

            // Si Firebase está disponible y online, sincronizar
            if (!this.useLocalStorageOnly && this.isOnline && this.db) {
                await this.deleteFromFirestore(collection, id);
                console.log(`✅ Eliminado sincronizado: ${collection}/${id}`);
            } else {
                // Agregar a operaciones pendientes
                this.pendingOperations.push({
                    type: 'delete',
                    collection,
                    id
                });
                console.log(`🗑️ Eliminación guardada para sincronizar: ${collection}/${id}`);
            }
        } catch (error) {
            console.error('Error eliminando datos:', error);
            throw error;
        }
    }

    // Operaciones de Firebase
    async saveToFirestore(collection, data) {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js');
        const docRef = doc(this.db, 'users', this.userId, collection, data.id);
        await setDoc(docRef, data, { merge: true });
    }

    async loadFromFirestore(collection) {
        const { collection: firestoreCollection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js');
        
        const q = query(
            firestoreCollection(this.db, 'users', this.userId, collection),
            where('userKey', '==', this.userKey)
        );
        
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        
        return data;
    }

    async deleteFromFirestore(collection, id) {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js');
        const docRef = doc(this.db, 'users', this.userId, collection, id);
        await deleteDoc(docRef);
    }

    // Operaciones de localStorage
    saveToLocalStorage(collection, data) {
        const existing = this.loadFromLocalStorage(collection);
        const index = existing.findIndex(item => item.id === data.id);
        
        if (index >= 0) {
            existing[index] = data;
        } else {
            existing.push(data);
        }
        
        localStorage.setItem(collection, JSON.stringify(existing));
    }

    loadFromLocalStorage(collection) {
        const data = localStorage.getItem(collection);
        return data ? JSON.parse(data) : [];
    }

    deleteFromLocalStorage(collection, id) {
        const existing = this.loadFromLocalStorage(collection);
        const filtered = existing.filter(item => item.id !== id);
        localStorage.setItem(collection, JSON.stringify(filtered));
    }

    saveCollectionToLocalStorage(collection, data) {
        localStorage.setItem(collection, JSON.stringify(data));
    }

    // Utility para merge de datos
    mergeData(localData, firebaseData) {
        const merged = [...firebaseData];
        
        // Agregar elementos locales que no están en Firebase
        localData.forEach(localItem => {
            const existsInFirebase = firebaseData.some(fbItem => fbItem.id === localItem.id);
            if (!existsInFirebase) {
                merged.push(localItem);
            }
        });
        
        return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Manejo de conectividad
    handleOnline() {
        this.isOnline = true;
        console.log('🌐 Conexión restaurada');
        this.syncPendingOperations();
        this.showSyncStatus('online');
    }

    handleOffline() {
        this.isOnline = false;
        console.log('📱 Modo offline');
        this.showSyncStatus('offline');
    }

    // Sincronizar operaciones pendientes
    async syncPendingOperations() {
        if (this.syncInProgress || !this.isOnline || this.useLocalStorageOnly) return;
        
        this.syncInProgress = true;
        this.showSyncStatus('syncing');
        
        try {
            const operations = [...this.pendingOperations];
            this.pendingOperations = [];
            
            for (const operation of operations) {
                try {
                    if (operation.type === 'save') {
                        await this.saveToFirestore(operation.collection, operation.data);
                    } else if (operation.type === 'delete') {
                        await this.deleteFromFirestore(operation.collection, operation.id);
                    }
                } catch (error) {
                    console.error('Error en operación pendiente:', error);
                    // Volver a agregar operación fallida
                    this.pendingOperations.push(operation);
                }
            }
            
            console.log(`✅ ${operations.length} operaciones sincronizadas`);
            this.showSyncStatus('synced');
            
        } catch (error) {
            console.error('Error sincronizando operaciones pendientes:', error);
            this.showSyncStatus('error');
        } finally {
            this.syncInProgress = false;
        }
    }

    // Mostrar estado de sincronización
    showSyncStatus(status) {
        const statusElement = document.getElementById('syncStatus');
        if (!statusElement) return;

        const statusConfig = {
            online: { icon: '🌐', text: 'En línea', class: 'online' },
            offline: { icon: '📱', text: 'Sin conexión', class: 'offline' },
            syncing: { icon: '🔄', text: 'Sincronizando...', class: 'syncing' },
            synced: { icon: '✅', text: 'Sincronizado', class: 'synced' },
            error: { icon: '⚠️', text: 'Error de sincronización', class: 'error' }
        };

        const config = statusConfig[status] || statusConfig.offline;
        statusElement.innerHTML = `${config.icon} ${config.text}`;
        statusElement.className = `sync-status ${config.class}`;
    }

    // Obtener información del usuario
    getUserInfo() {
        return {
            userId: this.userId,
            userKey: this.userKey ? this.userKey.substring(0, 8) + '...' : null,
            isOnline: this.isOnline,
            pendingOperations: this.pendingOperations.length,
            useLocalStorageOnly: this.useLocalStorageOnly
        };
    }

    // Exportar datos para backup
    async exportData() {
        const expenses = await this.loadData('expenses');
        const incomes = await this.loadData('incomes');
        const invoices = await this.loadData('invoices');
        
        return {
            userId: this.userId,
            exportDate: new Date().toISOString(),
            data: { expenses, incomes, invoices }
        };
    }

    // Importar datos desde backup
    async importData(backupData) {
        if (!backupData.data) throw new Error('Formato de backup inválido');
        
        const { expenses, incomes, invoices } = backupData.data;
        
        // Importar cada colección
        if (expenses) {
            for (const expense of expenses) {
                await this.saveData('expenses', expense);
            }
        }
        
        if (incomes) {
            for (const income of incomes) {
                await this.saveData('incomes', income);
            }
        }
        
        if (invoices) {
            for (const invoice of invoices) {
                await this.saveData('invoices', invoice);
            }
        }
        
        console.log('✅ Datos importados correctamente');
    }
}

// Exportar para uso global
window.DatabaseService = DatabaseService;