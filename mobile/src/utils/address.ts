const corrections: Record<string, string> = {
  " st ": " street ",
  " st,": " street,",
  " st$": " street",
  " ave ": " avenue ",
  " ave,": " avenue,",
  " ave$": " avenue",
  " rd ": " road ",
  " rd,": " road,",
  " rd$": " road",
  " dr ": " drive ",
  " dr,": " drive,",
  " dr$": " drive",
  " blvd ": " boulevard ",
  " blvd,": " boulevard,",
  " blvd$": " boulevard",
  " ln ": " lane ",
  " ln,": " lane,",
  " ln$": " lane",
  " ct ": " court ",
  " ct,": " court,",
  " ct$": " court",
  " pl ": " place ",
  " pl,": " place,",
  " pl$": " place",
  " cres ": " crescent ",
  " cres,": " crescent,",
  " cres$": " crescent",
  " pde ": " parade ",
  " pde,": " parade,",
  " pde$": " parade",
  " hwy ": " highway ",
  " hwy,": " highway,",
  " hwy$": " highway",
  " tce ": " terrace ",
  " tce,": " terrace,",
  " tce$": " terrace",
}

export const autoCorrectAddress = (input: string): string => {
  let corrected = input.trim().replace(/\s+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  Object.entries(corrections).forEach(([key, value]) => {
    const pattern = key
      .replace(" ", "\\s+")
      .replace(",", "\\,")
      .replace("$", "\\b")
    const regex = new RegExp(pattern, "gi")
    corrected = corrected.replace(regex, value)
  })
  return corrected
}

export const validateAddress = (
  input: string,
): { isValid: boolean; corrected: string; errors: string[] } => {
  const corrected = autoCorrectAddress(input)
  const errors: string[] = []

  if (corrected.length < 5) {
    errors.push("Address too short")
  }
  if (!/\d/.test(corrected)) {
    errors.push("Include a street number")
  }
  if (!/[a-zA-Z]/.test(corrected)) {
    errors.push("Include a street name")
  }
  if (!/(street|road|avenue|drive|lane|boulevard|terrace|parade|court|place|highway)/i.test(corrected)) {
    errors.push("Add a street type (Street, Avenue, Road, etc.)")
  }

  return {
    isValid: errors.length === 0,
    corrected,
    errors,
  }
}
