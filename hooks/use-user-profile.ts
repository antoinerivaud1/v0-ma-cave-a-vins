"use client"

import { useState, useEffect, useCallback } from "react"

interface UserProfile {
  firstName: string
}

const STORAGE_KEY = "cave-user-profile"

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setProfile(JSON.parse(stored))
    } catch (e) {
      console.error("[cave] Failed to parse user profile:", e)
    }
    setIsLoaded(true)
  }, [])

  const saveProfile = useCallback((data: UserProfile) => {
    setProfile(data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [])

  const clearProfile = useCallback(() => {
    setProfile(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { profile, isLoaded, saveProfile, clearProfile }
}
