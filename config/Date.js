/**
 * @module Date
 * @description Provide functions for manage dates.
 */

/**
 * @function
 * @description Set current date with informed time zone .
 * @param {Number} timezone - A timezone.
 * @returns {Object} A date with time zone defined.
 */
exports.setTimeZone = timezone => {
  const zone = parseInt(timezone)

  if (zone < -12 || zone > 12) throw 'Error, invalid Timezone'

  const date = new Date()
  const hour = date.getHours() + parseInt(timezone)

  date.setHours(hour)

  return date
}
