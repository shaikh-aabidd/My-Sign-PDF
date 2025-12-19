import React from 'react';
import { useForm } from 'react-hook-form';
import { useRegisterUserMutation, useLoginMutation } from '../features/api/user.api';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from './index';

function Signup() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const [login] = useLoginMutation();
  const [error, setError] = React.useState('');
  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (data) => {
    setError('');
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
      };

      const res = await registerUser(payload).unwrap();
      if (res) {
        await login({ email: data.email, password: data.password }).unwrap();
        navigate('/');
      }
    } catch (err) {
      const errorMessage = err.data?.error || err.data?.message || err.error || 'Signup failed';
      setError(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center px-6">
      <div className="w-full max-w-xl bg-white p-10 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Create Your Account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <div>
            <Input
              placeholder="Full Name"
              {...register('name', { required: 'Name is required' })}
              className="text-black w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-white"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="Email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
              className="text-black w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-white"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Input
              type="password"
              placeholder="Password"
              {...register('password', { required: 'Password is required' })}
              className="text-black w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-white"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Input
              type="password"
              placeholder="Confirm Password"
              {...register('confirmPassword', {
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              className="text-black w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded bg-white"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center mt-4">
            <Button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Sign Up
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;