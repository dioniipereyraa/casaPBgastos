// Sistema de Protección Inteligente
(function() {
    'use strict';
    
    // Detectar automáticamente el entorno
    const isProduction = !window.location.href.includes('localhost') && 
                        !window.location.href.includes('127.0.0.1') &&
                        !window.location.href.includes('file://') &&
                        !window.location.href.includes('192.168.') &&
                        !window.location.href.includes('10.0.') &&
                        !window.location.href.includes('.local');
    
    // Mostrar estado del entorno
    if (isProduction) {
        console.log('%c🔒 Modo Producción - Protecciones Activas', 'color: green; font-size: 14px; font-weight: bold;');
        
        // Protecciones básicas en producción
        // Deshabilitar clic derecho
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // Deshabilitar F12, Ctrl+Shift+I, etc.
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
                return false;
            }
        });
        
        // Detectar DevTools básico
        let devtools = {open: false, orientation: null};
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.clear();
                    console.log('%c🛡️ Herramientas de desarrollo detectadas', 'color: red; font-size: 16px; font-weight: bold;');
                }
            } else {
                devtools.open = false;
            }
        }, 1000);
        
    } else {
        console.log('%c🔧 Modo Desarrollo - Protecciones Desactivadas', 'color: orange; font-size: 14px; font-weight: bold;');
        console.log('%c- DevTools permitido', 'color: orange;');
        console.log('%c- Inspección habilitada', 'color: orange;');
        console.log('%c- Debugging completo disponible', 'color: orange;');
    }
    
    // API Key encryption (funciona en ambos modos)
    window.encryptApiKey = function(key) {
        let encrypted = "";
        for(let i = 0; i < key.length; i++) {
            encrypted += String.fromCharCode(key.charCodeAt(i) ^ 42);
        }
        return btoa(encrypted);
    };
    
    window.decryptApiKey = function(encryptedKey) {
        try {
            let decoded = atob(encryptedKey);
            let decrypted = "";
            for(let i = 0; i < decoded.length; i++) {
                decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ 42);
            }
            return decrypted;
        } catch (e) {
            return null;
        }
    };
    
})();