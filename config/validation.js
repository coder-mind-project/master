/**
 * @function
 * @module validation
 * @description Contains some functions for validate some data types.
 * @param {Object} app - A app Object provided by consign.
 * @returns {Object} Containing some functions for validate some data type.
 */
module.exports = app => {
  /**
   * @function
   * @description Verify if value exists.
   * @param {Any} value String, Arrays, Boolean, etc.
   * @param {String} msg A Throwable message.
   */
  const exists = (value, msg = "This value doesn't exists") => {
    if (!value) throw msg
    if (Array.isArray(value) && value.length === 0) throw msg
    if (typeof value === 'string' && !value.trim()) throw msg
  }

  /**
   * @function
   * @description Verify if value doesn't exists.
   * @param {Any} value String, Arrays, Boolean, etc.
   * @param {String} msg A Throwable message.
   */
  const notExists = (value, msg = 'This value exists') => {
    try {
      exists(value, msg)
    } catch (msg) {
      return
    }

    throw msg
  }

  /**
   * @function
   * @description Compare whether first value is equal to second value.
   * @param {Any} first String, Arrays, Boolean, etc.
   * @param {Any} second String, Arrays, Boolean, etc.
   * @param {String} msg A Throwable message.
   */
  const isEqual = (first, second, msg = 'The first value is equal to second value') => {
    if (first !== second) throw msg
  }

  /**
   * @function
   * @description Compare whether first value isn't equal to second value.
   * @param {Any} first String, Arrays, Boolean, etc.
   * @param {Any} second String, Arrays, Boolean, etc.
   * @param {String} msg A Throwable message.
   */
  const notEqual = (first, second, msg = "The first value isn't equal to second value") => {
    try {
      isEqual(first, second, msg)
    } catch (msg) {
      return
    }

    throw msg
  }

  /**
   * @function
   * @description Validates a password.
   * @param {String} password A string password not ciphered.
   * @param {Number} length Maximum size for password.
   * @param {String} msg A Throwable message.
   */
  const validatePassword = (password, length, msg = 'This password is weak') => {
    if (password.length < length) throw msg || `A senha precisa ter no mínimo ${length} caracteres`
    if (password.includes(' ')) throw msg || 'A senha não pode conter espaços em branco'
  }

  /**
   * @function
   * @description Validates a CPF
   * @param {String} cpf A Cpf.
   * @param {String} msg A Throwable message.
   */
  const validateCpf = (cpf, msg = 'This CPF is not correct') => {
    exists(cpf, msg)
    if (cpf.length < 14) throw msg
    if (cpf.includes(' ')) throw msg
    cpf.split('').forEach((char, index) => {
      if (index === 3 || index === 7) {
        if (char !== '.') throw msg
      } else if (index === 11) {
        if (char !== '-') throw msg
      } else {
        if (isNaN(parseInt(char))) throw msg
      }
    })
  }
  /**
   * @function
   * @description Validates a email.
   * @param {String} email A Email.
   * @param {String} msg A Throwable message.
   */
  const validateEmail = (email, msg = 'This email is not correct') => {
    exists(email, msg)
    if (!(email.includes('@') && email.includes('.'))) throw msg
  }

  /**
   * @function
   * @description Validates a Cnpj.
   * @param {String} cnpj A Cnpj.
   * @param {String} msg A Throwable message.
   */
  const validateCnpj = (cnpj, msg = 'This Cnpj is not correct') => {
    exists(cnpj, msg)

    if (cnpj.length < 18) throw msg
    if (cnpj.includes(' ')) throw msg
    cnpj.split('').forEach((char, index) => {
      if (index === 2 || index === 6) {
        if (char !== '.') throw msg
      } else if (index === 10) {
        if (char !== '/') throw msg
      } else if (index === 15) {
        if (char !== '-') throw msg
      } else {
        if (isNaN(parseInt(char))) throw msg
      }
    })
  }

  /**
   * @function
   * @description Validates a RG.
   * @param {String} rg A RG.
   * @param {String} msg A Throwable message.
   */
  const validateRg = (rg, msg = 'This RG is not correct') => {
    exists(rg, msg)
    if (rg.length < 12) throw msg
    if (rg.includes(' ')) throw msg
    rg.split('').forEach((char, index) => {
      if (index === 2 || index === 6) {
        if (char !== '.') throw msg
      } else if (index === 10) {
        if (char !== '-') throw msg
      } else {
        if (isNaN(parseInt(char))) throw msg
      }
    })
  }

  /**
   * @function
   * @description Validates a birth date with a minimum and maximum acceptable year.
   * @param {String} date A Date in String format.
   * @param {Number} minYear Minimum year.
   * @param {String} msg A Throwable message.
   */
  const validateBirthDate = (date, minYear, msg) => {
    exists(date, msg)
    const aux = date.split('-')
    if (aux[0] < minYear) throw `Anos menores de ${minYear} não são aceitos`
    if (aux[0] >= app.moment().get('year')) {
      throw msg || 'Datas maiores que hoje não são permitidas'
    }
  }

  /**
   * @function
   * @description Validates a Brazil postal code.
   * @param {String} postalcode A Postal code (In Brazil).
   * @param {String} msg A Throwable message.
   */
  const validatePostalCode = (postalcode, msg) => {
    if (postalcode) {
      if (postalcode.length > 9) throw msg

      postalcode.split('').forEach((char, index) => {
        if (index === 5) {
          if (char !== '-') throw msg
        } else {
          if (isNaN(parseInt(char))) throw msg
        }
      })
    }
  }

  /**
   * @function
   * @description Validates a String size.
   * @param {String} value Some value to be tested.
   * @param {Number} length String size.
   * @param {Array<['smaller', 'biggerOrEqual', 'bigger']>} method Method comparator.
   * @param {String} msg A Throwable message.
   */
  const validateLength = (value, length, method, msg) => {
    let type = method
    if (!method || (method !== 'bigger' && method !== 'smaller' && method !== 'biggerOrEqual')) {
      type = 'bigger'
    }

    switch (type) {
      case 'bigger': {
        if (value.trim().length > length) throw msg || `Máximo permitido ${length} caracteres`
        break
      }
      case 'smaller': {
        if (value.trim().length < length) throw msg || `Mínimo permitido ${length} caracteres`
        break
      }
      case 'biggerOrEqual': {
        if (value.trim().length >= length) throw msg || `Máximo permitido ${length - 1} caracteres`
        break
      }
    }
  }

  /**
   * @function
   * @description Converts month represented in Number to month represented in Words.
   * @param {Number} monthInNumber Month in Number. (Min = 1, Max = 12)
   * @returns {String} A month represented in word.
   */
  const defineMonthDescribed = monthInNumber => {
    try {
      if (!(monthInNumber && !isNaN(monthInNumber))) throw 'O número informado não é numérico'

      let month = ''
      switch (monthInNumber) {
        case 1: {
          month = 'JANEIRO'
          break
        }
        case 2: {
          month = 'FEVEREIRO'
          break
        }
        case 3: {
          month = 'MARÇO'
          break
        }
        case 4: {
          month = 'ABRIL'
          break
        }
        case 5: {
          month = 'MAIO'
          break
        }
        case 6: {
          month = 'JUNHO'
          break
        }
        case 7: {
          month = 'JULHO'
          break
        }
        case 8: {
          month = 'AGOSTO'
          break
        }
        case 9: {
          month = 'SETEMBRO'
          break
        }
        case 10: {
          month = 'OUTUBRO'
          break
        }
        case 11: {
          month = 'NOVEMBRO'
          break
        }
        case 12: {
          month = 'DEZEMBRO'
          break
        }
      }

      return month
    } catch (error) {
      return error
    }
  }

  return {
    exists,
    notExists,
    isEqual,
    notEqual,
    validatePassword,
    validateEmail,
    validateCpf,
    validateRg,
    validateCnpj,
    validateBirthDate,
    validatePostalCode,
    validateLength,
    defineMonthDescribed
  }
}
