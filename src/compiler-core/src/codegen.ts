import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function generate(ast) {
    
    const context = createCodegenContext();
    const {push} = context;


    //拼接导入
    genFunctionPreamble(ast,context)


    //拼接函数和参数
    const functionName = "render";
    const args = ["_ctx","_cache"];
    const signature = args.join(",");
   push(`function ${functionName}(${signature}){`);
   //拼接返回值
   push("return ");
   genNode(ast.codegenNode,context);
   push("}")

    return {
        code:context.code
    }

}

//拼接导入的函数
function genFunctionPreamble(ast,context) {
    const {push} = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    //不需要导入时不用加上
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`);
        push("\n");
    }
    push("return ");
}

//创建codegen的上下文，并封装+=的操作
function createCodegenContext() {
    const context = {
        code:"",
        push(source){
            context.code += source
        },
        //映射helper
        helper(key) {
            return `_${helperMapName[key]}`
        }
    };
    return context

}

//拼接节点（判断类型text，interpolation等）
function genNode(node,context) {
    switch(node.type) {
        case NodeTypes.TEXT:
            genText(node,context)
        break;
        case NodeTypes.INTERPOLATION:
            genInterpolation(node,context)
        break;
        case NodeTypes.SIMPLE_EXPRESSION:
           genExpression(node,context);
        break;
        case NodeTypes.ELEMENT:
           genElement(node,context);
        break;
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpression(node,context);
         break;
        default:
        break;    
    }
}

function genCompoundExpression(node,context) {
    //遍历联合类型的children拼起来
    const {children} = node;
    const {push} = context;
    for (let i=0;i<children.length;i++) {
        const child = children[i];
        //判断+号
        if (isString(child)) {
            push(child)
        } else {
            genNode(child,context)
        }
    }

}

function genElement(node,context) {
    const {push,helper} = context;
    const {tag,children,props} = node;    
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    //统一处理假值为null
    genNodeList(genNullable([tag,props,children]),context);
    push(")")
}


function genNodeList(nodes:any,context) {
    const {push} = context;
    for(let i=0;i<nodes.length;i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node)
        } else {
            genNode(node,context)
        }

        if (i<nodes.length - 1) {
            push(", ");
        }
    }


}

function genNullable(args:any) {
    return args.map((arg) => arg || "null");
}

function genExpression(node,context) {
    const {push} = context;
    push(`${node.content}`);
}

function genText(node,context) {
    //text
    const {push} = context;
    push(`'${node.content}'`);
}

function genInterpolation(node,context) {
     //text
     const {push,helper} = context;
     push(`${helper(TO_DISPLAY_STRING)}(`);
     genNode(node.content,context);
     push(')')

}