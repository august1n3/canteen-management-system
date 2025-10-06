"use client"
import { SocketProvider } from "@/contexts/SocketContext";
import Kiosk from "@/components/Public/Kiosk";
import QueueDisplay from "@/components/Public/QueueDisplay";


export default function Home() {
  return (
    <div>
      <Kiosk/>
    </div>
  )
}