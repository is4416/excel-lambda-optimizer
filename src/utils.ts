"use strict"

// ---------- ---------- ----------
// deleteKeys
// ---------- ---------- ----------
/**
 * オブジェクトから指定したキーを削除する
 * 
 * @param   {Record<string, any>} props 
 * @param   {...string}           keys 
 * @returns {Record<string, any>}
 */
export const deleteKeys = (
	props  : Record<string, any>,
	...keys: string[]
) => {
	const result = { ...props }

	for (const key of keys) {
		if (key in result) delete result[key]
	}

	return result
}

// ---------- ---------- ----------
// createLocalKey
// ---------- ---------- ----------
/**
 * キーから、ローカルキーを作成
 * 
 * @param   {string} key - キー
 * @returns {string}     - ローカルキー
 */
const createLocalKey = (key: string) => `local_state_${ key }`

// ---------- ---------- ----------
// getLocalState
// ---------- ---------- ----------
/**
 * メインステートからローカルステートを取得
 * 
 * @template S
 * @param   {S}                   state - メインステート
 * @param   {string}              key   - キー
 * @param   {Record<string, any>} def   - ローカルステートの初期値
 * @returns {Record<string, any>}       - ローカルステートの全部
 */
export const getLocalState = function <
	S extends Record <string, any>
> (
	state: S,
	key  : string,
	def  : Record <string, any>
): Record <string, any> {
	const localKey = createLocalKey(key)
	const prev     = state[localKey] ?? {}

	return {
		[localKey]: {
			...def,
			...prev
		}
	}
}

// ---------- ---------- ----------
// setLocalState
// ---------- ---------- ----------
/**
 * メインステートにローカルステートの更新を反映させる
 * 
 * @template S
 * @param   {S}                   state - メインステート
 * @param   {string}              key   - キー
 * @param   {Record<string, any>} val   - 更新するローカルステート
 * @returns {S}                         - 更新されたメインステート
 */
export const setLocalState = function <
	S extends Record <string, any>
> (
	state: S,
	key  : string,
	val  : Record <string, any>
): S {
	const localKey = createLocalKey(key)
	const prev     = state[localKey] ?? {}

	return {
		...state,
		[localKey]: {
			...prev,
			...val
		}
	}
}

// ---------- ---------- ----------
// getValue
// ---------- ---------- ----------
/**
 * パスを辿ってステートから値を取得する
 * 
 * @template S
 * @param   {S}        state    - ステート
 * @param   {string[]} keyNames - 値までのパス
 * @returns {any}
 */
export const getValue = function <S> (
	state   : S,
	keyNames: string[]
): any {
	return keyNames.reduce((obj, key) => {
		return obj[key]
	}, state as any)
}

// ---------- ---------- ----------
// setValue
// ---------- ---------- ----------
/**
 * パスを辿って値を設定したステートを返す
 * 
 * @template S
 * @param   {S}        state    - ステート 
 * @param   {string[]} keyNames - 値までのパス
 * @param   {any}      val      - 値
 * @returns {S}                 - 値を設定したステート
 */
export const setValue = function <S> (
	state   : S,
	keyNames: string[],
	val     : any
): S {
	const newState = { ...state } as any

	keyNames.reduce((obj, key, index) => {
		if (keyNames.length - 1 === index) {
			obj[key] = val
		} else {
			return obj[key]
		}
	}, newState)

	return newState
}
