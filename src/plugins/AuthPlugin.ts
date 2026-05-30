// ─────────────────────────────────────────────────────────────────────────────
// Auth Plugin
//
// Handles user authentication using the modular database layer.
// ─────────────────────────────────────────────────────────────────────────────

import * as auth from '../lib/db/auth';
import type { IPlugin, IEngine, Player } from '../engine/types';

export class AuthPlugin implements IPlugin {
  id = 'auth';
  roles = ['auth'] as const;

  private engine!: IEngine;
  private currentPlayer: Player | null = null;
  private unsubscribeAuth?: () => void;

  async init(engine: IEngine): Promise<void> {
    this.engine = engine;

    engine.storage.registerTable(this.id, { table: 'profiles', userScoped: true });

    // Fire-and-forget: must not block boot
    void this.checkExistingSession();

    // Subscribe to auth state changes using the modular auth module
    this.unsubscribeAuth = auth.onAuthStateChange(({ event, session }) => {
      (async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Only handle auth success if this is a NEW sign-in, not a token refresh
          // for an already authenticated user. This prevents state resets on tab switches.
          if (this.currentPlayer?.id === session.user.id) {
            // Same user, just a token refresh - skip reloading state
            return;
          }
          await this.handleAuthSuccess(session.user.id, session.user.email ?? '');
        } else if (event === 'SIGNED_OUT') {
          this.currentPlayer = null;
          this.engine.emit('auth_signout', {});
        } else if (event === 'TOKEN_REFRESHED') {
          // Token was refreshed but user is the same - do nothing
          // This prevents unnecessary state reloads on visibility change
        }
      })();
    });
  }

  private async checkExistingSession(): Promise<void> {
    try {
      const { session, error } = await auth.getSession();
      if (error) {
        console.error('[AuthPlugin] Session check failed:', error);
        this.engine.emit('auth_failed', { error: 'Session check failed' });
        return;
      }
      if (session?.user) {
        await this.handleAuthSuccess(session.user.id, session.user.email ?? '');
      }
    } catch (err) {
      console.error('[AuthPlugin] Session check failed:', err);
      this.engine.emit('auth_failed', { error: 'Session check failed' });
    }
  }

  private async handleAuthSuccess(userId: string, email: string): Promise<void> {
    try {
      const profile = await this.ensureProfile(userId, email);
      this.currentPlayer = profile;
      this.engine.emit('auth_success', profile);
    } catch (err) {
      console.error('[AuthPlugin] Auth success handler failed:', err);
      this.engine.emit('auth_failed', { error: 'Profile load failed' });
    }
  }

  private async ensureProfile(userId: string, email: string): Promise<Player> {
    const { data: existing } = await this.engine.storage.load<{ id: string; handle: string; avatar_index: number }>(
      'profiles',
      { id: userId },
      'id, handle, avatar_index'
    );

    if (existing) {
      return {
        id: existing.id,
        handle: existing.handle,
        avatarIndex: existing.avatar_index,
      };
    }

    const handle = email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 12) || 'HACKER';
    const { data: created } = await this.engine.storage.insert<{ id: string; handle: string; avatar_index: number }>(
      'profiles',
      { id: userId, handle, avatar_index: 0 },
      'id, handle, avatar_index'
    );

    return {
      id: created?.id ?? userId,
      handle: created?.handle ?? handle,
      avatarIndex: created?.avatar_index ?? 0,
    };
  }

  async signUp(email: string, password: string, handle: string): Promise<{ error: string | null }> {
    const { user, error } = await auth.signUp(email, password);
    if (error) return { error };

    if (user) {
      await this.engine.storage.save('profiles', { id: user.id, handle: handle.toUpperCase().slice(0, 12), avatar_index: 0 }, 'id');
    }

    // Sign in after sign up
    const { error: signInError } = await auth.signIn(email, password);
    if (signInError) return { error: signInError };

    return { error: null };
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await auth.signIn(email, password);
    if (error) return { error };
    return { error: null };
  }

  async signOut(): Promise<void> {
    await auth.signOut();
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await auth.resetPassword(email);
    if (error) return { error };
    return { error: null };
  }

  getPlayer(): Player | null {
    return this.currentPlayer;
  }

  cleanup(): void {
    this.unsubscribeAuth?.();
  }
}
