import { NodeTypes } from "../ast";
import { isText } from "../utils";

export function transformText(node) {


    if (node.type === NodeTypes.ELEMENT) {
        //TODO,添加中间层复合类型的节点
        //返回函数，延后执行
        return () => {
            const {children} = node;
            let currentContainer;
            for (let i=0;i<children.length;i++) {
                const child = children[i];
                //首先需要判断是否为text类型或者插值，只有是这两者的时候，才会对相邻的下一个节点就行判断
                if (isText(child)) {
                    //判断相邻节点
                    for (let j=i+1;i<children.length;i++) {
                        const next = children[j];
                        if (isText(next)) {
                            //将原来的节点替换,next删除
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type:NodeTypes.COMPOUND_EXPRESSION,
                                    children:[child]
                                }
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j,1);
                            j--;
                        } else {
                            //遇到不是上述两种节点，直接跳出循环
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        }
         

    }

  

}