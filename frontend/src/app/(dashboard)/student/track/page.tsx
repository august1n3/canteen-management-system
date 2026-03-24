"use client"
import React, { useState } from 'react';
import { Suspense } from 'react';
import OrderTracking from '@/components/Student/OrderTracking';

export const dynamic = 'force-dynamic';

function TrackOrderContent() {
  return (
    <div>
      <OrderTracking />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
