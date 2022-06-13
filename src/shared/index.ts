export * from "./toDisplayString"

export const extend = Object.assign;

export const isObject = (val) => {
    return val !== null && typeof val === "object"
}

export const isString = (val) => {
    return typeof val === "string"
}

export const hasChanged = (newv,val) => {
    return !Object.is(newv,val)
} 

export const hasOwn = (val,key) => {
    return Object.prototype.hasOwnProperty.call(val,key)
}

export const EMPTY_OBJECT = {};