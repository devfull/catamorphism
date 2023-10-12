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
 * Left-most non-None value of an array of Option
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


main()
