import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  createUserWithEmailAndPassword,
  type Auth,
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth as getSecondaryAuth } from "firebase/auth";
import { db, storage } from "@/lib/firebase";
import type { SchoolClass, Settings, Shaving, Student, AppUser } from "@/lib/types";
import { generateUniqueSecretCode } from "@/lib/secretCode";

/* ---------- Settings ---------- */
const SETTINGS_DOC = doc(db, "settings", "global");

export async function getSettings(): Promise<Settings> {
  const snap = await getDoc(SETTINGS_DOC);
  if (snap.exists()) return snap.data() as Settings;
  const def: Settings = { haircutPrice: 1250, termPayment: 5000, allowedCutsPerTerm: 4 };
  await setDoc(SETTINGS_DOC, def);
  return def;
}

export async function updateSettings(s: Partial<Settings>) {
  await setDoc(SETTINGS_DOC, s, { merge: true });
}

export function subscribeSettings(cb: (s: Settings) => void) {
  return onSnapshot(SETTINGS_DOC, (snap) => {
    if (snap.exists()) cb(snap.data() as Settings);
  });
}

/* ---------- Classes ---------- */
export function subscribeClasses(cb: (c: SchoolClass[]) => void) {
  return onSnapshot(query(collection(db, "classes"), orderBy("name")), (s) => {
    cb(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SchoolClass, "id">) })));
  });
}

export async function createClass(name: string) {
  await addDoc(collection(db, "classes"), { name, createdAt: Date.now() });
}

export async function updateClass(id: string, name: string) {
  await updateDoc(doc(db, "classes", id), { name });
}

export async function deleteClass(id: string) {
  await deleteDoc(doc(db, "classes", id));
}

/* ---------- Students ---------- */
export function subscribeStudents(cb: (s: Student[]) => void, max?: number) {
  const cons: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (max) cons.push(limit(max));
  return onSnapshot(query(collection(db, "students"), ...cons), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) })));
  });
}

export async function getStudent(id: string): Promise<Student | null> {
  const s = await getDoc(doc(db, "students", id));
  return s.exists() ? ({ id: s.id, ...(s.data() as Omit<Student, "id">) }) : null;
}

export async function findStudentsByName(nameLike: string): Promise<Student[]> {
  // Simple client-side filter: fetch all and filter (acceptable for school scale)
  const snap = await getDocs(collection(db, "students"));
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }));
  const q = nameLike.trim().toLowerCase();
  if (!q) return [];
  return all.filter((s) => s.fullName.toLowerCase().includes(q)).slice(0, 30);
}

export async function nameExists(name: string): Promise<boolean> {
  const snap = await getDocs(
    query(collection(db, "students"), where("fullName", "==", name.trim())),
  );
  return !snap.empty;
}

export async function isSecretCodeTaken(code: string): Promise<boolean> {
  const snap = await getDocs(
    query(collection(db, "students"), where("secretCode", "==", code)),
  );
  return !snap.empty;
}

export async function uploadStudentPhoto(file: File, studentId: string): Promise<string> {
  const r = storageRef(storage, `students/${studentId}/${Date.now()}-${file.name}`);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

export interface CreateStudentInput {
  fullName: string;
  className: string;
  photoFile?: File | null;
  paid?: boolean;
}

export async function createStudent(input: CreateStudentInput): Promise<Student> {
  const settings = await getSettings();
  const code = await generateUniqueSecretCode(isSecretCodeTaken);
  const id = crypto.randomUUID();
  let photoURL: string | undefined;
  if (input.photoFile) {
    photoURL = await uploadStudentPhoto(input.photoFile, id);
  }
  const paid = input.paid ?? true;
  const student: Student = {
    id,
    fullName: input.fullName.trim(),
    className: input.className,
    secretCode: code,
    photoURL,
    paymentAmount: paid ? settings.termPayment : 0,
    paymentDate: paid ? Date.now() : undefined,
    remainingCuts: paid ? settings.allowedCutsPerTerm : 0,
    totalCutsUsed: 0,
    paid,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "students", id), student);
  return student;
}

export async function updateStudent(id: string, data: Partial<Student>) {
  await updateDoc(doc(db, "students", id), data);
}

export async function deleteStudent(id: string) {
  await deleteDoc(doc(db, "students", id));
}

export async function resetStudentPayment(id: string) {
  const settings = await getSettings();
  await updateStudent(id, {
    paid: true,
    paymentAmount: settings.termPayment,
    paymentDate: Date.now(),
    remainingCuts: settings.allowedCutsPerTerm,
    totalCutsUsed: 0,
  });
}

/* ---------- Shavings ---------- */
export function subscribeShavings(cb: (s: Shaving[]) => void, max?: number) {
  const cons: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (max) cons.push(limit(max));
  return onSnapshot(query(collection(db, "shavings"), ...cons), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Shaving, "id">) })));
  });
}

export async function getStudentShavings(studentId: string): Promise<Shaving[]> {
  const snap = await getDocs(
    query(collection(db, "shavings"), where("studentId", "==", studentId)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Shaving, "id">) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function confirmShave(args: {
  student: Student;
  enteredCode: string;
  barber: AppUser;
}): Promise<{ ok: true; shaving: Shaving } | { ok: false; reason: string }> {
  const { student, enteredCode, barber } = args;
  if (!student.paid) return { ok: false, reason: "Student has not paid for this term" };
  if (student.remainingCuts <= 0) return { ok: false, reason: "No remaining shaves" };
  if (enteredCode.trim().toUpperCase() !== student.secretCode.toUpperCase()) {
    return { ok: false, reason: "Invalid student verification code" };
  }
  const settings = await getSettings();
  const id = crypto.randomUUID();
  const shaving: Shaving = {
    id,
    studentId: student.id,
    studentName: student.fullName,
    className: student.className,
    barberId: barber.uid,
    barberName: barber.displayName || barber.email,
    pricePerShave: settings.haircutPrice,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "shavings", id), shaving);
  await updateDoc(doc(db, "students", student.id), {
    remainingCuts: student.remainingCuts - 1,
    totalCutsUsed: student.totalCutsUsed + 1,
  });
  return { ok: true, shaving };
}

/* ---------- Users (Barbers) ---------- */
export function subscribeUsers(cb: (u: AppUser[]) => void) {
  return onSnapshot(collection(db, "users"), (snap) => {
    cb(snap.docs.map((d) => d.data() as AppUser));
  });
}

/**
 * Create a barber account WITHOUT logging out the current admin.
 * Uses a secondary Firebase Auth instance.
 */
export async function createBarberAccount(args: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AppUser> {
  // Reuse main app config
  const { app: mainApp } = await import("@/lib/firebase");
  const secondary = initializeApp(mainApp.options, `secondary-${Date.now()}`);
  const secondaryAuth: Auth = getSecondaryAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, args.email, args.password);
    const u: AppUser = {
      uid: cred.user.uid,
      email: args.email,
      role: "barber",
      displayName: args.displayName,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", cred.user.uid), u);
    return u;
  } finally {
    await deleteApp(secondary);
  }
}
