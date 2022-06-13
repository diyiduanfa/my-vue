import {h,renderSlots,createTextVNode,provide, inject} from "../../lib/guide-mini-vue.esm.js"
import {Inject} from "./Inject.js"
export const Provider1 = {
    name:"provide1",
    setup() {
        provide("foo1","foo2");
        const foo1 = inject("foo1");
        return {
            foo1
        }
    

    },
    render() {
        return h("div",{},[h("p",{},`provider1 -- ${this.foo1}`),h(Inject)])
    
    }
}