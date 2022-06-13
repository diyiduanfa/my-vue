import { h,ref } from "../../lib/guide-mini-vue.esm.js";
export const Child = {
    name:"App",
    setup(props,{emit}) {
       
    },
    render() {
        return h("div",{},[
            h("div",{},"child - props -msg:" + this.$props.msg)
          
        ])

    }
}