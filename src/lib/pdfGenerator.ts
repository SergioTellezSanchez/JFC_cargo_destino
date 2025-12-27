import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateShippingGuide = (pkg: any) => {
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(22);
    doc.setTextColor(31, 74, 94); // #1F4A5E
    doc.text('JFC CARGO Y DESTINO', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('TU CARGA, NUESTRO DESTINO', 105, 26, { align: 'center' });

    doc.setFontSize(8);
    doc.text('Carretera Toluca Atlacomulco Km 58.3, Estado de México, México', 105, 32, { align: 'center' });
    doc.text('contacto@jfccargodestino.com | +52 5541696690', 105, 36, { align: 'center' });

    // Shipping Info Box
    doc.setDrawColor(200);
    doc.line(10, 42, 200, 42);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`GUÍA DE ENVÍO: ${pkg.trackingId || 'PENDIENTE'}`, 10, 52);
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 150, 52);

    // Sender & Recipient Table
    (doc as any).autoTable({
        startY: 60,
        head: [['REMITENTE', 'DESTINATARIO']],
        body: [
            [
                `Nombre: ${pkg.senderName || 'N/A'}\nDirección: ${pkg.origin || 'N/A'}`,
                `Nombre: ${pkg.recipientName}\nDirección: ${pkg.destination || pkg.address}`
            ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [31, 74, 94] }
    });

    // Cargo Details
    (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['DETALLES DE LA CARGA', 'VALORES']],
        body: [
            ['TIPO DE CARGA', pkg.loadType === 'full-truck' ? 'Camión Completo' : pkg.loadType === 'van' ? 'Camioneta' : 'Especial'],
            ['VEHÍCULO', pkg.loadTypeDetails?.vehicleType || 'N/A'],
            ['PESO', `${pkg.weight} kg`],
            ['DIMENSIONES', pkg.dimensions || 'N/A'],
            ['VALOR DECLARADO', `$${pkg.price || 0} MXN`],
            ['ESTADO', pkg.status || 'PENDIENTE']
        ],
        theme: 'striped',
        headStyles: { fillColor: [31, 74, 94] }
    });

    // Legal Disclaimer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(100);
    const disclaimer = "Responsabilidades: El remitente declara que la mercancía no es peligrosa ni ilegal. JFC Cargo y Destino se hace responsable de la integridad de la carga desde la recolección hasta la entrega según los términos del seguro contratado (1.5% valor declarado).";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 180);
    doc.text(splitDisclaimer, 10, finalY);

    // Footer
    doc.text('Copia del Cliente', 105, 285, { align: 'center' });

    doc.save(`guia_jfc_${pkg.trackingId || 'draft'}.pdf`);
};
