'use client';

import QueryProvider from '@/components/Providers/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import './styles/globals.css';
import type { Metadata } from 'next';
import { Socket } from 'socket.io-client';
import { SocketProvider } from '@/contexts/SocketContext';



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={'min-h-screen bg-gray-50'}>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
            <CartProvider>
              {children}
            </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
  
   
