import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, userProfile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const isAdminUser = user.email === 'm30103981@gmail.com';

          // Listen to real-time changes
          unsubscribeDoc = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              // Ensure we enforce the boolean type strictly for isAdmin checking
              setUserProfile({
                ...profileData,
                isAdmin: profileData.isAdmin === true || (profileData.isAdmin as unknown as string) === "true" || isAdminUser
              });
            } else {
              // Create profile if doesn't exist
              const newProfile: UserProfile = {
                uid: user.uid,
                fullName: user.displayName || 'Anonymous User',
                email: user.email || '',
                photoURL: user.photoURL || '',
                isAdmin: isAdminUser,
              };
              try {
                 await setDoc(docRef, newProfile);
              } catch (err) {
                 console.error("Error creating user profile document:", err);
              }
              setUserProfile(newProfile);
            }
            setLoading(false);
          }, (err) => {
             console.error("Error fetching user profile:", err);
             setLoading(false);
          });
        } else {
          setUserProfile(null);
          if (unsubscribeDoc) unsubscribeDoc();
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching auth state:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
