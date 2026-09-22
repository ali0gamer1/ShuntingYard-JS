# JS_ShuntingYard

A small JavaScript expression evaluator built around the shunting-yard algorithm.

It tokenizes an expression, converts it to Reverse Polish Notation (RPN), and evaluates the result with pluggable operators and functions.

When parsing fails, the evaluator now reports the exact token position and shows a short slice of the surrounding expression with a caret pointing at the problem area.

## What it supports

- Numbers and decimals
- Variables
- Parentheses
- Binary operators
- Unary `+` and `-`
- Functions with fixed arity or overloads

## Built-in behavior

The default evaluator setup includes these operators:

- `+`
- `-`
- `*`
- `/`
- `^`
- `u+`
- `u-`

It also includes these functions:

- `sqrt(x)`
- `floor(x)`
- `max(...)`
- `rangeSum(...)`

## Evaluate an expression

The main entry point is `main(expression, variables, registry)` from `evaluator.js`.

```js
import { main } from "./evaluator.js";

const result = main("max(a, b) + sqrt(c)", {
	a: 3,
	b: 7,
	c: 25
});

console.log(result); // 12
```

Identifiers that are not registered as functions are treated as variables.

## Error reporting

Syntax errors are reported with:

- the error message
- the character index or token span where the problem occurred
- a small excerpt of the original expression
- a caret marker pointing to the failing character or token

Examples of parser errors that now include location context:

- misplaced commas
- missing arguments
- mismatched parentheses
- unknown functions
- wrong function arity

This location data is based on the original input string, so the reported position remains correct even when the expression contains whitespace.

For runtime math errors, the evaluator still relies on the registered operation or function to decide whether a bad value should throw. For example, division by zero in JavaScript returns `Infinity` unless you explicitly check for it in the operator implementation.

## Register a custom function

```js
import { main } from "./evaluator.js";
import { Registries } from "./Registries.js";
import { FunctionSpec } from "./FunctionSpec.js";
import { OperatorSpec } from "./OperatorSpec.js";
import { Associativity } from "./Specs.js";

const registry = new Registries();

registry.RegisterOperator(new OperatorSpec({
	Symbol: "+",
	precedence: 2,
	associativity: Associativity.Left,
	arity: 2,
	operation: (a, b) => a + b
}));

registry.RegisterFunction(new FunctionSpec({
	Symbol: "double",
	fixedArity: true,
	arity: 1,
	operation: (args) => args[0] * 2
}));

console.log(main("double(4) + 3", {}, registry)); // 11
```

For a custom function:

- `Symbol` is the function name used in expressions
- `fixedArity: true` means the function must receive exactly `arity` arguments
- `operation(args)` receives the function arguments as an array

## Register a custom operator

```js
import { main } from "./evaluator.js";
import { Registries } from "./Registries.js";
import { FunctionSpec } from "./FunctionSpec.js";
import { OperatorSpec } from "./OperatorSpec.js";
import { Associativity } from "./Specs.js";

const registry = new Registries();

registry.RegisterOperator(new OperatorSpec({
	Symbol: "+",
	precedence: 2,
	associativity: Associativity.Left,
	arity: 2,
	operation: (a, b) => a + b
}));

registry.RegisterOperator(new OperatorSpec({
	Symbol: "%",
	precedence: 3,
	associativity: Associativity.Left,
	arity: 2,
	operation: (a, b) => a % b
}));

registry.RegisterFunction(new FunctionSpec({
	Symbol: "id",
	fixedArity: true,
	arity: 1,
	operation: (args) => args[0]
}));

console.log(main("10 % 3 + id(2)", {}, registry)); // 3
```

For a custom operator:

- `Symbol` is the token used in the expression
- `precedence` controls ordering
- `associativity` is `Associativity.Left` or `Associativity.Right`
- `arity` is usually `2` for binary operators or `1` for unary operators

## Function overloads

Functions can also support multiple argument counts.

```js
import { FunctionSpec } from "./FunctionSpec.js";

const clamp = new FunctionSpec({
	Symbol: "clamp",
	fixedArity: false,
	minarity: 2,
	overLoads: new Map([
		[2, (args) => Math.max(0, Math.min(args[0], args[1]))],
		[3, (args) => Math.max(args[1], Math.min(args[0], args[2]))]
	])
});
```

## Core files

- `Tokenizer.js` parses raw text into tokens
- `Parser.js` converts tokens to RPN
- `evaluator.js` evaluates RPN and exposes `main(...)`
- `Registries.js` stores registered operators and functions
- `OperatorSpec.js` defines operator metadata
- `FunctionSpec.js` defines function metadata
- `tester.js` contains basic tests and examples

## Notes

- Unknown identifiers are treated as variables
- Unknown operators or invalid function calls throw errors with source context
- Comma and parenthesis validation is handled during parsing with caret-style location output
- Token positions are preserved from the original expression so error spans stay accurate

