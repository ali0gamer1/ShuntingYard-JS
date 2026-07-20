


/*
From C#
        private string symbol;
        private int precedence, arity;
        private Associativity associativity;

        private Func<double, double, double>? operation;
        private Func<double, double>? unaryOperation;

        public string Symbol { get => symbol; set => symbol = value; }
        public int Precedence { get => precedence; set => precedence = value; }
        public int Arity { get => arity; set => arity = value; }
        public Associativity Associativity { get => associativity; set => associativity = value; }
        public Func<double, double, double>? Operation { get => operation; set => operation = value; }
        public Func<double, double>? UnaryOperation { get => unaryOperation; set => unaryOperation = value; }
    
*/

class OperatorSpec
{

    constructor({Symbol, symbol, precedence, arity, associativity, operation, unaryOperation}) {
        const resolvedSymbol = Symbol ?? symbol;

        this.Symbol = resolvedSymbol;
        this.symbol = resolvedSymbol;
        this.precedence = precedence;
        this.arity = arity;
        this.associativity = associativity;
        this.operation = operation;
        this.unaryOperation = unaryOperation;
    }
    
}

export { OperatorSpec };