export function calculateAge(birthDate: Date): number {
  const today = new Date()
  const birth = new Date(birthDate)
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDifference = today.getMonth() - birth.getMonth()
  
  // If the birthday hasn't occurred this year yet, subtract 1
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function isValidBirthDate(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
  
  return date >= minDate && date <= maxDate
}

export function getMinBirthDate(): string {
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
  return formatDateForInput(minDate)
}

export function getMaxBirthDate(): string {
  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
  return formatDateForInput(maxDate)
}

export function getMinBirthDateObject(): Date {
  const today = new Date()
  return new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
}

export function getMaxBirthDateObject(): Date {
  const today = new Date()
  return new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
}