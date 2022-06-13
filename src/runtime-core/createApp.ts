import { createVNode } from "./vnode";
// import { render } from "./renderer";
export function createAppApi(render) {
    return function createApp(rootComponent) {                              
        return {
            mount(rootContainer) {
                //转换成虚拟节点
                //component ->vnode
               
                const vnode = createVNode(rootComponent);
                
                render(vnode,rootContainer);
            }
        }
    }

}
