"use client";

import React, { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-400 text-center py-8">Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  );
}
