'use strict';


const TokenType = {
    None: 0,
    Number: 1,
    Identifier: 2,
    UnaryOperator: 3,
    Parenthesis: 4,
    Comma: 5,
    Operator: 6,
    ArgCount: 7
};


class Token {
    
    constructor(type, token) {
        this.type = type;
        this.token = token;
    }
}



const Associativity = {
    None: 0,
    Left: 1,
    Right: 2
};

const TokenContext = {
    ExpectValue: 0,
    ValueEnded: 1
};


export  { TokenType, Associativity, TokenContext, Token };
