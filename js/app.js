// Gestión de Gastos del Hogar - JavaScript
class GestorFinanzas {
    constructor() {
        this.ingresos = [];
        this.gastos = [];
        this.database = null;
        this.init();
    }

    async init() {
        // Inicializar base de datos
        this.database = new DatabaseService();
        
        // Esperar a que se inicialice Firebase
        await new Promise(resolve => {
            const checkInit = () => {
                if (this.database.userId) {
                    resolve();
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            checkInit();
        });
        
        await this.cargarDatos();
        this.configurarEventos();
        this.establecerFechaActual();
        this.actualizarBalance();
        this.mostrarEstadoInicial();
        this.mostrarInfoUsuario();
    }

    // Configuración de eventos
    configurarEventos() {
        // Eventos para ingresos
        document.getElementById('btnAddIngreso').addEventListener('click', () => {
            this.mostrarFormulario('formIngreso');
        });

        document.getElementById('cancelarIngreso').addEventListener('click', () => {
            this.ocultarFormulario('formIngreso');
        });

        document.querySelector('#formIngreso form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.agregarIngreso();
        });

        // Eventos para gastos
        document.getElementById('btnAddGasto').addEventListener('click', () => {
            this.mostrarFormulario('formGasto');
        });

        document.getElementById('cancelarGasto').addEventListener('click', () => {
            this.ocultarFormulario('formGasto');
        });

        document.querySelector('#formGasto form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.agregarGasto();
        });
    }

    // Gestión de formularios
    mostrarFormulario(formId) {
        const form = document.getElementById(formId);
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }

    ocultarFormulario(formId) {
        const form = document.getElementById(formId);
        form.style.display = 'none';
        form.querySelector('form').reset();
        this.establecerFechaActual();
    }

    establecerFechaActual() {
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaIngreso').value = hoy;
        document.getElementById('fechaGasto').value = hoy;
    }

    // Gestión de ingresos
    async agregarIngreso() {
        const descripcion = document.getElementById('descripcionIngreso').value.trim();
        const monto = parseFloat(document.getElementById('montoIngreso').value);
        const fecha = document.getElementById('fechaIngreso').value;
        const categoria = document.getElementById('categoriaIngreso').value;

        if (!descripcion || !monto || !fecha || !categoria) {
            this.mostrarAlerta('Por favor, completa todos los campos', 'error');
            return;
        }

        if (monto <= 0) {
            this.mostrarAlerta('El monto debe ser mayor a 0', 'error');
            return;
        }

        const nuevoIngreso = {
            id: this.generarId(),
            descripcion,
            monto,
            fecha,
            categoria,
            tipo: 'ingreso',
            fechaCreacion: new Date().toISOString()
        };

        try {
            // Guardar en base de datos (con sincronización)
            await this.database.saveData('incomes', nuevoIngreso);
            this.ingresos.push(nuevoIngreso);
            
            this.renderizarIngresos();
            this.actualizarBalance();
            this.ocultarFormulario('formIngreso');
            this.mostrarAlerta('Ingreso agregado exitosamente', 'success');
        } catch (error) {
            this.mostrarAlerta('Error al guardar el ingreso', 'error');
            console.error('Error:', error);
        }
    }

    // Gestión de gastos
    async agregarGasto() {
        const descripcion = document.getElementById('descripcionGasto').value.trim();
        const monto = parseFloat(document.getElementById('montoGasto').value);
        const fecha = document.getElementById('fechaGasto').value;
        const categoria = document.getElementById('categoriaGasto').value;

        if (!descripcion || !monto || !fecha || !categoria) {
            this.mostrarAlerta('Por favor, completa todos los campos', 'error');
            return;
        }

        if (monto <= 0) {
            this.mostrarAlerta('El monto debe ser mayor a 0', 'error');
            return;
        }

        const nuevoGasto = {
            id: this.generarId(),
            descripcion,
            monto,
            fecha,
            categoria,
            tipo: 'gasto',
            fechaCreacion: new Date().toISOString()
        };

        try {
            // Guardar en base de datos (con sincronización)
            await this.database.saveData('expenses', nuevoGasto);
            this.gastos.push(nuevoGasto);
            
            this.renderizarGastos();
            this.actualizarBalance();
            this.ocultarFormulario('formGasto');
            this.mostrarAlerta('Gasto agregado exitosamente', 'success');
        } catch (error) {
            this.mostrarAlerta('Error al guardar el gasto', 'error');
            console.error('Error:', error);
        }
    }

    // Renderizado de listas
    renderizarIngresos() {
        const lista = document.getElementById('listaIngresos');
        lista.innerHTML = '';

        if (this.ingresos.length === 0) {
            lista.innerHTML = `
                <div class="empty-message">
                    <p>No hay ingresos registrados aún.</p>
                </div>
            `;
            return;
        }

        // Ordenar por fecha (más reciente primero)
        const ingresosOrdenados = this.ingresos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        ingresosOrdenados.forEach(ingreso => {
            const elemento = this.crearElementoTransaccion(ingreso);
            lista.appendChild(elemento);
        });
    }

    renderizarGastos() {
        const lista = document.getElementById('listaGastos');
        lista.innerHTML = '';

        if (this.gastos.length === 0) {
            lista.innerHTML = `
                <div class="empty-message">
                    <p>No hay gastos registrados aún.</p>
                </div>
            `;
            return;
        }

        // Ordenar por fecha (más reciente primero)
        const gastosOrdenados = this.gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        gastosOrdenados.forEach(gasto => {
            const elemento = this.crearElementoTransaccion(gasto);
            lista.appendChild(elemento);
        });
    }

    crearElementoTransaccion(transaccion) {
        const template = document.getElementById('transactionTemplate');
        const elemento = template.content.cloneNode(true);

        // Configurar contenido
        elemento.querySelector('.transaction-description').textContent = transaccion.descripcion;
        elemento.querySelector('.transaction-amount').textContent = this.formatearMoneda(transaccion.monto);
        elemento.querySelector('.transaction-category').textContent = this.obtenerNombreCategoria(transaccion.categoria);
        elemento.querySelector('.transaction-date').textContent = this.formatearFecha(transaccion.fecha);

        // Aplicar clase de tipo
        const montoElement = elemento.querySelector('.transaction-amount');
        montoElement.classList.add(transaccion.tipo === 'ingreso' ? 'income' : 'expense');

        // Configurar botones
        const btnEditar = elemento.querySelector('.btn-edit');
        const btnEliminar = elemento.querySelector('.btn-delete');

        btnEditar.addEventListener('click', () => {
            this.editarTransaccion(transaccion);
        });

        btnEliminar.addEventListener('click', () => {
            this.eliminarTransaccion(transaccion);
        });

        return elemento;
    }

    // Gestión de transacciones
    editarTransaccion(transaccion) {
        const nuevaDescripcion = prompt('Nueva descripción:', transaccion.descripcion);
        if (nuevaDescripcion === null) return;

        const nuevoMonto = prompt('Nuevo monto:', transaccion.monto);
        if (nuevoMonto === null) return;

        const montoNum = parseFloat(nuevoMonto);
        if (isNaN(montoNum) || montoNum <= 0) {
            this.mostrarAlerta('Monto inválido', 'error');
            return;
        }

        // Actualizar transacción
        transaccion.descripcion = nuevaDescripcion.trim();
        transaccion.monto = montoNum;

        this.guardarDatos();
        if (transaccion.tipo === 'ingreso') {
            this.renderizarIngresos();
        } else {
            this.renderizarGastos();
        }
        this.actualizarBalance();
        this.mostrarAlerta('Transacción actualizada', 'success');
    }

    async eliminarTransaccion(transaccion) {
        if (!confirm(`¿Estás seguro de que quieres eliminar "${transaccion.descripcion}"?`)) {
            return;
        }

        try {
            // Eliminar de la base de datos
            const collection = transaccion.tipo === 'ingreso' ? 'incomes' : 'expenses';
            await this.database.deleteData(collection, transaccion.id);

            // Eliminar del array local
            if (transaccion.tipo === 'ingreso') {
                this.ingresos = this.ingresos.filter(i => i.id !== transaccion.id);
                this.renderizarIngresos();
            } else {
                this.gastos = this.gastos.filter(g => g.id !== transaccion.id);
                this.renderizarGastos();
            }

            this.actualizarBalance();
            this.mostrarAlerta('Transacción eliminada', 'success');
        } catch (error) {
            this.mostrarAlerta('Error al eliminar la transacción', 'error');
            console.error('Error:', error);
        }
    }

    // Cálculo y actualización del balance
    actualizarBalance() {
        const totalIngresos = this.ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
        const totalGastos = this.gastos.reduce((total, gasto) => total + gasto.monto, 0);
        const balance = totalIngresos - totalGastos;

        // Actualizar elementos del DOM
        document.getElementById('totalIngresos').textContent = this.formatearMoneda(totalIngresos);
        document.getElementById('totalGastos').textContent = this.formatearMoneda(totalGastos);
        
        const balanceElement = document.getElementById('balanceTotal');
        balanceElement.textContent = this.formatearMoneda(balance);
        
        // Aplicar color según el balance
        balanceElement.className = 'amount';
        if (balance > 0) {
            balanceElement.classList.add('income');
        } else if (balance < 0) {
            balanceElement.classList.add('expense');
        }

        this.actualizarEstadoVacio();
    }

    // Gestión del estado vacío
    mostrarEstadoInicial() {
        this.actualizarEstadoVacio();
    }

    actualizarEstadoVacio() {
        const emptyState = document.getElementById('emptyState');
        const hayTransacciones = this.ingresos.length > 0 || this.gastos.length > 0;
        
        if (hayTransacciones) {
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'block';
        }
    }

    // Persistencia de datos
    // Cargar datos desde base de datos con sincronización
    async cargarDatos() {
        try {
            // Cargar ingresos y gastos desde la base de datos
            this.ingresos = await this.database.loadData('incomes');
            this.gastos = await this.database.loadData('expenses');

            this.renderizarIngresos();
            this.renderizarGastos();
            
            console.log(`Cargados: ${this.ingresos.length} ingresos, ${this.gastos.length} gastos`);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.mostrarAlerta('Error al cargar datos guardados', 'error');
        }
    }

    // Método legacy - ya no se usa, mantenido por compatibilidad
    guardarDatos() {
        // Los datos ahora se guardan automáticamente en la base de datos
        // cuando se agregan/editan/eliminan
        console.log('Método guardarDatos() legacy - usando base de datos automática');
    }

    // Utilidades
    generarId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    formatearMoneda(cantidad) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2
        }).format(cantidad);
    }

    formatearFecha(fecha) {
        return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    obtenerNombreCategoria(categoria) {
        const categorias = {
            // Ingresos
            'salario': 'Salario',
            'freelance': 'Freelance',
            'inversiones': 'Inversiones',
            'alquiler': 'Alquiler',
            // Gastos
            'alimentacion': 'Alimentación',
            'transporte': 'Transporte',
            'vivienda': 'Vivienda',
            'servicios': 'Servicios',
            'salud': 'Salud',
            'entretenimiento': 'Entretenimiento',
            'ropa': 'Ropa',
            'educacion': 'Educación',
            'otros': 'Otros'
        };
        return categorias[categoria] || categoria;
    }

    mostrarAlerta(mensaje, tipo = 'info') {
        // Crear elemento de alerta
        const alerta = document.createElement('div');
        alerta.className = `alerta alerta-${tipo}`;
        alerta.textContent = mensaje;
        
        // Estilos dinámicos
        alerta.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        // Colores según tipo
        switch (tipo) {
            case 'success':
                alerta.style.backgroundColor = '#10b981';
                break;
            case 'error':
                alerta.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                alerta.style.backgroundColor = '#f59e0b';
                break;
            default:
                alerta.style.backgroundColor = '#3b82f6';
        }

        // Agregar animación CSS si no existe
        if (!document.querySelector('#alertaStyles')) {
            const style = document.createElement('style');
            style.id = 'alertaStyles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(alerta);

        // Remover después de 3 segundos
        setTimeout(() => {
            alerta.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (alerta.parentNode) {
                    alerta.parentNode.removeChild(alerta);
                }
            }, 300);
        }, 3000);
    }

    // Métodos públicos para estadísticas (futuras funcionalidades)
    obtenerEstadisticas() {
        const totalIngresos = this.ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
        const totalGastos = this.gastos.reduce((total, gasto) => total + gasto.monto, 0);
        
        return {
            totalIngresos,
            totalGastos,
            balance: totalIngresos - totalGastos,
            numeroIngresos: this.ingresos.length,
            numeroGastos: this.gastos.length,
            promedioIngresos: this.ingresos.length > 0 ? totalIngresos / this.ingresos.length : 0,
            promedioGastos: this.gastos.length > 0 ? totalGastos / this.gastos.length : 0
        };
    }

    exportarDatos() {
        const datos = {
            ingresos: this.ingresos,
            gastos: this.gastos,
            fechaExportacion: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(datos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `finanzas_hogar_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    async limpiarDatos() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
            // Limpiar arrays locales
            this.ingresos = [];
            this.gastos = [];
            
            // Limpiar localStorage legacy
            localStorage.removeItem('gestorFinanzas_ingresos');
            localStorage.removeItem('gestorFinanzas_gastos');
            
            // TODO: Implementar limpieza de Firebase cuando esté configurado
            
            this.renderizarIngresos();
            this.renderizarGastos();
            this.actualizarBalance();
            this.mostrarAlerta('Todos los datos han sido eliminados', 'success');
        }
    }

    // Mostrar información del usuario y estado de sincronización
    mostrarInfoUsuario() {
        const info = this.database.getUserInfo();
        console.log('👤 Usuario:', info.userId?.substring(0, 8) + '...');
        console.log('🔑 Clave:', info.userKey);
        console.log('🌐 Estado:', info.isOnline ? 'En línea' : 'Sin conexión');
        console.log('📱 Modo:', info.useLocalStorageOnly ? 'Solo localStorage' : 'Firebase + localStorage');
        
        if (info.pendingOperations > 0) {
            console.log('⏳ Operaciones pendientes:', info.pendingOperations);
        }
    }
}

// Inicializar la aplicación cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.gestorFinanzas = new GestorFinanzas();
});

// Exportar para uso en consola de desarrollo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GestorFinanzas;
}