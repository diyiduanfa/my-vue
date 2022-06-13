import {h,renderSlots,createTextVNode,provide} from "../../lib/guide-mini-vue.esm.js"
import { Provider1 } from "./Provider1.js";
// import { Inject } from "./Inject.js";
export const Provider = {
    name:"provide",
    setup() {
      provide("foo1","foo1");
      provide("bar1","bar1");
       

    },
    render() {
        return h("div",{},[h("p",{},"provider"),h(Provider1)])
    
    }
}