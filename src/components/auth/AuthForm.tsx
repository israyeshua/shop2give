import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

type FormData = {
  email: string;
  password: string;
  role?: 'creator' | 'cause' | 'customer';
};

export function AuthForm() {
  const navigate = useNavigate();
  const { signIn, signUp, isLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      if (isRegistering && data.role) {
        await signUp(data.email, data.password, data.role);
      } else {
        await signIn(data.email, data.password);
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isRegistering ? 'Create Account' : 'Sign In'}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {isRegistering && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Type</label>
            <select
              {...register('role', { required: 'Please select an account type' })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select account type...</option>
              <option value="creator">Creator</option>
              <option value="cause">Cause/Nonprofit</option>
              <option value="customer">Customer</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-teal text-white py-2 px-4 rounded-md hover:bg-brand-teal-dark transition-colors"
        >
          {isLoading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
        </button>

        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-sm text-brand-teal hover:text-brand-teal-dark"
        >
          {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </button>
      </form>
    </div>
  );
}