'use client';

import { useState, useEffect } from 'react';
import { Shield, Search, RefreshCw } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';

export default function UserRoleManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch('/api/users');
            if (res.ok) setUsers(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (uid: string, newRole: string) => {
        setUpdatingUid(uid);
        try {
            const res = await authenticatedFetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, role: newRole })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
            } else {
                alert('Error al actualizar rol');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingUid(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} /> Gestión de Roles y Permisos
                </h2>
                <button onClick={fetchUsers} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    className="input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol Actual</th>
                            <th>Asignar Nuevo Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {u.photoURL && <img src={u.photoURL} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
                                        <span style={{ fontWeight: '600' }}>{u.name || 'Sin Nombre'}</span>
                                    </div>
                                </td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`badge badge-${u.role === 'ADMIN_MASTER' ? 'primary' : u.role === 'ADMIN_JR' ? 'secondary' : 'neutral'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <select
                                        className="input"
                                        style={{ padding: '0.25rem 0.5rem', width: 'auto' }}
                                        value={u.role}
                                        disabled={updatingUid === u.id}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    >
                                        <option value="USER">USER (Cliente)</option>
                                        <option value="DRIVER">DRIVER (Conductor)</option>
                                        <option value="ADMIN_JR">ADMIN_JR (Gestor)</option>
                                        <option value="ADMIN_MASTER">ADMIN_MASTER (Dueño)</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
