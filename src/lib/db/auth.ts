// ─────────────────────────────────────────────────────────────────────────────
// Authentication Module
//
// Handles all authentication operations: sign up, sign in, sign out, etc.
// Decoupled from the rest of the application for easy testing and modification.
// ─────────────────────────────────────────────────────────────────────────────

import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getClient } from './client';

export interface AuthResult {
  user: User | null;
  error: string | null;
  /** True if email confirmation is required before sign in */
  needsConfirmation?: boolean;
}

export interface AuthStateChange {
  event: AuthChangeEvent;
  session: Session | null;
}

/**
 * Sign up a new user with email and password.
 * Returns needsConfirmation=true if the user needs to confirm their email.
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const client = getClient();
    const { data, error } = await client.auth.signUp({ email, password });
    
    if (error) {
      return { user: null, error: error.message };
    }
    
    // Check if email confirmation is required
    // If identities is empty or user.confirmed_at is null, confirmation is needed
    const needsConfirmation = !data.user?.confirmed_at || 
      (data.user?.identities && data.user.identities.length === 0);
    
    return { user: data.user, error: null, needsConfirmation };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { user: null, error: message };
  }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { user: null, error: error.message };
    }
    
    return { user: data.user, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { user: null, error: message };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const client = getClient();
    const { error } = await client.auth.signOut();
    
    if (error) {
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

/**
 * Get the current session.
 */
export async function getSession(): Promise<{ session: Session | null; error: string | null }> {
  try {
    const client = getClient();
    const { data, error } = await client.auth.getSession();
    
    if (error) {
      return { session: null, error: error.message };
    }
    
    return { session: data.session, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { session: null, error: message };
  }
}

/**
 * Get the current user.
 */
export async function getUser(): Promise<AuthResult> {
  try {
    const client = getClient();
    const { data, error } = await client.auth.getUser();
    
    if (error) {
      return { user: null, error: error.message };
    }
    
    return { user: data.user, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { user: null, error: message };
  }
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    const client = getClient();
    const { error } = await client.auth.resetPasswordForEmail(email);
    
    if (error) {
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

/**
 * Update the current user's password.
 */
export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  try {
    const client = getClient();
    const { error } = await client.auth.updateUser({ password: newPassword });
    
    if (error) {
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (change: AuthStateChange) => void
): () => void {
  const client = getClient();
  
  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback({ event, session });
  });
  
  return () => {
    data.subscription.unsubscribe();
  };
}
