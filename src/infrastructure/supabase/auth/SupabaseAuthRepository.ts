import type { User } from '@supabase/supabase-js'
import type { AuthUser } from '@/domain/entités/AuthUser'
import type { AuthResult, AuthRepository } from '@/domain/repositories/AuthRepository'
import { supabase } from '../client'

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null

  return {
    id: user.id,
    email: user.email ?? null,
  }
}

export class SupabaseAuthRepository implements AuthRepository {
  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) throw error

    return {
      user: mapUser(data.user),
      hasSession: data.session !== null,
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return {
      user: mapUser(data.user),
      hasSession: data.session !== null,
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error?.name === 'AuthSessionMissingError') return null
    if (error) throw error

    return mapUser(user)
  }
}
