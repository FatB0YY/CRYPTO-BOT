/**
 * Преобразует читаемое значение токена (например, 0.01 USDC или 1.5 SOL)
 * в минимальную единицу токена (лампорты / base units) с учётом decimals.
 *
 * @param {number} amount - Количество токенов в привычном виде (человеко-читаемом), например 0.5.
 * @param {number} decimals - Количество знаков после запятой у токена (например, 6 для USDC, 9 для SOL).
 * @returns {number} Целое число, представляющее количество токена в минимальных единицах (лампортах).
 *
 * @example
 * toLamports(1.23, 6) // вернёт 1230000
 * toLamports(0.005, 9) // вернёт 5000000
 */
export const toLamports = (amount: number, decimals: number): number => {
  return Math.round(amount * Math.pow(10, decimals))
}
