import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots,name,props) {
    //返回vnode作为children

    const slot = slots[name];
    if(slot) {
      //function
      if (typeof slot === "function") {
        //只渲染children
        return createVNode(Fragment,{},slot(props))
      }
      
    }
   
}