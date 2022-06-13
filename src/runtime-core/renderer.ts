import { createVNode, Fragment,Text } from "./vnode";
import { createComponentInstance,setupComponent } from "./component";
import { EMPTY_OBJECT, isObject } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createAppApi } from "./createApp";
import { effect } from "../reactivity/effect";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { queueJobs } from "./scheduler";

//自定义渲染器
export function createRenderer(options) {
    const {
        createElement:hostCreateElement,
        patchProp:hostPatchProp,
        insert:hostInsert,
        remove:hostRemove,
        setElementText:hostSetElementText
    }  = options;
    

    function render(vnode,container) {
        patch(null,vnode,container,null,null);
    }

    //n1老的节点 n2新的
    function patch(n1,n2,container,parentComponent,anchor) {
    
        //需要判断是element 还是component或fragment
        //处理组件
        
        const {shapeFlag,type} = n2;
        switch(type) {
           case Fragment:
               processFragment(n1,n2,container,parentComponent,anchor);
           break;
           case Text:
               processText(n1,n2,container);
           break;
           default:
               if (shapeFlag & ShapeFlags.ELEMENT) {
                   processElement(n1,n2,container,parentComponent,anchor);
               } else if(shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                   processComponent(n1,n2,container,parentComponent,anchor);
               }
           break;
        }
   }
   
   function processFragment(n1:any,n2:any,container:any,parentComponent:any,anchor) {
       mountChildren(n2.children,container,parentComponent,anchor)
   }
   
   function processText(n1:any,n2:any,container:any) {
       const {children} = n2;
       const textNode = (n2.el = document.createTextNode(children));
       container.append(textNode);
   
   }
   
   function processElement(n1:any,n2:any,container:any,parentComponent:any,anchor) {
       if (!n1) {
        mountElement(n2,container,parentComponent,anchor)
       } else {
           //更新
        patchElement(n1,n2,container,parentComponent,anchor)
       }
      
   }

   function patchElement(n1,n2,container,parentComponent,anchor) {
     

     const oldProps = n1.props;
     const newProps = n2.props;
     //需要把el赋值给新的节点
     const el = (n2.el = n1.el);
     patchProps(el,oldProps,newProps);

     //text -> array ,text -> text ,array ->text ,array ->array
     patchChildren(n1,n2,el,parentComponent,anchor);
     //props
     //children

   }

   function patchChildren(n1,n2,container,parentComponent,anchor) {
       const prevShapeFlag = n1.shapeFlag;
       const c1 = n1.children;
       const shapeFlag = n2.shapeFlag;
       const c2 = n2.children;
       if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
           //array->text
           if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
               //1.把老的children清空
               unmountChildren(n1.children);
               //2.设置text
            //    hostSetElementText(container,c2);
            }
        //text->text
        //     else {
        //         if (c1 !== c2) {
        //             hostSetElementText(container,c2);
        //         }
        //    }
            if (c1 !== c2) {
                hostSetElementText(container,c2);
            }
        } else {
            //text->array
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container,"");
                mountChildren(c2,container,parentComponent,anchor)
            } else {
                //array ->array(diff)
                patchKeyedChildren(c1,c2,container,parentComponent,anchor);
            }

        }
       
       
     

   }
   //diff算法
   function patchKeyedChildren(c1,c2,container,parentComponent,parentAnchor) {
       
       
       let i = 0,
       l2 = c2.length,
       e1 = c1.length - 1,
       e2 = l2 - 1;

       //判断两个节点是否相同
       function isSameVNodeType(n1,n2) {
           //type,key
           return n1.type === n2.type && n1.key === n2.key
        }

        //起始大于结束后终止循环
        //左侧
        while (i<= e1 && i<= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1,n2)) {
                patch(n1,n2,container,parentComponent,parentAnchor);
            } else {
                break;
            }
            i++
        }

        //右侧
        while (i<= e1 && i<= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1,n2)) {
                patch(n1,n2,container,parentComponent,parentAnchor);
            } else {
                break;
            }
            e1--;
            e2--;
        }

        //新的大于老的，需要进行创建
        if (i>e1) {
            if (i<=e2) {
                //anchor
                /*这里取e2的下一个，并判断是否大于新的长度，如果大于，说明是左侧相同，那么锚点为空，
                innsertBefore的第二个参数为空，就会直接加到后面，如果比新长度小，说明右侧相同，那么锚点就是e2指的后面的一个节点
                然后遍历i到e1的节点，依次插入锚点的前面
                */
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null,c2[i],container,parentComponent,anchor);
                    i++;
                }
                
            }
        } 
        //老的的大于新的，需要进行删除
        else if (i>e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++
            }
        } else {
            //乱序
            let s1 = i,
            s2 = i;


            //新的数组的中间乱序的长度
            const toBePatched = e2 - s2 + 1;
            //用来标志新节点的patch次数，和toBepatched比较，老节点还有多的没有patch，就直接删除
            let patched = 0;
            //建立映射表
            //新数组的key和index的映射表
            const keyToNewIndexMap = new Map();
            //新老数组的索引值映射表
            const newIndexToOldIndexMap = new Array(toBePatched);
            //是否需要移动（获取最长递增子序列）
            let moved = false;
            let maxNewIndexSoFar = 0;
            //初始化映射表,初始化为-1，表示节点还没有patch
            for(let i = 0;i<toBePatched;i++) {
                newIndexToOldIndexMap[i] = -1
            }

            //初始化新数组key和index的映射关系
            for (let p = s2;p<=e2;p++) {
                const nextChild = c2[p];
                keyToNewIndexMap.set(nextChild.key,p);
            }
            
            for (let p = s1;p<= e1;p++) {
                const prevChild = c1[p];

                //如果新节点已经遍历完了，而老节点还有多的没有patch，就直接删除
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }


                //key存在通过map判断是否存在
                //key不存在需要遍历判断相不相等
                let newIndex;
                if (prevChild.key !== null) {
                    //根据key获取老节点在新节点里面的index
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                } else {
                    //不用key的话就需要再次遍历一边会使时间复杂度变为O（n2）
                    for (let j = s2;j<=e2;j++) {
                        if (isSameVNodeType(prevChild,c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }

                }
                //表示节点不存在
                if(newIndex === undefined) {
                    hostRemove(prevChild.el);
                } else {
                    //新的index大于记录下来的点，表示不需要移动，否则需要移动
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex
                    } else {
                        moved = true;
                    }
                    

                    //减去s2表示索引从0开始
                    newIndexToOldIndexMap[newIndex - s2] = p;
                    patch(prevChild,c2[newIndex],container,parentComponent,null);
                    patched++;
                }

            }

            //获取最长递增子序列[5,3,4] -> [1,2]//返回最长递增子序列的index    
            
                   
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            let j = increasingNewIndexSequence.length - 1;//作为最长递增子序列的尾指针
            //遍历原数组和最长递增子序列进行比较，判断存不存在，不在的话需要移动
            //由于需要innsertBefore，由于不确定后面的元素有没有被patch（是否稳定），
            //所以采用倒序的方式
            for (let i=toBePatched-1;i>=0;i--) {
                const nextIndex = i + s2,
                nextChild = c2[nextIndex];
                //锚点是当前元素的下一个
                const anchor = nextIndex + 1 <l2 ? c2[nextIndex + 1].el : null;
                
                //-1表示需要新的节点在老的里面不存在，需要创建
                if (newIndexToOldIndexMap[i] === -1) {
                    patch(null,nextChild,container,parentComponent,anchor)
                } else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        //移动
                        hostInsert(nextChild.el,container,anchor)
                    } else {
                        //存在的话子序列的指针往后移，继续判断
                        j--;
                    }
                }
               

            }

           
        }
   }

   function unmountChildren(children) {
       for (let i=0;i<children.length;i++) {
           const el = children[i].el;
           hostRemove(el);
       }
   }

   function patchProps(el,oldProps,newProps) {
       if (oldProps !== newProps) {
            //3种情况，1.foo：1 -》 foo：2
            //2.foo:1 -> foo:null | undefined
            //3.foo:1 ,bar:1 -> foo:1
            for (const key in newProps) {
                const prevProp = oldProps[key],
                nextProp = newProps[key];

                if (prevProp !== nextProp) {
                    hostPatchProp(el,key,prevProp,nextProp)
                }
            }

        }

        if (oldProps !== EMPTY_OBJECT) {
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el,key,oldProps[key],null)
                }
            }
        }
       

   }
   
   function  mountElement(vnode:any,container:any,parentComponent:any,anchor) {
       const el = (vnode.el = hostCreateElement(vnode.type));
       const {children,props,shapeFlag} = vnode;
       //children的两种类型string和array
       if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
           el.textContent = children;
       } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
           mountChildren(vnode.children,el,parentComponent,anchor)
       }
       
       for (let key in props) {
           const val = props[key];
   
           hostPatchProp(el,key,null,val)
       }
   
       hostInsert(el,container,anchor)
   
   }
   
   function mountChildren(children:any,container:any,parentComponent:any,anchor) {
        children.forEach((v) => {
           patch(null,v,container,parentComponent,anchor)
        })
   }
   
   function processComponent(n1:any,n2:any,container:any,parentComponent:any,anchor) {
       //没有老节点，初始化组件,有老节点，更新组件
       if (!n1) {
           mountComponent(n2,container,parentComponent,anchor);
       } else {
           updateComponent(n1,n2)
       }
      
   }

   //更新组件
   function updateComponent(n1,n2) {

        //赋值到n2上，这样n2就是下次更新的n1
        const instance = (n2.component = n1.component);
       //判断是否需要更新才调用update
       if (shouldUpdateComponent(n1,n2)) {
            //更新就是重新调用该组件的render函数，重新生成虚拟节点，再进行patch对比
           
            //将新的虚拟节点放到实例上
            instance.next = n2;
            instance.update();
       } else {
           n2.el = n1.el; 
           instance.vnode = n2
       }
   }
   
   function mountComponent(initialVnode:any,container:any,parentComponent:any,anchor) {
       const instance =  (initialVnode.component = createComponentInstance(
           initialVnode,
           parentComponent));
       setupComponent(instance);
       setupRenderEffect(instance,initialVnode,container,anchor)
   }
   
   function setupRenderEffect(instance:any,initialVnode,container:any,anchor) {

    //依赖收集，当set的时候重新调用effect的回调，从而继续调用render，生成新的虚拟节点
    //这里给实例增加update是因为effect的返回值被调用之后会重新调用fn，从而就会重新生成组件的虚拟节点
    instance.update = effect( () => {
        if (!instance.isMounted) {//init
            //取数据的this代理
            const {proxy} = instance;
            //先把之前的虚拟节点存起来
            const subTree = (instance.subTree = instance.render.call(proxy,proxy));
            
            //vnode -> patch
            
            patch(null,subTree,container,instance,anchor);
        
            initialVnode.el = subTree.el;


            instance.isMounted = true;

        } else {//update
            console.log("update");

            //next：要更新的虚拟节点，vnode：之前的虚拟节点
            const {proxy,next,vnode} = instance;
            if (next) {
                next.el = vnode.el;
                updateComponentPreRender(instance,next);
            }
            const subTree = instance.render.call(proxy,proxy);
            const prevSubTree = instance.subTree;
            patch(prevSubTree,subTree,container,instance,anchor);
        }

    },
    {
        //这里控制视图的异步更新
        schedular:() => {
            console.log("update--scheduler");
            //将更新的操作收集起来进入微任务队列中
            queueJobs(instance.update);
        }
    })
      
   }

   //获取最长递增子序列，copy vue3源码
  function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }


  function updateComponentPreRender(instance,nextVnode) {
      instance.vnode = nextVnode;
      instance.next = null;
      instance.props = nextVnode.props;

  }

   return {
       createApp:createAppApi(render)
   }

}



