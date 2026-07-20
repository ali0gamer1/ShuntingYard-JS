import { TokenType, TokenContext, Token } from "./Specs.js";




function isAlpha(char)
{
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}


function Tokenize(input, registry)
{
    if (registry == null)
        throw new Error("Registry cannot be null");

    
    input = input.replace(/\s/g, '');
    
    let tokens = [];
    let currentToken = '';
    let currentTokenType = TokenType.None;
    let lastContext = TokenContext.ExpectValue;


    for(let i = 0; i < input.length; i++)
    {
        let char = input[i];

        if (char >= '0' && char <= '9' || char === '.' && currentTokenType === TokenType.Number)
        {
            if (currentToken == "")
                currentTokenType = TokenType.Number;

            if (currentTokenType === TokenType.Identifier)
            {
                tokens.push(new Token(currentTokenType, currentToken));

                currentToken = "";
                currentTokenType = TokenType.Number;
            }

            currentToken += char;
        }
        
        else if (isAlpha(char))
        {
            if (currentToken == "")
                currentTokenType = TokenType.Identifier;

            if (currentTokenType === TokenType.Number)
            {
                tokens.push(new Token(currentTokenType, currentToken));
                currentToken = "";
                currentTokenType = TokenType.Identifier;
            }

            currentToken += char;
        }

        else if (registry.isOperator(char))
        {
            let hasPending = currentToken.length > 0;
            let contextForOp = hasPending ? TokenContext.ValueEnded : lastContext;
            
            if (hasPending)
            {
                tokens.push(new Token(currentTokenType, currentToken));
                currentToken = "";
                currentTokenType = TokenType.None;
            }

            let isPlusMinus = char === '+' || char === '-';
            let isUnary = isPlusMinus && (contextForOp === TokenContext.ExpectValue );

            if(isUnary)
                tokens.push(new Token(TokenType.UnaryOperator, `u${char}`));
            else
                tokens.push(new Token(TokenType.Operator, char));


            lastContext = TokenContext.ExpectValue;
        }

        else if (char === '(' || char === ')')
        {
            if (currentToken.length > 0)
            {
                tokens.push(new Token(currentTokenType, currentToken));
                currentToken = "";
                currentTokenType = TokenType.None;
            }

            if (char === '(')
                lastContext = TokenContext.ExpectValue;
            else
                lastContext = TokenContext.ValueEnded;

            tokens.push(new Token(TokenType.Parenthesis, char));


        }

        else if (char === ',')
        {
            if (currentToken.length > 0)
            {
                tokens.push(new Token(currentTokenType, currentToken));
                currentToken = "";
                currentTokenType = TokenType.None;
            }

            lastContext = TokenContext.ExpectValue;
            tokens.push(new Token(TokenType.Comma, char));
        }

    }

    if (currentToken.length > 0)
    {
        tokens.push(new Token(currentTokenType, currentToken));
    }

    return tokens;





}

export { Tokenize };

