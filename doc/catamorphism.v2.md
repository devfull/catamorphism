---
title: "Chain of Responsibility"
subtitle: "The Functional Way"
author: [Loïs Mansot]
email: [lois.mansot@smart-chain.fr]
version: v0.2d.04
date: \today
colorlinks: true
tables: yes
...

# Introduction

In the realm of software design, certain concepts have stood the test of time,
proving their value in building robust and flexible systems. Among these
concepts, design patterns have often played a pivotal role, offering
tried-and-true solutions to recurring problems in software development. One
such pattern is the "Chain of Responsibility."

The Chain of Responsibility is a behavioral design pattern that promotes the
decoupling of senders and receivers of requests. In this pattern, a request is
passed along a chain of handlers, each of which has the option to handle the
request or pass it to the next handler in the chain. The key idea is that no
single object needs to know which object will ultimately process the request,
and it allows for dynamic composition of handlers.

This pattern is useful in scenarios where you want to achieve flexibility and
avoid hardcoding the handling logic into a single class as cascading
conditionals. It allows you to add or modify handlers without changing the
client code that initiates the request.

In practice, a typical implementation of the Chain of Responsibility pattern
consists of a chain of handler objects, each with a reference to the next
handler in the chain. When a request is sent to the chain, it's passed from one
handler to the next until one of them successfully handles it or the end of the
chain is reached.

# Functional Approach

At Smart-Chain, our software engineers continually strive to harness the full
potential of programming languages.

Our primary focus will be on introducing you to the world of functional
programming in TypeScript, leveraging libraries like [`fp-ts`][fp-ts] to offer a
more concise and expressive approach distinct from traditional patterns. We
won't be implementing the Chain of Responsibility pattern itself, but rather its
functional variant based on list catamorphism and monoids.

## List catamorphism with first monoid

The functional approach to the Chain of Responsibility pattern, based on list
catamorphism with the first monoid, is a way to handle a series of operations
or responsibilities in a functional and composable manner. Let's break down the
core ideas involved:

- **List Catamorphism**: A [catamorphism][Catamorphism] is a generalization of
the `fold` operation that's commonly used in functional programming. It allows
you to traverse and process elements in a list while accumulating a result. In
the context of the Chain of Responsibility, list catamorphism provides a way to
traverse a list of handlers and apply a function to each of them, potentially
accumulating a final result.

- **First Monoid**: A [monoid][MonoidType] is a mathematical structure consisting of
a set, an associative binary operation, and an identity element. In this case,
the "first" monoid represents the idea of stoping with the first successful
handler in the chain. The binary operation combines two handlers results, and
the identity element represents the result of a skipped no-op handler. This
monoid helps us accumulate and choose the first valid result while maintaining
the monoidal properties, associativity and identity.

The key principle for establishing a valid monoid in this context involves
representing the result, including potential failures, using the algebraic data
type [`Option<A>`][Option]. This data type represents the presence or absence of
a value.  It has two variants: `None`, indicating the absence of a value, and
`Some<A>`, representing the presence of a value. `None` acts as a failure case,
while `Some<A>` encapsulates the successful result, providing a systematic
approach to handle both scenarios.

Here is an implementation using TypeScript and the [`fp-ts`][fp-ts] library,
using [`getMonoid`][O.getMonoid] from [`Option`][Option] and
[`concatAll`][M.concatAll] from [`Monoid`][Monoid]. Here,
[`getMonoid`][O.getMonoid] is returning the left-most non-`None` value. If both
operands are `Some` then the inner values are concatenated using the provided
Semigroup. The [`S.first`][S.first] semigroup have a `concat` operation that
always return the first argument.

Let's explore two working examples: one involving a list that includes both Some
and None elements, and the other with a list that contains only None elements.

\newpage

```ts
import * as F from "fp-ts/function"
import * as M from "fp-ts/Monoid"
import * as O from "fp-ts/Option"
import * as S from "fp-ts/Semigroup"
import assert from "assert"

/**
 * First Monoid for the Option type
 */
export const getMonoidFirst =
	<T>(): M.Monoid<O.Option<T>> =>
		O.getMonoid(S.first<T>())

/**
 * Left-most non-none value of an array of Option
 */
export const firstOption:
	<T>(xs: ReadonlyArray<O.Option<T>>) => O.Option<T> =
		M.concatAll(getMonoidFirst())

/**
 * Main function for testing
 */
export const main =
	(): void => {
		assert.deepStrictEqual(
			firstOption<number>([O.none, O.some(1), O.some(2)]),
			O.some(1)
		)
		assert.deepStrictEqual(
			firstOption<number>([O.none]),
			O.none
		)
	}
```

In this TypeScript implementation, we are using [eta reduction][EtaConversion]
and [currying][Currying]. See the [`flow`][flow] function from [`fp-ts`][fp-ts],
that helps function transformations with eta conversion besides the capability
of [`pipe`][pipe] for function composition. Currying is advantageous as it
facilitates partial application and enables eta-conversion by naturally breaking
down functions into a series of single-argument functions, which can make it
easier to identify and remove unnecessary parameters.

\newpage

## Generalization to asynchronous handler

While the previous straightforward approach works well for synchronous
operations, it falls short when dealing with asynchronous handlers that require
a [`TaskOption<A>`][TaskOption]. To tackle asynchronous processing effectively,
we'll introduce the concepts of [`Task`][Task] and [`Alternative`][Alternative].

Unlike traditional JavaScript promises, [`TaskOption<A>`][TaskOption] and
[`TaskEither<E, A>`][TaskEither] are designed to handle errors in a more
controlled and functional manner while allowing you to build complex
asynchronous workflows, avoiding the practice of throwing exceptions and,
instead, explicitly representing failures through their respective types.

The [`Alternative`][Alternative] type class is a fundamental abstraction that
represents computations that can be combined in an associative way. It's closely
related to other type classes like [`Monoid`][MonoidType] and
[`Applicative`][ApplicativeType]. The [`Alternative`][Alternative] type class
provides a mechanism for combining computations composed of two or more
alternatives, where these alternatives are attempted one after the other until a
meaningful result is obtained. This enables a powerful way to express and manage
branching logic in a consistent and functional manner.

Let's explore an illustrative example of an implementation that leverages the
[`Alternative`][Alternative] type class and [`TaskOption`][TaskOption] to
showcase how we can elegantly handle branching asynchronous computations.

```ts
import * as A from "fp-ts/Alternative"
import * as Console from "fp-ts/Console"
import * as F from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as T from "fp-ts/Task"
import * as TO from "fp-ts/TaskOption"
import assert from "assert"

/**
 * First non-none result of a TaskOption sequence
 */
export const firstTaskOption:
	<T>(fs: Array<TO.TaskOption<T>>) => TO.TaskOption<T> =
		A.altAll(TO.Alternative)

/**
 * Main function for testing
 */
export const main =
	async (): Promise<void> => {
		const log:
			<T>(a: T) => TO.TaskOption<void> =
				F.flow(Console.log, T.fromIO, T.delay(500), TO.fromTask)

		const handler =
			<T>(n: number, a: O.Option<T>): TO.TaskOption<T> =>
				F.pipe(
					log(`Handler ${n}: Step 1/2`),
					TO.chain(() => log(`Handler ${n}: Step 2/2`)),
					TO.chain(() => TO.fromOption(a))
				)

		assert.deepStrictEqual(
			await firstTaskOption([
				handler(0, O.none),
				handler(1, O.some(1)),
				handler(2, O.some(2)),
			])(),
			O.some(1)
		)
	}
```

The handler function logs two asynchronous steps, indicating its progress, and
returns a possibly failing result. It operates within the context of
[`TaskOption<A>`][TaskOption], representing an asynchronous computation that may
either succeed or fail depending on an [`Option<A>`][Option] argument.

It's important to highlight that the [`alt`][alt-interface] operation employed
in the implementation of [`altAll`][altAll] accepts a second argument that is
[lazy][LazyArg]. This feature enables subsequent handlers to be skipped if the
first handler has already succeeded, showcasing the primary capability of the
[`Alternative`][Alternative] type class.

When executing the tests, it becomes evident that the last handler is not
executed because the second handler has already succeeded with `O.some(1)`. This
is visually demonstrated in the logged output:

```
Handler 0: Step 1/2
Handler 0: Step 2/2
Handler 1: Step 1/2
Handler 1: Step 2/2
```

\newpage

## Collecting handler errors

In this section, we'll delve into the behavior of [`TaskEither`][TaskEither]
when handling errors and introduce a variation frequently referred to as
[`Validation`][Validation].

While [`TaskEither`][TaskEither] is effective for asynchronous computations with
potential errors, it falls short when you need to collect multiple errors. The
default [`Alt`][Validation] instance for [`Either`][Either] returns the last
encountered error, but if you want to accumulate all errors, you can use
[`Validation`][Validation] with a [`Semigroup`][SemigroupType] to achieve
comprehensive error aggregation via concatenation.

The key idea is to map left [`Either`][Either] results by packaging errors as
array singletons. This approach leverages the monoid instance of array to
facilitate the collection of errors.

The provided code introduces [`altValidation`][altValidation] from the
[`EitherT`][EitherT] error monad transformer, along with a `zeroM` no-op
default. This combination allows us to reduce the handler list in precisely the
same manner as the previous approach, with all errors accumulated.

```ts
import * as Array from "fp-ts/Array"
import * as Console from "fp-ts/Console"
import * as E from "fp-ts/Either"
import * as ET from "fp-ts/EitherT"
import * as F from "fp-ts/function"
import * as HKT from "fp-ts/HKT"
import * as Monad from "fp-ts/Monad"
import * as Monoid from "fp-ts/Monoid"
import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import assert from "assert"

/**
 * Get an empty left value from a monoid
 */
export const zero =
	<E, A>(m: Monoid.Monoid<E>): E.Either<E, A> =>
		E.left(m.empty)

/**
 * Wrap an empty left value from a monoid in a monad
 */
export const zeroM =
	<E, A, M extends HKT.URIS>(monad: Monad.Monad1<M>):
			((monoid: Monoid.Monoid<E>) => HKT.Kind<M, E.Either<E, A>>) =>
		F.flow(
			zero<E, A>,
			monad.of
		)

/**
 * First non-left result of an EitherT sequence, using left concatentation
 */
export const altAllValidation =
	<E, A, M extends HKT.URIS>(monad: Monad.Monad1<M>) => (monoid: Monoid.Monoid<E>):
			((fs: Array<HKT.Kind<M, E.Either<E, A>>>) => HKT.Kind<M, E.Either<E, A>>) =>
		Array.reduce(
			zeroM<E, A, M>(monad)(monoid),
			(acc, cur) =>
				ET.altValidation(monad, monoid)(() => cur)(acc)
		)

/**
 * First non-left result of a TaskEither sequence, using left concatentation
 */
export const firstTaskValidation =
	<E, A>(monoid: Monoid.Monoid<E>):
			((fs: Array<T.Task<E.Either<E, A>>>) => T.Task<E.Either<E, A>>) =>
		altAllValidation<E, A, T.URI>(T.Monad)(monoid)

/**
 * Main function for testing
 */
export const main =
	async (): Promise<void> => {
		const log:
			<T>(a: T) => TE.TaskEither<never, void> =
				F.flow(Console.log, T.fromIO, T.delay(500), TE.fromTask)

		const handler =
			<E, A>(n: number, a: E.Either<E, A>): TE.TaskEither<E, A> =>
				F.pipe(
					log(`Handler ${n}: Step 1/2`),
					TE.chain(() => log(`Handler ${n}: Step 2/2`)),
					TE.chain(() => TE.fromEither(a))
				)

		assert.deepStrictEqual(
			await firstTaskValidation(Array.getMonoid<string>())(
				Array.map(TE.mapLeft(Array.of<string>))([
					handler<string, never>(0, E.left("e0")),
					handler<string, never>(1, E.left("e1")),
				])
			)(),
			E.left(["e0", "e1"])
		)
	}
```

In the example provided, both handlers are executed, and their respective log
lines are recorded. However, any errors they encounter are gathered into a
unified error array as the resulting output.

# Conclusion

In this article, we've delved into how functional techniques provide us with
alternatives to the Chain of Responsibility design pattern. This demonstrates
the versatility of functional programming in offering different approaches to
solving similar problems.

We've demonstrated that by leveraging concepts like list catamorphism and
monoid, we can create a more expressive and concise alternative. In addition,
it's worth noting that the functional programming style solutions enhance type
safety by ensuring that all handlers have the same type and represent errors
consistently.

This approach extends beyond just the Chain of Responsibility pattern.
Functional programming empowers us to sidestep various design patterns by
providing a high degree of composability. These techniques, rooted in concepts
like [monoids][MonoidType], [alternatives][Alternative], and [monads][MonadType], allow
us to adapt and create numerous useful variations while maintaining consistency
in our functional codebase. This flexibility showcases the power of functional
programming in achieving elegant and adaptable solutions.

[fp-ts]: https://github.com/gcanti/fp-ts
[Alt]: https://gcanti.github.io/fp-ts/modules/Alt.ts.html
[alt-interface]: https://gcanti.github.io/fp-ts/modules/Alt.ts.html#alt-interface
[Alternative]: https://gcanti.github.io/fp-ts/modules/Alternative.ts.html
[altAll]: https://gcanti.github.io/fp-ts/modules/Alternative.ts.html#altall
[Either]: https://gcanti.github.io/fp-ts/modules/Either.ts.html
[EitherT]: https://gcanti.github.io/fp-ts/modules/EitherT.ts.html
[altValidation]: https://gcanti.github.io/fp-ts/modules/EitherT.ts.html#altvalidation
[LazyArg]: https://gcanti.github.io/fp-ts/modules/function.ts.html#lazyarg-interface
[flow]: https://gcanti.github.io/fp-ts/modules/function.ts.html#flow
[pipe]: https://gcanti.github.io/fp-ts/modules/function.ts.html#pipe
[Option]: https://gcanti.github.io/fp-ts/modules/Option.ts.html
[O.getMonoid]: https://gcanti.github.io/fp-ts/modules/Option.ts.html#getmonoid
[Monoid]: https://gcanti.github.io/fp-ts/modules/Monoid.ts.html
[M.concatAll]: https://gcanti.github.io/fp-ts/modules/Monoid.ts.html#concatall
[Task]: https://gcanti.github.io/fp-ts/modules/Task.ts.html
[TaskOption]: https://gcanti.github.io/fp-ts/modules/TaskOption.ts.html
[TaskEither]: https://gcanti.github.io/fp-ts/modules/TaskEither.ts.html
[Validation]: https://gcanti.github.io/fp-ts/modules/Either.ts.html#getaltvalidation
[Semigroup]: https://gcanti.github.io/fp-ts/modules/Semigroup.ts.html
[S.first]: https://gcanti.github.io/fp-ts/modules/Semigroup.ts.html#first
[MonoidType]: https://wiki.haskell.org/Typeclassopedia#Monoid
[Catamorphism]: https://wiki.haskell.org/Catamorphisms
[SemigroupType]: https://wiki.haskell.org/Typeclassopedia#Semigroup
[MonadType]: https://wiki.haskell.org/Typeclassopedia#Monad
[ApplicativeType]: https://wiki.haskell.org/Typeclassopedia#Applicative
[EtaConversion]: http://wiki.haskell.org/Eta_conversion
[Currying]: https://wiki.haskell.org/Currying
