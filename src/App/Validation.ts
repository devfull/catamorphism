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
 * First non-Left result of an EitherT sequence, using left concatentation
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
 * First non-Left result of a TaskEither sequence, using left concatentation
 */
export const firstTaskValidation =
	<E, A>(monoid: Monoid.Monoid<E>):
			((fs: Array<T.Task<E.Either<E, A>>>) => T.Task<E.Either<E, A>>) =>
		altAllValidation<E, A, T.URI>(T.Monad)(monoid)

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

main()
