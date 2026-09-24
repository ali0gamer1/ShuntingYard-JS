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

- [Specs.js](Specs.js) — Shared definitions used across the whole pipeline: the `TokenType` and `Associativity` enums, the `TokenContext` enum used by the tokenizer, and the `Token` class (type, raw text, and source `location`).
- [Tokenizer.js](Tokenizer.js) — Scans the raw expression string character by character and produces a flat list of `Token`s (numbers, identifiers, operators, unary operators, parentheses, commas), tracking each token's start/end index in the original string for later error reporting.
- [Parser.js](Parser.js) — Implements the shunting-yard algorithm (`Parser.toRPN`). Consumes the token list and, using operator precedence/associativity and function-arity info from the registry, rearranges it into Reverse Polish Notation (RPN), inserting implicit multiplication and `ArgCount` markers, and validating parentheses/commas along the way.
- [evaluator.js](evaluator.js) — The orchestration/entry-point module. Builds the default `Registries` (built-in operators and functions), exposes `main(expression, variables, registry)` which ties tokenizing → parsing → RPN evaluation together, and contains `evalRPN` which walks the RPN output with a stack machine to produce the final numeric result. Also has `promptForMissingVariables` for interactively asking the user for undefined identifiers.
- [OperatorSpec.js](OperatorSpec.js) — Plain data/spec class describing one operator: its symbol, precedence, associativity, arity, and the actual `operation`/`unaryOperation` function that performs the math.
- [FunctionSpec.js](FunctionSpec.js) — Plain data/spec class describing one function: its symbol, arity rules (fixed arity, min arity, or per-arity overloads), and a `run(args)` method that dispatches to the right implementation.
- [Registries.js](Registries.js) — Holds the lookup tables (`Map`s) of registered `OperatorSpec`s and `FunctionSpec`s, built via two mixins (`OperatorRegistry`, `FunctionRegistry`) combined into a single `Registries` class. Provides `isOperator`/`isFunction`/`GetOperator`/`GetFunction`/`RegisterOperator`/`RegisterFunction`.
- [ErrorFormat.js](ErrorFormat.js) — Formats parser/evaluator errors with source context: given a token and the original expression, it builds a message with the character position, a text snippet, and a caret (`^`) pointing at the offending token, then `raiseError` throws it.
- [tester.js](tester.js) — Standalone script (not imported by the library) with value tests and expected-error tests that exercise `main` from evaluator.js and print pass/fail results to the console.
- [tempCodeRunnerFile.js](tempCodeRunnerFile.js) — Scratch file auto-generated by the "Code Runner" VS Code extension when running a code selection; not part of the library.

## Design pattern

The project is built around the classic **shunting-yard algorithm** (Tokenizer → Parser → RPN evaluator pipeline), and layers a few object-oriented patterns on top:

- **Strategy pattern** — `OperatorSpec` and `FunctionSpec` each wrap a swappable behavior (`operation`/`unaryOperation`, or per-arity `overLoads`) behind a common shape (`Symbol`, arity info, `run`/operation call). The parser and evaluator only depend on this shape, so new operators/functions can be plugged in without changing parsing or evaluation logic.
- **Registry pattern** — `Registries` acts as a central lookup service that decouples the tokenizer/parser/evaluator from any hard-coded set of operators or functions; everything is registered at startup and looked up by symbol at runtime.
- **Mixin pattern** — `Registries` is composed from two mixins, `OperatorRegistry(BaseClass)` and `FunctionRegistry(BaseClass)`, combined as `class Registries extends FunctionRegistry(OperatorRegistry(Object))`, instead of using a single monolithic class or classic inheritance chain.
- **Pipeline pattern** — `main(...)` in evaluator.js chains discrete stages (`Tokenize` → `Parser.toRPN` → `evalRPN`), each consuming the previous stage's output, similar to a compiler pipeline.

## Notes

- Unknown identifiers are treated as variables
- Unknown operators or invalid function calls throw errors with source context
- Comma and parenthesis validation is handled during parsing with caret-style location output
- Token positions are preserved from the original expression so error spans stay accurate

