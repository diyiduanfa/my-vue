import { h,ref } from "../../lib/guide-mini-vue.esm.js";
import {ArrayToText} from "./ArrayToText.js"
import { TextToText } from "./TextToText.js";
import { ArrayToArray } from "./ArrayToArray.js";
import { TextToArray } from "./TextToArray.js";
export const App = {
    name:"App",
    setup() {
        const count = ref(0);
        const onClick = () => {
            count.value++
        }
        const props = ref({
            foo:"foo",
            bar:"bar"
        });
        const onChange1 = () => {
            props.value.foo = "newFoo"
        };
        const onChange2 = () => {
            props.value.foo = undefined
        };
        const onChange3 = () => {
            props.value = {
                foo:"foo"
            }
        };
        return {
            count,
            onClick,
            props,
            onChange1,
            onChange2,
            onChange3
        }

    },
    render() {
        return h(
            "div",
            {
                id:"root",
                ...this.props,
            },
            [
              h("div",{},`count:${this.count}`),
              h("button",{
                  onClick:this.onClick
              },
              "click"),
              h("button",{
                onClick:this.onChange1
                },
                "change1"),
              h("button",{
                onClick:this.onChange2
                },
                "change2"),
              h("button",{
                onClick:this.onChange3
                },
                "change3"),
            //   h(ArrayToText),  
            //   h(TextToText),  
            //   h(TextToArray),  
              h(ArrayToArray),  
            ]
        )

    }
}