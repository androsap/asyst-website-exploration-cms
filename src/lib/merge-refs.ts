import type { Ref, RefCallback } from "react"

/** Combines multiple refs (forwarded + internal) into one ref callback,
 * so a component can both expose a ref to its consumer and use its own
 * internal ref on the same DOM node. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
    return (node) => {
        for (const ref of refs) {
            if (!ref) continue
            if (typeof ref === "function") {
                ref(node)
            } else {
                ;(ref as { current: T | null }).current = node
            }
        }
    }
}
