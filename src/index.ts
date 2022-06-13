
export * from "./runtime-dom/index"


import { baseCompile } from "./compiler-core/src"
import * as runtimeDom from "./runtime-dom"
import {registerRuntimeCompiler} from "./runtime-dom"

//编译成函数
function compileToFunction(template) {
    const {code} = baseCompile(template);
    //通过new Function生成函数
    const render = new Function("Vue",code)(runtimeDom)

    return render
}


registerRuntimeCompiler(compileToFunction)