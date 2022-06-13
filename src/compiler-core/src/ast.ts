import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers";

export const enum NodeTypes {
    ROOT,//根节点
    INTERPOLATION,//插值
    SIMPLE_EXPRESSION,//表达式
    ELEMENT,//标签
    TEXT,//文本
    COMPOUND_EXPRESSION,
}

export function createVNodeCall(context,tag,props,children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type:NodeTypes.ELEMENT,
        tag,
        props,
        children
    }

}