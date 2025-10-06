"use client"
import { SocketProvider } from "@/contexts/SocketContext";
import Kiosk from "@/components/Public/Kiosk";
import Login from "@/components/Auth/Login";
import { AuthProvider } from "@/contexts/AuthContext";


export default function Home() {
  return (
    <div>
   <AuthProvider>
      <Login/>
    </AuthProvider>
    </div>
  )
}