'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'ADMIN' | 'USER' | 'GUEST';

interface User {
    email: string;
    name: string;
    role: UserRole;
}

interface UserContextType {
    user: User | null;
    login: (email: string) => void;
    logout: () => void;
    isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem('jfc_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (email: string) => {
        const isAdmin = email.toLowerCase() === 'sergiotellezsanchez@gmail.com';
        const newUser: User = {
            email,
            name: isAdmin ? 'Sergio Tellez' : 'Usuario Invitado',
            role: isAdmin ? 'ADMIN' : 'USER',
        };
        setUser(newUser);
        localStorage.setItem('jfc_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('jfc_user');
    };

    const isAdmin = user?.role === 'ADMIN';

    return (
        <UserContext.Provider value={{ user, login, logout, isAdmin }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
