import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, handleFirestoreError, OperationType } from '../lib/firebase';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          // Fetch workspaces
          const q = query(collection(db, 'workspaces'), where('ownerId', '==', user.uid));
          const snapshot = await getDocs(q);
          const ws: Workspace[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workspace));
          setWorkspaces(ws);

          // Fetch user preferences for active workspace
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData?.activeWorkspaceId) {
            const active = ws.find(w => w.id === userData.activeWorkspaceId);
            setActiveWorkspace(active || ws[0] || null);
          } else if (ws.length > 0) {
            setActiveWorkspace(ws[0]);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'workspaces');
        }
      } else {
        setWorkspaces([]);
        setActiveWorkspace(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Initialize user in firestore if not exists
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        try {
          await setDoc(userRef, {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp()
          });
          
          // Create initial default workspace
          const wsData = {
            name: `${user.displayName}'s Profile`,
            ownerId: user.uid,
            createdAt: serverTimestamp()
          };
          const wsRef = await addDoc(collection(db, 'workspaces'), wsData);
          await setDoc(userRef, { activeWorkspaceId: wsRef.id }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const switchWorkspace = async (id: string) => {
    if (!user) return;
    const ws = workspaces.find(w => w.id === id);
    if (ws) {
      setActiveWorkspace(ws);
      try {
        await setDoc(doc(db, 'users', user.uid), { activeWorkspaceId: id }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const createWorkspace = async (name: string) => {
    if (!user) return null;
    const wsData = {
      name,
      ownerId: user.uid,
      createdAt: serverTimestamp()
    };
    try {
      const wsRef = await addDoc(collection(db, 'workspaces'), wsData);
      const newWs = { id: wsRef.id, ...wsData, createdAt: new Date().toISOString() } as any; 
      setWorkspaces(prev => [...prev, newWs]);
      return newWs;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workspaces');
      return null;
    }
  };

  const updateWorkspace = async (id: string, name: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'workspaces', id), { name }, { merge: true });
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w));
      if (activeWorkspace?.id === id) {
        setActiveWorkspace(prev => prev ? { ...prev, name } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workspaces/${id}`);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      activeWorkspace, 
      workspaces, 
      signIn, 
      logout, 
      switchWorkspace,
      createWorkspace,
      updateWorkspace
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
