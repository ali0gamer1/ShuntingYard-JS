import { Token, TokenType } from "./Specs.js";

import { Associativity } from "./Specs.js";


class Parser {

    operatorStack = [];
    argCountStack = [];
    seenArgStack = [];
    

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


    toRPN(tokens, registry)
    {
        this.operatorStack = [];
        this.argCountStack = [];
        this.seenArgStack = [];

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
                    throw new Error("Misplaced comma");

                if(this.seenArgStack.at(-1) === false)
                {
                    throw new Error("Missing argument");
                }

                
                if(this.operatorStack.length == 0 || this.operatorStack.at(-1).token !== "(")
                {
                    throw new Error("Misplaced comma, missing parenthesis");
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
                                throw new Error("syntax error, unknown operator: " + (tempOpSpec == undefined ? topStack : currentToken.token));

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
                            throw new Error("syntax error, internal arg frame mismatch");
                        
                        let argCount = this.argCountStack.pop();
                        let seenArg = this.seenArgStack.pop();


                        if (!seenArg && argCount != 0)
                        {
                            throw new Error("Misplaced comma")
                        }

                        if (argCount == 0 && seenArg){
                            argCount = 1;
                        }


                        let funcSpec = registry.GetFunction(topStack.token);

                        if (funcSpec==undefined)
                            throw new Error("syntax error, unknown function: " + topStack.token);

                        if (funcSpec.fixedArity)
                        {
                            if (funcSpec.arity != argCount)
                            {
                                throw new Error("syntax error, function " + topStack.token + " expects " + funcSpec.arity + " arguments, got " + argCount);
                            }

                        }
                        else
                        {
                            if (!funcSpec.overLoads.has(argCount) && (funcSpec.minarity == null || argCount < funcSpec.minarity))
                            {
                                throw new Error("syntax error, function " + topStack.token + " expects at least " + funcSpec.minarity + " arguments, got " + argCount);
                            }

                            if (!Array.from(funcSpec.overLoads.keys()).includes(argCount) && funcSpec.operation == null)
                            {
                                throw new Error("syntax error, function " + topStack.token + " does not have an overload for " + argCount + " arguments");
                            }

                        }

                        output.push(new Token(TokenType.ArgCount, argCount));
                        output.push(topStack);

                        this.touchArgStartIfNeeded();
                        
                    }
                }
            }
           

        }

        while (this.operatorStack.length > 0)
        {
            let topStack = this.operatorStack.pop();
            if (topStack.token === "(" || topStack.token === ")")
            {
                throw new Error("Mismatched parenthesis");
            }
            output.push(topStack);
        }

        return output;

        
    }

    
}



export { Parser };