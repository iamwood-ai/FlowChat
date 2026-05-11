import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, data: any) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  userProfile: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setLoading(true);
        const fetchInitialData = async (retries = 0) => {
          try {
            // Fetch user profile from Firestore
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              setUserProfile(userDoc.data());
            }

            // Fetch workspaces
            const q = query(collection(db, 'workspaces'), where('ownerId', '==', user.uid));
            const snapshot = await getDocs(q);
            const ws: Workspace[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workspace));
            setWorkspaces(ws);

            // Set active workspace
            const activeId = userDoc.data()?.activeWorkspaceId;
            if (activeId) {
              const active = ws.find(w => w.id === activeId);
              setActiveWorkspace(active || ws[0] || null);
            } else if (ws.length > 0) {
              setActiveWorkspace(ws[0]);
            }
            setLoading(false);
          } catch (error) {
            if (retries < 3) {
              console.warn(`Firestore initial fetch failed. Retrying... (${retries + 1}/3)`);
              setTimeout(() => fetchInitialData(retries + 1), 500); // Reduced from 2000
            } else {
              handleFirestoreError(error, OperationType.LIST, 'workspaces');
              setLoading(false);
            }
          }
        };

        fetchInitialData();
      } else {
        setWorkspaces([]);
        setActiveWorkspace(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await initializeUser(user);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const user = result.user;
      await updateProfile(user, { displayName: name });
      await initializeUser(user, name);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const initializeUser = async (user: User, customName?: string) => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      try {
        const displayName = customName || user.displayName || 'New User';
        await setDoc(userRef, {
          userId: user.uid,
          email: user.email,
          displayName: displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp()
        });
        
        // Create initial default workspace
        const wsData = {
          name: `${displayName}'s Profile`,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          automationConfig: {
            smartReplyDelay: 5,
            keywordSensitivity: 'Strict Match',
            aiPersonality: 'Normal'
          }
        };
        const wsRef = await addDoc(collection(db, 'workspaces'), wsData);
        await setDoc(userRef, { activeWorkspaceId: wsRef.id }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const handleAuthError = (error: any) => {
    console.error("Auth error:", error);
    if (error.code === 'auth/popup-blocked') {
      alert("Sign-in popup was blocked by your browser.");
    } else if (error.code === 'auth/cancelled-popup-request') {
      // Ignore
    } else if (error.code === 'auth/email-already-in-use') {
      alert("This email is already in use. Please try logging in instead.");
    } else if (error.code === 'auth/weak-password') {
      alert("Password is too weak. Please use at least 6 characters.");
    } else if (error.code === 'auth/invalid-email') {
      alert("Invalid email address.");
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      alert("Invalid email or password.");
    } else {
      alert(`Authentication failed: ${error.message}`);
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
        await setDoc(doc(db, 'users', user.uid), { 
          activeWorkspaceId: id,
          displayName: ws.name 
        }, { merge: true });
        
        // Also update local state for immediate feedback
        setUserProfile(prev => prev ? { ...prev, displayName: ws.name } : { displayName: ws.name });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const createWorkspace = async (name: string) => {
    if (!user) return null;
    if (workspaces.length >= 10) {
      alert("You have reached the maximum limit of 10 profiles.");
      return null;
    }
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

  const updateWorkspace = async (id: string, data: any) => {
    if (!user) return;
    const updateData = typeof data === 'string' ? { name: data } : data;
    try {
      await setDoc(doc(db, 'workspaces', id), updateData, { merge: true });
      
      if (updateData.name) {
        setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name: updateData.name } : w));
        if (activeWorkspace?.id === id) {
          setActiveWorkspace(prev => prev ? { ...prev, name: updateData.name } : null);
          // Sync user displayName as well
          await setDoc(doc(db, 'users', user.uid), { displayName: updateData.name }, { merge: true });
          setUserProfile(prev => prev ? { ...prev, displayName: updateData.name } : { displayName: updateData.name });
        }
      } else {
        // Just update local workspaces state if other fields changed
        setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updateData } : w));
        if (activeWorkspace?.id === id) {
          setActiveWorkspace(prev => prev ? { ...prev, ...updateData } : null);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workspaces/${id}`);
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!user) return;
    try {
      // 1. Update Auth Profile (only displayName to avoid 'URL too long' error)
      const { updateProfile } = await import('firebase/auth');
      const authUpdate: any = {};
      if (data.displayName) authUpdate.displayName = data.displayName;
      
      // We explicitly DO NOT update photoURL in Firebase Auth if it's a data URL
      // to avoid the character limit error. We'll rely on Firestore.
      if (data.photoURL && !data.photoURL.startsWith('data:')) {
        authUpdate.photoURL = data.photoURL;
      }

      await updateProfile(user, authUpdate);

      // 2. Update Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // 3. Update local states
      setUser({ ...auth.currentUser } as User);
      setUserProfile((prev: any) => ({ ...prev, ...data }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      activeWorkspace, 
      workspaces, 
      signIn, 
      signInEmail,
      signUpEmail,
      logout, 
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      updateUserProfile,
      userProfile
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
