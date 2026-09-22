import { TokenType, TokenContext, Token } from "./Specs.js";




function isAlpha(char)
{
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}


function Tokenize(input, registry)
{
    if (registry == null)
        throw new Error("Registry cannot be null");

    let tokens = [];
    let currentToken = '';
    let currentTokenType = TokenType.None;
    let currentTokenStart = -1;
    let lastContext = TokenContext.ExpectValue;

    // Note: whitespace is no longer stripped up front. None of the branches
    // below match a whitespace character, so it is simply skipped over, same
    // as before - but now token indices stay aligned with the original
    // expression, which is required for accurate error locations.
    for(let i = 0; i < input.length; i++)
    {
        let char = input[i];

        if (char >= '0' && char <= '9' || char === '.' && currentTokenType === TokenType.Number)
        {
            if (currentToken == "")
            {
                currentTokenType = TokenType.Number;
                currentTokenStart = i;
            }

            if (currentTokenType === TokenType.Identifier)
            {
                const tokenObj = new Token(currentTokenType, currentToken);
                
                tokenObj.location.startIndex = currentTokenStart;
                tokenObj.location.endIndex = i - 1;

                tokens.push(tokenObj);
                
                

                currentToken = "";
                currentTokenType = TokenType.Number;
                currentTokenStart = i;
            }

            currentToken += char;
        }
        
        else if (isAlpha(char))
        {
            if (currentToken == "")
            {
                currentTokenType = TokenType.Identifier;
                currentTokenStart = i;
            }

            if (currentTokenType === TokenType.Number)
            {
                const tokenObj = new Token(currentTokenType, currentToken);
                tokenObj.location.startIndex = currentTokenStart;
                tokenObj.location.endIndex = i - 1;
                tokens.push(tokenObj);
                
                currentToken = "";
                currentTokenType = TokenType.Identifier;
                currentTokenStart = i;
            }

            currentToken += char;
        }

        else if (registry.isOperator(char))
        {
            let hasPending = currentToken.length > 0;
            let contextForOp = hasPending ? TokenContext.ValueEnded : lastContext;
            
            if (hasPending)
            {
                const tokenObj = new Token(currentTokenType, currentToken);
                tokenObj.location.startIndex = currentTokenStart;
                tokenObj.location.endIndex = i - 1;
                tokens.push(tokenObj);

                currentToken = "";
                currentTokenType = TokenType.None;
            }

            let isPlusMinus = char === '+' || char === '-';
            let isUnary = isPlusMinus && (contextForOp === TokenContext.ExpectValue );

            if(isUnary)
            {
                const tokenObj = new Token(TokenType.UnaryOperator, `u${char}`);
                tokenObj.location.startIndex = i;
                tokenObj.location.endIndex = i;
                tokens.push(tokenObj);

            }
            else
            {
                const tokenObj = new Token(TokenType.Operator, char);
                tokenObj.location.startIndex = i;
                tokenObj.location.endIndex = i;
                tokens.push(tokenObj);
            }

            lastContext = TokenContext.ExpectValue;
        }

        else if (char === '(' || char === ')')
        {
            if (currentToken.length > 0)
            {
                const tokenObj = new Token(currentTokenType, currentToken);
                tokenObj.location.startIndex = currentTokenStart;
                tokenObj.location.endIndex = i - 1;
                tokens.push(tokenObj);

                currentToken = "";
                currentTokenType = TokenType.None;
            }

            if (char === '(')
                lastContext = TokenContext.ExpectValue;
            else
                lastContext = TokenContext.ValueEnded;

            const tokenObj = new Token(TokenType.Parenthesis, char);
            tokenObj.location.startIndex = i;
            tokenObj.location.endIndex = i;
            tokens.push(tokenObj);


        }

        else if (char === ',')
        {
            if (currentToken.length > 0)
            {
                const tokenObj = new Token(currentTokenType, currentToken);
                tokenObj.location.startIndex = currentTokenStart;
                tokenObj.location.endIndex = i - 1;
                tokens.push(tokenObj);
                currentToken = "";
                currentTokenType = TokenType.None;
            }

            lastContext = TokenContext.ExpectValue;
            const tokenObj = new Token(TokenType.Comma, char);
            tokenObj.location.startIndex = i;
            tokenObj.location.endIndex = i;
            tokens.push(tokenObj);
        }

    }

    if (currentToken.length > 0)
    {
        const tokenObj = new Token(currentTokenType, currentToken);
        tokenObj.location.startIndex = currentTokenStart;
        tokenObj.location.endIndex = input.length - 1;
        tokens.push(tokenObj);
    }

    return tokens;
}

export { Tokenize };

