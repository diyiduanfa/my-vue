import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transform/transformElement";
import { transformExpression } from "./transform/transformExpression";
import { transformText } from "./transform/transformText";

//编译函数
export function baseCompile(template) {
    const ast:any = baseParse(template);
    transform(ast,{
        nodeTransforms:[transformExpression,transformElement,transformText]
    });
    return  generate(ast);
}