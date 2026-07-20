



const OperatorRegistry = BaseClass => class extends BaseClass
{
    constructor(...args)
    {
        super(...args);
    }

    // Map<string, OperatorSpec>
    operators = new Map();

    isOperator(token)
    {
        return this.operators.has(token);
    }
    

    GetOperator(token)
    {
        return this.operators.get(token);
    }

    RegisterOperator(operatorSpec)
    {
        this.operators.set(operatorSpec.Symbol, operatorSpec);
    }
}

const FunctionRegistry = BaseClass => class extends BaseClass
{
    constructor(...args)
    {
        super(...args);
    }

    // Map<string, FunctionSpec>
    functions = new Map();

    isFunction(token)
    {
        return this.functions.has(token);
    }

    GetFunction(token)
    {
        return this.functions.get(token);
    }

    RegisterFunction(functionSpec)
    {
        this.functions.set(functionSpec.Symbol, functionSpec);


        

    }


}

class Registries extends FunctionRegistry(OperatorRegistry(Object))
{


}

export { Registries };