"use strict"

import { app, Dispatch, text } from "hyperapp"
import h from "hyperapp-jsx-pragma"
import { lambdaOptimizer, OptimizerOptions } from "./excelLambdaOptimizer"

// ---------- ---------- ---------- ---------- ----------
// interface State
// ---------- ---------- ---------- ---------- ----------

interface State {
	code   : string
	options: Partial <OptimizerOptions>
}

// ---------- ---------- ---------- ---------- ----------
// action_loadSample
// ---------- ---------- ---------- ---------- ----------

const action_loadSample = (state: State) => {
	return [state, async (dispatch: Dispatch <State>) => {
		const sampleCode = await fetch("./sampleCode.txt").then(data => {
			if (!data.ok) throw new Error("errorr loadText")
			return data.text()
		})

		dispatch((state: State) => ({
			...state,
			code: sampleCode
		}))
	}]
}

// ---------- ---------- ---------- ---------- ----------
// action_inputText
// ---------- ---------- ---------- ---------- ----------

const action_inputText = (state: State, e: Event) => {
	const element = e.currentTarget as HTMLTextAreaElement
	if (!element) return state

	return {
		...state,
		code: element.value
	}
}

// ---------- ---------- ---------- ---------- ----------
// action_changeOption
// ---------- ---------- ---------- ---------- ----------

const action_changeOption = (state: State, e: Event) => {
	const checkBox = e.currentTarget as HTMLInputElement
	if (!checkBox) return state

	return {
		...state,
		options: {
			...state.options,
			[checkBox.name]: checkBox.checked
		}
	}
}

// ---------- ---------- ---------- ---------- ----------
// action_deleteCode
// ---------- ---------- ---------- ---------- ----------

const action_deleteCode = (state: State) => {
	return {
		...state,
		code: ""
	}
}

// ---------- ---------- ---------- ---------- ----------
// action_copyClipboard
// ---------- ---------- ---------- ---------- ----------

const action_copyClipboard = (state: State) => {
	const text = state.code !== "" ? lambdaOptimizer(state.code, state.options) : ""
	navigator.clipboard.writeText(text)
	return state
}

// ---------- ---------- ---------- ---------- ----------
// event
// ---------- ---------- ---------- ---------- ----------

addEventListener("load", () => {

	// state
	const param: State = {
		code   : "",
		options: {
			minify         : false,
			skipFirstLAMBDA: true
		}
	}

	// entry point
	app({
		node: document.querySelector("#app") as HTMLElement,
		init: param,
		view: (state: State) => (<main id="app">
			<section>
				<textarea
					id      = "code"
					title   = "code"
					placeholder = "code"
					value   = { state.code }
					wrap    = "off"
					oninput = { action_inputText }
				/>
			</section>
			<section>
				<textarea
					id       = "formula"
					title    = "formula"
					placeholder = "formula"
					value    = { state.code !== "" ? lambdaOptimizer(state.code, state.options) : "" }
					readOnly = {true}
				/>
				<div id="param">
					<label><input
						type     = "checkbox"
						name     = "minify"
						checked  = { state.options.minify }
						onchange = { action_changeOption }
					/><span
						title = "コードを圧縮"
					>minify</span></label>
					<label><input
						type     = "checkbox"
						name     = "skipFirstLAMBDA"
						checked  = { state.options.skipFirstLAMBDA }
						onchange = { action_changeOption }
						disabled = { !state.options.minify }
					/><span
						class = { !state.options.minify && "inactive" }
						title = "最初のLAMBDA関数の引数を短縮しない"
					>skipFirstLAMBDA</span></label>
					<div></div>
					<span
						title   = "サンプルコードの読み込み"
						onclick = { action_loadSample }
					>load sample</span>
					<button
						type    = "button"
						title   = "delete code"
						onclick = { action_deleteCode }
					><img src="./svg/delete.svg" /></button>
					<button
						type    = "button"
						title   = "copy"
						onclick = { action_copyClipboard }
					><img src="./svg/copy_line.svg" /></button>
				</div>
			</section>
		</main>)
	})
})
