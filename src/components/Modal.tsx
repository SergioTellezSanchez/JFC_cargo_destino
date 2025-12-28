import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = '600px' }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div
                className="card"
                style={{
                    width: '90%',
                    maxWidth: maxWidth,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    position: 'relative',
                    animation: 'fadeIn 0.2s ease-out',
                    padding: 0,
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    borderRadius: '1rem'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    background: 'linear-gradient(to right, var(--card-bg), var(--secondary-bg))',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '4px', height: '20px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--secondary-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            color: 'var(--secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--secondary)'}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            </div>
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
