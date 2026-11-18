'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminLoginSchema } from '@/lib/validations/auth';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // ZOD VALIDATION
    const validationResult = adminLoginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const errorsMap: { email?: string; password?: string } = {};
      for (const issue of validationResult.error.issues) {
        if (issue.path[0] === 'email') errorsMap.email = issue.message;
        if (issue.path[0] === 'password') errorsMap.password = issue.message;
      }
      setFieldErrors(errorsMap);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      const data = res.data;

      const token = data.data?.token || data.token;
      const user = data.data?.user || data.user;

      if (user?.role !== 'admin') {
        setErrorMessage('Access restricted: Only Super Admin credentials are authorized to access this administration console.');
        setIsLoading(false);
        return;
      }

      if (token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        router.push('/');
      } else {
        setErrorMessage('Authentication token missing from response.');
      }
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      setErrorMessage(serverMessage || 'Could not connect to the authentication server. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@ambalifestyle.com');
    setPassword('admin123');
    setErrorMessage(null);
    setFieldErrors({});
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-200">
            A
          </div>
          <div>
            <h1 className="font-extrabold text-zinc-900 tracking-tight text-xl">AMBA LIFESTYLE</h1>
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Super Admin Console</p>
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-zinc-900">
          Admin Portal Sign In
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Platform governance, vendor onboarding approvals & store management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-zinc-200 rounded-2xl sm:px-10">
          
          {/* Quick Demo Pre-fill */}
          <div className="mb-6 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Super Admin Credentials</span>
              </div>
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-2xs hover:bg-indigo-50"
              >
                Auto-fill
              </button>
            </div>
            <p className="text-[11px] text-indigo-700 mt-1 font-mono">
              admin@ambalifestyle.com / admin123
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Input
                label="Super Admin Email"
                type="email"
                placeholder="admin@ambalifestyle.com"
                value={email}
                error={fieldErrors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                error={fieldErrors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-600">
                <input
                  type="checkbox"
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                Keep me authenticated
              </label>
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-700">
                Reset Key
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white shadow-xs"
            >
              Enter Admin Console
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Role-Based Access
            </span>
            <a
              href="http://localhost:3002/login"
              className="text-zinc-600 hover:text-indigo-600 flex items-center gap-1 font-medium"
            >
              Vendor Portal
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
