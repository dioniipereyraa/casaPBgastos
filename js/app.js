// Gestión de Gastos del Hogar - JavaScript
class GestorFinanzas {
    constructor() {
        this.ingresos = [];
        this.gastos = [];
        this.seleccionIngresos = new Set();
        this.seleccionGastos = new Set();
        this.mesSeleccionado = this.mesActualYM(); // 'YYYY-MM'
        this.limiteIngresos = 5;
        this.limiteGastos = 5;
        this.PAGE_SIZE = 5;
        this.database = null;
        this.init();
    }

    mesActualYM(d = new Date()) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    // Verifica si cambió el mes; si sí, auto-actualiza selector
    chequearCambioDeMes() {
        const actual = this.mesActualYM();
        if (this.mesSeleccionado !== actual && this._seguirMesActual !== false) {
            this.mesSeleccionado = actual;
            this.actualizarSelectorMes();
            this.renderizarIngresos();
            this.renderizarGastos();
            this.actualizarBalance();
        }
    }

    filtrarPorMes(items) {
        return items.filter(it => (it.fecha || '').startsWith(this.mesSeleccionado));
    }

    formatearMesLargo(ym) {
        const [y, m] = ym.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        const nombre = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        return nombre.charAt(0).toUpperCase() + nombre.slice(1);
    }

    cambiarMes(delta) {
        const [y, m] = this.mesSeleccionado.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        this.mesSeleccionado = this.mesActualYM(d);
        this._seguirMesActual = (this.mesSeleccionado === this.mesActualYM());
        this.limiteIngresos = this.PAGE_SIZE;
        this.limiteGastos = this.PAGE_SIZE;
        this.actualizarSelectorMes();
        this.renderizarIngresos();
        this.renderizarGastos();
        this.actualizarBalance();
    }

    irAMesActual() {
        this.mesSeleccionado = this.mesActualYM();
        this._seguirMesActual = true;
        this.limiteIngresos = this.PAGE_SIZE;
        this.limiteGastos = this.PAGE_SIZE;
        this.actualizarSelectorMes();
        this.renderizarIngresos();
        this.renderizarGastos();
        this.actualizarBalance();
    }

    actualizarSelectorMes() {
        const label = document.getElementById('mesActual');
        if (label) label.textContent = this.formatearMesLargo(this.mesSeleccionado);
        const btnHoy = document.getElementById('btnHoy');
        if (btnHoy) btnHoy.style.display = this.mesSeleccionado === this.mesActualYM() ? 'none' : 'inline-flex';
    }

    async init() {
        // Inicializar base de datos
        this.database = new DatabaseService();
        
        // Esperar a que se inicialice Firebase completamente
        await new Promise(resolve => {
            const checkInit = () => {
                if (this.database.initialized && this.database.userId) {
                    resolve();
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            checkInit();
        });
        
        console.log('✅ Aplicación inicializada correctamente');
        
        await this.cargarDatos();
        this.configurarEventos();
        this.establecerFechaActual();
        this.actualizarBalance();
        this.mostrarEstadoInicial();
        this.mostrarInfoUsuario();
        
        // Configurar listener para cambios en tiempo real
        this.configurarSincronizacionTiempoReal();
    }

    // Configurar sincronización en tiempo real
    configurarSincronizacionTiempoReal() {
        window.addEventListener('dataUpdated', async (event) => {
            const { collection, data } = event.detail;
            console.log(`🔄 Actualizando interfaz: ${collection}`);
            
            if (collection === 'expenses') {
                this.gastos = data;
                this.renderizarGastos();
            } else if (collection === 'incomes') {
                this.ingresos = data;
                this.renderizarIngresos();
            } else if (collection === 'config') {
                // Manejar cambios de configuración (API keys, etc.)
                this.handleConfigUpdate(data);
            }
            
            this.actualizarBalance();
            
            // Mostrar notificación de sincronización
            this.mostrarNotificacion('📱 Datos sincronizados desde otro dispositivo', 'success');
        });
    }

    // Manejar actualizaciones de configuración
    handleConfigUpdate(configData) {
        const apiKeyConfig = configData.find(config => config.type === 'chatgpt_api_key');
        
        if (apiKeyConfig && window.gestorFacturas) {
            // Actualizar API key en el gestor de facturas si cambió
            if (window.gestorFacturas.apiKey !== apiKeyConfig.value) {
                window.gestorFacturas.apiKey = apiKeyConfig.value;
                const apiKeyInput = document.getElementById('chatgptApiKey');
                if (apiKeyInput) {
                    apiKeyInput.value = apiKeyConfig.value;
                }
                window.gestorFacturas.verificarConfiguracion();
                console.log('🔑 API Key actualizada desde otro dispositivo');
                this.mostrarNotificacion('🔑 API Key sincronizada desde otro dispositivo', 'success');
            }
        }
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

        // Selector de mes
        document.getElementById('btnPrevMes').addEventListener('click', () => this.cambiarMes(-1));
        document.getElementById('btnNextMes').addEventListener('click', () => this.cambiarMes(1));
        document.getElementById('btnHoy').addEventListener('click', () => this.irAMesActual());
        this.actualizarSelectorMes();
        // Revisar cada minuto si cambió el mes (para renovar automáticamente)
        setInterval(() => this.chequearCambioDeMes(), 60 * 1000);

        // Selección múltiple
        document.getElementById('btnSelectAllIngresos').addEventListener('click', () => this.toggleSeleccionarTodos('ingreso'));
        document.getElementById('btnSelectAllGastos').addEventListener('click', () => this.toggleSeleccionarTodos('gasto'));
        document.getElementById('btnDeleteSelectedIngresos').addEventListener('click', () => this.eliminarSeleccionados('ingreso'));
        document.getElementById('btnDeleteSelectedGastos').addEventListener('click', () => this.eliminarSeleccionados('gasto'));
    }

    toggleSeleccionarTodos(tipo) {
        const set = tipo === 'ingreso' ? this.seleccionIngresos : this.seleccionGastos;
        const items = tipo === 'ingreso' ? this.ingresos : this.gastos;
        if (set.size === items.length) {
            set.clear();
        } else {
            items.forEach(i => set.add(i.id));
        }
        if (tipo === 'ingreso') this.renderizarIngresos(); else this.renderizarGastos();
    }

    async eliminarSeleccionados(tipo) {
        const set = tipo === 'ingreso' ? this.seleccionIngresos : this.seleccionGastos;
        if (set.size === 0) return;
        if (!confirm(`¿Eliminar ${set.size} ${tipo === 'ingreso' ? 'ingreso(s)' : 'gasto(s)'}? Esta acción no se puede deshacer.`)) return;

        const collection = tipo === 'ingreso' ? 'incomes' : 'expenses';
        const ids = Array.from(set);
        set.clear();

        try {
            await Promise.all(ids.map(id => this.database.deleteData(collection, id)));
            if (tipo === 'ingreso') {
                this.ingresos = this.ingresos.filter(i => !ids.includes(i.id));
                this.renderizarIngresos();
            } else {
                this.gastos = this.gastos.filter(g => !ids.includes(g.id));
                this.renderizarGastos();
            }
            this.actualizarBalance();
            this.mostrarAlerta(`${ids.length} eliminados`, 'success');
        } catch (error) {
            console.error('Error en eliminación masiva:', error);
            this.mostrarAlerta('Error al eliminar algunos elementos', 'error');
        }
    }

    actualizarBarraSeleccion(tipo) {
        const set = tipo === 'ingreso' ? this.seleccionIngresos : this.seleccionGastos;
        const items = tipo === 'ingreso' ? this.ingresos : this.gastos;
        const suffix = tipo === 'ingreso' ? 'Ingresos' : 'Gastos';
        const btnSelectAll = document.getElementById('btnSelectAll' + suffix);
        const btnDelete = document.getElementById('btnDeleteSelected' + suffix);
        const count = document.getElementById('countSel' + suffix);

        btnSelectAll.style.display = items.length > 0 ? 'inline-flex' : 'none';
        btnDelete.style.display = set.size > 0 ? 'inline-flex' : 'none';
        count.textContent = set.size;
        btnSelectAll.innerHTML = set.size === items.length && items.length > 0
            ? '<i class="fas fa-square"></i> Deseleccionar todos'
            : '<i class="fas fa-check-square"></i> Seleccionar todos';
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
            // El listener de Firestore en tiempo real actualiza this.ingresos automáticamente.
            await this.database.saveData('incomes', nuevoIngreso);
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
            // El listener de Firestore en tiempo real actualiza this.gastos automáticamente.
            await this.database.saveData('expenses', nuevoGasto);
            this.ocultarFormulario('formGasto');
            this.mostrarAlerta('Gasto agregado exitosamente', 'success');
        } catch (error) {
            this.mostrarAlerta('Error al guardar el gasto', 'error');
            console.error('Error:', error);
        }
    }

    // Renderizado de listas (filtrado por mes + paginado)
    renderizarIngresos() {
        this.renderizarLista('ingreso');
    }
    renderizarGastos() {
        this.renderizarLista('gasto');
    }

    renderizarLista(tipo) {
        const esIngreso = tipo === 'ingreso';
        const listaEl = document.getElementById(esIngreso ? 'listaIngresos' : 'listaGastos');
        const fuente = esIngreso ? this.ingresos : this.gastos;
        listaEl.innerHTML = '';

        const delMes = this.filtrarPorMes(fuente)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        if (delMes.length === 0) {
            const mensaje = fuente.length === 0
                ? `No hay ${esIngreso ? 'ingresos' : 'gastos'} registrados aún.`
                : `No hay ${esIngreso ? 'ingresos' : 'gastos'} en ${this.formatearMesLargo(this.mesSeleccionado)}.`;
            listaEl.innerHTML = `<div class="empty-message"><p>${mensaje}</p></div>`;
            if (esIngreso) this.seleccionIngresos.clear(); else this.seleccionGastos.clear();
            this.actualizarBarraSeleccion(tipo);
            return;
        }

        const limite = esIngreso ? this.limiteIngresos : this.limiteGastos;
        const visibles = delMes.slice(0, limite);
        const ocultos = delMes.length - visibles.length;

        visibles.forEach(item => listaEl.appendChild(this.crearElementoTransaccion(item)));

        if (ocultos > 0 || delMes.length > this.PAGE_SIZE) {
            const footer = document.createElement('div');
            footer.className = 'list-footer';
            if (ocultos > 0) {
                const btnMas = document.createElement('button');
                btnMas.className = 'btn btn-secondary btn-sm';
                btnMas.innerHTML = `<i class="fas fa-chevron-down"></i> Mostrar ${Math.min(ocultos, this.PAGE_SIZE)} más`;
                btnMas.addEventListener('click', () => {
                    if (esIngreso) this.limiteIngresos += this.PAGE_SIZE; else this.limiteGastos += this.PAGE_SIZE;
                    this.renderizarLista(tipo);
                });
                footer.appendChild(btnMas);
            }
            if (visibles.length > this.PAGE_SIZE) {
                const btnMenos = document.createElement('button');
                btnMenos.className = 'btn btn-secondary btn-sm';
                btnMenos.innerHTML = `<i class="fas fa-chevron-up"></i> Mostrar menos`;
                btnMenos.addEventListener('click', () => {
                    if (esIngreso) this.limiteIngresos = this.PAGE_SIZE; else this.limiteGastos = this.PAGE_SIZE;
                    this.renderizarLista(tipo);
                });
                footer.appendChild(btnMenos);
            }
            const info = document.createElement('span');
            info.className = 'list-footer-info';
            info.textContent = `Mostrando ${visibles.length} de ${delMes.length}`;
            footer.appendChild(info);
            listaEl.appendChild(footer);
        }

        const fuenteIds = new Set(fuente.map(i => i.id));
        const set = esIngreso ? this.seleccionIngresos : this.seleccionGastos;
        set.forEach(id => { if (!fuenteIds.has(id)) set.delete(id); });
        this.actualizarBarraSeleccion(tipo);
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

        // Checkbox de selección múltiple
        const checkbox = elemento.querySelector('.transaction-select');
        const set = transaccion.tipo === 'ingreso' ? this.seleccionIngresos : this.seleccionGastos;
        checkbox.checked = set.has(transaccion.id);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) set.add(transaccion.id); else set.delete(transaccion.id);
            this.actualizarBarraSeleccion(transaccion.tipo);
        });

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

    // Cálculo y actualización del balance (del mes seleccionado)
    actualizarBalance() {
        const ingresosMes = this.filtrarPorMes(this.ingresos);
        const gastosMes = this.filtrarPorMes(this.gastos);
        const totalIngresos = ingresosMes.reduce((total, ingreso) => total + ingreso.monto, 0);
        const totalGastos = gastosMes.reduce((total, gasto) => total + gasto.monto, 0);
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
            version: '1.1.0'
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

    // Mostrar notificaciones al usuario
    mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notification ${tipo}`;
        notificacion.innerHTML = `
            <span>${mensaje}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Agregar al DOM
        document.body.appendChild(notificacion);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.remove();
            }
        }, 3000);
    }
}

// La inicialización se realiza desde index.html para evitar instancias duplicadas.

// Exportar para uso en consola de desarrollo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GestorFinanzas;
}