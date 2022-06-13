import { isObject } from "../shared/index"
import { mutableHandlers,readonlyHandlers,shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '_v_isReactive',
    IS_ReadOnly = '_v_isReadOnly',
}
function createReactiveObject(target:any,baseHandlers) {
    if (!isObject(target)) {
        console.warn(`${target}必须是一个对象`);
        return
    }
    return new Proxy(target,baseHandlers)
}

export function reactive(raw) {
   return createReactiveObject(raw,mutableHandlers)
}

export function readonly(raw) {
  return createReactiveObject(raw,readonlyHandlers)
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw,shallowReadonlyHandlers)
}

export function isReactive(value) {
    return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadOnly(value) {
    return !!value[ReactiveFlags.IS_ReadOnly];
}

export function isProxy(value) {
    return isReactive(value) || isReadOnly(value);
}