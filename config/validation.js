/*  
    Aqui existem funções para validação de dados
*/

module.exports = app => {

    function exists(valor, msg){
        /*  Verifica existencia de dados para
            arrays, strings e valores numéricos
            Caso não exista é lançado uma excessão com a 
            mensagem de erro definida na função 
        */

        if(!valor) throw msg
        if(Array.isArray(valor) && valor.length === 0) throw msg
        if(typeof valor === 'string' && !valor.trim()) throw msg
    }
    

    function notExists(valor, msg){
        /*  Oposto a função exists.
            Ou seja, caso não exista nenhum valor não será 
            disparado nenhuma excessão, caso exista será disparado
            uma excessão com a mensagem definida na função   
        */

        try{
            exists(valor, msg)
        }catch(msg){
            return
        }

        throw msg
    }

    function isEqual(antigo, novo, msg){
        /*  Função que verifica igualdade entre dois valores
            Caso seja diferente é disparado uma excessão com a mensagem
            Definida na função  
        */

        if(antigo !== novo) throw msg
    }

    function notEqual(antigo, novo, msg){
        /*  Oposto a função isEqual.
            Ou seja, caso valores sejam estritamente iguais será disparado
            uma excessão com a mensagem definida na função
         */

        try{
            isEqual(antigo, novo, msg)
        }catch(msg){
            return
        }
        throw msg
    }

    function validatePassword(senha, length, msg){
        /*  Função que valida uma senha digitada */

        if(senha.length < length) throw msg ? msg : `A senha precisa ter no mínimo ${length} caracteres`
        if(senha.includes(' ')) throw msg ? msg : 'A senha não pode conter espaços em branco'
    }

    
    function validateCpf(cpf , msg){
        /* Função que valida um CPF de pessoas nativas do Brasil */

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
        /* Função que valida um e-mail digitado */

        exists(email, msg)
        if(!(email.includes('@') && email.includes('.'))) throw msg
    }

    function validateCnpj(cnpj, msg){
        /* Função que valida um CNPJ de empresas nativas no Brasil */
        
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
        /* Função que valida RG de pessoas nativas do Brasil */

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

    function validateBirthDate(data, minYear, msg){
        /* Função que valida data de nascimento */

        exists(data, msg)
        data = data.split('-')
        if(data[0] < minYear) throw `Anos menores de ${minYear} não são aceitos`
        if(data[0] >= app.moment().get('year')) throw msg ? msg : 'Datas maiores que hoje não são permitidas'
    }


    function validatePostalCode(postalcode, msg){
        /* Função que valida Código postal nativo do brasil */

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
        /*
        
            Função que valida o tamanho de uma string
            Atributo = Descrição - tipo
            value = string a ser testada - String
            length = Limite de caracteres - Number
            method = (padrão = 'bigger') Metodo de comparação - enum 'bigger', 'smaller' e 'biggerOrEqual'
            msg = (opcional) Mensagem a ser apresentada ao critério ser burlado
        
         */
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

    function defineMonthDescribed(monthInNumber){
        try {
            if(!(monthInNumber && !isNaN(monthInNumber))) throw 'O número informado não é numérico'
            
            let month = ''
            switch(monthInNumber){
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

    return {exists, notExists, isEqual, notEqual, validatePassword, validateEmail, validateCpf, validateRg, validateCnpj, validateBirthDate, validatePostalCode, validateLength, defineMonthDescribed} 
}