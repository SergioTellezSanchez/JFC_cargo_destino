'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { UserRole } from './firebase/schema';

interface UserData {
    uid: string;
    email: string | null;
    name: string | null;
    photoURL: string | null;
    role: UserRole;
}

interface UserContextType {
    user: UserData | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // We rely on the session cookie for server-side auth, 
                // but we keep client-side state for UI responsiveness.
                // Fetch basic role from Firestore to update UI immediately
                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);
                    let role = UserRole.CUSTOMER; // Default

                    if (userSnap.exists()) {
                        role = userSnap.data().role as UserRole;
                    } else {
                        // Create user document if it doesn't exist
                        await setDoc(userRef, {
                            email: firebaseUser.email,
                            name: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role,
                            createdAt: new Date()
                        });
                    }

                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        role
                    });
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            // Create Server Session
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (res.ok) {
                // Refresh to let Middleware/Server Components know about the cookie
                router.refresh();
            } else {
                console.error("Failed to create session");
            }
        } catch (error) {
            console.error("Error logging in with Google", error);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            await signOut(auth);
            router.refresh();
        } catch (error) {
            console.error("Error logging out", error);
        }
    };

    const isAdmin = !!(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER || user?.role === UserRole.CARRIER_ADMIN);

    return (
        <UserContext.Provider value={{ user, loading, loginWithGoogle, logout, isAdmin }}>
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
