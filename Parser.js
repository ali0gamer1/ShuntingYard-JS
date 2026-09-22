import { Token, TokenType } from "./Specs.js";

import { Associativity } from "./Specs.js";


class Parser {

    operatorStack = [];
    argCountStack = [];
    seenArgStack = [];
    expression = "";


    // Builds "message (at position N)" plus a snippet of the surrounding
    // characters with a caret pointing at the offending token. Falls back to
    // the plain message if the token has no known location (e.g. tokens
    // synthesized by the parser itself, like the implied '*' operator).
    formatErrorLocation(message, token)
    {
        const expression = this.expression;

        if (!token || !token.location || token.location.startIndex == null || !expression)
        {
            return message;
        }

        const start = token.location.startIndex;
        const end = (token.location.endIndex != null && token.location.endIndex >= start)
            ? token.location.endIndex
            : start;

        const radius = 12;
        const contextStart = Math.max(0, start - radius);
        const contextEnd = Math.min(expression.length - 1, end + radius);

        const before = expression.slice(contextStart, start);
        const errorText = expression.slice(start, end + 1);
        const after = expression.slice(end + 1, contextEnd + 1);

        const prefixEllipsis = contextStart > 0 ? "..." : "";
        const suffixEllipsis = contextEnd < expression.length - 1 ? "..." : "";

        const snippet = `${prefixEllipsis}${before}${errorText}${after}${suffixEllipsis}`;
        const caretPadding = " ".repeat(prefixEllipsis.length + before.length);
        const caret = "^".repeat(end - start + 1);

        const positionLabel = start === end ? `position ${start}` : `positions ${start}-${end}`;

        return `${message} (at ${positionLabel})\n  ${snippet}\n  ${caretPadding}${caret}`;
    }

    raiseError(message, token)
    {
        throw new Error(this.formatErrorLocation(message, token));
    }


    touchArgStartIfNeeded()
    {
        if (this.argCountStack.length > 0 && this.seenArgStack.at(-1) === false) //fix?
        {
            this.seenArgStack.pop();
            this.seenArgStack.push(true);

            //removed the if
          //  if(this.argCountStack.at(-1) === 0)
           // {
                let count = this.argCountStack.pop();
                this.argCountStack.push(count + 1);
           // }

        }
    }


    toRPN(tokens, registry, expression = "")
    {
        this.operatorStack = [];
        this.argCountStack = [];
        this.seenArgStack = [];
        this.expression = expression ?? "";

        let output = [];

        let tempOpSpec;
        let tempCurrentOpSpec;

        for(let i = 0; i < tokens.length; i++)
        {
            let currentToken = tokens[i];

            if (currentToken.type === TokenType.Number)
            {
                //check if the next token is a parenthesis, if so, we assume multiplication is intented,
                //  so we push a multiplication operator before the number
                let nextToken = tokens[i + 1];
                if (nextToken != null && nextToken.token === "(") {
                    this.operatorStack.push(new Token(TokenType.Operator, "*"));
                }

                output.push(currentToken);
                this.touchArgStartIfNeeded();
            }
            else
            if (currentToken.type === TokenType.Identifier)
            {
                let nextToken = tokens[i + 1];
                let isFunctionCall = nextToken != null
                    && nextToken.token === "("
                    && registry.isFunction(currentToken.token);

                if (isFunctionCall)
                {
                    this.operatorStack.push(currentToken);
                }
                else
                {
                    //check if the next token is a parenthesis, if so, we assume multiplication is intented,
                    //  so we push a multiplication operator before the identifier
                    if (nextToken != null && nextToken.token === "(") {
                        this.operatorStack.push(new Token(TokenType.Operator, "*"));
                    }

                    output.push(currentToken);
                    this.touchArgStartIfNeeded();
                }
            }
            else
            if (currentToken.type === TokenType.Comma)
            {
                
                
                
                while (this.operatorStack.length > 0 && this.operatorStack.at(-1).token !== "(")
                {
                    output.push(this.operatorStack.pop());
                }

                if (this.argCountStack.length === 0 || this.seenArgStack.length === 0) 
                {

                    this.raiseError("Misplaced comma, missing parenthesis", currentToken);

                }

                if(this.seenArgStack.at(-1) === false)
                {
                    this.raiseError("Missing argument", currentToken);
                }

                
                if(this.operatorStack.length == 0 || this.operatorStack.at(-1).token !== "(")
                {
                    this.raiseError("Misplaced comma, missing parenthesis", currentToken);
                }


                //this.argCountStack.push(this.argCountStack.pop() + 1);
                this.seenArgStack.pop();
                this.seenArgStack.push(false);
           
            }
            else
            if (currentToken.type === TokenType.Operator || currentToken.type === TokenType.UnaryOperator)
            {

                while (this.operatorStack.length > 0)
                {
                    let topStack = this.operatorStack.at(-1);
                    
                    if (topStack.token !== "(")
                    {
                        if (registry.isOperator(topStack.token))
                        {
                            tempOpSpec = registry.GetOperator(topStack.token);
                            tempCurrentOpSpec = registry.GetOperator(currentToken.token);
                            
                            if (tempOpSpec == undefined || tempCurrentOpSpec == undefined)
                                this.raiseError("syntax error, unknown operator: " + (tempOpSpec == undefined ? topStack.token : currentToken.token), tempOpSpec == undefined ? topStack : currentToken);

                            if (tempOpSpec.precedence > tempCurrentOpSpec.precedence || (tempOpSpec.precedence === tempCurrentOpSpec.precedence && tempCurrentOpSpec.associativity === Associativity.Left))
                            {
                                output.push(this.operatorStack.pop());
                                continue;
                            }

                            break;
                        }
                        else
                        {
                            break;
                        }

                    }
                    else
                        break;
                    

                }

                this.operatorStack.push(currentToken);

            }
            else
            if (currentToken.type === TokenType.Parenthesis)
            {
                if (currentToken.token === "(")
                {
                    this.operatorStack.push(currentToken);
                    let startsFunction = i > 0 && tokens[i - 1].type === TokenType.Identifier;

                    if (startsFunction)
                    {
                        this.argCountStack.push(0);
                        this.seenArgStack.push(false);
                    }

                }
                else
                {

                    let topStack = this.operatorStack.pop();
                    while (topStack !== undefined && topStack.token !== "(")
                    {
                        output.push(topStack);
                        topStack = this.operatorStack.pop();
                    }

                    if (this.operatorStack.length>0 && registry.isFunction(this.operatorStack.at(-1).token))
                    {
                        topStack = this.operatorStack.pop();

                        if (this.argCountStack.length == 0 || this.seenArgStack.length == 0)
                            this.raiseError("syntax error, internal arg frame mismatch", currentToken);
                        
                        let argCount = this.argCountStack.pop();
                        let seenArg = this.seenArgStack.pop();


                        if (!seenArg && argCount != 0)
                        {
                            this.raiseError("Misplaced comma", currentToken);
                        }

                        if (argCount == 0 && seenArg){
                            argCount = 1;
                        }


                        let funcSpec = registry.GetFunction(topStack.token);

                        if (funcSpec==undefined)
                            this.raiseError("syntax error, unknown function: " + topStack.token, topStack);

                        if (funcSpec.fixedArity)
                        {
                            if (funcSpec.arity != argCount)
                            {
                                this.raiseError("syntax error, function " + topStack.token + " expects " + funcSpec.arity + " arguments, got " + argCount, topStack);
                            }

                        }
                        else
                        {
                            if (!funcSpec.overLoads.has(argCount) && (funcSpec.minarity == null || argCount < funcSpec.minarity))
                            {
                                this.raiseError("syntax error, function " + topStack.token + " expects at least " + funcSpec.minarity + " arguments, got " + argCount, topStack);
                            }

                            if (!Array.from(funcSpec.overLoads.keys()).includes(argCount) && funcSpec.operation == null)
                            {
                                this.raiseError("syntax error, function " + topStack.token + " does not have an overload for " + argCount + " arguments", topStack);
                            }

                        }

                        output.push(new Token(TokenType.ArgCount, argCount));
                        output.push(topStack);

                        this.touchArgStartIfNeeded();
                        
                    }

                    const nextToken = tokens[i + 1];
                    if (nextToken != null && nextToken.token === "(") {
                        this.operatorStack.push(new Token(TokenType.Operator, "*"));
                    }

                }
            }
           

        }

        while (this.operatorStack.length > 0)
        {
            let topStack = this.operatorStack.pop();
            if (topStack.token === "(" || topStack.token === ")")
            {
                this.raiseError("Mismatched parenthesis", topStack);
            }
            output.push(topStack);
        }

        return output;

        
    }

    
}



export { Parser };