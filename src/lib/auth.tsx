import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FbUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser, Role } from "@/lib/types";

interface AuthCtx {
  fbUser: FbUser | null;
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const ADMIN_BOOTSTRAP_EMAIL = "admin@hairtrack.app";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setFbUser(u);
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      let appUser: AppUser;
      if (snap.exists()) {
        appUser = snap.data() as AppUser;
      } else {
        // Bootstrap: first account or matching admin email becomes admin
        const role: Role = u.email === ADMIN_BOOTSTRAP_EMAIL ? "admin" : "barber";
        appUser = {
          uid: u.uid,
          email: u.email ?? "",
          role,
          displayName: u.displayName ?? u.email ?? "",
          createdAt: Date.now(),
        };
        await setDoc(ref, appUser);
      }
      setUser(appUser);
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const ref = doc(db, "users", cred.user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as AppUser;
    const role: Role = email === ADMIN_BOOTSTRAP_EMAIL ? "admin" : "barber";
    const appUser: AppUser = {
      uid: cred.user.uid,
      email,
      role,
      displayName: email,
      createdAt: Date.now(),
    };
    await setDoc(ref, appUser);
    return appUser;
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <Ctx.Provider value={{ fbUser, user, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
