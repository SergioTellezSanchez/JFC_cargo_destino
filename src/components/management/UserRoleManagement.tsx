'use client';

import { useState, useEffect, useMemo } from 'react';
import { Shield, Search, RefreshCw, Building2, Pencil, User as UserIcon } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';
import Modal from '@/components/Modal';

const ROLE_ORDER = ['ADMIN', 'CARRIER', 'DRIVER', 'CLIENT'];
const ROLE_NAMES: Record<string, string> = {
    ADMIN: 'Administradores',
    CARRIER: 'Transportistas',
    DRIVER: 'Conductores',
    CLIENT: 'Clientes',
};
const ROLE_BADGE: Record<string, string> = {
    ADMIN: 'badge-primary',
    CARRIER: 'badge-secondary',
    DRIVER: 'badge-warning',
    CLIENT: 'badge-neutral',
};

export default function UserRoleManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [selectedUserForCompany, setSelectedUserForCompany] = useState<any>(null);
    const [modalCompanyValue, setModalCompanyValue] = useState('');
    const [isNewCompany, setIsNewCompany] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uRes, dRes, vRes] = await Promise.all([
                authenticatedFetch('/api/users'),
                authenticatedFetch('/api/drivers'),
                authenticatedFetch('/api/vehicles')
            ]);
            if (uRes.ok) setUsers(await uRes.json());
            if (dRes.ok) setDrivers(await dRes.json());
            if (vRes.ok) setVehicles(await vRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Get unique existing company names for the dropdown
    const availableCompanies = useMemo(() => {
        const companies = new Set<string>([
            'JFC Cargo Central',
            'Logística Express MX',
            'Transportes del Norte',
            'Mudanzas Rápidas S.A.',
            'Flotilla Continental',
            'Aliado Estratégico Bajío'
        ]);
        drivers.forEach(d => { if (d.company) companies.add(d.company); });
        vehicles.forEach(v => { if (v.company) companies.add(v.company); });
        return Array.from(companies).sort();
    }, [drivers, vehicles]);

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

    const openCompanyModal = (user: any) => {
        setSelectedUserForCompany(user);
        setModalCompanyValue(user.company || '');
        setIsNewCompany(false);
        setIsCompanyModalOpen(true);
    };

    const closeCompanyModal = () => {
        setIsCompanyModalOpen(false);
        setSelectedUserForCompany(null);
        setModalCompanyValue('');
        setIsNewCompany(false);
    };

    const saveCompanyFromModal = async () => {
        if (!selectedUserForCompany) return;

        const uid = selectedUserForCompany.id;
        const company = modalCompanyValue.trim();

        setUpdatingUid(uid);
        setIsCompanyModalOpen(false); // Optimistic close

        try {
            const res = await authenticatedFetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, company })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === uid ? { ...u, company } : u));
                setSelectedUserForCompany(null);
            } else {
                alert('Error al guardar empresa');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingUid(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group users by role
    const groupedUsers = useMemo(() => {
        const groups: Record<string, any[]> = {
            ADMIN: [],
            CARRIER: [],
            DRIVER: [],
            CLIENT: [],
            UNASSIGNED: []
        };

        filteredUsers.forEach(u => {
            if (ROLE_ORDER.includes(u.role)) {
                groups[u.role].push(u);
            } else {
                groups['UNASSIGNED'].push(u);
            }
        });

        return groups;
    }, [filteredUsers]);

    return (
        <div className="space-y-8 mt-8">
            <div className="card p-6 md:p-8 border-none shadow-sm bg-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Shield className="text-indigo-600" size={28} />
                            Gestión de Roles y Permisos
                        </h2>
                        <p className="text-slate-500 font-medium mt-1">
                            Administra los accesos y empresas de los usuarios de la plataforma.
                        </p>
                    </div>
                    <button onClick={fetchData} className="btn btn-secondary shadow-sm bg-white" disabled={loading}>
                        <RefreshCw size={18} className={`${loading ? 'animate-spin text-indigo-500' : 'text-slate-600'}`} />
                        <span className="hidden md:inline ml-2">Actualizar</span>
                    </button>
                </div>

                <div className="relative mb-6 max-w-xl">
                    <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o empresa..."
                        className="input pl-12 h-12 w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <RefreshCw className="animate-spin text-indigo-500" size={32} />
                </div>
            ) : (
                <div className="space-y-8">
                    {[...ROLE_ORDER, 'UNASSIGNED'].map(role => {
                        const roleUsers = groupedUsers[role];
                        if (roleUsers.length === 0) return null;

                        const isCarrier = role === 'CARRIER';

                        return (
                            <div key={role} className="card p-0 overflow-hidden border border-slate-200 shadow-sm bg-white">
                                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2">
                                        <UserIcon size={16} className="text-indigo-500" />
                                        {ROLE_NAMES[role] || 'Sin Rol Asignado'}
                                    </h3>
                                    <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                        {roleUsers.length}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="table w-full">
                                        <thead>
                                            <tr className="bg-white text-slate-500 text-xs uppercase border-b border-slate-100">
                                                <th className="font-bold px-6 py-4">Usuario</th>
                                                <th className="font-bold px-6 py-4">Rol Actual</th>
                                                <th className="font-bold px-6 py-4">Empresa Logística</th>
                                                <th className="font-bold px-6 py-4 text-right">Asignar Rol</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {roleUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {u.photoURL ? (
                                                                <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-sm border border-indigo-200">
                                                                    {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-slate-800">{u.name || 'Sin Nombre'}</div>
                                                                <div className="text-xs text-slate-500">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`badge ${ROLE_BADGE[u.role] || 'badge-neutral'} font-bold shadow-sm whitespace-nowrap`}>
                                                            {u.role || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 min-w-[240px]">
                                                        {!isCarrier ? (
                                                            <span className="text-xs text-slate-400 italic">—</span>
                                                        ) : (
                                                            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2 max-w-xs">
                                                                {u.company ? (
                                                                    <div className="flex items-center gap-2 truncate text-indigo-700 font-semibold text-sm pl-1">
                                                                        <Building2 size={14} className="shrink-0" />
                                                                        <span className="truncate">{u.company}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic pl-2">Sin empresa asignada</span>
                                                                )}
                                                                <button
                                                                    title="Editar empresa"
                                                                    onClick={() => openCompanyModal(u)}
                                                                    disabled={updatingUid === u.id}
                                                                    className="shrink-0 p-1.5 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-md transition-colors disabled:opacity-50"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <select
                                                            className="select select-sm select-bordered w-full max-w-[150px] bg-slate-50 font-medium text-slate-700 ml-auto"
                                                            value={u.role || ''}
                                                            disabled={updatingUid === u.id}
                                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                        >
                                                            <option value="" disabled>Seleccionar...</option>
                                                            <option value="CLIENT">CLIENTE</option>
                                                            <option value="DRIVER">CONDUCTOR</option>
                                                            <option value="CARRIER">TRANSPORTISTA</option>
                                                            <option value="ADMIN">ADMIN</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal para asignar empresa logística */}
            <Modal isOpen={isCompanyModalOpen} onClose={closeCompanyModal} title="Asignar Empresa Logística">
                {selectedUserForCompany && (
                    <div className="space-y-6">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-lg shadow-sm border border-indigo-300 shrink-0">
                                {(selectedUserForCompany.name || selectedUserForCompany.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900">{selectedUserForCompany.name || 'Sin Nombre'}</h4>
                                <p className="text-xs text-indigo-600">{selectedUserForCompany.email}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="input-group m-0">
                                <label className="text-sm font-bold text-slate-700">Empresa Logística</label>
                                <p className="text-xs text-slate-500 mb-2">
                                    Selecciona una empresa existente de la base de datos.
                                </p>

                                {!isNewCompany ? (
                                    <select
                                        className="select w-full bg-slate-50 border-slate-200 focus:border-indigo-500 transition-shadow"
                                        value={availableCompanies.includes(modalCompanyValue) ? modalCompanyValue : (modalCompanyValue ? 'OTRA' : '')}
                                        onChange={(e) => {
                                            if (e.target.value === 'OTRA') {
                                                setIsNewCompany(true);
                                                setModalCompanyValue('');
                                            } else {
                                                setModalCompanyValue(e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="" disabled>Seleccionar empresa...</option>
                                        {availableCompanies.map(company => (
                                            <option key={company} value={company}>{company}</option>
                                        ))}
                                        <option value="OTRA" className="font-bold text-indigo-600">+ Escribir nueva empresa...</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2 relative">
                                        <input
                                            type="text"
                                            className="input w-full bg-slate-50 border-slate-200"
                                            placeholder="Nombre de la nueva empresa..."
                                            value={modalCompanyValue}
                                            onChange={(e) => setModalCompanyValue(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsNewCompany(false);
                                                setModalCompanyValue('');
                                            }}
                                            className="btn btn-ghost text-slate-500 px-3 border border-slate-200"
                                            title="Volver a la lista"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button className="btn btn-secondary flex-1" onClick={closeCompanyModal}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary flex-1 shadow-sm" onClick={saveCompanyFromModal}>
                                Guardar Empresa
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
