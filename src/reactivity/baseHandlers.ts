import {track,trigger} from "./effect"
import { reactive, ReactiveFlags, readonly } from "./reactive";
import { isObject } from "../shared/index";
import { extend } from "../shared/index";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true,true);

function createGetter(isReadOnly = false,isShallow = false) {
    return function get(target,key) {
      const res = Reflect.get(target,key);
      
      if (key === ReactiveFlags.IS_REACTIVE) {
        return !isReadOnly
      } else if (key === ReactiveFlags.IS_ReadOnly) {
        return isReadOnly
      }
      
      if (isShallow) {
          return res;
      }

      if (isObject(res)) {
          return isReadOnly ? readonly(res) : reactive(res)
      }
      //todo依赖收集
      if (!isReadOnly) {
          track(target,key);
      } 
      return res;
    }
}

function createSetter() {
    return function set(target,key,value) {
        const res = Reflect.set(target,key,value);

        //todo触发依赖
        trigger(target,key);
        return res
    }
}

export const mutableHandlers = {
    get,
    set,
}

export const readonlyHandlers = {
    get:readonlyGet,
    set(target,key,value) {
        console.warn(`key:${key} set 失败，因为 ${target} 是readonly`)
        return true
    }
}   


export const shallowReadonlyHandlers = extend({},readonlyHandlers,{
    get:shallowReadonlyGet
})