/**
 * Ported from the original main.tex's `convert_number_to_words` Lua function.
 * Kept as a direct, line-by-line port (not rewritten "cleverer") so the output
 * matches the previous printed bills exactly — same wording, same edge cases.
 */

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]

const TENS = {
  20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty',
  60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety',
}

function getWords(num) {
  if (num < 20) return ONES[num]

  if (num < 100) {
    const tensPart = TENS[Math.floor(num / 10) * 10]
    const remainder = num % 10
    return remainder !== 0 ? `${tensPart} ${ONES[remainder]}` : tensPart
  }

  if (num < 1000) {
    const remainder = num % 100
    return remainder !== 0
      ? `${getWords(Math.floor(num / 100))} hundred ${getWords(remainder)}`
      : `${getWords(Math.floor(num / 100))} hundred`
  }

  if (num < 100000) {
    const remainder = num % 1000
    return remainder !== 0
      ? `${getWords(Math.floor(num / 1000))} thousand ${getWords(remainder)}`
      : `${getWords(Math.floor(num / 1000))} thousand`
  }

  if (num < 10000000) {
    const remainder = num % 100000
    return remainder !== 0
      ? `${getWords(Math.floor(num / 100000))} hundred ${getWords(remainder)}`
      : `${getWords(Math.floor(num / 100000))} hundred`
  }

  return 'number too large'
}

/**
 * @param {number} n  A non-negative integer.
 * @returns {string} e.g. `numberToWords(142055)` → "One hundred forty two thousand fifty five only"
 */
export function numberToWords(n) {
  const result = getWords(Math.trunc(n))
  return result.charAt(0).toUpperCase() + result.slice(1) + ' only'
}
