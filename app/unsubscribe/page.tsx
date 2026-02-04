"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type NotificationPref = 'email' | 'text' | 'both' | 'none';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'choice'>('loading');
  const [message, setMessage] = useState('Verifying your request...');
  const [currentPref, setCurrentPref] = useState<NotificationPref>('email');

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link. Please check your email for the correct link.');
      return;
    }

    const fetchCurrentPrefs = async () => {
      try {
        const response = await fetch(
          `/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
        );
  
        if (response.ok) {
          const data = await response.json();
          setCurrentPref(data.currentPref);
          setStatus('choice');
        } else {
          setStatus('error');
          setMessage('Invalid or expired link. Please check your email for a valid unsubscribe link.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred. Please try again later.');
      }
    };
  
    fetchCurrentPrefs();
  }, [searchParams]);

  const handlePreferenceUpdate = async (newPref: NotificationPref) => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token, preference: newPref }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(`Your notification preferences have been updated to ${newPref}.`);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to update preferences. Please try again later.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again later.');
    }
  };

  const renderPreferenceButtons = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">
        Current preference: {currentPref}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => handlePreferenceUpdate('email')}
          className={`p-3 rounded-lg border ${
            currentPref === 'email' 
              ? 'bg-blue-100 border-blue-500' 
              : 'hover:bg-gray-50 border-gray-300'
          }`}
        >
          Email Only
        </button>
        <button
          onClick={() => handlePreferenceUpdate('text')}
          className={`p-3 rounded-lg border ${
            currentPref === 'text' 
              ? 'bg-blue-100 border-blue-500' 
              : 'hover:bg-gray-50 border-gray-300'
          }`}
        >
          Text Only
        </button>
        <button
          onClick={() => handlePreferenceUpdate('both')}
          className={`p-3 rounded-lg border ${
            currentPref === 'both' 
              ? 'bg-blue-100 border-blue-500' 
              : 'hover:bg-gray-50 border-gray-300'
          }`}
        >
          Both Email and Text
        </button>
        <button
          onClick={() => handlePreferenceUpdate('none')}
          className={`p-3 rounded-lg border ${
            currentPref === 'none' 
              ? 'bg-blue-100 border-blue-500' 
              : 'hover:bg-gray-50 border-gray-300'
          }`}
        >
          Unsubscribe from All Notifications
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center dark:text-white">
        Notification Preferences
      </h1>
      {status === 'choice' ? (
        renderPreferenceButtons()
      ) : (
        <div className={`text-center mb-6 ${
          status === 'error' ? 'text-red-500' : 
          status === 'success' ? 'text-green-500' : 
          'text-gray-500'
        }`}>
          {message}
        </div>
      )}
      <div className="text-center mt-6">
        <Link 
          href="/" 
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
      <div className="text-center">Loading...</div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-900 px-4">
      <Suspense fallback={<LoadingFallback />}>
        <UnsubscribeContent />
      </Suspense>
    </main>
  );
}