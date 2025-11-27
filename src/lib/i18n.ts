export type Language = 'es' | 'en';

export const translations = {
    es: {
        // Home
        appTitle: 'App de Logística',
        adminDashboard: 'Panel de Administración',
        adminDesc: 'Gestionar paquetes y conductores',
        driverApp: 'App de Conductor',
        driverDesc: 'Ver rutas y actualizar estado',

        // Admin Dashboard
        packages: 'Paquetes',
        createPackage: 'Crear Paquete',
        createDriver: 'Crear Conductor',
        trackingId: 'ID de Seguimiento',
        recipient: 'Destinatario',
        address: 'Dirección',
        status: 'Estado',
        assignedDriver: 'Conductor Asignado',
        action: 'Acción',
        assignDriver: 'Asignar Conductor',
        unassigned: 'Sin asignar',
        loading: 'Cargando...',

        // Package Form
        recipientName: 'Nombre del Destinatario',
        weight: 'Peso (kg)',
        size: 'Tamaño',
        small: 'Pequeño',
        medium: 'Mediano',
        large: 'Grande',
        create: 'Crear',
        cancel: 'Cancelar',

        // Driver Form
        driverName: 'Nombre del Conductor',
        email: 'Correo Electrónico',

        // Driver App
        myRoute: 'Mi Ruta',
        noActiveDeliveries: 'No hay entregas activas.',
        to: 'Para',
        confirmPickup: 'Confirmar Recogida',
        startRoute: 'Iniciar Ruta',
        delivered: 'Entregado',
        failed: 'Fallido',
        completed: 'Completado',

        // Status
        PENDING: 'PENDIENTE',
        ASSIGNED: 'ASIGNADO',
        PICKED_UP: 'RECOGIDO',
        IN_TRANSIT: 'EN TRÁNSITO',
        DELIVERED: 'ENTREGADO',
        FAILED: 'FALLIDO',

        // New Admin Keys
        manageDrivers: 'Administrar Conductores',
        viewGlobalMap: 'Ver Mapa Global',
        selectLocation: 'Seleccionar Ubicación',
        instructionsLabel: 'Instrucciones / Comentarios',
        securityLabel: 'Permitir dejar con vigilancia / recepción',
        confirmLocation: 'Confirmar Ubicación',
        globalMapTitle: 'Mapa Global de Entregas',
        selectLocationTitle: 'Seleccionar ubicación de entrega',
        deliveryLocation: 'Ubicación Entrega',
        driverLocation: 'Ubicación Conductor',
        evidence: 'Evidencia',
        viewMap: 'Ver Mapa',
        noLocation: 'Sin ubicación',
    },
    en: {
        // Home
        appTitle: 'Logistics App',
        adminDashboard: 'Admin Dashboard',
        adminDesc: 'Manage packages and drivers',
        driverApp: 'Driver App',
        driverDesc: 'View routes and update status',

        // Admin Dashboard
        packages: 'Packages',
        createPackage: 'Create Package',
        createDriver: 'Create Driver',
        trackingId: 'Tracking ID',
        recipient: 'Recipient',
        address: 'Address',
        status: 'Status',
        assignedDriver: 'Assigned Driver',
        action: 'Action',
        assignDriver: 'Assign Driver',
        unassigned: 'Unassigned',
        loading: 'Loading...',

        // Package Form
        recipientName: 'Recipient Name',
        weight: 'Weight (kg)',
        size: 'Size',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        create: 'Create',
        cancel: 'Cancel',

        // Driver Form
        driverName: 'Driver Name',
        email: 'Email',

        // Driver App
        myRoute: 'My Route',
        noActiveDeliveries: 'No active deliveries.',
        to: 'To',
        confirmPickup: 'Confirm Pickup',
        startRoute: 'Start Route',
        delivered: 'Delivered',
        failed: 'Failed',
        completed: 'Completed',

        // Status
        PENDING: 'PENDING',
        ASSIGNED: 'ASSIGNED',
        PICKED_UP: 'PICKED UP',
        IN_TRANSIT: 'IN TRANSIT',
        DELIVERED: 'DELIVERED',
        FAILED: 'FAILED',

        // New Admin Keys
        manageDrivers: 'Manage Drivers',
        viewGlobalMap: 'View Global Map',
        selectLocation: 'Select Location',
        instructionsLabel: 'Instructions / Comments',
        securityLabel: 'Allow leaving with security / reception',
        confirmLocation: 'Confirm Location',
        globalMapTitle: 'Global Delivery Map',
        selectLocationTitle: 'Select Delivery Location',
        deliveryLocation: 'Delivery Location',
        driverLocation: 'Driver Location',
        evidence: 'Evidence',
        viewMap: 'View Map',
        noLocation: 'No location',
    },
};

export function useTranslation(lang: Language) {
    return (key: keyof typeof translations.es) => {
        return translations[lang][key] || key;
    };
}
