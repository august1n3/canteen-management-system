"use client"
import { SocketProvider } from "@/contexts/SocketContext";
import Kiosk from "@/components/Public/Kiosk";
import Login from "@/components/Auth/Login";
import { AuthProvider } from "@/contexts/AuthContext";
import Menu from "@/components/Student/Menu";
import { CartProvider } from "@/contexts/CartContext";
import OrderHistory from "@/components/Student/OrderHistory";


export default function Home() {
  return (
    <div>
   <AuthProvider>
    <CartProvider>
      <OrderHistory/>
    </CartProvider>
    </AuthProvider>
    </div>
  )
}