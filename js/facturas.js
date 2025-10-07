// Gestor de Facturas con ChatGPT Integration
class GestorFacturas {
    constructor() {
        this.apiKey = '';
        this.facturas = [];
        this.procesando = false;
        this.database = null;
        this.init();
    }

    init() {
        // Esperar a que la base de datos esté disponible
        if (window.gestorFinanzas && window.gestorFinanzas.database) {
            this.database = window.gestorFinanzas.database;
        }
        
        this.cargarApiKey();
        this.cargarFacturas();
        this.configurarEventos();
        this.configurarPestanas();
        this.verificarConfiguracion();
    }

    // Configuración de pestañas
    configurarPestanas() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remover active de todos los botones y paneles
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Activar el botón y panel seleccionado
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    // Configurar eventos
    configurarEventos() {
        // Configuración API
        document.getElementById('guardarApiKey').addEventListener('click', () => {
            this.guardarApiKey();
        });

        // Upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.procesarArchivos(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.procesarArchivos(e.target.files);
        });

        // Botones de datos extraídos
        document.getElementById('editarDatos').addEventListener('click', () => {
            this.habilitarEdicion();
        });

        document.getElementById('confirmarTransaccion').addEventListener('click', () => {
            this.confirmarTransaccion();
        });

        document.getElementById('descartarDatos').addEventListener('click', () => {
            this.descartarDatos();
        });
    }

    // Gestión de API Key
    cargarApiKey() {
        this.apiKey = localStorage.getItem('chatgpt_api_key') || '';
        if (this.apiKey) {
            document.getElementById('chatgptApiKey').value = this.apiKey;
        }
    }

    guardarApiKey() {
        const apiKey = document.getElementById('chatgptApiKey').value.trim();
        if (!apiKey) {
            alert('Por favor, ingresa tu API Key de OpenAI');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            alert('La API Key debe comenzar con "sk-"');
            return;
        }

        this.apiKey = apiKey;
        localStorage.setItem('chatgpt_api_key', apiKey);
        this.verificarConfiguracion();
        this.mostrarAlerta('API Key guardada correctamente', 'success');
    }

    verificarConfiguracion() {
        const apiConfig = document.getElementById('apiConfig');
        const uploadSection = document.getElementById('uploadSection');

        if (this.apiKey) {
            apiConfig.style.display = 'none';
            uploadSection.style.display = 'block';
        } else {
            apiConfig.style.display = 'block';
            uploadSection.style.display = 'none';
        }
    }

    // Procesamiento de archivos
    async procesarArchivos(files) {
        if (!this.apiKey) {
            alert('Primero configura tu API Key de OpenAI');
            return;
        }

        if (this.procesando) {
            alert('Ya hay un archivo siendo procesado. Espera a que termine.');
            return;
        }

        for (let file of files) {
            if (this.validarArchivo(file)) {
                await this.procesarArchivo(file);
            }
        }
    }

    validarArchivo(file) {
        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        const tamañoMaximo = 10 * 1024 * 1024; // 10MB

        if (!tiposPermitidos.includes(file.type)) {
            alert('Tipo de archivo no soportado. Usa JPG, PNG o PDF.');
            return false;
        }

        if (file.size > tamañoMaximo) {
            alert('El archivo es demasiado grande. Máximo 10MB.');
            return false;
        }

        return true;
    }

    async procesarArchivo(file) {
        this.procesando = true;
        this.mostrarProcesando(true);
        
        try {
            // Convertir archivo a base64
            const base64 = await this.archivoABase64(file);
            
            // Actualizar progreso
            this.actualizarProgreso(30, 'Enviando a ChatGPT...');
            
            // Enviar a ChatGPT
            const datosExtraidos = await this.extraerDatosConChatGPT(base64, file.type);
            
            // Actualizar progreso
            this.actualizarProgreso(80, 'Procesando respuesta...');
            
            // Guardar factura
            const factura = {
                id: this.generarId(),
                nombre: file.name,
                tipo: file.type,
                tamaño: file.size,
                fechaProcesado: new Date().toISOString(),
                datos: datosExtraidos,
                miniatura: base64
            };
            
            // Guardar en base de datos si está disponible
            if (this.database) {
                await this.database.saveData('invoices', factura);
            }
            
            this.facturas.push(factura);
            this.guardarFacturas();
            
            // Mostrar datos extraídos
            this.mostrarDatosExtraidos(datosExtraidos);
            this.actualizarProgreso(100, 'Completado');
            
            setTimeout(() => {
                this.mostrarProcesando(false);
            }, 1000);
            
        } catch (error) {
            console.error('Error procesando archivo:', error);
            this.mostrarAlerta('Error al procesar el archivo: ' + error.message, 'error');
            this.mostrarProcesando(false);
        } finally {
            this.procesando = false;
        }
    }

    async archivoABase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async extraerDatosConChatGPT(base64Image, fileType) {
        const prompt = `
        Analiza esta imagen de factura o recibo y extrae la siguiente información en formato JSON:
        
        {
            "descripcion": "descripción del establecimiento o producto/servicio",
            "monto": "monto total numérico (solo números, sin símbolos)",
            "fecha": "fecha en formato YYYY-MM-DD",
            "categoria": "una de estas: alimentacion, transporte, vivienda, servicios, salud, entretenimiento, ropa, educacion, otros",
            "tipo": "gasto o ingreso (la mayoría son gastos)",
            "establecimiento": "nombre del establecimiento",
            "detalles": "productos o servicios detallados si están disponibles"
        }
        
        Si no puedes extraer algún dato, usa null. Para la categoría, elige la más apropiada basándote en el tipo de establecimiento o productos.
        `;

        const requestBody = {
            model: "gpt-4o-mini", // Usando gpt-4o-mini que es más económico
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: base64Image
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500,
            temperature: 0.1
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error de API: ${errorData.error?.message || 'Error desconocido'}`);
        }

        const data = await response.json();
        const contenido = data.choices[0].message.content;
        
        try {
            // Extraer JSON de la respuesta
            const jsonMatch = contenido.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No se pudo extraer JSON de la respuesta');
            }
        } catch (error) {
            console.error('Error parseando JSON:', contenido);
            throw new Error('Error interpretando la respuesta de ChatGPT');
        }
    }

    mostrarProcesando(mostrar) {
        const processingStatus = document.getElementById('processingStatus');
        processingStatus.style.display = mostrar ? 'block' : 'none';
        
        if (!mostrar) {
            this.actualizarProgreso(0, 'Analizando imagen con ChatGPT...');
        }
    }

    actualizarProgreso(porcentaje, mensaje) {
        document.getElementById('progressFill').style.width = `${porcentaje}%`;
        document.getElementById('statusMessage').textContent = mensaje;
    }

    mostrarDatosExtraidos(datos) {
        document.getElementById('extractedDesc').value = datos.descripcion || '';
        document.getElementById('extractedAmount').value = datos.monto || '';
        document.getElementById('extractedDate').value = datos.fecha || '';
        document.getElementById('extractedCategory').value = datos.categoria || 'otros';
        document.getElementById('extractedType').value = datos.tipo || 'gasto';
        
        // Deshabilitar edición inicialmente
        this.deshabilitarEdicion();
        
        document.getElementById('extractedData').style.display = 'block';
    }

    habilitarEdicion() {
        const campos = ['extractedDesc', 'extractedAmount', 'extractedDate'];
        campos.forEach(id => {
            document.getElementById(id).removeAttribute('readonly');
        });
        
        document.getElementById('editarDatos').textContent = 'Edición Habilitada';
        document.getElementById('editarDatos').disabled = true;
    }

    deshabilitarEdicion() {
        const campos = ['extractedDesc', 'extractedAmount', 'extractedDate'];
        campos.forEach(id => {
            document.getElementById(id).setAttribute('readonly', true);
        });
        
        document.getElementById('editarDatos').textContent = 'Editar';
        document.getElementById('editarDatos').disabled = false;
    }

    async confirmarTransaccion() {
        const descripcion = document.getElementById('extractedDesc').value.trim();
        const monto = parseFloat(document.getElementById('extractedAmount').value);
        const fecha = document.getElementById('extractedDate').value;
        const categoria = document.getElementById('extractedCategory').value;
        const tipo = document.getElementById('extractedType').value;

        if (!descripcion || !monto || !fecha || !categoria) {
            alert('Por favor, completa todos los campos obligatorios');
            return;
        }

        if (monto <= 0) {
            alert('El monto debe ser mayor a 0');
            return;
        }

        // Crear transacción
        const transaccion = {
            id: this.generarId(),
            descripcion,
            monto,
            fecha,
            categoria,
            tipo,
            fechaCreacion: new Date().toISOString(),
            origen: 'factura'
        };

        try {
            // Guardar en base de datos usando el gestor principal
            const collection = tipo === 'ingreso' ? 'incomes' : 'expenses';
            await window.gestorFinanzas.database.saveData(collection, transaccion);

            // Agregar a la aplicación principal
            if (tipo === 'ingreso') {
                window.gestorFinanzas.ingresos.push(transaccion);
                window.gestorFinanzas.renderizarIngresos();
            } else {
                window.gestorFinanzas.gastos.push(transaccion);
                window.gestorFinanzas.renderizarGastos();
            }

            window.gestorFinanzas.actualizarBalance();
            
            // Limpiar formulario y ocultar datos extraídos
            this.ocultarDatosExtraidos();
            
            alert('Transacción agregada exitosamente desde la factura');
        } catch (error) {
            console.error('Error al guardar transacción:', error);
            alert('Error al guardar la transacción');
        }
    }

    descartarDatos() {
        document.getElementById('extractedData').style.display = 'none';
        // Limpiar campos
        ['extractedDesc', 'extractedAmount', 'extractedDate'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('extractedCategory').value = 'otros';
        document.getElementById('extractedType').value = 'gasto';
    }

    ocultarDatosExtraidos() {
        this.descartarDatos();
    }

    // Gestión de facturas
    async cargarFacturas() {
        try {
            if (this.database) {
                this.facturas = await this.database.loadData('invoices');
            } else {
                // Fallback a localStorage
                const facturasGuardadas = localStorage.getItem('gestorFinanzas_facturas');
                if (facturasGuardadas) {
                    this.facturas = JSON.parse(facturasGuardadas);
                }
            }
            this.renderizarFacturas();
        } catch (error) {
            console.error('Error al cargar facturas:', error);
        }
    }

    async guardarFacturas() {
        try {
            if (this.database) {
                // Las facturas individuales ya se guardan en la base de datos
                // Este método se mantiene por compatibilidad
                console.log('Facturas guardadas automáticamente en la base de datos');
            } else {
                // Fallback a localStorage
                localStorage.setItem('gestorFinanzas_facturas', JSON.stringify(this.facturas));
            }
        } catch (error) {
            console.error('Error al guardar facturas:', error);
        }
    }

    renderizarFacturas() {
        const lista = document.getElementById('facturasList');
        lista.innerHTML = '';

        if (this.facturas.length === 0) {
            lista.innerHTML = `
                <div class="empty-message">
                    <p>No hay facturas procesadas aún.</p>
                </div>
            `;
            return;
        }

        // Ordenar por fecha (más recientes primero)
        const facturasOrdenadas = this.facturas.sort((a, b) => 
            new Date(b.fechaProcesado) - new Date(a.fechaProcesado)
        );

        facturasOrdenadas.forEach(factura => {
            const elemento = this.crearElementoFactura(factura);
            lista.appendChild(elemento);
        });
    }

    crearElementoFactura(factura) {
        const div = document.createElement('div');
        div.className = 'factura-item';

        const esTipoImagen = factura.tipo.startsWith('image/');
        const thumbnailContent = esTipoImagen 
            ? `<img src="${factura.miniatura}" alt="Factura">`
            : `<i class="fas fa-file-pdf"></i>`;

        div.innerHTML = `
            <div class="factura-thumbnail">
                ${thumbnailContent}
            </div>
            <div class="factura-info">
                <h4>${factura.datos.descripcion || factura.nombre}</h4>
                <div class="factura-details">
                    <span><i class="fas fa-calendar"></i> ${this.formatearFecha(factura.datos.fecha)}</span>
                    <span><i class="fas fa-tag"></i> ${this.obtenerNombreCategoria(factura.datos.categoria)}</span>
                    <span><i class="fas fa-file"></i> ${factura.nombre}</span>
                </div>
            </div>
            <div class="factura-amount ${factura.datos.tipo}">
                ${this.formatearMoneda(factura.datos.monto)}
            </div>
        `;

        return div;
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
        }).format(cantidad || 0);
    }

    formatearFecha(fecha) {
        if (!fecha) return 'N/A';
        return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    obtenerNombreCategoria(categoria) {
        const categorias = {
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
        // Reutilizar la función de alerta del gestor principal
        if (window.gestorFinanzas && window.gestorFinanzas.mostrarAlerta) {
            window.gestorFinanzas.mostrarAlerta(mensaje, tipo);
        } else {
            alert(mensaje);
        }
    }

    // Método para limpiar facturas
    limpiarFacturas() {
        if (confirm('¿Estás seguro de que quieres eliminar todas las facturas procesadas?')) {
            this.facturas = [];
            localStorage.removeItem('gestorFinanzas_facturas');
            this.renderizarFacturas();
            this.mostrarAlerta('Facturas eliminadas correctamente', 'success');
        }
    }

    // Método para obtener estadísticas de facturas
    obtenerEstadisticasFacturas() {
        const totalFacturas = this.facturas.length;
        const totalGastos = this.facturas.filter(f => f.datos.tipo === 'gasto').length;
        const totalIngresos = this.facturas.filter(f => f.datos.tipo === 'ingreso').length;
        const montoTotal = this.facturas.reduce((sum, f) => sum + (f.datos.monto || 0), 0);
        
        return {
            totalFacturas,
            totalGastos,
            totalIngresos,
            montoTotal,
            categorias: this.facturas.reduce((acc, f) => {
                const cat = f.datos.categoria || 'otros';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// Exportar para uso global
window.GestorFacturas = GestorFacturas;