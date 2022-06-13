import { createVNodeCall, NodeTypes } from "../ast";

export function transformElement(node,context) {
    //需要延后执行，所以返回函数

    if (node.type === NodeTypes.ELEMENT) {
        return () => {
            //中间处理层
            //tag
            const vnodeTag = `'${node.tag}'`;

            //props
            let vnodeProps


            //children
            const children = node.children;
            let vnodeChildren = children[0];

            node.codegenNode = createVNodeCall(context,vnodeTag,vnodeProps,vnodeChildren);
        }
    }
    
 


}