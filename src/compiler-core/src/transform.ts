import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root,options ={}) {


    //创建上下文
    const context = createTransformContext(root,options);
    //1.深度优先搜索（递归）
    traverseNode(root,context);


    //创建根节点的children代码,便于直接拿到需要生成代码的节点
    createRootCodegen(root);

    root.helpers = [...context.helpers.keys()];
   
}

function createRootCodegen(root:any) {
    const child = root.children[0];
    //判断是否是element，如果是element，直接把子节点的codegenNode放到root上（中间层处理过），方便后续直接调用children
    if (child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode;
    } else {
        root.codegenNode = root.children[0];
    }
   
}

function createTransformContext(root:any,options:any):any {
    const context = {
        root,
        nodeTransforms:options.nodeTransforms || [],
        helpers:new Map(),
        helper(key) {
            context.helpers.set(key,1);
        }
    }
    return context
}


function traverseNode(node:any,context) {

    //这里通过传入函数，然后内部进行调用，并把需要用到的参数传出去
    //这样就可以实现扩展（plugin）
    //插件模式，洋葱模型
    const nodeTransforms = context.nodeTransforms;
    const exitFns:any = [];
    for (let i=0;i<nodeTransforms.length;i++) {
        const transformPlugin = nodeTransforms[i];
        //这里为了防止插件影响了ast的结构导致其他插件出现问题
        //所以我们把transform几个插件返回函数，并记录下来
        //然后等执行完之后再执行，也就是延后执行，从而使其不相互干扰
        const onExit = transformPlugin(node,context);
        //只会收集会导致ast结构变化的插件
        //洋葱模式，先调用的后执行，后调用的先执行
        if (onExit) exitFns.push(onExit);
    }

    //判断类型
    switch(node.type) {
        //插值类型时调用全局上下文中的helper函数，存在helpers
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING);
        break;    
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            //递归处理子节点
             traverseChildren(node,context)
        break;    
        default:
        break;   
    }

    let i = exitFns.length;
    while(i--) {
        exitFns[i]();
    }



}


function  traverseChildren(node,context) {
    const children = node.children;
    for (let i=0;i<children.length;i++) {
        const node = children[i];
        traverseNode(node,context)
    }

}