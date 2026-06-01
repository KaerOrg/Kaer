import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

type SeenState = null | boolean // null = checking, false = first visit, true = returning

function storageKey(moduleKey: string): string {
  return `guide_seen_${moduleKey}`
}

export function useGuideFirstVisit(moduleKey: string) {
  const [isSeen, setIsSeen] = useState<SeenState>(null)

  useEffect(() => {
    AsyncStorage.getItem(storageKey(moduleKey)).then((value) => {
      setIsSeen(value !== null)
    })
  }, [moduleKey])

  const markGuideSeen = useCallback(() => {
    AsyncStorage.setItem(storageKey(moduleKey), '1').catch(() => undefined)
    setIsSeen(true)
  }, [moduleKey])

  return { isSeen, markGuideSeen }
}
