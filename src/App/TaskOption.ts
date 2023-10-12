import * as A from "fp-ts/Alternative"
import * as Console from "fp-ts/Console"
import * as F from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as T from "fp-ts/Task"
import * as TO from "fp-ts/TaskOption"
import assert from "assert"

/**
 * First non-None result of a TaskOption sequence
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

main()
