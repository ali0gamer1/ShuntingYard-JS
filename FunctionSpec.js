




class FunctionSpec
{   
    constructor({Symbol, symbol, arity, minarity, fixedArity, overLoads, operation})
    {
        const resolvedSymbol = Symbol ?? symbol;

        this.Symbol = resolvedSymbol;
        this.symbol = resolvedSymbol;
        this.arity = arity; //idk why
        this.minarity = minarity; //nullable
        this.fixedArity = fixedArity; //must
        this.overLoads = overLoads ?? new Map(); // Dictionary<int, Func<double[], double>> 
        
        this.operation = operation; //nullable
    }


    #test()
    {
        console.log("kos nane JS");
        
    }
    

    run(args)
    {
        if(this.operation != null)
        {
            return this.operation(args);
        }

        if (this.overLoads != null)
        {
            if (this.overLoads.has(args.length))
            {
                return this.overLoads.get(args.length)(args);
            }
        }

        throw new Error("No operation defined for this function with " + args.length + " arguments");
        
    }


}

export { FunctionSpec };