import {h,renderSlots,createTextVNode,inject} from "../../lib/guide-mini-vue.esm.js"
export const Inject = {
    name:"inject",
    setup() {
        const foo1 = inject("foo1");
        const bar1 = inject("bar1");
        // const baz = inject("baz","bazDefault");
        const baz = inject("baz",() => {return "bazDefault"});
        return {
            foo1,
            bar1,
            baz
        }
       

    },
    render() {
        return h("div",{},`${this.foo1} --- ${this.bar1} --- ${this.baz}`)
    }
}