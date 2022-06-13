import {h} from "../../lib/guide-mini-vue.esm.js"
import {Foo} from "./Foo.js"
import {Provider} from "./Provider.js"
window.self = null;
export const App = {
    name:"app",
    render() {
        window.self = this;
        return h("div",{
            id:"root",
            class:["red","blue"],
            onClick() {
                // console.log(123);
            }
        },
        //"hi,mini-vue"
        [
          h("p",{
              id:"p1",
              class:["red"]
          },"p1" + this.msg),
          h(Foo,{
            count:1,
            onAdd(a,b) {
                console.log("emitAdd app",a,b)
            },
            onAddFoo(a,b) {
                console.log("emitAdd add-foo",a,b)
            }
          },
          //   h("div",{},"slot1")
         // [h("div",{},"slot1"),h("div",{},"slot2")]
         {
            'header':({age}) => h("div",{},"slot1" + age),
            'footer':() => h("div",{},"slot2")
          }),
          h(Provider,{})
        ]
        )
    },
    setup() {
        return {
            msg:"mini-vue"
        }
    }
}