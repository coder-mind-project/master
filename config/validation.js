module.exports = app => {
    function exists(valor, msg){
        if(!valor) throw msg
        if(Array.isArray(valor) && valor.length === 0) throw msg
        if(typeof valor === 'string' && !valor.trim()) throw msg
    }
    
    function notExists(valor, msg){
        try{
            exists(valor, msg)
        }catch(msg){
            return
        }
        throw msg
    }

    function isEqual(antigo, novo, msg){
        if(antigo === novo) throw msg
    }

    function notEqual(antigo, novo, msg){
        try{
            isEqual(antigo, novo, msg)
        }catch(msg){
            return
        }
        throw msg
    }

    function validatePassword(senha, msg){
        if(senha.length < 8) throw 'A senha precisa ter no mínimo 8 caracteres'
        if(senha.includes(' ')) throw 'A senha não pode conter espaços em branco'
    }

    function validateCpf(cpf , msg){
        exists(cpf, msg)
        if(cpf.length < 14) throw msg
        if(cpf.includes(' ')) throw msg
        cpf.split('').forEach((char, index) => {
                        
            if(index === 3 || index === 7) {
                if(char !== '.') throw msg

            }else if(index === 11){
                if(char !== '-') throw msg
                
            }else{
                if(isNaN(parseInt(char))) throw msg
                
            }
        })
    }

    function validateEmail(email, msg){
        exists(email, msg)
        if(!(email.includes('@') && email.includes('.'))) throw msg
    }

    function validateCnpj(cnpj, msg){
        exists(cnpj, msg)
        if(cnpj.length < 18) throw msg
        if(cnpj.includes(' ')) throw msg
        cnpj.split('').forEach((char, index) => {
            if(index === 2 || index === 6){
                if(char !== '.') throw msg
            }else if(index === 10){
                if(char !== '/') throw msg
            }else if(index === 15){
                if(char !== '-') throw msg
            }else{
                if(isNaN(parseInt(char))) throw msg
            }

            
        })
    }

    function validateRg(rg, msg){
        exists(rg, msg)
        if(rg.length < 12) throw msg
        if(rg.includes(' ')) throw msg
        rg.split('').forEach((char, index) => {

            if(index === 2 || index === 6){
                if(char !== '.') throw msg

            }else if(index === 10){
                if(char !== '-') throw msg

            }else{
                if(isNaN(parseInt(char))) throw msg
                
            }
        })

    }

    function validateBirthDate(data, msg){
        exists(data, msg)
        data = data.split('-')
        if(data[0] < 1920) throw 'Anos menores de 1920 não são aceitos'
        if(data[0] >= app.moment().get('year')) throw msg
    }

    function validadeOnlyYearData(data, msg){
        if(data === null || data.trim() === '') return
        data = data.split('-')
        if(data[0] < app.moment().get('year') - 1) throw msg
    }

    function validateData(data, msg){
        exists(data, msg)
        data = data.split('-')
        if(data[0] < 2000) throw 'Anos menores de 2000 não são aceitos'
        if(data[0] > app.moment().add(50, 'year').get('year')) throw msg
    }

    function validatePostalCode(postalcode, msg){
        if(postalcode){
            if(postalcode.length > 9) throw msg
    
            postalcode.split('').forEach((char, index) => {
    
                if(index === 5){
                    if(char !== '-') throw msg
    
                }else{
                    if(isNaN(parseInt(char))) throw msg
                }
            })
        }
    }

    function validateLength(value, length, method, msg){
        if(!method || (method !== 'bigger' && method !== 'smaller' && method !== 'biggerOrEqual')) method = 'bigger'
        
        switch(method){
            case 'bigger': {
                if(value.trim().length > length) throw msg || `Máximo permitido ${length} caracteres` 
                break
            }
            case 'smaller': {
                if(value.trim().length < length) throw msg || `Mínimo permitido ${length} caracteres` 
                break
            }
            case 'biggerOrEqual': {
                if(value.trim().length >= length) throw msg || `Máximo permitido ${length - 1} caracteres` 
                break
            }
        }
    }

    return {exists, notExists, isEqual, notEqual, validatePassword, validateEmail, validateCpf, validateRg, validateCnpj, validateBirthDate, validadeOnlyYearData, validateData, validatePostalCode, validateLength} 
}