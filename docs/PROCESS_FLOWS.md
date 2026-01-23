# FLUJOS DE PROCESO - JFC CARGO DESTINO

## ÍNDICE

1. [Flujo 1: Crear Orden y Cotizar](#flujo-1-crear-orden-y-cotizar)
2. [Flujo 2: Asignar a Transportistas](#flujo-2-asignar-a-transportistas)
3. [Flujo 3: Preparación en Almacén](#flujo-3-preparación-en-almacén)
4. [Flujo 4: Tracking en Vivo + Validación de Riesgos](#flujo-4-tracking-en-vivo--validación-de-riesgos)
5. [Flujo 5: Entrega y Confirmación](#flujo-5-entrega-y-confirmación)
6. [Flujo 6: Seguimiento de Órdenes](#flujo-6-seguimiento-de-órdenes)
7. [Flujo 7: Cálculo de Rentabilidad](#flujo-7-cálculo-de-rentabilidad)
8. [Flujo 8: Casos Excepcionales & Soporte](#flujo-8-casos-excepcionales--soporte)

---

## FLUJO 1: CREAR ORDEN Y COTIZAR

### Diagrama

![Flujo 1: Crear Orden y Cotizar](/public/docs/flujo-1-crear-orden.png)

### Actores
- **Customer Portal** (Cliente)
- **Core System** (Backend)
- **Firestore** (Database)
- **3rd Party** (Stripe/PayPal)

### Descripción

Este flujo permite a los clientes crear órdenes de envío, obtener cotizaciones en tiempo real y confirmar el servicio.

### Pasos Detallados

#### 1. Cliente Ingresa Datos

**Portal**: Customer Portal  
**Acción**: Usuario completa formulario de cotización

**Datos requeridos:**
- Origen (dirección + coordenadas)
- Destino (dirección + coordenadas)
- Peso y dimensiones de la carga
- Tipo de carga (general, frágil, peligrosa)
- Fecha de recolección deseada
- Fecha de entrega deseada

**Validaciones frontend:**
- Direcciones válidas (Google Maps Autocomplete)
- Peso > 0
- Dimensiones > 0
- Fechas futuras

**Tech**: React Hook Form + Zod validation

#### 2. Sistema Calcula Precio

**Sistema**: Core System  
**Módulo**: `pricing-engine.ts`

**Cálculo incluye:**
```typescript
const pricing = {
  basePrice: calculateDistance(origin, destination) * pricePerKm,
  fuelSurcharge: baseFuel * currentFuelPrice,
  insurance: cargoValue * insuranceRate,
  urgency: isExpress ? expressSurcharge : 0,
  total: basePrice + fuelSurcharge + insurance + urgency
}
```

**Validaciones backend:**
- Ruta válida (Google Maps Directions API)
- Vehículos disponibles para el tipo de carga
- Capacidad suficiente

**Tech**: Node.js + Google Maps API

#### 3. Sistema Valida Vehículos Aptos

**Sistema**: Core System  
**Módulo**: `vehicle-validator.ts`

**Query Firestore:**
```typescript
const vehicles = await db.collection('vehicles')
  .where('status', '==', 'active')
  .where('capacity.weight', '>=', cargo.weight)
  .where('capacity.volume', '>=', cargo.volume)
  .get();
```

**Resultado**: Lista de vehículos aptos con disponibilidad

#### 4. Cliente Ve Cotización

**Portal**: Customer Portal  
**Display**:
- Precio total desglosado
- Opciones de servicio (Standard / Express)
- Vehículos disponibles
- ETA estimado
- Términos y condiciones

**Decisión**: ¿Acepta cotización?

#### 5A. Cliente Acepta → Procesar Pago

**Sistema**: Core System + 3rd Party (Stripe/PayPal)

**Flujo de pago:**
1. Cliente selecciona método de pago
2. Core System crea Payment Intent (Stripe) o Order (PayPal)
3. Cliente completa pago en modal seguro
4. Webhook confirma pago exitoso
5. Core System actualiza estado

**Firestore writes:**
```typescript
// Crear quote
await db.collection('quotes').doc(quoteId).set({
  ...quoteData,
  status: 'accepted'
});

// Crear order
await db.collection('orders').doc(orderId).set({
  quoteId,
  status: 'pending_assignment',
  ...orderData
});

// Crear payment
await db.collection('payments').doc(paymentId).set({
  orderId,
  status: 'completed',
  ...paymentData
});
```

**Notificaciones:**
- Email al cliente (confirmación de orden)
- SMS al cliente (número de orden)
- Notificación a Super Admin Zone (nueva orden)

#### 5B. Cliente Rechaza → Guardar Quote

**Firestore write:**
```typescript
await db.collection('quotes').doc(quoteId).set({
  ...quoteData,
  status: 'rejected'
});
```

**Follow-up**: Email automático después de 24h con descuento

### State Machine Transitions

```
null → DRAFT (cliente inicia formulario)
DRAFT → QUOTED (sistema calcula precio)
QUOTED → ACCEPTED (cliente acepta)
ACCEPTED → PENDING_ASSIGNMENT (pago confirmado)
```

### Métricas

- **Conversion Rate**: % de quotes que se convierten en orders
- **Average Quote Time**: Tiempo promedio para generar cotización
- **Payment Success Rate**: % de pagos exitosos

---

## FLUJO 2: ASIGNAR A TRANSPORTISTAS

### Diagrama

![Flujo 2: Asignar a Transportistas](/public/docs/flujo-2-asignar-transportistas.png)

### Actores
- **Super Admin Zone** (Admin)
- **Core System** (Backend)
- **Carrier Portal** (Transportista)
- **Mobile App** (Conductor)
- **Firestore** (Database)
- **3rd Party** (Twilio SMS)

### Descripción

Sistema de subastas para asignar órdenes a transportistas. Los transportistas pujan por las órdenes disponibles.

### Pasos Detallados

#### 1. Admin Crea Subasta

**Portal**: Super Admin Zone  
**Acción**: Admin selecciona orden y crea subasta

**Datos de subasta:**
```typescript
const auction = {
  orderId: string,
  origin: object,
  destination: object,
  cargo: object,
  pickupDate: timestamp,
  suggestedPrice: number,
  commission: 8, // %
  netProfit: suggestedPrice * 0.92,
  vehicleRequirements: {
    type: 'truck',
    minCapacity: 5000 // kg
  },
  status: 'open',
  expiresAt: timestamp // 24-48 horas
}
```

**Firestore write:**
```typescript
await db.collection('auctions').doc(auctionId).set(auction);
```

#### 2. Transportistas Ven Subasta

**Portal**: Carrier Portal  
**Query Realtime:**
```typescript
db.collection('auctions')
  .where('status', '==', 'open')
  .where('expiresAt', '>', new Date())
  .onSnapshot(snapshot => {
    // Update UI en tiempo real
  });
```

**Display para cada subasta:**
- Origen → Destino
- Peso/Dimensiones
- Fecha de recolección
- Precio sugerido
- Comisión plataforma
- Ganancia neta estimada
- Validación de vehículo apto ✓/✗

#### 3. Transportista Envía Puja

**Portal**: Carrier Portal  
**Acción**: Transportista ingresa monto de puja

**Validaciones:**
- Puja >= precio mínimo
- Transportista tiene vehículo apto
- Transportista no está suspendido

**Firestore write:**
```typescript
await db.collection('bids').add({
  auctionId,
  carrierId,
  driverId: null, // Se asigna después
  bidAmount: number,
  status: 'pending',
  createdAt: timestamp
});
```

#### 4. Admin Revisa Pujas

**Portal**: Super Admin Zone  
**Query:**
```typescript
db.collection('bids')
  .where('auctionId', '==', auctionId)
  .orderBy('bidAmount', 'desc')
  .get();
```

**Decisión**: Admin selecciona mejor puja (no siempre la más alta)

**Criterios:**
- Precio
- Rating del transportista
- Historial de entregas
- Disponibilidad

#### 5. Sistema Asigna Conductor

**Sistema**: Core System  
**Acción**: Actualizar estados

**Firestore writes:**
```typescript
// Actualizar auction
await db.collection('auctions').doc(auctionId).update({
  status: 'assigned',
  claimedBy: driverId,
  claimedAt: timestamp
});

// Actualizar bid ganadora
await db.collection('bids').doc(winningBidId).update({
  status: 'accepted'
});

// Rechazar otras bids
await Promise.all(
  losingBids.map(bid => 
    db.collection('bids').doc(bid.id).update({ status: 'rejected' })
  )
);

// Actualizar order
await db.collection('orders').doc(orderId).update({
  status: 'assigned',
  carrierId,
  driverId,
  auctionId
});
```

**Notificaciones:**
- SMS al conductor ganador
- Email al transportista ganador
- Notificaciones push a conductores perdedores

#### 6. Conductor Acepta/Rechaza

**Portal**: Mobile App  
**Decisión**: Conductor ve asignación y decide

**6A. Acepta:**
```typescript
await db.collection('orders').doc(orderId).update({
  status: 'assigned_confirmed'
});
```
→ Continúa a Flujo 3 (Preparación en Almacén)

**6B. Rechaza:**
```typescript
await db.collection('driver_rejections').add({
  driverId,
  orderId,
  reason: string,
  timestamp
});

await db.collection('orders').doc(orderId).update({
  status: 'rejected'
});
```
→ Vuelve a Admin para reasignar

### State Machine Transitions

```
PENDING_ASSIGNMENT → AUCTION_CREATED (admin crea subasta)
AUCTION_CREATED → BIDDING (transportistas pujan)
BIDDING → ASSIGNED (admin selecciona ganador)
ASSIGNED → ASSIGNED_CONFIRMED (conductor acepta)
ASSIGNED → REJECTED (conductor rechaza)
```

### Métricas

- **Auction Fill Rate**: % de subastas que se asignan
- **Average Bid Count**: Promedio de pujas por subasta
- **Time to Assignment**: Tiempo promedio hasta asignación

---

## FLUJO 3: PREPARACIÓN EN ALMACÉN

### Diagrama

![Flujo 3: Preparación en Almacén](/public/docs/flujo-3-preparacion-almacen.png)

### Actores
- **Warehouse Portal** (Almacén)
- **Mobile App** (Conductor)
- **Core System** (Backend)
- **Firestore** (Database)

### Descripción

Proceso de preparación de carga en el almacén y pickup por parte del conductor.

### Pasos Detallados

#### 1. Almacén Ve Orden Lista

**Portal**: Warehouse Portal  
**Query:**
```typescript
db.collection('orders')
  .where('status', '==', 'assigned_confirmed')
  .where('pickupDate', '<=', tomorrow)
  .orderBy('pickupDate', 'asc')
  .get();
```

**Display**: Lista de órdenes pendientes de preparación

#### 2. Almacenero Prepara Carga

**Portal**: Warehouse Portal  
**Acciones:**
1. Verificar peso y dimensiones reales
2. Generar código de barras/QR
3. Cargar en área de staging
4. Tomar fotos de la carga
5. Marcar como "lista para pickup"

**Firestore write:**
```typescript
await db.collection('shipments').doc(shipmentId).set({
  orderId,
  barcode: generateBarcode(orderId),
  qrCode: generateQR(orderId),
  pickupPhotos: [url1, url2, url3],
  status: 'preparing',
  createdAt: timestamp
});
```

**Notificación**: SMS al conductor "Carga lista para recolección"

#### 3. Conductor Llega al Almacén

**Portal**: Mobile App  
**Acción**: Conductor hace check-in GPS

**Validación geofencing:**
```typescript
const distance = calculateDistance(
  driverLocation,
  warehouseLocation
);

if (distance > 100) { // metros
  throw new Error('Debes estar en el almacén');
}
```

#### 4. Conductor Escanea Código

**Portal**: Mobile App  
**Tech**: Camera API + Barcode/QR Scanner

**Validación:**
```typescript
const shipment = await db.collection('shipments')
  .where('barcode', '==', scannedCode)
  .get();

if (!shipment.exists) {
  throw new Error('Código inválido');
}

if (shipment.orderId !== assignedOrderId) {
  throw new Error('Esta carga no es tuya');
}
```

#### 5. Conductor Verifica y Fotografía

**Portal**: Mobile App  
**Acciones:**
1. Tomar foto de la carga
2. Confirmar peso/dimensiones
3. Reportar cualquier discrepancia
4. Firmar recibo digital

**Firestore update:**
```typescript
await db.collection('shipments').doc(shipmentId).update({
  status: 'picked_up',
  pickupTime: timestamp,
  pickupPhotos: arrayUnion(...newPhotos),
  driverSignature: signatureUrl
});
```

#### 6. Inicia Viaje

**Sistema**: Core System  
**State Machine**: `assigned_confirmed` → `in_transit`

**Firestore update:**
```typescript
await db.collection('orders').doc(orderId).update({
  status: 'in_transit',
  actualPickupTime: timestamp
});
```

**Activaciones:**
- GPS tracking continuo (cada 10 segundos)
- Validación de riesgos en tiempo real
- ETA calculation automático

**Notificaciones:**
- SMS al cliente: "Tu envío está en camino. ETA: XX:XX"
- Email con link de tracking

→ Continúa a Flujo 4 (Tracking en Vivo)

### State Machine Transitions

```
ASSIGNED_CONFIRMED → PREPARING (almacén inicia preparación)
PREPARING → READY_FOR_PICKUP (carga lista)
READY_FOR_PICKUP → PICKED_UP (conductor confirma)
PICKED_UP → IN_TRANSIT (conductor inicia viaje)
```

### Métricas

- **Preparation Time**: Tiempo promedio de preparación
- **Pickup Accuracy**: % de pickups sin discrepancias
- **On-Time Pickup Rate**: % de pickups a tiempo

---

## FLUJO 4: TRACKING EN VIVO + VALIDACIÓN DE RIESGOS

### Diagrama

![Flujo 4: Tracking en Vivo + Validación de Riesgos](/public/docs/flujo-4-tracking-riesgos.png)

### Actores
- **Mobile App** (Conductor)
- **Core System** (Backend)
- **Customer Portal** (Cliente)
- **Super Admin Zone** (Admin)
- **3rd Party** (Google Maps, Samsara GPS)
- **Firestore** (Database)

### Descripción

Tracking GPS en tiempo real con validación automática de zonas de riesgo y cálculo dinámico de ETA.

### Pasos Detallados

#### 1. GPS Continuo del Conductor

**Portal**: Mobile App  
**Frecuencia**: Cada 10 segundos

**Geolocation API:**
```typescript
navigator.geolocation.watchPosition(
  async (position) => {
    await db.collection('tracking').add({
      orderId,
      driverId,
      vehicleId,
      location: new GeoPoint(
        position.coords.latitude,
        position.coords.longitude
      ),
      speed: position.coords.speed,
      heading: position.coords.heading,
      accuracy: position.coords.accuracy,
      timestamp: new Date(),
      eventType: 'gps_update'
    });
  },
  { enableHighAccuracy: true }
);
```

**Optimización**: Batch writes cada 30 segundos para reducir costos

#### 2. Validación de Zonas de Riesgo

**Sistema**: Core System  
**Trigger**: Cloud Function on tracking write

**Query risk zones:**
```typescript
const riskZones = await db.collection('risk_zones')
  .where('status', '==', 'active')
  .get();

for (const zone of riskZones) {
  const distance = calculateDistance(
    driverLocation,
    zone.center
  );
  
  if (distance <= zone.radius) {
    // RIESGO DETECTADO
    await handleRiskDetection(orderId, zone);
  }
}
```

**Geofencing con Google Maps:**
```typescript
const isInRiskZone = await googleMaps.geometry.poly.containsLocation(
  driverLocation,
  riskZonePolygon
);
```

#### 3. Manejo de Riesgo Detectado

**Sistema**: Core System  
**Event**: `RiskDetected`

**Acciones automáticas:**
```typescript
// Crear incidente
await db.collection('incidents').add({
  orderId,
  driverId,
  type: 'security',
  severity: zone.severity, // 'low' | 'medium' | 'high' | 'critical'
  description: `Conductor en zona de riesgo: ${zone.name}`,
  location: driverLocation,
  status: 'reported',
  reportedAt: timestamp
});

// Notificar Super Admin
await sendNotification({
  userId: 'super_admin',
  type: 'push',
  title: '⚠️ Riesgo Detectado',
  body: `Orden ${orderId} en zona ${zone.name}`,
  priority: 'high'
});

// SMS al conductor
await twilioClient.messages.create({
  to: driverPhone,
  body: `ALERTA: Estás en zona de riesgo. Procede con precaución.`
});
```

**Admin Decision:**
- **Continuar**: Monitorear de cerca
- **Pausar ruta**: Cambiar estado a `paused_security`
- **Cancelar**: Abortar entrega y retornar

#### 4. Cliente Ve Tracking

**Portal**: Customer Portal  
**Tech**: Firestore Realtime + Google Maps

**Query:**
```typescript
db.collection('tracking')
  .where('orderId', '==', orderId)
  .orderBy('timestamp', 'desc')
  .limit(1)
  .onSnapshot(snapshot => {
    const latestLocation = snapshot.docs[0].data();
    updateMapMarker(latestLocation);
    updateETA(latestLocation);
  });
```

**Display:**
- Mapa con ubicación en tiempo real
- Ruta completa (origen → ubicación actual → destino)
- ETA dinámico
- Estado del envío
- Botón de chat/soporte

#### 5. Cálculo Dinámico de ETA

**Sistema**: Core System  
**API**: Google Maps Directions API

**Cálculo:**
```typescript
const directions = await googleMaps.directions({
  origin: currentLocation,
  destination: deliveryAddress,
  mode: 'driving',
  departure_time: 'now',
  traffic_model: 'best_guess'
});

const eta = new Date(
  Date.now() + directions.routes[0].legs[0].duration_in_traffic.value * 1000
);

await db.collection('orders').doc(orderId).update({
  currentETA: eta
});
```

**Actualización**: Cada 5 minutos o cuando hay cambio significativo

#### 6. Detección de Paradas

**Sistema**: Core System  
**Logic**: Si velocidad < 5 km/h por > 10 minutos

**Acciones:**
```typescript
await db.collection('tracking').add({
  orderId,
  driverId,
  location: currentLocation,
  eventType: 'stop_detected',
  timestamp
});

// Notificar cliente si parada > 30 minutos
if (stopDuration > 30 * 60 * 1000) {
  await sendNotification({
    userId: clientId,
    type: 'sms',
    body: `Tu envío ha hecho una parada. ETA actualizado.`
  });
}
```

### State Machine Transitions

```
IN_TRANSIT (normal)
IN_TRANSIT → PAUSED_SECURITY (riesgo crítico)
PAUSED_SECURITY → IN_TRANSIT (riesgo resuelto)
PAUSED_SECURITY → CANCELLED (admin cancela)
```

### Métricas

- **GPS Accuracy**: Precisión promedio de GPS
- **Risk Zone Entries**: Número de entradas a zonas de riesgo
- **ETA Accuracy**: Diferencia entre ETA y tiempo real
- **Tracking Uptime**: % de tiempo con GPS activo

---

## FLUJO 5: ENTREGA Y CONFIRMACIÓN

### Diagrama

![Flujo 5-8: Overview](/public/docs/flujo-5-8-overview.png)

*Nota: La imagen muestra los flujos 5-8. Ver sección específica para Flujo 5.*

### Actores
- **Mobile App** (Conductor)
- **Core System** (Backend)
- **Customer Portal** (Cliente)
- **Firestore** (Database)

### Descripción

Proceso de entrega final con validación GPS, captura de firma digital y generación de POD (Proof of Delivery).

### Pasos Detallados

#### 1. Conductor Llega a Destino

**Portal**: Mobile App  
**Validación GPS:**
```typescript
const distance = calculateDistance(
  driverLocation,
  deliveryAddress
);

if (distance > 100) { // metros
  showError('Debes estar en la ubicación de entrega');
  disableDeliveryButton();
} else {
  enableDeliveryButton();
}
```

**Geofencing automático**: Notificación push cuando conductor entra en radio de 500m

#### 2. Proceso de Entrega

**Portal**: Mobile App  
**Pasos:**

1. **Tomar foto del envío entregado**
   ```typescript
   const photo = await Camera.takePicture({
     quality: 80,
     allowEditing: false
   });
   
   const photoUrl = await uploadToStorage(photo, `deliveries/${orderId}/`);
   ```

2. **Capturar firma digital del receptor**
   ```typescript
   const signature = await SignaturePad.getSignature();
   const signatureUrl = await uploadToStorage(signature, `signatures/${orderId}/`);
   ```

3. **Ingresar nombre del receptor**
   ```typescript
   const receiverName = await promptForName();
   ```

4. **Confirmar entrega**
   ```typescript
   await db.collection('shipments').doc(shipmentId).update({
     status: 'delivered',
     deliveryTime: timestamp,
     deliveryPhotos: arrayUnion(photoUrl),
     signature: signatureUrl,
     signedBy: receiverName,
     deliveryLocation: new GeoPoint(lat, lng)
   });
   ```

#### 3. Generación de POD (Proof of Delivery)

**Sistema**: Core System  
**Trigger**: Cloud Function on shipment status = 'delivered'

**PDF Generation:**
```typescript
const podData = {
  orderNumber: order.id,
  client: client.name,
  origin: order.origin.address,
  destination: order.destination.address,
  cargo: order.cargo,
  pickupTime: shipment.pickupTime,
  deliveryTime: shipment.deliveryTime,
  driver: driver.name,
  vehicle: vehicle.plates,
  photos: shipment.deliveryPhotos,
  signature: shipment.signature,
  signedBy: shipment.signedBy,
  generatedAt: new Date()
};

const pdfUrl = await generatePOD(podData);

await db.collection('documents').add({
  orderId: order.id,
  type: 'pod',
  name: `POD-${order.id}.pdf`,
  url: pdfUrl,
  uploadedBy: 'system',
  createdAt: timestamp
});

await db.collection('shipments').doc(shipmentId).update({
  podUrl: pdfUrl
});
```

#### 4. Actualización de Estado

**Sistema**: Core System  
**State Machine**: `in_transit` → `delivered`

**Firestore update:**
```typescript
await db.collection('orders').doc(orderId).update({
  status: 'delivered',
  actualDeliveryTime: timestamp,
  deliveryDuration: actualDeliveryTime - actualPickupTime
});
```

#### 5. Notificaciones al Cliente

**Sistema**: Core System  
**Canales**: SMS + Email

**SMS:**
```
¡Tu envío ha sido entregado! 
Recibido por: [Nombre]
Hora: [HH:MM]
Ver comprobante: [Link]
```

**Email:**
- Asunto: "Entrega Confirmada - Orden #[ID]"
- Cuerpo: Detalles de entrega + link a POD
- Adjunto: PDF del POD
- CTA: "Calificar servicio"

#### 6. Solicitud de Calificación

**Portal**: Customer Portal  
**Timing**: Inmediatamente después de entrega

**Rating form:**
```typescript
interface DeliveryRating {
  orderId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  categories: {
    punctuality: number;
    communication: number;
    cargoCondition: number;
    driverProfessionalism: number;
  };
  comments?: string;
  wouldRecommend: boolean;
}
```

**Firestore write:**
```typescript
await db.collection('orders').doc(orderId).update({
  rating: ratingData.rating,
  ratingCategories: ratingData.categories,
  ratingComments: ratingData.comments,
  ratedAt: timestamp
});

// Actualizar stats del conductor
await db.collection('drivers').doc(driverId).update({
  rating: calculateNewAverage(currentRating, newRating),
  totalRatings: increment(1)
});
```

#### 7. Finalización de Orden

**Sistema**: Core System  
**State Machine**: `delivered` → `completed`

**Trigger**: 24 horas después de entrega (si no hay reclamos)

**Firestore update:**
```typescript
await db.collection('orders').doc(orderId).update({
  status: 'completed',
  completedAt: timestamp
});
```

**Event**: `OrderCompleted` → Trigger cálculo de rentabilidad (Flujo 7)

### State Machine Transitions

```
IN_TRANSIT → DELIVERED (conductor confirma entrega)
DELIVERED → COMPLETED (24h sin reclamos)
DELIVERED → DISPUTED (cliente reporta problema)
```

### Métricas

- **On-Time Delivery Rate**: % de entregas a tiempo
- **POD Generation Time**: Tiempo para generar POD
- **Average Rating**: Calificación promedio
- **Delivery Accuracy**: % de entregas sin problemas

---

## FLUJO 6: SEGUIMIENTO DE ÓRDENES

### Actores
- **Customer Portal** (Cliente)
- **Carrier Portal** (Transportista)
- **Mobile App** (Conductor)
- **Core System** (Backend)
- **Firestore** (Database)

### Descripción

Infraestructura de seguimiento en tiempo real para todos los stakeholders.

### Componentes Técnicos

#### 1. WebSocket Server

**Tech**: Socket.io

**Server setup:**
```typescript
io.on('connection', (socket) => {
  socket.on('subscribe:order', async (orderId) => {
    // Validar permisos
    const hasAccess = await validateOrderAccess(socket.userId, orderId);
    if (!hasAccess) return;
    
    // Unirse a room
    socket.join(`order:${orderId}`);
    
    // Enviar estado actual
    const order = await getOrderWithTracking(orderId);
    socket.emit('order:update', order);
  });
});
```

**Firestore listener:**
```typescript
db.collection('orders').doc(orderId)
  .onSnapshot(snapshot => {
    io.to(`order:${orderId}`).emit('order:update', snapshot.data());
  });

db.collection('tracking')
  .where('orderId', '==', orderId)
  .orderBy('timestamp', 'desc')
  .limit(1)
  .onSnapshot(snapshot => {
    io.to(`order:${orderId}`).emit('tracking:update', snapshot.docs[0].data());
  });
```

#### 2. Cliente - Tracking Widget

**Portal**: Customer Portal  
**Component**: `OrderTrackingWidget.tsx`

**Features:**
- Mapa en tiempo real
- Timeline de eventos
- ETA dinámico
- Información del conductor
- Chat/soporte

**React Query:**
```typescript
const { data: order } = useQuery({
  queryKey: ['order', orderId],
  queryFn: () => fetchOrder(orderId),
  refetchInterval: 30000 // Fallback si WebSocket falla
});

useEffect(() => {
  socket.emit('subscribe:order', orderId);
  
  socket.on('order:update', (data) => {
    queryClient.setQueryData(['order', orderId], data);
  });
  
  return () => {
    socket.emit('unsubscribe:order', orderId);
  };
}, [orderId]);
```

#### 3. Transportista - Dashboard

**Portal**: Carrier Portal  
**Component**: `FleetDashboard.tsx`

**Features:**
- Vista de todas las órdenes activas
- Mapa con múltiples conductores
- Filtros por estado
- Alertas en tiempo real

**Query:**
```typescript
const { data: activeOrders } = useQuery({
  queryKey: ['orders', 'active', carrierId],
  queryFn: async () => {
    const snapshot = await db.collection('orders')
      .where('carrierId', '==', carrierId)
      .where('status', 'in', ['in_transit', 'assigned_confirmed'])
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  }
});
```

#### 4. Conductor - Vista de Ruta

**Portal**: Mobile App  
**Component**: `ActiveDeliveryScreen.tsx`

**Features:**
- Navegación turn-by-turn (Google Maps)
- Información de la orden
- Botón de emergencia/incidente
- Chat con cliente/soporte

**Navigation:**
```typescript
const openNavigation = () => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deliveryAddress)}`;
  Linking.openURL(url);
};
```

### Eventos en Tiempo Real

**Event Types:**
```typescript
enum OrderEvent {
  ORDER_CREATED = 'order:created',
  ORDER_ASSIGNED = 'order:assigned',
  PICKUP_COMPLETED = 'order:picked_up',
  IN_TRANSIT = 'order:in_transit',
  DELIVERY_COMPLETED = 'order:delivered',
  ORDER_COMPLETED = 'order:completed',
  RISK_DETECTED = 'order:risk_detected',
  INCIDENT_REPORTED = 'order:incident_reported',
  ETA_UPDATED = 'order:eta_updated'
}
```

**Event Bus:**
```typescript
eventBus.on(OrderEvent.IN_TRANSIT, async (order) => {
  // Notificar cliente
  await sendNotification({
    userId: order.clientId,
    type: 'push',
    title: 'Envío en camino',
    body: `Tu orden #${order.id} está en tránsito`
  });
  
  // Activar tracking GPS
  await activateGPSTracking(order.driverId);
  
  // Calcular ETA inicial
  await calculateAndUpdateETA(order.id);
});
```

### Métricas

- **WebSocket Uptime**: % de tiempo con conexión activa
- **Event Latency**: Tiempo desde evento hasta notificación
- **Tracking Accuracy**: Precisión de ubicación
- **User Engagement**: % de usuarios que usan tracking

---

## FLUJO 7: CÁLCULO DE RENTABILIDAD

### Diagrama

*Ver imagen overview de flujos 5-8*

### Actores
- **Core System** (Backend)
- **Carrier Portal** (Transportista)
- **Super Admin Zone** (Admin)
- **BigQuery** (Analytics)
- **Firestore** (Database)

### Descripción

Cálculo automático de rentabilidad post-entrega con análisis de costos, márgenes y ROI.

### Pasos Detallados

#### 1. Trigger de Cálculo

**Sistema**: Core System  
**Trigger**: Cloud Function on order status = 'completed'

**Event**: `OrderCompleted`

#### 2. Recopilación de Datos

**Sistema**: Core System  
**Módulo**: `profitability-calculator.ts`

**Datos necesarios:**
```typescript
interface ProfitabilityData {
  // Ingresos
  revenue: {
    basePrice: number;
    fuelSurcharge: number;
    insurance: number;
    total: number;
  };
  
  // Costos
  costs: {
    fuel: {
      distance: number; // km
      fuelConsumption: number; // L/100km
      fuelPrice: number; // $/L
      total: number;
    };
    salary: {
      driverHours: number;
      hourlyRate: number;
      total: number;
    };
    tolls: {
      tollCount: number;
      totalAmount: number;
    };
    depreciation: {
      vehicleValue: number;
      depreciationRate: number; // % por km
      distance: number;
      total: number;
    };
    maintenance: {
      perKmCost: number;
      distance: number;
      total: number;
    };
    insurance: {
      dailyRate: number;
      days: number;
      total: number;
    };
    platformCommission: {
      rate: number; // % (si es subasta)
      total: number;
    };
    other: number;
  };
  
  // Métricas
  distance: number; // km
  duration: number; // horas
  type: 'regular' | 'auction';
}
```

#### 3. Cálculo de Costos

**Fuel Cost:**
```typescript
const fuelCost = (distance / 100) * fuelConsumption * fuelPrice;
```

**Salary Cost:**
```typescript
const driverHours = (actualDeliveryTime - actualPickupTime) / (1000 * 60 * 60);
const salaryCost = driverHours * hourlyRate;
```

**Depreciation:**
```typescript
const depreciationCost = (vehicleValue * depreciationRate * distance) / 100000;
```

**Total Costs:**
```typescript
const totalCosts = 
  fuelCost + 
  salaryCost + 
  tollsCost + 
  depreciationCost + 
  maintenanceCost + 
  insuranceCost + 
  platformCommission + 
  otherCosts;
```

#### 4. Cálculo de Rentabilidad

**Margin:**
```typescript
const margin = revenue.total - totalCosts;
```

**ROI:**
```typescript
const roi = (margin / totalCosts) * 100; // %
```

**Profit per km:**
```typescript
const profitPerKm = margin / distance;
```

**Profit per hour:**
```typescript
const profitPerHour = margin / duration;
```

#### 5. Almacenamiento en Firestore

**Firestore write:**
```typescript
await db.collection('analytics').add({
  orderId,
  carrierId,
  driverId,
  vehicleId,
  revenue: revenue.total,
  costs: {
    fuel: fuelCost,
    salary: salaryCost,
    tolls: tollsCost,
    depreciation: depreciationCost,
    maintenance: maintenanceCost,
    insurance: insuranceCost,
    platformCommission,
    other: otherCosts,
    total: totalCosts
  },
  margin,
  roi,
  profitPerKm,
  profitPerHour,
  distance,
  duration,
  type: order.type,
  route: {
    origin: order.origin,
    destination: order.destination
  },
  createdAt: timestamp
});
```

#### 6. Actualización de Stats del Conductor

**Firestore update:**
```typescript
await db.collection('drivers').doc(driverId).update({
  totalTrips: increment(1),
  totalDistance: increment(distance),
  totalRevenue: increment(revenue.total),
  totalProfit: increment(margin),
  averageROI: calculateNewAverage(currentROI, roi)
});
```

#### 7. Exportación a BigQuery

**Sistema**: Core System  
**Frequency**: Batch job cada hora

**BigQuery insert:**
```typescript
await bigquery.dataset('jfc_analytics').table('profitability').insert([{
  order_id: orderId,
  carrier_id: carrierId,
  driver_id: driverId,
  revenue: revenue.total,
  costs: totalCosts,
  margin,
  roi,
  distance,
  duration,
  type: order.type,
  timestamp: new Date()
}]);
```

**Beneficios de BigQuery:**
- Análisis histórico
- Queries complejas
- Machine Learning (predicción de rentabilidad)
- Reportes ejecutivos

#### 8. Dashboard de Rentabilidad

**Portal**: Carrier Portal  
**Component**: `ProfitabilityDashboard.tsx`

**KPIs mostrados:**

```typescript
interface ProfitabilityKPIs {
  // Totales
  totalRevenue: number;
  totalCosts: number;
  totalMargin: number;
  averageROI: number;
  
  // Por período
  monthlyRevenue: number;
  monthlyMargin: number;
  
  // Utilización de flota
  fleetUtilization: number; // % de tiempo con carga
  emptyMiles: number; // km sin carga
  emptyMilesPercentage: number;
  
  // Por ruta
  topRoutes: Array<{
    route: string;
    trips: number;
    avgMargin: number;
    avgROI: number;
  }>;
  
  // Por conductor
  driverPerformance: Array<{
    driverId: string;
    name: string;
    trips: number;
    avgMargin: number;
    rating: number;
  }>;
  
  // Efectividad de subastas
  auctionStats: {
    totalAuctions: number;
    auctionsWon: number;
    winRate: number;
    avgMarginAuctions: number;
    avgMarginRegular: number;
  };
}
```

**Charts (Recharts):**
- Revenue vs Costs (línea temporal)
- Margin por ruta (bar chart)
- ROI distribution (histogram)
- Fleet utilization (gauge)
- Cost breakdown (pie chart)

#### 9. Reportes Automáticos

**Sistema**: Core System  
**Frequency**: Semanal/Mensual

**Email report:**
- PDF con KPIs principales
- Gráficas de tendencias
- Recomendaciones automáticas (IA)
- Comparación con período anterior

**Recomendaciones IA (Claude API):**
```typescript
const recommendations = await claude.messages.create({
  model: 'claude-3-sonnet',
  messages: [{
    role: 'user',
    content: `Analiza estos datos de rentabilidad y proporciona 3 recomendaciones:
    ${JSON.stringify(profitabilityData)}`
  }]
});
```

### Métricas

- **Average Margin**: Margen promedio por orden
- **Fleet Utilization**: % de utilización de flota
- **Empty Miles Reduction**: Reducción de km vacíos (gracias a subastas)
- **ROI Trend**: Tendencia de ROI mes a mes

---

## FLUJO 8: CASOS EXCEPCIONALES & SOPORTE

### Diagrama

*Ver imagen overview de flujos 5-8*

### Actores
- **Todos los portales**
- **Core System** (Backend)
- **Super Admin Zone** (Admin)
- **3rd Party** (Claude API, Twilio)
- **Firestore** (Database)

### Descripción

Manejo de excepciones, incidentes y sistema de soporte multi-canal.

### Casos Excepcionales

#### A. CONDUCTOR RECHAZA MÚLTIPLES ASIGNACIONES

**Trigger**: Driver rechaza > 3 asignaciones en 24h

**Sistema**: Core System  
**Cloud Function**: `onDriverRejection`

**Logic:**
```typescript
const rejections = await db.collection('driver_rejections')
  .where('driverId', '==', driverId)
  .where('timestamp', '>', last24Hours)
  .get();

if (rejections.size >= 3) {
  // Reducir prioridad
  await db.collection('drivers').doc(driverId).update({
    assignmentPriority: 'low',
    status: 'under_review'
  });
  
  // Notificar admin
  await sendNotification({
    userId: 'super_admin',
    type: 'push',
    title: 'Conductor con múltiples rechazos',
    body: `${driver.name} ha rechazado ${rejections.size} asignaciones`
  });
  
  // Posible suspensión temporal
  if (rejections.size >= 5) {
    await db.collection('drivers').doc(driverId).update({
      status: 'suspended',
      suspensionReason: 'multiple_rejections',
      suspendedUntil: add24Hours(new Date())
    });
  }
}
```

#### B. INCIDENTE CRÍTICO (ASALTO/ACCIDENTE)

**Portal**: Mobile App  
**Action**: Conductor presiona botón de emergencia

**Immediate actions:**
```typescript
// 1. Crear incidente crítico
const incidentId = await db.collection('incidents').add({
  orderId,
  driverId,
  type: 'security',
  severity: 'critical',
  description: 'Botón de emergencia activado',
  location: currentLocation,
  status: 'reported',
  reportedAt: timestamp
});

// 2. Notificar Super Admin INMEDIATAMENTE
await sendNotification({
  userId: 'super_admin',
  type: 'push',
  title: '🚨 EMERGENCIA',
  body: `Conductor ${driver.name} activó botón de emergencia`,
  priority: 'urgent',
  sound: 'emergency'
});

// 3. SMS a número de emergencia
await twilioClient.messages.create({
  to: emergencyNumber,
  body: `EMERGENCIA - Conductor: ${driver.name}, Ubicación: ${location}, Orden: ${orderId}`
});

// 4. Pausar orden
await db.collection('orders').doc(orderId).update({
  status: 'paused_security',
  pausedAt: timestamp,
  pauseReason: 'emergency_button'
});

// 5. Grabar audio/video si está disponible
if (hasRecordingCapability) {
  await startEmergencyRecording(driverId);
}
```

**Admin response workflow:**
```typescript
// Admin ve dashboard de emergencia
// Opciones:
// 1. Llamar al conductor
// 2. Contactar autoridades
// 3. Decidir siguiente paso

if (adminDecision === 'continue_with_security') {
  await db.collection('orders').doc(orderId).update({
    status: 'in_transit',
    resumedAt: timestamp
  });
} else if (adminDecision === 'cancel_order') {
  await cancelOrderAndRefund(orderId, 'security_incident');
}
```

#### C. CLIENTE CANCELA ORDEN

**Portal**: Customer Portal  
**Action**: Cliente solicita cancelación

**Cancelación antes de asignación:**
```typescript
if (order.status === 'pending_assignment') {
  // Reembolso completo
  await processRefund(order.paymentId, order.pricing.total);
  
  await db.collection('orders').doc(orderId).update({
    status: 'cancelled',
    cancelledBy: 'client',
    cancelledAt: timestamp,
    refundAmount: order.pricing.total
  });
  
  await sendNotification({
    userId: order.clientId,
    type: 'email',
    subject: 'Cancelación confirmada',
    body: 'Tu orden ha sido cancelada. Reembolso completo procesado.'
  });
}
```

**Cancelación después de asignación:**
```typescript
if (order.status === 'assigned' || order.status === 'assigned_confirmed') {
  // Fee de cancelación 20%
  const cancellationFee = order.pricing.total * 0.20;
  const refundAmount = order.pricing.total - cancellationFee;
  
  // Mostrar confirmación al cliente
  const confirmed = await showCancellationModal({
    cancellationFee,
    refundAmount
  });
  
  if (confirmed) {
    await processRefund(order.paymentId, refundAmount);
    
    await db.collection('orders').doc(orderId).update({
      status: 'cancelled',
      cancelledBy: 'client',
      cancelledAt: timestamp,
      cancellationFee,
      refundAmount
    });
    
    // Notificar conductor
    await sendNotification({
      userId: order.driverId,
      type: 'push',
      title: 'Orden cancelada',
      body: `La orden #${orderId} ha sido cancelada por el cliente`
    });
    
    // Liberar conductor
    await db.collection('drivers').doc(order.driverId).update({
      status: 'available'
    });
  }
}
```

**Cancelación durante tránsito:**
```typescript
if (order.status === 'in_transit') {
  // Requiere intervención de admin
  await db.collection('support_tickets').add({
    userId: order.clientId,
    orderId,
    subject: 'Solicitud de cancelación en tránsito',
    category: 'cancellation',
    priority: 'high',
    status: 'open',
    createdAt: timestamp
  });
  
  await sendNotification({
    userId: 'super_admin',
    type: 'push',
    title: 'Cancelación en tránsito',
    body: `Cliente solicita cancelar orden #${orderId} en tránsito`
  });
  
  // Admin coordina retorno seguro de carga
}
```

#### D. CONEXIÓN PERDIDA (OFFLINE MODE)

**Portal**: Mobile App  
**Tech**: Firestore Offline Persistence + Local Storage

**Offline capabilities:**
```typescript
// Habilitar persistencia offline
await enableIndexedDbPersistence(db);

// Continuar registrando GPS localmente
const offlineQueue = [];

navigator.geolocation.watchPosition((position) => {
  const trackingData = {
    orderId,
    driverId,
    location: new GeoPoint(position.coords.latitude, position.coords.longitude),
    timestamp: new Date(),
    offline: true
  };
  
  // Guardar en local storage
  offlineQueue.push(trackingData);
  localStorage.setItem('offline_tracking', JSON.stringify(offlineQueue));
});

// Permitir confirmar entrega offline
const deliveryData = {
  orderId,
  photos: localPhotos,
  signature: localSignature,
  timestamp: new Date(),
  offline: true
};
localStorage.setItem('pending_delivery', JSON.stringify(deliveryData));

// Mostrar indicador de modo offline
showOfflineIndicator();
```

**Recuperación de conexión:**
```typescript
window.addEventListener('online', async () => {
  // Sincronizar datos offline
  const offlineTracking = JSON.parse(localStorage.getItem('offline_tracking') || '[]');
  const pendingDelivery = JSON.parse(localStorage.getItem('pending_delivery') || 'null');
  
  // Subir tracking data
  for (const tracking of offlineTracking) {
    await db.collection('tracking').add(tracking);
  }
  
  // Subir delivery data
  if (pendingDelivery) {
    // Subir fotos a Storage
    const photoUrls = await uploadPhotos(pendingDelivery.photos);
    const signatureUrl = await uploadSignature(pendingDelivery.signature);
    
    // Actualizar Firestore
    await db.collection('shipments').doc(shipmentId).update({
      status: 'delivered',
      deliveryTime: pendingDelivery.timestamp,
      deliveryPhotos: photoUrls,
      signature: signatureUrl
    });
  }
  
  // Limpiar storage
  localStorage.removeItem('offline_tracking');
  localStorage.removeItem('pending_delivery');
  
  // Ocultar indicador
  hideOfflineIndicator();
  
  // Notificar usuario
  showToast('Datos sincronizados correctamente');
});
```

### Sistema de Soporte

#### 1. Chat con IA (Claude)

**Portal**: Customer Portal, Mobile App  
**Component**: `SupportChat.tsx`

**Chatbot implementation:**
```typescript
const handleUserMessage = async (message: string) => {
  // Contexto del usuario
  const context = {
    userId,
    currentOrder: activeOrder,
    orderHistory: recentOrders,
    userType: 'customer' // o 'driver'
  };
  
  // Llamar a Claude API
  const response = await claude.messages.create({
    model: 'claude-3-sonnet',
    messages: [
      {
        role: 'user',
        content: `Contexto: ${JSON.stringify(context)}\n\nPregunta: ${message}`
      }
    ],
    system: `Eres un asistente de soporte para JFC Cargo Destino. 
    Ayuda a los usuarios con preguntas sobre sus envíos, tracking, pagos, etc.
    Si no puedes resolver el problema, escala a un humano.`
  });
  
  // Detectar si necesita escalamiento
  if (response.content.includes('[ESCALATE]')) {
    await createSupportTicket(userId, message);
    return {
      message: 'He creado un ticket de soporte. Un agente te contactará pronto.',
      escalated: true
    };
  }
  
  return {
    message: response.content,
    escalated: false
  };
};
```

#### 2. Sistema de Tickets

**Portal**: Todos  
**Collection**: `support_tickets`

**Crear ticket:**
```typescript
await db.collection('support_tickets').add({
  userId,
  orderId: orderId || null,
  subject: string,
  description: string,
  category: 'technical' | 'billing' | 'delivery' | 'other',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  status: 'open',
  messages: [{
    from: userId,
    message: description,
    timestamp: new Date()
  }],
  createdAt: timestamp
});
```

**Escalamiento automático:**
```typescript
// Si ticket no se responde en X tiempo
const unrespondedTickets = await db.collection('support_tickets')
  .where('status', '==', 'open')
  .where('createdAt', '<', subtract4Hours(new Date()))
  .get();

for (const ticket of unrespondedTickets.docs) {
  await db.collection('support_tickets').doc(ticket.id).update({
    priority: 'high',
    escalatedAt: timestamp
  });
  
  await sendNotification({
    userId: 'support_supervisor',
    type: 'push',
    title: 'Ticket escalado',
    body: `Ticket #${ticket.id} sin respuesta por 4 horas`
  });
}
```

#### 3. Dashboard de Soporte

**Portal**: Super Admin Zone  
**Component**: `SupportDashboard.tsx`

**Features:**
- Lista de tickets abiertos
- Filtros por prioridad/categoría
- Asignación de tickets a agentes
- Respuestas rápidas (templates)
- Historial de conversaciones
- Métricas de soporte

**Métricas:**
- Average Response Time
- Average Resolution Time
- Ticket Volume (por día/semana)
- Customer Satisfaction (CSAT)
- First Contact Resolution Rate

### Métricas

- **Incident Response Time**: Tiempo promedio de respuesta a incidentes
- **Ticket Resolution Time**: Tiempo promedio de resolución
- **Escalation Rate**: % de tickets escalados
- **Customer Satisfaction**: Rating de soporte

---

## RESUMEN DE INTEGRACIONES

| Flujo | Integraciones Clave |
|-------|-------------------|
| Flujo 1 | Stripe/PayPal, Google Maps, Twilio, SendGrid |
| Flujo 2 | Twilio, Firebase FCM |
| Flujo 3 | Camera API, Barcode Scanner, Firebase Storage |
| Flujo 4 | Google Maps, Geofencing, Samsara GPS, Twilio |
| Flujo 5 | Camera API, Signature Pad, PDF Generator, SendGrid |
| Flujo 6 | Socket.io, Firebase Realtime, Google Maps |
| Flujo 7 | BigQuery, Claude API (recomendaciones) |
| Flujo 8 | Claude API (chatbot), Twilio (emergencias) |

---

**Última actualización**: 2026-01-20  
**Versión**: 1.0  
**Autor**: Equipo JFC Cargo Destino
