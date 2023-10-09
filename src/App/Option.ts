import * as F from "fp-ts/function"
import * as M from "fp-ts/Monoid"
import * as O from "fp-ts/Option"
import * as S from "fp-ts/Semigroup"
import assert from "assert"

export const getMonoidFirst:
	<T>() => M.Monoid<O.Option<T>> =
	<T>() =>
		O.getMonoid(S.first<T>())

export const firstOption:
	<T>(xs: ReadonlyArray<O.Option<T>>) => O.Option<T> =
		F.flow(
			M.concatAll(getMonoidFirst()),
		)

export const main:
	() => void =
	() => {
		assert.deepStrictEqual(
			firstOption<number>([O.none, O.some(1), O.some(2)]),
			O.some(1)
		)
		assert.deepStrictEqual(
			firstOption<number>([O.none]),
			O.none
		)
	}
