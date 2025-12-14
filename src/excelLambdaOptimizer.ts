// ---------- ---------- ---------- ---------- ----------
// interface ArgData
// ---------- ---------- ---------- ---------- ----------
/**
 * @type {Object} ArgData
 * 
 * @property {string | null}              name      - 関数名 | null
 * @property {(index: number) => boolean} breakRule - 改行ルール
 * @property {(index: number) => boolean} variable  - 変数
 */
interface ArgData {
	name     : string
	breakRule: (index: number, maxCount: number) => boolean
	variable : (index: number, maxCount: number) => boolean
}

// ---------- ---------- ---------- ---------- ----------
// getFunctionName
// ---------- ---------- ---------- ---------- ----------

const getFunctionName = (text: string, index: number): string | null => {
	const ControlChar = '=+-*/(,'

	for (let i = index - 1; i >= 0; i--) {
		if (ControlChar.indexOf(text[i]) !== -1) return text.slice(i + 1, index)
	}

	return null
}

// ---------- ---------- ---------- ---------- ----------
// getFunctionValue
// ---------- ---------- ---------- ---------- ----------

const getFunctionValue = (text: string, index: number): string => {
	let escape = false
	let depth  = 0
	let i      = index

	while (i < text.length) {
		const C = text[i]
		if (C === '"') escape = !escape
		if (escape) {
			i++
			continue
		}

		if (C === "(") depth++
		if (C === ")") {
			depth--
			if (depth === 0) return text.slice(index, i + 1)
		}

		i++
	}

	return text.slice(index, text.length)
}

// ---------- ---------- ---------- ---------- ----------
// splitArgs
// ---------- ---------- ---------- ---------- ----------

const splitArgs = (value: string): string[] => {
	const args: string[] = []

	let depth  = 0
	let escape = false
	let start  = 1 // "(" の次から開始

	for (let i = 1; i < value.length - 1; i++) {
		const C = value[i]

		if (C === '"') escape = !escape
		if (escape) continue

		if (C === "(") depth++
		if (C === ")") depth--

		if (C === "," && depth === 0) {
			args.push(value.slice(start, i).trim())
			start = i + 1
		}
	}

	// 最後の引数
	if (start < value.length - 1)
		args.push(value.slice(start, value.length - 1).trim())

	return args
}

// ---------- ---------- ---------- ---------- ----------
// interface OptimizerOptions
// ---------- ---------- ---------- ---------- ----------

export interface OptimizerOptions {
	EOL            : string
	indentSize     : number
	spacingKeys    : {from: string, to: string}[]
	argRules       : ArgData[]
	skipFirstLAMBDA: boolean
	minify         : boolean
}

// ---------- ---------- ---------- ---------- ----------
// lambdaOptimizer
// ---------- ---------- ---------- ---------- ----------

export const lambdaOptimizer = (text: string, options: Partial <OptimizerOptions>): string => {

	// ---------- ---------- ----------
	// variable
	// ---------- ---------- ----------

	let result = text            // 返値
	let firstKeys: string[] = [] // 最初の変数名一覧
	let keys: string[] = []      // 変数名一覧

	// ---------- ---------- ----------
	// オプションの初期化
	// ---------- ---------- ----------

	const param: OptimizerOptions = {
		EOL        : String.fromCharCode(10),
		indentSize : 2,
		spacingKeys: [
			{from: "=LAMBDA", to: "= LAMBDA"},
			{from: "===",     to: " === "},
			{from: "!==",     to: " !== "},
			{from: "==",      to: " == "},
			{from: "!=",      to: " != "},
			{from: "=+",      to: " =+ "},
			{from: "=-",      to: " =- "},
			{from: "=*",      to: " =* "},
			{from: ">=",      to: " >= "},
			{from: "=>",      to: " => "},
			{from: "<=",      to: " <= "},
			{from: "=<",      to: " =< "},
			{from: "<<",      to: " << "},
			{from: ">>",      to: " >> "},
			{from: "=/",      to: " =/ "},
			{from: "+",       to: " + "},
			{from: "-",       to: " - "},
			{from: "*",       to: " * "},
			{from: "/",       to: " / "},
			{from: "=",       to: " = "},
			{from: "<",       to: " < "},
			{from: ">",       to: " > "},
			{from: ",",       to: ", "}
		],
		argRules: [
			{
				name     : "LAMBDA",
				breakRule: (index: number, maxCount: number) => false,
				variable : (index: number, maxCount: number) => index !== maxCount - 1
			},
			{
				name     : "LET",
				breakRule: (index: number, maxCount: number) => index % 2 === 0,
				variable : (index: number, maxCount: number) => index % 2 === 0 && index !== maxCount - 1
			},
			{
				name     : "IF",
				breakRule: (index: number, maxCount: number) => index > 0,
				variable : (index: number, maxCount: number) => false
			},
			{
				name     : "MAP",
				breakRule: (index: number, maxCount: number) => true,
				variable : (index: number, maxCount: number) => false
			},
			{
				name     : "REDUCE",
				breakRule: (index: number, maxCount: number) => true,
				variable : (index: number, maxCount: number) => false
			},
			{
				name     : "HSTACK",
				breakRule: (index: number) => true,
				variable : (index: number) => false
			}
		],
		skipFirstLAMBDA: true,
		minify         : true,
		...options
	}

	// ---------- ---------- ----------
	// コメントの削除
	// ---------- ---------- ----------

	const initializreText = (S: string): string => {
		let result = ""
		let escape = false
		let i = 0

		while (i < S.length - 1) {

			// 文字列エスケープ判定
			if (S[i] === '"') escape = !escape

			// 文字列の場合、//の最初の/ではない場合
			// 半角スペースでない場合は、そのまま追加
			if (
				escape ||
				S.slice(i, i + 2) !== "//"
			) {
				if (S[i] !== " ") result += S[i]
				i++
				continue
			}

			// コメントは処理を飛ばす
			const r = S.indexOf(param.EOL, i)
			const p = r === -1 ? S.length : r
			i = p
		}

		// 空白行を削除
		result = result.split(param.EOL).map(line => line.trim()).filter(Boolean).join("")

		// 最初の LAMBDA まで削除
		return "=" + result.slice(result.toUpperCase().indexOf("LAMBDA"))
	}
	result = initializreText(result)

	// ---------- ---------- ----------
	// 改行処理
	// ---------- ---------- ----------

	const breakArgs = (text: string, keys: string[], firstKeys: string[]): string => {
		const rules = param.argRules
		let result = text
		let escape = false
		let isFirstLambda = param.skipFirstLAMBDA

		for (let i = 0; i < result.length; i++) {
			const C = result[i]
			if (C === '"') escape = !escape
			if (escape || C !== "(") continue

			const name = getFunctionName(result, i)?.toUpperCase().trim()
			if (!name) continue

			const value = getFunctionValue(result, i)

			const rule = rules.find(a => a.name === name)
			// if (!rule) continue
			if (!rule) {
				// 関数名は大文字に変換
				result = result.slice(0, i - name.length)
					+ name.toUpperCase()
					+ result.slice(i)
				continue
			}

			const args: string[] = splitArgs(value)
			let isBreak = false
			const newValue = "(" + args.map((arg, index) => {
				// 引数抽出
				if (rule.variable(index, args.length)) {
					if (rule.name !== "LAMBDA" || !isFirstLambda) keys.push(arg)
					if (rule.name === "LAMBDA" && isFirstLambda) firstKeys.push(arg)
				}

				// 改行判定
				if (rule.breakRule(index, args.length)) {
					isBreak = true
					return param.EOL + arg
				} else {
					return arg
				}
			}).join(",")
				+ (isBreak ? param.EOL : "")
				+ ")"
			if (rule.name === "LAMBDA") isFirstLambda = false

			const newName = name.toUpperCase() // 改行対象となった関数名は大文字に固定
			result = result.slice(0, i - newName.length) + newName + newValue + result.slice(i + value.length)
		}

		return result
	}
	result = breakArgs(result, keys, firstKeys)

	// ---------- ---------- ----------
	// インデント処理
	// ---------- ---------- ----------

	const indentLines = (text: string): string => {

		const isOpen = (S: string): boolean => {
			let depth = 0
			for (let i = 0; i < S.length; i++) {
				if (S[i] === "(") depth++
				if (S[i] === ")") depth--

				const nextC = "+-*/=!<>"

				if (
					i < S.length - 1 &&
					S[i] === ")" &&
					nextC.indexOf(S[i + 1]) !== -1
				) depth++
			}
			return depth > 0
		}

		const lines = text.split(param.EOL)
		let indent = 0

		return lines.map(line => {
			if (line[0] === ")") indent--
			const r = " ".repeat(Math.max(0, param.indentSize * indent)) + line
			if (isOpen(line)) indent++
			return r
		}).join(param.EOL)
	}
	if (!param.minify) result = indentLines(result)

	// ---------- ---------- ----------
	// スペース追加
	// ---------- ---------- ----------

	const insertSpaces = (text: string): string => {
		let result = ""
		let escape = false
		let i = 0

		while (i < text.length) {
			const C = text[i]

			if (C === '"') escape = !escape

			const key = param.spacingKeys.find(key => {
				if (text.length - i < key.from.length) return false
				return text.slice(i, i + key.from.length) === key.from
			})

			if (escape || !key) {
				result += C
				i++
			} else {
				result += key.to
				i = i + key.from.length
			}
		}

		return result
	}
	if (!param.minify) result = insertSpaces(result)

	// ---------- ---------- ----------
	// 変数名置換
	// ---------- ---------- ----------

	const replaceKeys = (text: string, keys: string[]): string => {
		let   result      = ""
		let   escape      = false
		let   i           = 0

		const controlChar = ' =+-*/,(){}' + param.EOL

		// 指定位置からcontrolCharまでの文字を返す
		const getText = (index: number): string => {
			for (let i = index; i < text.length; i++) {
				const C = text[i]
				if (controlChar.indexOf(C) === -1) continue
				return text.slice(index, i)
			}
			return text.slice(index, text.length)
		}

		// 0 -> A, 1 -> B, ... 26 -> Z, 27 -> AA
		const numberToColumn = (num: number): string => {
			let x = num + 1
			let result = ""
			while (x > 0) {
				x--
				result = String.fromCharCode(65 + (x % 26)) + result
				x = Math.floor(x / 26)
			}
			return result
		}

		// firstKeys, keys から、変換後の変数名を作成する
		const createNewKeys = (): string[] => {
			const results: string[] = []
			const usedKeys = new Set(firstKeys.map(key => key.toUpperCase()))
			for (let i = 0, offset; i < keys.length; i++) {
				offset = 0
				while (true) {
					const newKey = numberToColumn(i + offset)
					if (!usedKeys.has(newKey)) {
						results.push(newKey)
						usedKeys.add(newKey)
						break
					}
					offset++
				}
			}
			return results
		}
		const newKeys = createNewKeys()

		while (i < text.length) {
			const C = text[i]
			const prevC = i === 0 ? " " : text[i - 1]

			if (C === '"') escape = !escape

			// エスケープ処理は、Cをつむ
			// 前の文字が制御記号でなければ、文字の途中なのでそのままCを積む
			if (
				escape ||
				controlChar.indexOf(prevC) === -1
			) {
				result += C
				i++
				continue
			}

			// 次の制御記号までの文字を取得する
			const S = getText(i)
			const r = keys.indexOf(S)

			if (r !== -1) {
				// keys と一致していれば置換して積む
				result += newKeys[r]
				i += keys[r].length
			} else {
				result += C
				i++
			}
		}
		return result
	}
	if (param.minify) result = replaceKeys(result, keys)

	// ---------- ---------- ----------
	// minifyの時に改行を削除
	// ---------- ---------- ----------

	const deleteBreak = (text: string): string => {
		let result = ""

		for (let i = 0, escape = false; i < text.length; i++) {
			const C = text[i]
			if (C === '"') escape = !escape
			if (escape || C !== param.EOL) result += C
		}

		return result
	}
	if (param.minify) result = deleteBreak(result)

	return result
}
