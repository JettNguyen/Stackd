import { useEffect, useRef, useState } from 'react'

const useDelayedSpinner = (isLoading, delay = 1000) => {
  const [shouldShow, setShouldShow] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = window.setTimeout(() => {
        setShouldShow(true)
      }, delay)
    } else {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
      setShouldShow(false)
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading, delay])

  return shouldShow
}

export default useDelayedSpinner
