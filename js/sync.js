// Sistema de Sincronización Simple - Sin Backend
class SincronizacionSimple {
    constructor() {
        this.baseUrl = window.location.origin;
        this.dataPath = '/data/';
        this.intervalSync = null;
        this.init();
    }

    init() {
        this.configurarInterfazSincronizacion();
        this.iniciarRespaldoAutomatico();
    }

    // Configurar interfaz simple
    configurarInterfazSincronizacion() {
        this.crearBotonSincronizacion();
    }

    crearBotonSincronizacion() {
        const header = document.querySelector('.header');
        const syncSection = document.createElement('div');
        syncSection.className = 'sync-section';
        syncSection.innerHTML = `
            <div class="sync-controls">
                <div class="sync-actions">
                    <button class="btn btn-primary" id="exportarDatos">
                        <i class="fas fa-download"></i> Exportar Datos
                    </button>
                    <button class="btn btn-secondary" id="importarDatos">
                        <i class="fas fa-upload"></i> Importar Datos
                    </button>
                </div>
            </div>
            <div class="sync-status" id="syncStatus">
                <small><i class="fas fa-save"></i> Guardado automático activado</small>
            </div>
        `;

        header.appendChild(syncSection);

        // Eventos
        document.getElementById('exportarDatos').addEventListener('click', () => {
            this.exportarDatos();
        });

        document.getElementById('importarDatos').addEventListener('click', () => {
            this.crearInputImportar();
        });
    }

    // Exportar datos
    exportarDatos() {
        const ingresos = JSON.parse(localStorage.getItem('gestorFinanzas_ingresos') || '[]');
        const gastos = JSON.parse(localStorage.getItem('gestorFinanzas_gastos') || '[]');
        
        const datos = {
            ingresos: ingresos,
            gastos: gastos,
            fechaExportacion: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(datos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `finanzas_hogar_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.mostrarEstadoSync('success', 'Datos exportados correctamente');
    }

    // Crear input para importar
    crearInputImportar() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importarDatos(file);
            }
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    // Importar datos
    importarDatos(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const datos = JSON.parse(e.target.result);
                
                if (datos.ingresos && datos.gastos) {
                    if (confirm('¿Quieres reemplazar todos los datos actuales con los datos importados?')) {
                        localStorage.setItem('gestorFinanzas_ingresos', JSON.stringify(datos.ingresos));
                        localStorage.setItem('gestorFinanzas_gastos', JSON.stringify(datos.gastos));
                        
                        // Recargar la aplicación
                        if (window.gestorFinanzas) {
                            window.gestorFinanzas.cargarDatos();
                            window.gestorFinanzas.actualizarBalance();
                        }
                        
                        this.mostrarEstadoSync('success', 'Datos importados correctamente');
                    }
                } else {
                    this.mostrarEstadoSync('error', 'Archivo no válido');
                }
            } catch (error) {
                console.error('Error al importar:', error);
                this.mostrarEstadoSync('error', 'Error al leer el archivo');
            }
        };
        reader.readAsText(file);
    }

    // Respaldo automático
    iniciarRespaldoAutomatico() {
        // Hacer respaldo cada hora
        this.intervalSync = setInterval(() => {
            this.respaldoAutomatico();
        }, 60 * 60 * 1000);
        
        // Hacer respaldo al cerrar la ventana
        window.addEventListener('beforeunload', () => {
            this.respaldoAutomatico();
        });
    }

    respaldoAutomatico() {
        try {
            const ingresos = JSON.parse(localStorage.getItem('gestorFinanzas_ingresos') || '[]');
            const gastos = JSON.parse(localStorage.getItem('gestorFinanzas_gastos') || '[]');
            
            const respaldo = {
                ingresos,
                gastos,
                fechaRespaldo: new Date().toISOString()
            };
            
            localStorage.setItem('gestorFinanzas_respaldo', JSON.stringify(respaldo));
            console.log('Respaldo automático realizado');
        } catch (error) {
            console.error('Error en respaldo automático:', error);
        }
    }

    detenerRespaldoAutomatico() {
        if (this.intervalSync) {
            clearInterval(this.intervalSync);
            this.intervalSync = null;
        }
    }

    mostrarEstadoSync(tipo, mensaje) {
        const statusElement = document.getElementById('syncStatus');
        if (!statusElement) return;

        const iconos = {
            loading: 'fas fa-spinner fa-spin',
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle'
        };

        const colores = {
            loading: '#3b82f6',
            success: '#10b981',
            error: '#ef4444'
        };

        statusElement.innerHTML = `
            <small style="color: ${colores[tipo]}">
                <i class="${iconos[tipo]}"></i> ${mensaje}
            </small>
        `;

        // Volver al estado normal después de 3 segundos
        if (tipo !== 'loading') {
            setTimeout(() => {
                statusElement.innerHTML = `<small><i class="fas fa-save"></i> Guardado automático activado</small>`;
            }, 3000);
        }
    }

    // Método de limpieza simplificado
    limpiarTodosLosDatos() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
            // Eliminar todos los datos
            localStorage.removeItem('gestorFinanzas_ingresos');
            localStorage.removeItem('gestorFinanzas_gastos');
            localStorage.removeItem('gestorFinanzas_respaldo');
            
            // Recargar aplicación
            if (window.gestorFinanzas) {
                window.gestorFinanzas.cargarDatos();
                window.gestorFinanzas.actualizarBalance();
            }
            
            this.mostrarEstadoSync('success', 'Todos los datos eliminados');
        }
    }
}

// Estilos simplificados para la interfaz
const estilosSync = `
.sync-section {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.sync-controls {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5rem;
}

.sync-actions {
    display: flex;
    gap: 0.5rem;
}

.sync-status {
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 768px) {
    .sync-actions {
        flex-direction: column;
        width: 100%;
    }
    
    .sync-actions .btn {
        width: 100%;
        justify-content: center;
    }
}
`;

// Agregar estilos al documento
if (!document.getElementById('syncStyles')) {
    const style = document.createElement('style');
    style.id = 'syncStyles';
    style.textContent = estilosSync;
    document.head.appendChild(style);
}

// Exportar para uso global
window.SincronizacionSimple = SincronizacionSimple;