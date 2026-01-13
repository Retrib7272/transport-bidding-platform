import { formatInTimeZone } from 'date-fns-tz'
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, isAfter } from 'date-fns'

const IST_TIMEZONE = 'Asia/Kolkata'

/**
 * Calculate expiry time: Next 6 PM IST from current time
 */
export function calculateExpiryTime() {
  const now = new Date()
  
  // Get current time in IST
  const nowIST = formatInTimeZone(now, IST_TIMEZONE, "yyyy-MM-dd HH:mm:ss")
  const currentISTDate = new Date(nowIST)
  
  // Set to 6 PM today
  let expiry = setHours(currentISTDate, 18)
  expiry = setMinutes(expiry, 0)
  expiry = setSeconds(expiry, 0)
  expiry = setMilliseconds(expiry, 0)
  
  // If current time is after 6 PM, move to next day
  if (isAfter(currentISTDate, expiry)) {
    expiry = addDays(expiry, 1)
  }
  
  return expiry
}

/**
 * Format date for display in IST
 */
export function formatDateIST(date, format = 'PPp') {
  if (!date) return ''
  return formatInTimeZone(new Date(date), IST_TIMEZONE, format)
}

/**
 * Get time remaining until expiry
 */
export function getTimeRemaining(expiryDate) {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry - now
  
  if (diff <= 0) return 'Expired'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}h ${minutes}m remaining`
}

/**
 * Generate bid link for carriers
 */
export function generateBidLink(bidId) {
  return `${window.location.origin}/bid/${bidId}`
}
