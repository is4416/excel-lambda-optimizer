declare module "hyperapp-jsx-pragma"

namespace JSX {
	interface IntrinsicElements {
		[key: string]: VNode
	}
}