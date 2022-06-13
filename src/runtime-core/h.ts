import  {createVNode} from "./vnode"
export function h(vnode,props?,children?) {
    return createVNode(vnode,props,children);
}