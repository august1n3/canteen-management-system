"use client"
import { AuthProvider } from "@/contexts/AuthContext";
import Menu from "@/components/Student/Menu";
import Cart from "@/components/Student/Cart";
import { CartProvider } from "@/contexts/CartContext";


export default function Home() {
  return (
    <div>
   <AuthProvider>
    <CartProvider>
      <Cart/>
    </CartProvider>
    </AuthProvider>
    </div>
  )
}