import { hasChanged,isObject } from "../shared/index";
import { trackEffects,isTracking, triggerEffects } from "./effect";
import { reactive } from "./reactive";

//1 true "1
//proxy对于对象，ref是值类型
//class {} -> get/set
class RefImpl {
    private _value:any;
    public dep;
    private _rawValue:any;
    public _v_isRef = true;
    constructor(value) {
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newvalue) {
        //一定是先修改了值
        if (hasChanged(newvalue,this._rawValue)) {
            this._rawValue = newvalue;
            this._value = convert(newvalue);
            triggerEffects(this.dep)
        }
       
    }
}

function convert(value) {
    return isObject(value) ? reactive(value) : value;
}

function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep)
     } 
}


export function ref(value) {
    return new RefImpl(value)
}

export function isRef(ref) {
  return !!ref._v_isRef
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref
}

export function proxyRefs(objectWithRefs) {
    //作用：setup的ref返回值在使用时不需要.value
    return new Proxy(objectWithRefs,{
        get(target,key) {
          return unRef(Reflect.get(target,key))
        },
        set(target,key,value) :any{
            //value值不是ref，target[key]是ref，修改.value值
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            } else {
                return Reflect.set(target,key,value)
            }
        }
    })
}