import { FunctionSpec } from "./FunctionSpec.js";   
import { OperatorSpec } from "./OperatorSpec.js";
import { Registries } from "./Registries.js";
import { Parser } from "./Parser.js";
import { Tokenize } from "./Tokenizer.js";
import { TokenType } from "./Specs.js";
import { Associativity } from "./Specs.js";


import { question } from "readline-sync";




function createDefaultRegistry() {
	const registry = new Registries();

	registry.RegisterOperator(new OperatorSpec({
		Symbol: '+',
		precedence: 2,
		associativity: Associativity.Left,
		arity: 2,
		operation: (a, b) => a + b
	}));

	registry.RegisterOperator(new OperatorSpec({
		Symbol: '-',
		precedence: 2,
		associativity: Associativity.Left,
		arity: 2,
		operation: (a, b) => a - b
	}));

	registry.RegisterOperator(new OperatorSpec({
		Symbol: '*',
		precedence: 3,
		associativity: Associativity.Left,
		arity: 2,
		operation: (a, b) => a * b
	}));

	registry.RegisterOperator(new OperatorSpec({
		Symbol: '/',    
		precedence: 3,
		associativity: Associativity.Left,
		arity: 2,
		operation: (a, b) => a / b
	}));

	registry.RegisterOperator(new OperatorSpec({
		Symbol: '^',    
		precedence: 4,
		associativity: Associativity.Right,
		arity: 2,
		operation: (a, b) => Math.pow(a, b)
	}));

	registry.RegisterOperator(new OperatorSpec({
		Symbol: 'u+',
		precedence: 5,
		associativity: Associativity.Right,
		arity: 1,
		unaryOperation: (value) => +value
	}));

	registry.RegisterOperator(new OperatorSpec({
		Symbol: 'u-',
		precedence: 5,
		associativity: Associativity.Right,
		arity: 1,
		unaryOperation: (value) => -value
	})  );


    registry.RegisterFunction(new FunctionSpec({
        Symbol: 'sqrt',
        fixedArity: true,
        arity: 1,
        operation: (args) => Math.sqrt(args[0])
    }));


    registry.RegisterFunction(new FunctionSpec(
        {
            Symbol: "floor",
            fixedArity: true,
            arity: 1,
            operation: (args)=>Math.floor(args[0])
        }

    ));


    registry.RegisterFunction(new FunctionSpec({
        Symbol: 'max',
        fixedArity: false,
        minarity: 1,
        operation: (args) => Math.max(...args)
    }));

    registry.RegisterFunction(new FunctionSpec({
        Symbol: "rangeSum",
        fixedArity: false,
        minarity: 1,
        overLoads: new Map([
            [1, (args) => {
                let sum = 0;
                for(let i = 1; i <= args[0]; i++)
                {
                    sum += i;
                }
                return sum;
            }],
            [2, (args) => {
                let sum = 0;
                for(let i = args[0]; i <= args[1]; i++)
                {
                    sum += i;
                }
                return sum;
            }],
            [3, (args) => {
                let sum = 0;
                for(let i = args[0]; i <= args[1]; i += args[2])
                {
                    sum += i;
                }
                return sum;
            }]
        ]),

        
    }));


	return registry;
}


//setup
export function promptForMissingVariables(tokens, registry, variables) {
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === TokenType.Identifier && !registry.isFunction(token.token)) {

            
            // Check if it's missing from the passed variables
            if (!Object.prototype.hasOwnProperty.call(variables, token.token)) {
                const ans = question(`Unknown identifier "${token.token}".\nPlease assign a numeric value: `);
                const num = Number(ans);
                
                if (Number.isNaN(num)) {
                    throw new Error(`Value for "${token.token}" must be numeric.`);
                }
                
                // Cache it so we don't ask again for the same variable
                variables[token.token] = num;
            }
        }
    }
}


export function evalRPN(rpn, registry, variables)
{    
    const stack = [];
	const functionArgCountStack = [];


	for(const token of rpn)
	{
		if(token.type === TokenType.Number)
		{	
			stack.push(Number(token.token));
            continue;
		}


        //check if variable is defined in the variables object.
        // and do a reinforced check to ensure the identifier is valid and numeric
        if (token.type === TokenType.Identifier && !registry.isFunction(token.token))
        {
            
            if (!Object.prototype.hasOwnProperty.call(variables, token.token)) 
            {
                throw new Error(`Unknown identifier: ${token.token}`)
            }
            
            
            if (Number.isNaN(variables[token.token])) 
                throw new Error(`Identifier is not numeric: ${token.token}`);

            stack.push(variables[token.token]);
            continue;
        }

      

        if(token.type === TokenType.ArgCount)
        {
            const argCount = token.token;
            if (!Number.isInteger(argCount) || argCount < 0) 
                throw new Error(`Invalid function arg marker: ${token.token}`);
            functionArgCountStack.push(argCount);
            continue;
        }

        if(registry.isFunction(token.token))
        {
            let argCount = functionArgCountStack.pop();
            const functionSpec = registry.GetFunction(token.token);

            //reinforced check to ensure the functionSpec is valid
            if (!functionSpec)                
                throw new Error(`Unknown function in RPN: ${token.token}`);


            if(stack.length < argCount)
                throw new Error(`Insufficient arguments for function: ${token.token}`);

            const args = stack.splice(stack.length - argCount, argCount);

            
            if (functionSpec.fixedArity && args.length !== functionSpec.arity)
                throw new Error(`Function ${token.token} expects ${functionSpec.arity} arguments, got ${args.length}`);



            let result = functionSpec.run(args);


            stack.push(result);
            continue;
        }

        if(registry.isOperator(token.token))
        {
            const operatorSpec = registry.GetOperator(token.token);
            if (!operatorSpec)                
                throw new Error(`Unknown operator in RPN: ${token.token}`);

            if (stack.length < operatorSpec.arity)
                throw new Error(`Insufficient arguments for operator: ${token.token}`);

            if (operatorSpec.arity === 1) 
            {
                const value = stack.pop();
                const result = operatorSpec.unaryOperation(value);
                stack.push(result);
                continue;
            }

            const b = stack.pop();
            const a = stack.pop();
            const result = operatorSpec.operation(a, b);
            stack.push(result);
        }
        
    }

    if (stack.length !== 1) {
            throw new Error('Invalid expression: too many values left on stack');
        }

    return stack[0];
}

export function main(expression, variables = {}, registry = createDefaultRegistry())
{
    
    const tokens = Tokenize(expression, registry);
    
    // Scan and prompt for missing variables before parser runs
    promptForMissingVariables(tokens, registry, variables);
    
    const parser = new Parser();    
    const rpn = parser.toRPN(tokens, registry, expression);    
    return evalRPN(rpn, registry, variables);
}



//temp repl

while (true) {
    const input = question("Enter an expression (or 'exit' to quit): ");

    if (input.trim().toLowerCase() === 'exit') {
        break;
    }
    try {
        const result = main(input);
        console.log(`Result: ${result}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

}

    



