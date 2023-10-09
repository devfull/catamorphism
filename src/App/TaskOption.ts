import * as A from "fp-ts/Alternative"
import * as Array from "fp-ts/Array"
import * as Console from "fp-ts/Console"
import * as F from "fp-ts/function"
import * as HKT from "fp-ts/HKT"
import * as O from "fp-ts/Option"
import * as T from "fp-ts/Task"
import * as TO from "fp-ts/TaskOption"
import assert from "assert"

export const firstAlt:
	<M extends HKT.URIS, A>(a: A.Alternative1<M>) => (fs: Array<HKT.Kind<M, A>>) => HKT.Kind<M, A> =
	<M extends HKT.URIS, A>(a: A.Alternative1<M>) =>
		F.flow(
			Array.reduce(
				a.zero<A>(),
				(acc, cur: HKT.Kind<M, A>) =>
					a.alt<A>(acc, () => cur)
			),
		)

export const firstTaskOption:
	<A>(fs: Array<TO.TaskOption<A>>) => TO.TaskOption<A> =
	<A>(fs: Array<TO.TaskOption<A>>) =>
		firstAlt<TO.URI, A>(TO.Alternative)(fs)

export const main =
	async () => {
		const log:
			<A>(a: A) => TO.TaskOption<void> =
				F.flow(Console.log, T.fromIO, T.delay(500), TO.fromTask)

		const handler:
			<A>(n: number, a: O.Option<A>) => TO.TaskOption<A> =
			<A>(n: number, a: O.Option<A>) =>
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
