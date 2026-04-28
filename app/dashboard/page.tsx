"use client";
import { useAuth } from "@/lib/useAuth";

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: "20%" }}>
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ color: "#fff", padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Funcionando ✔</p>
    </div>
  );
}