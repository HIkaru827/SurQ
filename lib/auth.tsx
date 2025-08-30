'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from './firebase'
import { firestoreService } from './supabase'
import { User } from './firebase'

interface AuthContextType {
  user: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<FirebaseUser>
  signUp: (email: string, password: string, name: string) => Promise<FirebaseUser>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // プロフィールを強制的に再読み込みする関数
  const refreshUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      // Get auth token for authenticated API call
      const token = await firebaseUser.getIdToken()
      const response = await fetch(`/api/users?email=${encodeURIComponent(firebaseUser.email!)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
        // 新しいプロフィールをキャッシュに保存
        if (data.user) {
          sessionStorage.setItem(`profile_${firebaseUser.uid}`, JSON.stringify(data.user))
        }
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    if (!auth) {
      console.warn('Firebase auth not initialized - running without authentication')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          // キャッシュされたプロフィールをチェック
          const cachedProfile = sessionStorage.getItem(`profile_${firebaseUser.uid}`)
          if (cachedProfile) {
            setUserProfile(JSON.parse(cachedProfile))
            setLoading(false)
            return
          }

          // emailベースでユーザーを取得（APIと同じ方法）
          const token = await firebaseUser.getIdToken()
          const response = await fetch(`/api/users?email=${encodeURIComponent(firebaseUser.email!)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          if (response.ok) {
            const data = await response.json()
            setUserProfile(data.user)
            // プロフィールをキャッシュ（5分間）
            sessionStorage.setItem(`profile_${firebaseUser.uid}`, JSON.stringify(data.user))
          } else {
            setUserProfile(null)
          }
        } catch (error) {
          console.error('Error handling user profile:', error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
    if (typeof window === 'undefined') {
      throw new Error('Authentication only available on client side')
    }
    if (!auth) throw new Error('Firebase Auth not initialized')
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }

  const signUp = async (email: string, password: string, name: string): Promise<FirebaseUser> => {
    if (typeof window === 'undefined') {
      throw new Error('Authentication only available on client side')
    }
    if (!auth) throw new Error('Firebase Auth not initialized')
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update display name
    await updateProfile(result.user, { displayName: name })
    
    // Create user profile in Firestore will be handled by the auth state change listener
    
    return result.user
  }

  const logout = async (): Promise<void> => {
    if (typeof window === 'undefined') {
      throw new Error('Authentication only available on client side')
    }
    if (!auth) throw new Error('Firebase Auth not initialized')
    await signOut(auth)
  }

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await refreshUserProfile(user)
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}