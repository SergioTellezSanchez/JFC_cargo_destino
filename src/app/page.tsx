'use client';

import { useRouter } from 'next/navigation';
import { Truck, Plane, Ship, FileText, Warehouse, MapPin, Globe, Clock, ShieldCheck, Users, Phone, Mail } from 'lucide-react';

export default function Home() {
    const router = useRouter();

    return (
        <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(rgba(31, 74, 94, 0.9), rgba(31, 74, 94, 0.8)), url(/hero-bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'white',
                padding: '6rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh'
            }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
                    JFC Cargo y Destino
                </h1>
                <p style={{ fontSize: '1.5rem', marginBottom: '2rem', maxWidth: '800px', opacity: 0.9 }}>
                    Tu carga, nuestro destino.
                </p>
                <p style={{ fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '600px', color: 'var(--accent)' }}>
                    Soluciones logísticas por tierra, aire y mar. Operamos en México, Estados Unidos y Canadá.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        className="btn"
                        style={{ background: 'var(--accent)', color: 'var(--primary)', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem' }}
                        onClick={() => router.push('/quotation')}
                    >
                        Solicita tu cotización
                    </button>
                    <button
                        className="btn"
                        style={{ background: 'transparent', border: '2px solid white', color: 'white', padding: '1rem 2rem', fontSize: '1.1rem' }}
                        onClick={() => router.push('/packages/create')}
                    >
                        Rastrear Carga
                    </button>
                </div>
            </section>

            {/* Stats Section */}
            <section style={{ background: 'var(--primary)', color: 'white', padding: '3rem 2rem' }}>
                <div className="container">
                    <div className="responsive-grid">
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>+300</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Entregas mensuales</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>+100</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Alianzas internacionales</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>100%</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Tiempos garantizados</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section style={{ padding: '5rem 2rem', background: 'var(--background)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem' }}>Nuestros Servicios</h2>
                        <p style={{ color: 'var(--secondary)', maxWidth: '700px', margin: '0 auto' }}>
                            En JFC Cargo Destino ofrecemos una gama completa de soluciones logísticas diseñadas para adaptarse a cada tipo de carga y necesidad de transporte.
                        </p>
                    </div>

                    <div className="responsive-grid">
                        <ServiceCard
                            icon={<Truck size={40} />}
                            title="Transporte Terrestre"
                            desc="Coordinamos el transporte terrestre de tu carga con una red confiable de operadores, unidades seguras y seguimiento constante."
                        />
                        <ServiceCard
                            icon={<Plane size={40} />}
                            title="Carga Aérea"
                            desc="Ideal para envíos urgentes o de alto valor. Ofrecemos soluciones de carga aérea con tiempos reducidos y manejo especializado."
                        />
                        <ServiceCard
                            icon={<Ship size={40} />}
                            title="Carga Marítima"
                            desc="Consolidamos, transportamos y gestionamos tu carga vía marítima desde y hacia cualquier puerto del mundo."
                        />
                        <ServiceCard
                            icon={<FileText size={40} />}
                            title="Despacho Aduanal"
                            desc="Agilizamos el cruce de tu mercancía a través de procesos aduanales eficientes y conforme a la ley."
                        />
                        <ServiceCard
                            icon={<Warehouse size={40} />}
                            title="Almacenaje"
                            desc="Contamos con espacios seguros y estratégicamente ubicados para el resguardo temporal o prolongado de tu mercancía."
                        />
                        <ServiceCard
                            icon={<MapPin size={40} />}
                            title="Rastreo en Tiempo Real"
                            desc="Te ofrecemos visibilidad total en cada etapa del trayecto de tu carga, desde la recolección hasta la entrega final."
                        />
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section style={{ padding: '5rem 2rem', background: 'white' }}>
                <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1.5rem' }}>¿Por qué elegirnos?</h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '2rem' }}>
                            Más que un servicio de transporte, somos tu socio logístico de confianza.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <FeatureItem text="Rastreo en tiempo real" />
                            <FeatureItem text="Seguro de mercancía" />
                            <FeatureItem text="Atención personalizada" />
                            <FeatureItem text="Cumplimiento normativo (HAZMAT, aduanas)" />
                            <FeatureItem text="Cobertura trinacional" />
                            <FeatureItem text="Respuesta rápida y entregas urgentes" />
                        </ul>
                    </div>
                    <div style={{ background: 'var(--secondary-bg)', padding: '2rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                        {/* Placeholder for an image or graphic */}
                        <Globe size={120} color="var(--primary)" strokeWidth={1} />
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section style={{ padding: '5rem 2rem', background: 'var(--primary-light)' }}>
                <div className="container">
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '3rem', textAlign: 'center' }}>Testimonios</h2>
                    <div className="responsive-grid">
                        <TestimonialCard
                            quote="Es una empresa seria, con 10 años de trayectoria en el sector. Cumplen con los tiempos de entrega y cuidan nuestra carga como propia."
                            author="Roberto Gutiérrez"
                            role="Jefe de Operaciones, LogiTrade MX"
                        />
                        <TestimonialCard
                            quote="Gracias a JFC Cargo Destino logramos mover mercancía entre México y Canadá sin contratiempos. Su servicio terrestre es puntual y confiable."
                            author="Daniel Pérez"
                            role="Coordinador Logístico, Grupo Transcomex"
                        />
                        <TestimonialCard
                            quote="Siempre atentos, con excelente comunicación y rastreo en tiempo real. Nos han apoyado en operaciones sensibles y urgentes sin fallar."
                            author="Marcela Estrada"
                            role="Gerente de Importaciones, Industrias Arka"
                        />
                    </div>
                </div>
            </section>

            {/* Contact Footer */}
            <footer style={{ background: 'var(--primary)', color: 'white', padding: '4rem 2rem' }}>
                <div className="container">
                    <div className="responsive-grid" style={{ alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--accent)' }}>JFC Cargo y Destino</h3>
                            <p style={{ opacity: 0.8, maxWidth: '300px' }}>
                                Con más de 10 años de experiencia, movemos tu carga con respaldo y compromiso.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Contacto</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={18} />
                                    <span>Carretera Toluca Atlacomulco Km 58.3, Estado de México</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={18} />
                                    <span>contacto@jfccargodestino.com</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={18} />
                                    <span>+52 5541696690</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Enlaces</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
                                <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Inicio</a>
                                <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Servicios</a>
                                <a href="/quotation" style={{ color: 'white', textDecoration: 'none' }}>Cotizador</a>
                                <a href="/admin" style={{ color: 'white', textDecoration: 'none' }}>Admin</a>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>
                        © {new Date().getFullYear()} JFC Cargo y Destino. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </main>
    );
}

function ServiceCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', transition: 'transform 0.2s' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--foreground)' }}>{title}</h3>
            <p style={{ color: 'var(--secondary)', lineHeight: '1.6' }}>{desc}</p>
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--foreground)' }}>
            <ShieldCheck size={20} color="var(--success)" />
            <span>{text}</span>
        </li>
    );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
    return (
        <div className="card" style={{ padding: '2rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ color: 'var(--accent)', fontSize: '2rem', lineHeight: '1', marginBottom: '1rem' }}>"</div>
            <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', color: 'var(--foreground)' }}>{quote}</p>
            <div>
                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{author}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{role}</div>
            </div>
        </div>
    );
}
