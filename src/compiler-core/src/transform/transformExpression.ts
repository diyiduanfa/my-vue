//表达式插件

import { NodeTypes } from "../ast";

//对表达式值进行处理，对节点类型为插值的节点，给他的content下面的content的值进行处理
//{{message}}  =>{type:interpolation,content: {type:expression,content:message}}
export function transformExpression(node) {
    if (node.type === NodeTypes.INTERPOLATION) {
        node.content = processExpression(node.content)
    }
}

function processExpression(node:any) {
    node.content = `_ctx.${node.content}`;
    return node
}