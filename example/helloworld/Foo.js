import {h,renderSlots,createTextVNode} from "../../lib/guide-mini-vue.esm.js"
export const Foo = {
    setup(props,{emit}) {
        //1.接收props
        //2.通过this调用
        //3.shallowReadonly
        const emitAdd = () => {
            emit("add",1,2);
            emit("add-foo",1,2)
        }
        return {
            emitAdd
        }

    },
    render() {
        const btn = h("button",{
            onClick:this.emitAdd
        },"emitAdd");
        const foo = h("p",{},"foo");
        //具名插槽
        //获取到渲染的元素
        //获取到渲染的位置,从而把slots放在不同的位置上

        //作用域插槽
       const age = 18;
        return h("div",{},[
            renderSlots(this.$slots,"header",{
                age
            }),
            foo,
            btn,
            createTextVNode("你好"),
            renderSlots(this.$slots,"footer"),
            ])
        // return h("div",{},"foo:" + this.count)

    }
}